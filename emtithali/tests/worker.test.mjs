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

// ---- البند 84: طلب «أريد المدقق كواجهة API» وعدّاد فحوص المدقق ----
const apiReq = {
  company: "شركة اختبار", email: "api@example.com", invoices_per_month: "من 50 إلى 500",
  consent: "نعم: التواصل بشأن واجهة API لمدقق PINT AE فقط، بلا إحالة إلى أي مزوّد", source: "?src=validator-api",
  sent_at: "2026-11-26T15:00:00.000Z", kind: "validator-api",
};

test("طلب validator-api يُحفظ بلا اسم ولا جوال، وmetadata ‏{src, inv} نفسها، والسجل بالحقل kind", async () => {
  const store = kv();
  const r = await worker.fetch(post(apiReq), { LEADS: store, ASSETS: assets });
  assert.equal(r.status, 200);
  assert.deepStrictEqual(await r.json(), { success: true });
  assert.equal(store.m.size, 1);
  const [k, v] = [...store.m][0];
  assert.match(k, /^lead:\d{14}-[0-9a-f]{8}$/);
  const rec = JSON.parse(v);
  assert.deepEqual(Object.keys(rec), ["company", "invoices_per_month", "consent", "source", "sent_at", "email", "kind", "received_at", "site"]);
  assert.equal(rec.kind, "validator-api");
  assert.deepStrictEqual(store.o.get(k).metadata, { src: "?src=validator-api", inv: apiReq.invoices_per_month });
  assert.equal(JSON.stringify(store.o.get(k).metadata).includes(apiReq.email), false);
});

test("validator-api بلا بريد أو ببريد معطوب أو بلا موافقة أو بلا شركة، ونوع غير معروف: 400 دون حفظ", async () => {
  const store = kv();
  for (const bad of [
    { ...apiReq, email: "" }, { ...apiReq, email: "not-an-email" }, { ...apiReq, consent: " " },
    { ...apiReq, company: "" }, { ...apiReq, kind: "other" }, { ...lead, kind: "provider" },
  ]) {
    const r = await worker.fetch(post(bad), { LEADS: store, ASSETS: assets });
    assert.equal(r.status, 400, JSON.stringify(bad));
    assert.equal((await r.json()).success, false);
  }
  assert.equal(store.m.size, 0);
  // وطلب العروض العادي بلا kind ما زال يشترط الاسم والجوال
  const r2 = await worker.fetch(post({ company: "شركة", email: "a@example.com", consent: "نعم" }), { LEADS: store, ASSETS: assets });
  assert.equal(r2.status, 400);
  assert.equal(store.m.size, 0);
});

const check = (body, headers = {}, method = "POST") => new Request("https://emtithali.com/api/pint-check", {
  method, headers: { "content-type": "application/json", ...headers },
  body: method === "GET" ? undefined : typeof body === "string" ? body : JSON.stringify(body),
});

test("‎/api/pint-check‎: الحدث الصالح 204 ويُحفظ في CHECKS وحده بقيمة فارغة وmetadata ‏{ok, n}", async () => {
  const leads = kv(), checks = kv();
  for (const ev of [{ ok: true, n: 0 }, { ok: false, n: 6 }]) {
    const r = await worker.fetch(check(ev), { LEADS: leads, CHECKS: checks, ASSETS: assets });
    assert.equal(r.status, 204);
    assert.equal(r.headers.get("cache-control"), "no-store");
    assert.equal(await r.text(), "");
  }
  assert.equal(leads.m.size, 0);
  assert.equal(checks.m.size, 2);
  const entries = [...checks.m];
  for (const [k, v] of entries) { assert.match(k, /^check:\d{14}-[0-9a-f]{8}$/); assert.equal(v, ""); assert.deepStrictEqual(Object.keys(checks.o.get(k)), ["metadata"]); }
  assert.deepStrictEqual(entries.map(([k]) => checks.o.get(k).metadata), [{ ok: 1, n: 0 }, { ok: 0, n: 6 }]);
});

test("‎/api/pint-check‎: أي حقل زائد أو نوع خاطئ أو نتيجة متناقضة أو جسم كبير يُرفض دون حفظ، وGET ‏405", async () => {
  const checks = kv();
  for (const bad of [
    { ok: true, n: 0, name: "x" }, { ok: true, n: 0, xml: "<Invoice/>" }, { ok: "true", n: 0 }, { ok: true, n: "0" },
    { ok: true, n: 1 }, { ok: false, n: 0 }, { ok: false, n: -1 }, { ok: false, n: 1.5 }, { ok: false, n: 1001 }, { ok: true }, [true, 0], "x",
  ]) {
    const r = await worker.fetch(check(bad), { CHECKS: checks, ASSETS: assets });
    assert.equal(r.status, 400, JSON.stringify(bad));
  }
  const big = await worker.fetch(check(" ".repeat(65)), { CHECKS: checks, ASSETS: assets });
  assert.equal(big.status, 413);
  const get = await worker.fetch(check(null, {}, "GET"), { CHECKS: checks, ASSETS: assets });
  assert.equal(get.status, 405);
  assert.equal(checks.m.size, 0);
});

test("‎/api/pint-check‎ بلا ربط CHECKS أو بـx-dry-run: 204 دون أي كتابة، ولا يمس LEADS أبداً", async () => {
  const leads = kv(), checks = kv();
  const r1 = await worker.fetch(check({ ok: true, n: 0 }), { LEADS: leads, ASSETS: assets });
  assert.equal(r1.status, 204);
  const r2 = await worker.fetch(check({ ok: false, n: 2 }, { "x-dry-run": "1" }), { LEADS: leads, CHECKS: checks, ASSETS: assets });
  assert.equal(r2.status, 204);
  assert.equal(leads.m.size + checks.m.size, 0);
});

test("‎/api/pint-check‎: خطأ الكتابة لا يصل إلى الزائر، وحد 30 كتابة في الساعة لكل نسخة عامل", async () => {
  const fresh = (await import("../site/_worker.js?cap")).default; // نسخة مستقلة من الوحدة بعدّاد صفري
  const throwing = { put: async () => { throw new Error("KV PUT failed: 429"); } };
  const r = await fresh.fetch(check({ ok: true, n: 0 }), { CHECKS: throwing, ASSETS: assets });
  assert.equal(r.status, 204);
  const checks = kv();
  for (let i = 0; i < 40; i++) {
    const x = await fresh.fetch(check({ ok: i % 2 === 0, n: i % 2 === 0 ? 0 : 3 }), { CHECKS: checks, ASSETS: assets });
    assert.equal(x.status, 204);
  }
  // المحاولة المرمية الأولى تُحتسب، فيبقى 29 في الساعة نفسها (إلا إن عبر الاختبار رأس الساعة)
  assert.ok(checks.m.size === 29 || checks.m.size === 30, String(checks.m.size));
});
