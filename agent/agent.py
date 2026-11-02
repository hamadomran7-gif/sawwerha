"""وكيل الإنتاج — يعمل على جهاز ويندوز مع RTX 4090.

يسحب الطلبات من بوت واتساب (Cloudflare Worker)، ينتج الصور، ويرفعها.
التشغيل:   python agent.py               (حلقة مستمرة)
           python agent.py --once        (طلب واحد ثم خروج)
           python agent.py --dry-run     (بلا GPU/ComfyUI، لاختبار المسار)
"""
import argparse
import json
import logging
import random
import sys
import time
from pathlib import Path

import requests
from PIL import Image

import pipeline
from comfy import ComfyClient

HERE = Path(__file__).resolve().parent
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


def produce(job: dict, cfg: dict, worker: Worker, comfy) -> list:
    """ينتج كل صور الطلب ويعيد مفاتيح R2 بعد الرفع."""
    work = Path(cfg.get("work_dir", "./work")) / f"job_{job['id']}"
    work.mkdir(parents=True, exist_ok=True)
    dry = cfg.get("dry_run", False)
    out_size = int(cfg.get("output_size", 2000))
    life_size = int(cfg.get("lifestyle_size", 1328))
    per_product = int(job.get("outputs_per_product", 3))
    is_sample = job["kind"] == "sample"
    keys = []

    for idx, key in enumerate(job["inputs"], start=1):
        src = worker.download(key, work / f"in_{idx}{Path(key).suffix or '.jpg'}")
        img = Image.open(src)
        cut = pipeline.cutout(img, dry_run=dry)

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
            if not dry and cfg.get("edit_mode", "edit") == "edit" and comfy is not None:
                for attempt in range(3):
                    try:
                        cand = pipeline.edit_scene(comfy, white_path, job["category"], v, life_size, seed + attempt * 101, revision_note=job.get("revision_note"), prefix=f"job{job['id']}_p{idx}_s{v}")
                        ok, why = pipeline.quality_ok(cand)
                        if ok:
                            scene = cand
                            break
                        log.warning("quality check failed (%s), retrying", why)
                    except Exception as e:  # noqa: BLE001
                        log.warning("edit_scene failed (attempt %s): %s", attempt + 1, e)
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
    worker = Worker(cfg["worker_url"], cfg["agent_token"])
    comfy = None if cfg.get("dry_run") else ComfyClient(cfg.get("comfy_url", "http://127.0.0.1:8188"))
    poll = int(cfg.get("poll_seconds", 20))
    log.info("agent started (dry_run=%s)", cfg.get("dry_run", False))

    while True:
        try:
            hb = worker.heartbeat()
            if hb.get("paused"):
                log.info("service paused by owner")
                if args.once:
                    return
                time.sleep(poll)
                continue
            if comfy is not None and not comfy.alive():
                log.warning("ComfyUI not reachable at %s — waiting", cfg.get("comfy_url"))
                time.sleep(poll)
                continue
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
