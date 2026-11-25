"""اختبار تقاسم الكرت مع Salad (القرار 13): إغلاق ComfyUI عند الخمول وإعادته باسم ComfyUI.exe عند الطلب.
التشغيل: python3 agent/tests/test_share.py agent"""
import sys, tempfile, types
from pathlib import Path
sys.path.insert(0, sys.argv[1])
import agent
import comfy as comfy_mod

# 1) قراءة run_comfy.bat: المجلد وأمر main.py، بحلقة وبلا حلقة، وبعلامات اقتباس
LOOP = ("@echo off\r\ncd /d C:\\Sawwerha\\ComfyUI\r\n:loop\r\n"
        ".\\python_embeded\\python.exe -s ComfyUI\\main.py --listen 127.0.0.1 --port 8188 --disable-auto-launch --disable-dynamic-vram --disable-pinned-memory\r\n"
        "timeout /t 30 /nobreak >nul\r\ngoto loop\r\n")
cwd, cmd = agent.comfy_command(LOOP)
assert cwd == "C:\\Sawwerha\\ComfyUI", cwd
assert cmd[0] == ".\\python_embeded\\python.exe" and cmd[1:4] == ["-s", "ComfyUI\\main.py", "--listen"], cmd
assert cmd[-2:] == ["--disable-dynamic-vram", "--disable-pinned-memory"], cmd
QUOTED = '@echo off\ncd /d "C:\\Sawwerha\\ComfyUI"\n.\\python_embeded\\python.exe -s ComfyUI\\main.py --port 8188\n'
assert agent.comfy_command(QUOTED) == ("C:\\Sawwerha\\ComfyUI", [".\\python_embeded\\python.exe", "-s", "ComfyUI\\main.py", "--port", "8188"])
assert agent.comfy_command("rem main.py\r\necho main.py\r\n") == (None, None)

# 2) نسخة المفسّر باسم ComfyUI.exe في مجلده، تُنسخ مرة وتُجدَّد إن تغيّر الحجم
root = Path(tempfile.mkdtemp())
emb = root / "python_embeded"
emb.mkdir()
(emb / "python.exe").write_bytes(b"MZ-python-launcher")
exe = agent.named_comfy_exe(str(root), ".\\python_embeded\\python.exe")
assert exe == emb / "ComfyUI.exe" and exe.read_bytes() == b"MZ-python-launcher", exe
exe.write_bytes(b"MZ-python-launcher")  # الحجم نفسه: لا نسخ جديد
assert agent.named_comfy_exe(str(root), ".\\python_embeded\\python.exe") == exe
(emb / "python.exe").write_bytes(b"MZ-python-launcher-v2")
assert agent.named_comfy_exe(str(root), ".\\python_embeded\\python.exe").read_bytes() == b"MZ-python-launcher-v2"
assert agent.named_comfy_exe(str(root), str(exe)) == exe  # الأمر باسم ComfyUI.exe أصلاً

# 3) التشغيل المسمّى: الخيارات نفسها بلا الحلقة، من مجلد ComfyUI
bat = root / "run_comfy.bat"
bat.write_bytes(LOOP.replace("C:\\Sawwerha\\ComfyUI", str(root)).encode("latin-1"))
spawned = []
assert agent.start_comfy_named({"comfy_bat": str(bat)}, spawner=lambda a, c: spawned.append((a, c))) is True
args, where = spawned[0]
assert args[0] == str(emb / "ComfyUI.exe") and args[1:3] == ["-s", "ComfyUI\\main.py"] and "--disable-pinned-memory" in args, args
assert where == str(root), where
assert agent.start_comfy_named({"comfy_bat": str(root / "missing.bat")}, spawner=lambda a, c: spawned.append(a)) is False
assert "ComfyUI.exe" in agent.PS_KILL_COMFY and "python.exe" in agent.PS_KILL_COMFY

# 4) GpuShare بساعة وهمية
class Clock:
    def __init__(self): self.t = 1000.0
    def now(self): return self.t
    def sleep(self, s): self.t += s

class FakeComfy:
    def __init__(self): self.up = True; self.is_busy = False; self.free = [22 << 30]
    def alive(self): return self.up
    def busy(self): return self.is_busy
    def vram_free(self): return self.free.pop(0) if len(self.free) > 1 else self.free[0]

