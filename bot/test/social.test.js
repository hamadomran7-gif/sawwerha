// اختبار النشر الآلي على إنستغرام (بلا شبكة: fetch محاكى).
import { test } from "node:test";
import assert from "node:assert/strict";
import { instagramTick, isDue, gulfNow, REELS } from "../src/social.js";

function memMeta() {
  const m = new Map();
  return { get: async (k) => (m.has(k) ? m.get(k) : null), set: async (k, v) => m.set(k, String(v)), _m: m };
}
// الأحد 1 نوفمبر 2026 الساعة 20:10 بتوقيت الخليج = 16:10 UTC
const SUN_2010 = Date.parse("2026-11-01T16:10:00Z"); // 2026-11-01 = الأحد
const FRI_2010 = Date.parse("2026-11-06T16:10:00Z");

test("الجدول: الأحد–الخميس بعد الساعة 20 بتوقيت الخليج، مرة يومياً", () => {
  assert.equal(gulfNow(SUN_2010).day, 0);
  assert.equal(isDue({ nowMs: SUN_2010, lastDate: null }), true);
  assert.equal(isDue({ nowMs: SUN_2010, lastDate: "2026-11-01" }), false);
  assert.equal(isDue({ nowMs: Date.parse("2026-11-01T15:00:00Z"), lastDate: null }), false); // 19:00
  assert.equal(isDue({ nowMs: FRI_2010, lastDate: null }), false); // الجمعة
  assert.equal(isDue({ nowMs: FRI_2010, lastDate: null, force: true }), true);
});

test("بلا أسرار: لا شيء يحدث", async () => {
  const r = await instagramTick({}, memMeta(), async () => {}, SUN_2010);
  assert.equal(r.skipped, "not configured");
});

test("دورة كاملة: إنشاء حاوية ← انتظار ← نشر ← المقطع التالي", async () => {
  const env = { IG_USER_ID: "1784", IG_TOKEN: "tok" };
  const meta = memMeta();
  const calls = [];
  let status = "IN_PROGRESS";
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    calls.push({ u, method: init.method || "GET", body: init.body ? String(init.body) : "" });
    if (u.endsWith("/1784/media")) return new Response(JSON.stringify({ id: "C1" }));
    if (u.includes("/C1?fields=status_code")) return new Response(JSON.stringify({ status_code: status }));
    if (u.endsWith("/1784/media_publish")) return new Response(JSON.stringify({ id: "M1" }));
    return new Response(JSON.stringify({ error: { message: "unexpected", code: 1 } }), { status: 400 });
  };
  try {
    const a = await instagramTick(env, meta, async () => {}, SUN_2010);
    assert.equal(a.created, "C1");
    assert.match(calls[0].body, /media_type=REELS/);
    assert.match(decodeURIComponent(calls[0].body), new RegExp(REELS[0].file.replace(".", "\\.")));
    const b = await instagramTick(env, meta, async () => {}, SUN_2010 + 5 * 60000);
    assert.equal(b.waiting, "C1");
    status = "FINISHED";
    const c = await instagramTick(env, meta, async () => {}, SUN_2010 + 10 * 60000);
    assert.equal(c.published, "M1");
    assert.equal(await meta.get("ig_next_index"), "1");
    assert.equal(await meta.get("ig_last_date"), "2026-11-01");
    const d = await instagramTick(env, meta, async () => {}, SUN_2010 + 15 * 60000);
    assert.equal(d.idle, true); // لا منشور ثانٍ في اليوم نفسه
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("خطأ في المعالجة: يتجاوز المقطع ويبلّغ المالك", async () => {
  const env = { IG_USER_ID: "1784", IG_TOKEN: "tok" };
  const meta = memMeta();
  await meta.set("ig_pending", JSON.stringify({ id: "C9", index: 2, created: SUN_2010, date: "2026-11-01" }));
  const notes = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ status_code: "ERROR" }));
  try {
    const r = await instagramTick(env, meta, async (m) => notes.push(m), SUN_2010 + 60000);
    assert.equal(r.abandoned, "C9");
    assert.equal(await meta.get("ig_next_index"), "3");
    assert.equal(notes.length, 1);
  } finally {
    globalThis.fetch = realFetch;
  }
});
