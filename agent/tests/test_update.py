import json, sys, tempfile, types
from pathlib import Path
sys.path.insert(0, sys.argv[1])
import agent

root = Path(tempfile.mkdtemp())
(root / "agent").mkdir()
(root / "agent" / "agent.py").write_bytes(b"print('x')\r\n")          # same content, CRLF
(root / "agent" / "pipeline.py").write_bytes(b"old = 1\n")              # will change
agent.ROOT = root
agent.HERE = root / "agent"

remote = {
    "agent/manifest.json": json.dumps({"files": {
        "agent/agent.py": "agent/agent.py",
        "agent/pipeline.py": "agent/pipeline.py",
        "agent/bad.py": "agent/bad.py",
        "workflows/x.json": "workflows/x.json",
        "evil.txt": "../../evil.txt",
    }}).encode(),
    "agent/agent.py": b"print('x')\n",
    "agent/pipeline.py": b"new = 2\n",
    "agent/bad.py": b"def (:\n",
    "workflows/x.json": b'{"a": 1}',
    "evil.txt": b"pwn",
}

class Resp:
    def __init__(self, b): self.content = b
    def raise_for_status(self): pass
    def json(self): return json.loads(self.content)

def fake_get(url, params=None, timeout=None, **kw):
    key = url.split("/main/", 1)[1]
    return Resp(remote[key])

agent.requests = types.SimpleNamespace(get=fake_get)
changed = agent.self_update({"repo": "o/r", "branch": "main"})
assert changed is True
assert (root / "agent" / "pipeline.py").read_bytes() == b"new = 2\n"
assert (root / "agent" / "agent.py").read_bytes() == b"print('x')\r\n", "CRLF-only difference must not rewrite"
assert not (root / "agent" / "bad.py").exists(), "invalid python must be skipped"
assert (root / "workflows" / "x.json").exists()
assert not (root.parent / "evil.txt").exists(), "path traversal must be refused"
assert agent.self_update({"repo": "o/r", "branch": "main"}) is False, "second run must be a no-op"

class FakeComfy:
    def __init__(self, names): self.names = names; self.calls = 0
    def loras(self): return self.names
    def folder(self, kind): return None
assert agent.lightning_name({"lightning": True}, FakeComfy([agent.LIGHTNING_LORA])) == agent.LIGHTNING_LORA
assert agent.lightning_name({}, FakeComfy([agent.LIGHTNING_LORA])) is None
assert agent.lightning_name({"lightning": False}, FakeComfy([agent.LIGHTNING_LORA])) is None
print("all update tests passed")