def make(mode="auto", salad="1", **extra):
    clk, fc, calls, started = Clock(), FakeComfy(), [], []
    state = {"salad": salad}
    def ps(cmd):
        if cmd == agent.PS_COUNT_SALAD:
            calls.append("salad"); return state["salad"]
        if cmd == agent.PS_KILL_LOOP:
            calls.append("kill-loop"); fc.up = False; return "11"
        if cmd == agent.PS_KILL_COMFY:
            calls.append("kill-comfy"); fc.up = False; return "22"
        calls.append("other"); return ""
    def named(cfg):
        started.append("named"); fc.up = True; return True
    def starter(b):
        started.append("bat"); fc.up = True
    cfg = {"gpu_share": mode, "comfy_bat": str(bat), **extra}
    sh = agent.GpuShare(cfg, fc, ps=ps, starter=starter, named=named, clock=clk.now, sleep=clk.sleep)
    return sh, clk, fc, calls, started, state

# Salad لا يعمل: لا إغلاق مهما طال الخمول، وفحصه مرة كل دقيقة لا في كل دورة
sh, clk, fc, calls, started, state = make(salad="0")
clk.t += 3600
assert sh.maybe_park() is False and sh.maybe_park() is False and fc.up
assert calls.count("salad") == 1, calls
clk.t += 61
sh.maybe_park()
assert calls.count("salad") == 2, calls

# Salad يعمل: لا إغلاق قبل 10 دقائق خمول، ثم الحلقة أولاً ثم ComfyUI
sh, clk, fc, calls, started, state = make()
clk.t += 9 * 60
assert sh.maybe_park() is False and not sh.parked
clk.t += 61
assert sh.maybe_park() is True and sh.parked and not fc.up
assert calls[-2:] == ["kill-loop", "kill-comfy"], calls
assert sh.maybe_park() is False  # مركون أصلاً

# ComfyUI مشغول بطلب: لا إغلاق، ويُعاد عدّ الخمول
sh, clk, fc, calls, started, state = make()
clk.t += 20 * 60
fc.is_busy = True
assert sh.maybe_park() is False and not sh.parked and sh.last_work == clk.t

# طلب وصل وهو مركون: ComfyUI.exe ثم انتظار تحرّر الذاكرة من Salad، ثم الإنتاج
sh, clk, fc, calls, started, state = make()
clk.t += 11 * 60
sh.maybe_park()
fc.free = [3 << 30, 5 << 30, 21 << 30]
t0 = clk.t
assert sh.unpark("job #7") is True
assert started == ["named"] and not sh.parked and fc.up
assert clk.t - t0 == 10, clk.t - t0  # انتظر دورتين (5 ثوانٍ) حتى صارت الذاكرة الحرة 21 GB
assert sh.last_work == clk.t

# الذاكرة لا تتحرّر: يُنتج بعد المهلة ولا يعلق
sh, clk, fc, calls, started, state = make(share_vram_wait_seconds=30)
sh.parked = True; fc.up = False
fc.free = [2 << 30]
t0 = clk.t
assert sh.unpark("job #8") is True and clk.t - t0 >= 30

# ComfyUI.exe لم يستجب: يوقفه ثم يشغّل الحلقة المعتادة
sh, clk, fc, calls, started, state = make(share_start_wait_seconds=60)
sh.parked = True; fc.up = False
sh.named = lambda cfg: started.append("named-hung") or True
assert sh.unpark("job #9") is True
assert started == ["named-hung", "bat"] and "kill-comfy" in calls and not sh.parked, (started, calls)

# Salad أُغلق والكرت مركون: يعود ComfyUI بحلقته المعتادة (python.exe)
sh, clk, fc, calls, started, state = make()
clk.t += 11 * 60
sh.maybe_park()
state["salad"] = "0"
clk.t += 61
sh.resume_if_inactive()
assert started == ["bat"] and not sh.parked and fc.up, started

# بدء الوكيل وComfyUI مغلق وSalad يعمل: مركون فلا يعيده المراقب
sh, clk, fc, calls, started, state = make()
fc.up = False
sh.adopt()
assert sh.parked
sh, clk, fc, calls, started, state = make(salad="0")
fc.up = False
sh.adopt()
assert not sh.parked

# الوضعان الصريحان: off لا يفحص Salad ولا يغلق، وon يغلق بلا Salad
sh, clk, fc, calls, started, state = make(mode="off")
clk.t += 3600
assert sh.maybe_park() is False and calls == []
sh, clk, fc, calls, started, state = make(mode="on", salad="0")
clk.t += 11 * 60
assert sh.maybe_park() is True and "salad" not in calls

