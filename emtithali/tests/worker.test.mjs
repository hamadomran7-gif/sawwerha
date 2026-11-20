// اختبارات عامل امتثالي (emtithali/site/_worker.js): cd emtithali && npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../site/_worker.js";

// m: المفتاح ← القيمة، وo: المفتاح ← الخيار الثالث لـput (فيه metadata)
const kv = () => { const m = new Map(), o = new Map(); return { m, o, put: async (k, v, opts) => { m.set(k, v); o.set(k, opts); } }; };
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

test("metadata ‏{src, inv} فقط مع الطلب، بلا بيانات شخصية، والقيمة بالشكل القديم نفسه", async () => {
  const store = kv();
  const sent = { ...lead, source: "?src=free-zones", email: "a@example.com" };
  const r = await worker.fetch(post(sent), { LEADS: store, ASSETS: assets });
  assert.deepStrictEqual(await r.json(), { success: true });
  assert.equal(store.m.size, 1);
  const [k, v] = [...store.m][0];
  const opts = store.o.get(k);
  assert.deepStrictEqual(Object.keys(opts), ["metadata"]); // لا خيار آخر، كـexpirationTtl الذي يمحو الطلبات
  assert.deepStrictEqual(opts.metadata, { src: "?src=free-zones", inv: lead.invoices_per_month });
  for (const f of ["name", "company", "phone", "email"]) assert.equal(f in opts.metadata, false);
  for (const s of [sent.name, sent.company, sent.phone, sent.email]) assert.equal(JSON.stringify(opts.metadata).includes(s), false);
  assert.equal(v, JSON.stringify({ ...sent, received_at: JSON.parse(v).received_at, site: "emtithali.com" }));
});

test("source من 300 محرف تحكم: metadata دون حد KV ‏(1024 بايت)", async () => {
  const store = kv();
  // trim لا يزيل \u0001، وJSON.stringify يكتب كلاً منها 6 بايت: 300 منها 1800 بايت لولا الحدّ
  const r = await worker.fetch(post({ ...lead, source: "\u0001".repeat(300), invoices_per_month: "\u0001".repeat(100) }), { LEADS: store, ASSETS: assets });
  assert.deepStrictEqual(await r.json(), { success: true });
  const [k, v] = [...store.m][0];
  const { source } = JSON.parse(v);
  assert.equal(source, "\u0001".repeat(300)); // القيمة كما هي
  assert.ok(Buffer.byteLength(JSON.stringify({ src: source })) > 1024); // المدخل يتجاوز الحد فعلاً لولا القص
  const { metadata } = store.o.get(k);
  assert.deepStrictEqual(metadata, { src: "\u0001".repeat(100), inv: "\u0001".repeat(30) });
  assert.ok(Buffer.byteLength(JSON.stringify(metadata)) <= 1024);
});

test("إن رمى put مع metadata خطأً: يُحفظ الطلب بلا metadata ويرد بالنجاح", async () => {
  const store = kv(), tries = [];
  const put = store.put;
  store.put = async (k, v, opts) => { tries.push([k, opts]); if (opts?.metadata) throw new Error("KV PUT failed: 413 metadata too large"); return put(k, v, opts); };
  // بلا source ولا عدد فواتير: src = "direct" ولا inv
  const { source, invoices_per_month, ...bare } = lead;
  const r = await worker.fetch(post(bare), { LEADS: store, ASSETS: assets });
  assert.equal(r.status, 200);
  assert.deepStrictEqual(await r.json(), { success: true });
  assert.equal(store.m.size, 1);
  const [k, v] = [...store.m][0];
  // المحاولة الأولى بـmetadata رُفضت، والثانية بالمفتاح نفسه بلا خيارات
  assert.deepStrictEqual(tries, [[k, { metadata: { src: "direct" } }], [k, undefined]]);
  assert.equal(store.o.get(k), undefined);
  assert.equal(v, JSON.stringify({ ...bare, received_at: JSON.parse(v).received_at, site: "emtithali.com" }));
});
