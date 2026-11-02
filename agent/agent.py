"""وكيل الإنتاج — يعمل على جهاز ويندوز مع RTX 4090.

يسحب الطلبات من بوت واتساب (Cloudflare Worker)، ينتج الصور، ويرفعها.
التشغيل:   python agent.py               (حلقة مستمرة)
           python agent.py --once        (طلب واحد ثم خروج)
           python agent.py --dry-run     (بلا GPU/ComfyUI، لاختبار المسار)
"""
import argparse
import json
import logging
import os
import random
import subprocess
import sys
import threading
import time
from pathlib import Path

import requests
from PIL import Image

import pipeline
from comfy import ComfyClient

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent  # C:\\Sawwerha
AGENT_VERSION = "2026.11.02-6"
DEFAULT_REPO = "hamadomran7-gif/sawwerha"
LIGHTNING_LORA = "Qwen-Image-Edit-Lightning-8steps-V1.0-bf16.safetensors"
LIGHTNING_URL = "https://huggingface.co/lightx2v/Qwen-Image-Lightning/resolve/main/" + LIGHTNING_LORA
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s", handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler(HERE / "agent.log", encoding="utf-8")])
log = logging.getLogger("sawwerha")


class Worker:
    """عميل واجهة البوت."""

    def __init__(self, base: str, token: str):
        self.base = base.rstrip("/")
        self.h = {"Authorization": f"Bearer {token}"}

    def heartbeat(self):
        r = requests.post(f"{self.base}/api/heartbeat", headers=self.h, timeout=30)
        r.raise_for_status()
        return r.json()

    def next_job(self):
        r = requests.get(f"{self.base}/api/jobs/next", headers=self.h, timeout=30)
        r.raise_for_status()
        return r.json().get("job")

    def download(self, key: str, dest: Path) -> Path:
        r = requests.get(f"{self.base}/api/media/{key}", headers=self.h, timeout=120)
        r.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(r.content)
        return dest

    def upload(self, job_id: int, name: str, path: Path) -> str:
        with open(path, "rb") as f:
            r = requests.put(f"{self.base}/api/jobs/{job_id}/outputs/{name}", headers={**self.h, "Content-Type": "image/jpeg"}, data=f, timeout=300)
        r.raise_for_status()
        return r.json()["key"]

    def complete(self, job_id: int, keys: list):
        r = requests.post(f"{self.base}/api/jobs/{job_id}/complete", headers=self.h, json={"outputs": keys}, timeout=600)
        r.raise_for_status()
        return r.json()

    def fail(self, job_id: int, error: str):
        requests.post(f"{self.base}/api/jobs/{job_id}/fail", headers=self.h, json={"error": error[:500]}, timeout=30)


# ------------------------------------------------------------ التحديث الذاتي
def _norm(b: bytes) -> bytes:
    return b.replace(b"\r\n", b"\n")


def self_update(cfg: dict) -> bool:
    """يزامن ملفات الوكيل مع مستودع GitHub (agent/manifest.json).
    يتحقق من صلاحية كل ملف قبل استبداله، ويثبّت المتطلبات إن تغيّرت.
    يعيد True إن تغيّر شيء (فيُعاد تشغيل الوكيل ليعمل بالكود الجديد)."""
    if not cfg.get("auto_update", True):
        return False
    repo = cfg.get("repo", DEFAULT_REPO)
    branch = cfg.get("branch", "main")
    base = f"https://raw.githubusercontent.com/{repo}/{branch}/"
    try:
        r = requests.get(base + "agent/manifest.json", params={"t": int(time.time())}, timeout=30)
        r.raise_for_status()
        files = r.json()["files"]
    except Exception as e:  # noqa: BLE001
        log.warning("update check failed: %s", e)
        return False
    changed = []
    for src, dst in files.items():
        local = (ROOT / dst).resolve()
        if ROOT.resolve() not in local.parents:
            log.warning("update: refusing path outside %s: %s", ROOT, dst)
            continue
        try:
            g = requests.get(base + src, params={"t": int(time.time())}, timeout=60)
            g.raise_for_status()
            data = g.content
            if src.endswith(".py"):
                compile(data.decode("utf-8"), src, "exec")
            elif src.endswith(".json"):
                json.loads(data.decode("utf-8-sig"))
        except Exception as e:  # noqa: BLE001
            log.warning("update: skip %s (%s)", src, e)
            continue
        old = local.read_bytes() if local.exists() else None
        if old is not None and _norm(old) == _norm(data):
            continue
        local.parent.mkdir(parents=True, exist_ok=True)
        tmp = local.with_name(local.name + ".new")
        tmp.write_bytes(data)
        os.replace(tmp, local)
        changed.append(dst)
    if not changed:
        return False
    log.info("updated from %s@%s: %s", repo, branch, ", ".join(changed))
    if any(c.endswith("requirements.txt") for c in changed):
        log.info("installing requirements…")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-r", str(HERE / "requirements.txt")], timeout=3600, check=False)
        except Exception as e:  # noqa: BLE001
            log.warning("pip install failed: %s", e)
    return True


