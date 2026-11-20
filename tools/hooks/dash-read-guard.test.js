// Tests for dash-read-guard.js. Run from the repository root:
//   node --test tools/hooks/dash-read-guard.test.js
// Each case runs the script itself as a child process with a PreToolUse hook input
// on stdin, as Claude Code sends it, and checks the exit code and the streams.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const SCRIPT = path.join(__dirname, 'dash-read-guard.js');
const BOARD = { object: 'node', id: 'ee2c569b-f39d' };
const OTHER_DOC = { object: 'node', id: 'a1b2c3d4-e5f6' };
const CONTAINER = { kind: 'project', id: '0551f12a-82d9-4107-8ac4-238b8a005a35' };
const TABLE = 'm0denaqvxev.15733';
const CANARY = '__dash_guard_canary__';

function hookInput(toolInput, toolName = 'mcp__Claude_Docs__read') {
  return JSON.stringify({
    session_id: 'test-session',
    transcript_path: '/tmp/test-transcript.jsonl',
    cwd: path.resolve(__dirname, '..', '..'),
    permission_mode: 'default',
    hook_event_name: 'PreToolUse',
    tool_name: toolName,
    tool_input: toolInput,
    tool_use_id: 'toolu_test_01',
  });
}

function run(stdin) {
  const r = spawnSync(process.execPath, [SCRIPT], { input: stdin, encoding: 'utf8', timeout: 10000 });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

function read(payload, ref = BOARD) {
  const toolInput = { ref, container: CONTAINER };
  if (payload !== undefined) toolInput.payload = payload;
  return run(hookInput(toolInput));
}

function assertDeny(r) {
  assert.equal(r.code, 2, r.stderr);
  assert.equal(r.stdout, '');
  assert.match(r.stderr, /القاعدة 20 \(ب\) والدرس 13/);
  assert.match(r.stderr, /search/);
  assert.match(r.stderr, /sinceRev/);
  assert.ok(r.stderr.trim().split('\n').length <= 2, 'at most two lines');
}

function assertAllow(r) {
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, '');
}

test('full board read without payload: deny', () => assertDeny(read(undefined)));
test('board {"kind":"view"}: deny', () => assertDeny(read({ kind: 'view' })));
test('board atRev without parentId: deny', () => assertDeny(read({ kind: 'view', atRev: 412 })));
test('board one section by parentId: allow', () =>
  assertAllow(read({ kind: 'view', parentId: 'm0denaqvxev.100' })));
test('board sinceRev: allow', () => assertAllow(read({ kind: 'view', sinceRev: 412 })));
test('board search with text: allow', () => assertAllow(read({ kind: 'search', text: 'المحفظة' })));
test('board outline projection: allow', () => assertAllow(read({ projection: 'outline' })));
test('board history: allow', () => assertAllow(read({ kind: 'history' })));
test('log table in full: deny', () => assertDeny(read({ kind: 'view', parentId: TABLE })));
test('log table with sinceRev: allow', () =>
  assertAllow(read({ kind: 'view', parentId: TABLE, sinceRev: 412 })));
test('another document in full: allow', () => assertAllow(read(undefined, OTHER_DOC)));
test('payload as JSON text for a full read: deny', () => assertDeny(read('{"kind":"view"}')));
test('payload text that is not JSON: allow', () => assertAllow(read('{"kind":"view"')));
test('stdin that is not JSON: allow', () => assertAllow(run('not json {')));
test('canary: deny with the canary prefix', () => {
  const r = read({ kind: 'search', text: CANARY });
  assert.equal(r.code, 2);
  assert.equal(r.stdout, '');
  assert.ok(r.stderr.startsWith('dash-guard canary:'), r.stderr);
});
test('another tool on the board: allow', () =>
  assertAllow(run(hookInput({ ref: BOARD, container: CONTAINER }, 'mcp__Claude_Docs__update'))));

// Edge cases beyond the required list.
test('empty stdin: allow', () => assertAllow(run('')));
test('board empty payload object: deny', () => assertDeny(read({})));
test('log table with kind absent: deny', () => assertDeny(read({ parentId: TABLE })));
test('log table atRev without sinceRev: deny', () => assertDeny(read({ kind: 'view', parentId: TABLE, atRev: 9 })));
test('log table outline projection: allow', () =>
  assertAllow(read({ kind: 'view', parentId: TABLE, projection: 'outline' })));
test('canary in another document: deny', () => {
  const r = read({ kind: 'search', text: CANARY }, OTHER_DOC);
  assert.equal(r.code, 2);
  assert.ok(r.stderr.startsWith('dash-guard canary:'), r.stderr);
});
test('payload text that is a JSON number: allow', () => assertAllow(read('42')));
test('tool_input missing: allow', () =>
  assertAllow(run(JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'mcp__Claude_Docs__read' }))));
