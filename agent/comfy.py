"""عميل بسيط لواجهة ComfyUI عبر HTTP."""
import json
import time
import uuid
import requests


class ComfyClient:
    def __init__(self, base_url: str, timeout: int = 1800):
        self.base = base_url.rstrip("/")
        self.timeout = timeout
        self.client_id = str(uuid.uuid4())

    def alive(self) -> bool:
        try:
            r = requests.get(f"{self.base}/system_stats", timeout=5)
            return r.ok
        except requests.RequestException:
            return False

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
        while time.time() - start < self.timeout:
            h = requests.get(f"{self.base}/history/{pid}", timeout=30).json()
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