# ------------------------------------------------------------ مراقبة ComfyUI
def restart_comfy() -> bool:
    """يوقف عملية ComfyUI المتجمّدة؛ حلقة run_comfy.bat تعيد تشغيلها بعد 30 ثانية."""
    if os.name != "nt":
        return False
    ps = ("Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*ComfyUI\\main.py*' } "
          "| ForEach-Object { Stop-Process -Id $_.ProcessId -Force; $_.ProcessId }")
    try:
        r = subprocess.run(["powershell", "-NoProfile", "-Command", ps], capture_output=True, text=True, timeout=60)
        log.warning("ComfyUI watchdog: stopped %s", (r.stdout or "").strip() or "nothing")
        return bool((r.stdout or "").strip())
    except Exception as e:  # noqa: BLE001
        log.warning("ComfyUI watchdog failed: %s", e)
        return False


# ------------------------------------------------------------ Lightning LoRA
_lightning = {"name": None, "downloading": False}


def lightning_name(cfg: dict, comfy):
    """اسم ملف Lightning إن كان ComfyUI يراه؛ وإلا يبدأ تنزيله في الخلفية مرة واحدة."""
    # معطّل افتراضياً: تطبيق LoRA على نموذج fp8 بحجم 20 GB جمّد ComfyUI (نفاد الذاكرة) في اختبار 2026-11-02.
    # يُفعَّل بـ "lightning": true في config.json بعد التحقق من الذاكرة.
    if comfy is None or not cfg.get("lightning", False):
        return None
    name = cfg.get("lightning_lora", LIGHTNING_LORA)
    try:
        if name in comfy.loras():
            _lightning["name"] = name
            return name
    except Exception as e:  # noqa: BLE001
        log.warning("lora list failed: %s", e)
        return None
    if not _lightning["downloading"]:
        _lightning["downloading"] = True
        threading.Thread(target=_download_lightning, args=(cfg, comfy, name), daemon=True).start()
    return None


def _download_lightning(cfg: dict, comfy, name: str):
    try:
        folder = comfy.folder("loras")
        if not folder:
            raise RuntimeError("ComfyUI loras folder unknown")
        dest = Path(folder) / name
        part = dest.with_name(dest.name + ".part")
        url = cfg.get("lightning_url", LIGHTNING_URL)
        log.info("downloading Lightning LoRA → %s", dest)
        with requests.get(url, stream=True, timeout=60) as r:
            r.raise_for_status()
            with open(part, "wb") as f:
                for chunk in r.iter_content(chunk_size=8 * 1024 * 1024):
                    f.write(chunk)
        os.replace(part, dest)
        log.info("Lightning LoRA ready (%.0f MB)", dest.stat().st_size / 1e6)
    except Exception as e:  # noqa: BLE001
        log.warning("Lightning download failed: %s", e)
    finally:
        _lightning["downloading"] = False


