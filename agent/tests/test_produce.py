import sys, tempfile, time
from pathlib import Path
sys.path.insert(0, sys.argv[1])
import agent, pipeline, requests
from PIL import Image
agent.time.sleep = lambda s: None  # fast
tmp = Path(tempfile.mkdtemp())
class W:
    def __init__(self): self.up = []
    def download(self, key, dest):
        Image.new("RGB", (400, 600), (240, 240, 240)).save(dest); return dest
    def upload(self, jid, name, path): self.up.append(name); return f"orders/{jid}/out/{name}"
pipeline.cutout = lambda img, dry_run=False: Image.new("RGBA", (300, 500), (200, 30, 30, 255))
job = {"id": 9, "kind": "sample", "category": "perfume", "inputs": ["test/in/1.jpg"], "outputs_per_product": 3}
cfg = {"work_dir": str(tmp), "watermark_samples": True}
# 1) ComfyUI unreachable -> RuntimeError, nothing uploaded
def boom(*a, **k): raise requests.ConnectionError("refused")
pipeline.edit_scene = boom
w = W()
try:
    agent.produce(job, cfg, w, comfy=object()); raise SystemExit("expected RuntimeError")
except RuntimeError as e:
    assert "unavailable" in str(e) and w.up == [], (e, w.up)
# 2) model works but quality fails 3x -> composite fallback, 3 uploads
pipeline.edit_scene = lambda *a, **k: Image.new("RGB", (100, 100), (0, 0, 0))
w = W(); keys = agent.produce(job, cfg, w, comfy=object())
assert len(keys) == 3 and w.up == ["p1_white_1.jpg", "p1_life_1.jpg", "p1_life_2.jpg"], w.up
# 3) model works -> scenes used
pipeline.edit_scene = lambda *a, **k: Image.effect_noise((1328, 1328), 60).convert("RGB")
w = W(); keys = agent.produce(job, cfg, w, comfy=object())
assert len(keys) == 3
print("produce tests passed")
