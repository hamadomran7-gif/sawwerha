"""عميل بسيط لواجهة ComfyUI عبر HTTP."""
import json
import time
import uuid
import requests


class ComfyClient:
    def __init__(self, base_url: str, timeout: int = 1800, unreachable_grace: int = 900, lost_grace: int = 90):
        self.base = base_url.rstrip("/")
        self.timeout = timeout
        # أثناء تحميل نموذج بحجم 20 GB قد يتوقف ComfyUI عن الرد مؤقتاً؛ ننتظر الطلب نفسه بدل إرسال نسخة مكررة.
        self.unreachable_grace = unreachable_grace
        self.lost_grace = lost_grace
        self.client_id = str(uuid.uuid4())

    def alive(self) -> bool:
        try:
            r = requests.get(f"{self.base}/system_stats", timeout=5)
            return r.ok
        except requests.RequestException:
            return False

    def queue(self) -> dict:
        r = requests.get(f"{self.base}/queue", timeout=30)
        r.raise_for_status()
        return r.json()

    def busy(self) -> bool:
        """هل يوجد طلب قيد التنفيذ أو في الانتظار؟ (False إن كان ComfyUI لا يرد)."""
        try:
            q = self.queue()
        except (requests.RequestException, ValueError):
            return False
        return bool(q.get("queue_running") or q.get("queue_pending"))

    def _queued(self, pid: str) -> bool:
        q = self.queue()
        items = (q.get("queue_running") or []) + (q.get("queue_pending") or [])
        return any(len(it) > 1 and it[1] == pid for it in items)

    def loras(self) -> list:
        """أسماء ملفات LoRA التي يراها ComfyUI."""
        r = requests.get(f"{self.base}/object_info/LoraLoaderModelOnly", timeout=30)
        r.raise_for_status()
        spec = r.json()["LoraLoaderModelOnly"]["input"]["required"]["lora_name"]
        if spec and isinstance(spec[0], list):
            return spec[0]
        if spec and spec[0] == "COMBO" and len(spec) > 1:
            return list(spec[1].get("options", []))
        return []

    def folder(self, kind: str):
        """أول مجلد يستخدمه ComfyUI لنوع نماذج معيّن (مثل loras)."""
        r = requests.get(f"{self.base}/internal/folder_paths", timeout=30)
        r.raise_for_status()
        paths = r.json().get(kind) or []
        return paths[0] if paths else None

    def upload_image(self, path: str) -> str:
        """يرفع صورة إلى مجلد input في ComfyUI ويعيد اسمها."""
        with open(path, "rb") as f:
            r = requests.post(f"{self.base}/upload/image", files={"image": (path.split("/")[-1].split("\\")[-1], f)}, data={"overwrite": "true"}, timeout=120)
        r.raise_for_status()
        data = r.json()
        name = data.get("name")
        sub = data.get("subfolder") or ""
        return f"{sub}/{name}" if sub else name

    def run(self, workflow: dict) -> list:
        """يرسل سير عمل بصيغة API وينتظر النتيجة، ويعيد قائمة بالصور (bytes)."""
        r = requests.post(f"{self.base}/prompt", json={"prompt": workflow, "client_id": self.client_id}, timeout=60)
        if not r.ok:
            raise RuntimeError(f"ComfyUI rejected workflow: {r.status_code} {r.text[:500]}")
        pid = r.json()["prompt_id"]
        start = time.time()
        unreachable_since = None
        lost_since = None
        last_queue_check = 0.0
        while time.time() - start < self.timeout:
            try:
                h = requests.get(f"{self.base}/history/{pid}", timeout=30).json()
                if pid not in h and time.time() - last_queue_check >= 30:
                    last_queue_check = time.time()
                    if self._queued(pid):
                        lost_since = None
                    else:
                        lost_since = lost_since or time.time()
                unreachable_since = None
            except (requests.RequestException, ValueError) as e:
                unreachable_since = unreachable_since or time.time()
                if time.time() - unreachable_since > self.unreachable_grace:
                    raise requests.ConnectionError(f"ComfyUI unreachable for {int(time.time() - unreachable_since)}s while running {pid}") from e
                time.sleep(5)
                continue
            if lost_since and pid not in h and time.time() - lost_since > self.lost_grace:
                raise RuntimeError(f"ComfyUI lost prompt {pid} (restarted?)")
            if pid in h:
                entry = h[pid]
                status = entry.get("status", {})
                if status.get("status_str") == "error":
                    raise RuntimeError(f"ComfyUI error: {json.dumps(status.get('messages', []))[:800]}")
                images = []
                for node in entry.get("outputs", {}).values():
                    for im in node.get("images", []):
                        params = {"filename": im["filename"], "subfolder": im.get("subfolder", ""), "type": im.get("type", "output")}
                        g = requests.get(f"{self.base}/view", params=params, timeout=120)
                        g.raise_for_status()
                        images.append(g.content)
                if images:
                    return images
            time.sleep(2)
        raise TimeoutError("ComfyUI timed out")
