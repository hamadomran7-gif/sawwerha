// اختبارات عامل امتثالي (emtithali/site/_worker.js): cd emtithali && npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../site/_worker.js";

const kv = () => { const m = new Map(); return { m, put: async (k, v) => { m.set(k, v); } }; };
const assets = { fetch: async (req) => new Response("asset:" + new URL(req.url).pathname, { status: 200 }) };
const lead = {
  name: "اختبار", company: "شركة اختبار", phone: "0500000000", invoices_per_month: "لا أعرف",
  current_system: "برنامج آخر", consent: "نعم: حتى ثلاثة مزوّدين معتمدين", source: "direct", sent_at: "2026-11-18T15:00:00.000Z",
};
const post = (body, headers = {}) => new Request("https://emtithali.com/api/submit", {
  method: "POST", headers: { "content-type": "application/json", accept: "application/json", ...headers },
  body: typeof body === "string" ? body : JSON.stringify(body),
});

test("طلب صالح يُحفظ بمفتاح lead:YYYYMMDDHHMMSS-xxxxxxxx وشكل السجل نفسه", async () => {
  const store = kv();
  const r = await worker.fetch(post({ ...lead, email: "a@example.com", extra: "drop me" }), { LEADS: store, ASSETS: assets });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await r.json(), { success: true });
  assert.equal(store.m.size, 1);
  const [k, v] = [...store.m][0];
  assert.match(k, /^lead:\d{14}-[0-9a-f]{8}$/);
  const rec = JSON.parse(v);
  assert.deepEqual(Object.keys(rec), ["name", "company", "phone", "invoices_per_month", "current_system", "consent", "source", "sent_at", "email", "received_at", "site"]);
  assert.equal(rec.site, "emtithali.com");
  assert.equal(rec.extra, undefined);
  // المفتاح بتوقيت received_at نفسه
  assert.equal(k.slice(5, 19), rec.received_at.replace(/[-:T]/g, "").slice(0, 14));
});

test("حقل إلزامي ناقص أو JSON معطوب: 400 دون حفظ", async () => {
  const store = kv();
  const r1 = await worker.fetch(post({ ...lead, phone: "  " }), { LEADS: store, ASSETS: assets });
  assert.equal(r1.status, 400);
  assert.equal((await r1.json()).success, false);
  const r2 = await worker.fetch(post("x"), { LEADS: store, ASSETS: assets });
  assert.equal(r2.status, 400);
  assert.equal(await r2.text(), '{"success":false,"message":"Bad JSON"}');
  const r3 = await worker.fetch(post({ ...lead, name: 5 }), { LEADS: store, ASSETS: assets });
  assert.equal(r3.status, 400);
  const r4 = await worker.fetch(post("x".repeat(20001)), { LEADS: store, ASSETS: assets });
  assert.equal(r4.status, 413);
  assert.equal(store.m.size, 0);
});

test("x-dry-run: 1 يرد بالنجاح دون كتابة، ولو بلا ربط KV", async () => {
  const store = kv();
  const r = await worker.fetch(post(lead, { "x-dry-run": "1" }), { LEADS: store, ASSETS: assets });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { success: true, dry_run: true });
  assert.equal(store.m.size, 0);
  const r2 = await worker.fetch(post(lead, { "x-dry-run": "1" }), { ASSETS: assets });
  assert.equal(r2.status, 200);
});

test("GET وغيره: 405 بالنص الأصلي", async () => {
  const r = await worker.fetch(new Request("https://emtithali.com/api/submit"), { LEADS: kv(), ASSETS: assets });
  assert.equal(r.status, 405);
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.equal(await r.text(), '{"success":false,"message":"Use POST"}');
});

test("بلا ربط LEADS: 503 JSON", async () => {
  const r = await worker.fetch(post(lead), { ASSETS: assets });
  assert.equal(r.status, 503);
  assert.equal((await r.json()).success, false);
});

test("ما عدا ‎/api/submit‎ يمر إلى الأصول الثابتة", async () => {
  const r = await worker.fetch(new Request("https://emtithali.com/api/other"), { LEADS: kv(), ASSETS: assets });
  assert.equal(await r.text(), "asset:/api/other");
  const r2 = await worker.fetch(new Request("https://emtithali.com/scope"), { LEADS: kv(), ASSETS: assets });
  assert.equal(await r2.text(), "asset:/scope");
});