def produce(job: dict, cfg: dict, worker: Worker, comfy) -> list:
    """ينتج كل صور الطلب ويعيد مفاتيح R2 بعد الرفع."""
    work = Path(cfg.get("work_dir", "./work")) / f"job_{job['id']}"
    work.mkdir(parents=True, exist_ok=True)
    dry = cfg.get("dry_run", False)
    out_size = int(cfg.get("output_size", 2000))
    life_size = int(cfg.get("lifestyle_size", 1328))
    per_product = int(job.get("outputs_per_product", 3))
    is_sample = job["kind"] == "sample"
    lora = None if dry else lightning_name(cfg, comfy)
    steps = int(cfg.get("lightning_steps", 8)) if lora else int(cfg.get("steps", 20))
    log.info("scenes via %s (%s steps)", "Lightning" if lora else "standard workflow", steps)
    keys = []

    # المرحلة أ: القصّ لكل المنتجات أولاً، ثم تحرير ذاكرة كرت الشاشة لـ ComfyUI
    cuts = []
    for idx, key in enumerate(job["inputs"], start=1):
        src = worker.download(key, work / f"in_{idx}{Path(key).suffix or '.jpg'}")
        cuts.append(pipeline.cutout(Image.open(src), dry_run=dry))
    pipeline.release_cutout()

    for idx, cut in enumerate(cuts, start=1):
        # 1) الصورة البيضاء (دائماً أولى الصور)
        white = pipeline.white_background(cut, size=out_size)
        white_path = pipeline.save_jpeg(white, str(work / f"p{idx}_white_1.jpg"))
        outputs = [white_path]
        if per_product >= 6:
            # نسخة ثانية بخلفية بيضاء بزاوية قص أضيق (لقطة تفصيل)
            detail = pipeline.white_background(cut, size=out_size, fill=0.95)
            outputs.append(pipeline.save_jpeg(detail, str(work / f"p{idx}_white_2.jpg")))

        # 2) المشاهد
        n_scenes = per_product - len(outputs)
        seed_base = random.randint(1, 10**9)
        for v in range(n_scenes):
            seed = seed_base + v
            scene = None
            conn_errors = 0
            if not dry and cfg.get("edit_mode", "edit") == "edit" and comfy is not None:
                for attempt in range(3):
                    try:
                        cand = pipeline.edit_scene(comfy, cut, job["category"], v, life_size, seed + attempt * 101, steps=steps, revision_note=job.get("revision_note"), prefix=f"job{job['id']}_p{idx}_s{v}", lora=lora, work_dir=str(work), canvas=int(cfg.get("scene_canvas", 1024)))
                        ok, why = pipeline.quality_ok(cand)
                        if ok:
                            scene = cand
                            break
                        log.warning("quality check failed (%s), retrying", why)
                    except requests.RequestException as e:
                        conn_errors += 1
                        log.warning("ComfyUI unreachable (attempt %s): %s", attempt + 1, e)
                        time.sleep(10)
                    except Exception as e:  # noqa: BLE001
                        log.warning("edit_scene failed (attempt %s): %s", attempt + 1, e)
                if conn_errors >= 3:
                    # لا نسلّم مشاهد بديلة ضعيفة لأن ComfyUI متوقف: يعود الطلب للطابور
                    raise RuntimeError("ComfyUI unavailable — job requeued")
            if scene is None:
                scene = pipeline.composite_scene(cut, life_size, seed)
            outputs.append(pipeline.save_jpeg(scene, str(work / f"p{idx}_life_{v + 1}.jpg")))

        # 3) علامة مائية للعينات المجانية فقط
        if is_sample and cfg.get("watermark_samples", True):
            for p in outputs:
                pipeline.save_jpeg(pipeline.watermark(Image.open(p), cfg.get("watermark_text", "Sawwerha")), p)

        for p in outputs:
            keys.append(worker.upload(job["id"], Path(p).name, Path(p)))
    return keys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=str(HERE / "config.json"))
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    cfg = json.loads(Path(args.config).read_text(encoding="utf-8-sig"))
    if args.dry_run:
        cfg["dry_run"] = True
    while str(cfg.get("worker_url", "")).startswith("REPLACE") or str(cfg.get("agent_token", "")).startswith("REPLACE"):
        log.warning("config.json not configured yet (worker_url/agent_token) — waiting 5 min")
        if args.once:
            return
        time.sleep(300)
        cfg = json.loads(Path(args.config).read_text(encoding="utf-8-sig"))
    if not args.once and self_update(cfg):
        log.info("restarting with updated code")
        sys.exit(0)
    worker = Worker(cfg["worker_url"], cfg["agent_token"])
    comfy = None if cfg.get("dry_run") else ComfyClient(cfg.get("comfy_url", "http://127.0.0.1:8188"))
    poll = int(cfg.get("poll_seconds", 20))
    update_every = 60 * int(cfg.get("update_check_minutes", 30))
    last_update_check = time.time()
    last_rev = None
    down_since = None
    last_restart = 0.0
    log.info("agent %s started (dry_run=%s)", AGENT_VERSION, cfg.get("dry_run", False))
    if comfy is not None and cfg.get("lightning", False) and comfy.alive():
        lightning_name(cfg, comfy)  # يبدأ تنزيل Lightning مبكراً إن لم يكن موجوداً

    while True:
        try:
            hb = worker.heartbeat()
            rev = hb.get("agent_rev")
            due = time.time() - last_update_check > update_every
            if not args.once and ((rev and last_rev and rev != last_rev) or due):
                last_update_check = time.time()
                if self_update(cfg):
                    log.info("restarting with updated code")
                    sys.exit(0)
            last_rev = rev or last_rev
            if hb.get("paused"):
                log.info("service paused by owner")
                if args.once:
                    return
                time.sleep(poll)
                continue
            if comfy is not None and not comfy.alive():
                down_since = down_since or time.time()
                down_min = (time.time() - down_since) / 60
                log.warning("ComfyUI not reachable at %s for %.0f min — waiting", cfg.get("comfy_url"), down_min)
                limit = float(cfg.get("comfy_watchdog_minutes", 10))
                if limit > 0 and down_min >= limit and time.time() - last_restart > 1800:
                    last_restart = time.time()
                    restart_comfy()
                time.sleep(poll)
                continue
            down_since = None
            job = worker.next_job()
            if not job:
                if args.once:
                    log.info("no jobs")
                    return
                time.sleep(poll)
                continue
            log.info("job #%s kind=%s category=%s inputs=%s", job["id"], job["kind"], job["category"], len(job["inputs"]))
            started = time.time()
            try:
                keys = produce(job, cfg, worker, comfy)
                res = worker.complete(job["id"], keys)
                log.info("job #%s delivered in %.0fs → %s", job["id"], time.time() - started, res)
            except Exception as e:  # noqa: BLE001
                log.exception("job #%s failed", job["id"])
                worker.fail(job["id"], str(e))
            if args.once:
                return
        except KeyboardInterrupt:
            return
        except Exception as e:  # noqa: BLE001
            log.error("loop error: %s", e)
            time.sleep(poll)


if __name__ == "__main__":
    main()
