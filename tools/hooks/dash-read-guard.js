#!/usr/bin/env node
// dash-read-guard: a Claude Code PreToolUse command hook for mcp__Claude_Docs__read.
// Registered in .claude/settings.json; reads the hook input (JSON) on stdin.
// Refuses exactly three cases, with exit 2 and a short reason on stderr:
//   1. a full read of the agent board body (BOARD_ID) with no parentId, no sinceRev
//      and no "outline" projection (payload absent, kind absent, or kind "view",
//      atRev included);
//   2. a full read of the log table (LOG_TABLE_ID) as parentId with no sinceRev;
//   3. the canary: payload.text === CANARY in any document, so any session can check
//      with one cheap search that this guard runs there.
// Everything else is allowed. Fails open: any error, unknown shape or bad JSON text
// exits 0 with no output. No dependencies.
'use strict';

const TOOL = 'mcp__Claude_Docs__read';
const BOARD_ID = 'ee2c569b-f39d'; // «لوحة الوكيل»: the board body node
const LOG_TABLE_ID = 'm0denaqvxev.15733'; // the log table, about 90K characters
const CANARY = '__dash_guard_canary__';
const STDIN_WAIT_MS = 3000; // stdin never closing counts as an error: allow

const MSG_BOARD =
  'حارس اللوحة (dash-guard): رُفضت قراءة «لوحة الوكيل» كاملة، فهي تتجاوز حد الأداة (القاعدة 20 (ب) والدرس 13).\n' +
  'البديل الأرخص في payload: {"kind":"view","parentId":"<معرّف القسم>"} لقسم واحد، أو {"kind":"search","text":"..."}، أو {"kind":"view","sinceRev":<آخر rev مسجّل>} للمتغيّر وحده.';
const MSG_TABLE =
  'حارس اللوحة (dash-guard): رُفضت قراءة جدول السجل ' + LOG_TABLE_ID + ' كاملاً، نحو 90 ألف حرف (القاعدة 20 (ب) والدرس 13).\n' +
  'البديل الأرخص: أضف "sinceRev":<آخر rev مسجّل> إلى الطلب نفسه ليعود المتغيّر وحده، أو {"kind":"search","text":"..."}.';
const MSG_CANARY =
  'dash-guard canary: الحارس فعّال في هذه الجلسة؛ هذا رفض متعمّد لنص الاختبار ولا يلزم شيء آخر.';

const present = (v) => v !== undefined && v !== null && v !== '';

// Returns the refusal text, or null to allow.
function decide(input) {
  if (!input || typeof input !== 'object' || input.tool_name !== TOOL) return null;
  const ti = input.tool_input;
  if (!ti || typeof ti !== 'object') return null;

  let p = ti.payload; // an object, or the same as JSON text
  if (typeof p === 'string') {
    try {
      p = JSON.parse(p);
    } catch {
      return null; // payload text that is not JSON: allow
    }
  }
  if (p === undefined || p === null) p = null; // no payload: a full read
  else if (typeof p !== 'object' || Array.isArray(p)) return null; // not understood: allow

  if (p && p.text === CANARY) return MSG_CANARY;

  const kind = p ? p.kind : undefined;
  const fullView =
    (!present(kind) || kind === 'view') &&
    !present(p && p.sinceRev) &&
    !(p && p.projection === 'outline');

  const id = ti.ref && typeof ti.ref === 'object' ? ti.ref.id : undefined;
  if (id === BOARD_ID && (p === null || (fullView && !present(p.parentId)))) return MSG_BOARD;
  if (p && p.parentId === LOG_TABLE_ID && fullView) return MSG_TABLE;
  return null;
}

let done = false;
const timer = setTimeout(() => {
  done = true;
  process.exit(0);
}, STDIN_WAIT_MS);

function finish(raw) {
  if (done) return;
  done = true;
  clearTimeout(timer);
  let msg = null;
  try {
    msg = decide(JSON.parse(raw));
  } catch {
    msg = null; // stdin that is not JSON: allow
  }
  if (msg) {
    process.stderr.write(msg + '\n');
    process.exitCode = 2; // PreToolUse: blocks the call, stderr goes to Claude
  }
}

process.on('uncaughtException', () => process.exit(0));
const chunks = [];
process.stdin.on('data', (c) => chunks.push(c));
process.stdin.on('end', () => finish(Buffer.concat(chunks).toString('utf8')));
process.stdin.on('error', () => finish(''));