# خطأ في التقاسم لا يوقف الإنتاج: يُطفأ التقاسم ويُترك المراقب يعيد ComfyUI
sh, clk, fc, calls, started, state = make()
assert sh.active() is True
sh.parked = True
def boom(*a): raise RuntimeError("powershell missing")
sh.ps = boom
sh.checked = None
sh.safe("resume_if_inactive")
assert sh.mode == "auto" and sh.salad and sh.parked and started == []  # فشل فحص Salad يُبقي آخر حالة ولا يرمي
sh.unpark = boom
assert sh.safe("unpark", "job #10") is False and sh.mode == "off" and not sh.parked

# 5) vram_free من /system_stats
class Resp:
    def __init__(self, data, ok=True): self.data = data; self.ok = ok
    def raise_for_status(self):
        if not self.ok: raise comfy_mod.requests.HTTPError("500")
    def json(self): return self.data
real_get = comfy_mod.requests.get
c = comfy_mod.ComfyClient("http://127.0.0.1:8188")
comfy_mod.requests.get = lambda url, timeout=5: Resp({"devices": [{"type": "cuda", "vram_free": 21474836480}, {"type": "cpu", "vram_free": 1}]})
assert c.vram_free() == 21474836480
comfy_mod.requests.get = lambda url, timeout=5: Resp({"devices": []})
assert c.vram_free() is None
comfy_mod.requests.get = lambda url, timeout=5: Resp({}, ok=False)
assert c.vram_free() is None
def down(url, timeout=5): raise comfy_mod.requests.ConnectionError("refused")
comfy_mod.requests.get = down
assert c.vram_free() is None
comfy_mod.requests.get = real_get

# 6) الحلقة الرئيسية بلا GPU: خمول دقيقة فإغلاق، ثم طلب يعيد ComfyUI.exe قبل الإنتاج، ثم يُسلَّم
import json
cfgp = root / "config.json"
cfgp.write_text(json.dumps({"worker_url": "https://bot.example", "agent_token": "t", "poll_seconds": 20, "comfy_bat": str(bat),
                            "share_idle_minutes": 1, "share_vram_wait_seconds": 0}), encoding="utf-8")
clk, fc, calls, started, events = Clock(), FakeComfy(), [], [], []
class W:
    def __init__(self, base, token): self.n = 0
    def heartbeat(self): return {"ok": True, "agent_rev": None}
    def next_job(self):
        self.n += 1
        return {"id": 42, "kind": "sample", "category": "perfume", "inputs": ["k"]} if self.n == 8 else None
    def complete(self, i, keys): events.append(("complete", i)); return {"ok": True}
    def fail(self, i, e): events.append(("fail", i, e))
def loop_ps(cmd):
    if cmd == agent.PS_COUNT_SALAD: calls.append("salad"); return "1"
    if cmd in (agent.PS_KILL_LOOP, agent.PS_KILL_COMFY): calls.append("kill"); fc.up = False; return "1"
    return ""
sleeps = []
def loop_sleep(s):
    sleeps.append(s); clk.t += s
    if len(sleeps) > 12: raise KeyboardInterrupt
agent.Worker = W
agent.ComfyClient = lambda url: fc
agent.self_update = lambda cfg: False
agent.ensure_comfy_launcher = lambda cfg, comfy: False
agent._ps = loop_ps
agent.start_comfy_named = lambda cfg: (started.append(("named", len(calls))), setattr(fc, "up", True)) and True
agent.produce = lambda job, cfg, worker, comfy: events.append(("produce", job["id"], fc.up)) or ["out.jpg"]
agent.time = types.SimpleNamespace(time=clk.now, sleep=loop_sleep)
agent.IS_WINDOWS = True
sys.argv = ["agent.py", "--config", str(cfgp)]
agent.main()
assert events == [("produce", 42, True), ("complete", 42)], events
# أُغلق مرتين (قبل الطلب وبعد دقيقة من تسليمه)، وشُغّل ComfyUI.exe مرة واحدة بعد الإغلاق الأول
assert calls.count("kill") == 4 and len(started) == 1 and calls.index("kill") < started[0][1], (calls, started)
# بلا Windows أو مع gpu_share=off: لا تقاسم أبداً (السلوك السابق)
calls.clear(); started.clear(); events.clear(); sleeps.clear(); fc.up = True
agent.IS_WINDOWS = False
agent.main()
assert "kill" not in calls and "salad" not in calls and started == [] and events == [("produce", 42, True), ("complete", 42)], (calls, events)

print("share ok")
