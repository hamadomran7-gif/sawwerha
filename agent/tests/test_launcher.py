"""اختبار إدارة مشغّل ComfyUI ومرونة انتظار الطلب.
التشغيل: python3 agent/tests/test_launcher.py agent"""
import sys, tempfile, time, types
from pathlib import Path
sys.path.insert(0, sys.argv[1])
import agent
import comfy as comfy_mod
import requests as real_requests

agent.time = types.SimpleNamespace(time=time.time, sleep=lambda s: None)

BAT = ("@echo off\r\ncd /d C:\\Sawwerha\\ComfyUI\r\n:loop\r\n"
       ".\\python_embeded\\python.exe -s ComfyUI\\main.py --listen 127.0.0.1 --port 8188 --disable-auto-launch\r\n"
       "timeout /t 30 /nobreak >nul\r\ngoto loop\r\n")

# 1) patch_comfy_bat: يضيف الناقص فقط، يحافظ على CRLF، ولا يكرر
flags = ["--disable-dynamic-vram", "--disable-pinned-memory"]
new = agent.patch_comfy_bat(BAT, flags)
assert new is not None
line = [l for l in new.split("\r\n") if "main.py" in l][0]
assert line.endswith("--disable-auto-launch --disable-dynamic-vram --disable-pinned-memory"), line
assert new.count("\r\n") == BAT.count("\r\n") and "\n" not in new.replace("\r\n", "")
assert agent.patch_comfy_bat(new, flags) is None
assert agent.patch_comfy_bat("rem main.py\r\n", flags) is None
partial = BAT.replace("--disable-auto-launch", "--disable-auto-launch --disable-pinned-memory")
assert agent.patch_comfy_bat(partial, flags).count("--disable-pinned-memory") == 1

# 2) ensure_comfy_launcher: يكتب الملف ويوقف الحلقة ثم ComfyUI ثم يشغّل من جديد
class FakeComfy:
    def __init__(self, busy=False): self._busy = busy; self.alive_calls = 0
    def busy(self): return self._busy
    def alive(self): self.alive_calls += 1; return True

d = Path(tempfile.mkdtemp())
bat = d / "run_comfy.bat"
bat.write_bytes(BAT.encode("latin-1"))
calls = []
def ps(cmd):
    calls.append("loop" if "cmd.exe" in cmd and "Stop-Process" in cmd else "comfy" if "python.exe" in cmd else "count")
    return "123"
started = []
cfg = {"comfy_bat": str(bat)}
assert agent.ensure_comfy_launcher(cfg, FakeComfy(), ps=ps, starter=started.append) is True
assert calls == ["loop", "comfy"], calls
assert started == [bat]
assert b"--disable-dynamic-vram --disable-pinned-memory" in bat.read_bytes()
assert not (d / "run_comfy.bat.new").exists()
# مرة ثانية: لا تغيير ولا إعادة تشغيل
calls.clear(); started.clear()
assert agent.ensure_comfy_launcher(cfg, FakeComfy(), ps=ps, starter=started.append) is False
assert calls == [] and started == []

# 3) لا يقاطع طلباً قيد التنفيذ
bat.write_bytes(BAT.encode("latin-1"))
assert agent.ensure_comfy_launcher(cfg, FakeComfy(busy=True), ps=ps, starter=started.append) is False
assert bat.read_bytes() == BAT.encode("latin-1") and started == []
# وضع التجربة أو بلا ComfyUI: لا شيء
assert agent.ensure_comfy_launcher({**cfg, "dry_run": True}, FakeComfy(), ps=ps, starter=started.append) is False
assert agent.ensure_comfy_launcher(cfg, None, ps=ps, starter=started.append) is False

# 4) restart_comfy: يشغّل الحلقة فقط إن لم تكن تعمل
started.clear()
assert agent.restart_comfy(cfg, ps=lambda c: "0" if "Count" in c else "77", starter=started.append) is True
assert started == [bat]
started.clear()
assert agent.restart_comfy(cfg, ps=lambda c: "1" if "Count" in c else "77", starter=started.append) is True
assert started == []

# 5) ComfyClient.run: انقطاع مؤقت أثناء التحميل لا يعيد إرسال الطلب
class R:
    def __init__(self, data=None, content=b"", ok=True): self._d = data; self.content = content; self.ok = ok; self.text = ""
    def json(self): return self._d
    def raise_for_status(self): pass

state = {"posts": 0, "hist": 0}
def fake_post(url, json=None, timeout=None, **kw):
    state["posts"] += 1
    return R({"prompt_id": "p1"})
def fake_get(url, params=None, timeout=None, **kw):
    if url.endswith("/history/p1"):
        state["hist"] += 1
        if state["hist"] <= 3:
            raise real_requests.ConnectionError("read timed out")
        if state["hist"] == 4:
            return R({})
        return R({"p1": {"status": {"status_str": "success"}, "outputs": {"12": {"images": [{"filename": "a.png"}]}}}})
    if url.endswith("/queue"):
        return R({"queue_running": [[1, "p1", {}, {}, []]], "queue_pending": []})
    if url.endswith("/view"):
        return R(content=b"PNG")
    raise AssertionError(url)

comfy_mod.time = types.SimpleNamespace(time=time.time, sleep=lambda s: None)
comfy_mod.requests = types.SimpleNamespace(post=fake_post, get=fake_get, RequestException=real_requests.RequestException, ConnectionError=real_requests.ConnectionError)
c = comfy_mod.ComfyClient("http://x")
assert c.run({}) == [b"PNG"]
assert state["posts"] == 1

# 6) طلب ضاع (أُعيد تشغيل ComfyUI): يرفع خطأ بدل الانتظار 30 دقيقة
clock = {"t": 1000.0}
comfy_mod.time = types.SimpleNamespace(time=lambda: clock["t"], sleep=lambda s: clock.__setitem__("t", clock["t"] + s))
def lost_get(url, params=None, timeout=None, **kw):
    if url.endswith("/history/p1"):
        return R({})
    if url.endswith("/queue"):
        return R({"queue_running": [], "queue_pending": []})
    raise AssertionError(url)
comfy_mod.requests = types.SimpleNamespace(post=fake_post, get=lost_get, RequestException=real_requests.RequestException, ConnectionError=real_requests.ConnectionError)
c = comfy_mod.ComfyClient("http://x", lost_grace=60)
try:
    c.run({})
    raise AssertionError("expected lost prompt")
except RuntimeError as e:
    assert "lost prompt" in str(e)
assert clock["t"] - 1000.0 < 300

# 7) انقطاع طويل: يرفع ConnectionError بعد المهلة ليعيد produce() المحاولة
clock["t"] = 1000.0
def dead_get(url, params=None, timeout=None, **kw):
    raise real_requests.ConnectionError("refused")
comfy_mod.requests = types.SimpleNamespace(post=fake_post, get=dead_get, RequestException=real_requests.RequestException, ConnectionError=real_requests.ConnectionError)
c = comfy_mod.ComfyClient("http://x", unreachable_grace=120)
try:
    c.run({})
    raise AssertionError("expected ConnectionError")
except real_requests.ConnectionError:
    pass
print("launcher tests OK")
