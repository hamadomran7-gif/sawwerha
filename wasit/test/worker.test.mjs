// اختبارات عامل الوساطة (wasit/site/_worker.js) وصفحتها: cd wasit && npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker from "../site/_worker.js";

const HTML = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");

// KV وهمي: m المفتاح ← القيمة، وo المفتاح ← خيارات put (فيها metadata)، وlist بصفحات كما في Cloudflare
const kv = (pageSize = 1000) => {
  const m = new Map(), o = new Map();
  return {
    m, o,
    put: async (k, v, opts) => { m.set(k, v); o.set(k, opts); },
    list: async ({ prefix = "", cursor } = {}) => {
      const names = [...m.keys()].filter((k) => k.startsWith(prefix)).sort();
      const start = cursor ? Number(cursor) : 0;
      const keys = names.slice(start, start + pageSize).map((name) => ({ name, metadata: o.get(name)?.metadata }));
      const end = start + keys.length;
      return end < names.length ? { keys, list_complete: false, cursor: String(end) } : { keys, list_complete: true };
    },
  };
};
// أصول وهمية: الصفحة للمسارات بلا امتداد، وتسجّل رؤوس كل طلب
const assets = (html = HTML) => {
  const seen = [];
  return {
    seen,
    fetch: async (req) => {
      seen.push(req);
      const p = new URL(req.url).pathname;
      if (p.endsWith(".svg")) return new Response("<svg/>", { headers: { "content-type": "image/svg+xml", etag: '"svg"' } });
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", etag: '"abc"', "content-length": String(Buffer.byteLength(html)) } });
    },
  };
};
const lead = {
  name: "اختبار", phone: "971500000000", purpose: "استثمار", type: "تاون هاوس", budget: "2.5 إلى 4 ملايين",
  timing: "خلال 3 أشهر", pay: "خطة دفع المطوّر", consent: true, source: "?src=ig&fbclid=xyz", page: "/", at: "2026-11-24T00:00:00.000Z",
};
const post = (body, headers = {}, host = "wasit.example") => new Request(`https://${host}/api/lead`, {
  method: "POST", headers: { "content-type": "application/json", ...headers },
  body: typeof body === "string" ? body : JSON.stringify(body),
});
const get = (path, headers = {}, host = "wasit.example") => new Request(`https://${host}${path}`, { headers });

// خيارات كل قائمة في الصفحة كما يراها المتصفح
function pageOptions() {
  const out = {};
  for (const [, id, body] of HTML.matchAll(/<select id="([a-z]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    out[id] = [...body.matchAll(/<option(?: value="([^"]*)")?>([^<]*)<\/option>/g)].map(([, v, t]) => (v === undefined ? t : v)).filter(Boolean);
  }
  return out;
}

test("طلب صالح يُحفظ بمفتاح lead:<ISO>:<8 hex> وmetadata ‏{src, budget, type} بلا بيانات شخصية", async () => {
  const store = kv();
  const r = await worker.fetch(post({ ...lead, phone: "+971 50-000 (0000)", extra: "drop me" }), { WASIT_LEADS: store, ASSETS: assets() });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(store.m.size, 1);
  const [k, v] = [...store.m][0];
  assert.match(k, /^lead:\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z:[0-9a-f]{8}$/);
  const rec = JSON.parse(v);
  assert.deepEqual(Object.keys(rec), ["name", "phone", "purpose", "type", "budget", "timing", "pay", "consent", "source", "page", "sent_at", "received_at", "site"]);
  assert.equal(rec.phone, "971500000000");
  assert.equal(rec.extra, undefined);
  assert.equal(rec.site, "wasit.example");
  assert.equal(k.slice(5, 29), rec.received_at);
  const opts = store.o.get(k);
  assert.deepEqual(Object.keys(opts), ["metadata"]); // لا expirationTtl يمحو الطلبات
  assert.deepEqual(opts.metadata, { src: "ig", budget: lead.budget, type: lead.type });
  for (const s of [lead.name, "971500000000", "fbclid"]) assert.equal(JSON.stringify(opts.metadata).includes(s), false);
});

test("كل خيار في قوائم الصفحة مقبول، وما ليس فيها يُرد 400", async () => {
  const opts = pageOptions();
  assert.deepEqual(Object.keys(opts).sort(), ["budget", "pay", "purpose", "timing", "type"]);
  for (const [field, values] of Object.entries(opts)) {
    assert.ok(values.length >= 3, field);
    for (const value of values) {
      const r = await worker.fetch(post({ ...lead, [field]: value }, { "x-dry-run": "1" }), { ASSETS: assets() });
      assert.equal(r.status, 200, `${field}=${value}`);
    }
    const r = await worker.fetch(post({ ...lead, [field]: values[0] + " " }, { "x-dry-run": "1" }), { ASSETS: assets() });
    assert.equal(r.status, 400, field);
    assert.deepEqual(await r.json(), { ok: false, error: field });
  }
});

test("التحقق: الاسم والهاتف والموافقة والفخ وJSON، و400 بلا حفظ", async () => {
  const store = kv();
  const env = { WASIT_LEADS: store, ASSETS: assets() };
  const cases = [
    [{ ...lead, name: "  " }, "name"], [{ ...lead, name: "ا".repeat(81) }, "name"], [{ ...lead, name: 5 }, "name"],
    [{ ...lead, phone: "12345678" }, "phone"], [{ ...lead, phone: "1".repeat(16) }, "phone"], [{ ...lead, phone: "97150abc0000" }, "phone"],
    [{ ...lead, phone: 971500000000 }, "phone"], [{ ...lead, consent: "true" }, "consent"], [{ ...lead, consent: false }, "consent"],
    [(({ consent, ...x }) => x)(lead), "consent"], [{ ...lead, website: "http://spam.example" }, "website"], [{ ...lead, website: 0 }, "website"],
    ["x", "json"], [[lead], "json"], ["null", "json"],
  ];
  for (const [body, field] of cases) {
    const r = await worker.fetch(post(body), env);
    assert.equal(r.status, 400, field);
    assert.deepEqual(await r.json(), { ok: false, error: field });
  }
  assert.equal((await worker.fetch(post({ ...lead, name: "ا".repeat(80), website: "" }), env)).status, 200); // 80 حرفاً والفخ فارغ
  assert.equal((await worker.fetch(post("x".repeat(8001)), env)).status, 413);
  assert.equal((await worker.fetch(get("/api/lead"), env)).status, 405);
  assert.equal(store.m.size, 1);
});

test("الأرقام العربية الهندية تُحوَّل، وx-dry-run لا يكتب، وبلا KV يرد 503", async () => {
  const store = kv();
  const r = await worker.fetch(post({ ...lead, phone: "٩٧١٥٠٠٠٠٠٠٠٠" }), { WASIT_LEADS: store, ASSETS: assets() });
  assert.equal(r.status, 200);
  assert.equal(JSON.parse([...store.m.values()][0]).phone, "971500000000");
  const r2 = await worker.fetch(post({ ...lead, phone: "۹۷۱۵۰۰۰۰۰۰۰۰" }, { "x-dry-run": "1" }), { WASIT_LEADS: store, ASSETS: assets() });
  assert.deepEqual(await r2.json(), { ok: true, dry_run: true });
  assert.equal(store.m.size, 1);
  const r3 = await worker.fetch(post(lead), { ASSETS: assets() });
  assert.equal(r3.status, 503);
});

test("إن رمى put مع metadata: يُحفظ الطلب بالمفتاح نفسه بلاها ويرد بالنجاح", async () => {
  const store = kv(), tries = [];
  const put = store.put;
  store.put = async (k, v, opts) => { tries.push([k, opts]); if (opts?.metadata) throw new Error("KV PUT failed"); return put(k, v, opts); };
  const r = await worker.fetch(post({ ...lead, source: "" }), { WASIT_LEADS: store, ASSETS: assets() });
  assert.deepEqual(await r.json(), { ok: true });
  const [k] = [...store.m.keys()];
  assert.deepEqual(tries, [[k, { metadata: { src: "direct", budget: lead.budget, type: lead.type } }], [k, undefined]]);
});

test("/api/stats: العدد بالأيام بتوقيت دبي والمصادر، بلا اسم ولا هاتف ولو عُبث بـmetadata، وعبر صفحات القائمة", async () => {
  const store = kv(2);
  const day = (iso, src, extra = {}) => store.put(`lead:${iso}:0000000${store.m.size}`, JSON.stringify({ name: "سالم", phone: "971511111111" }), { metadata: { src, budget: lead.budget, type: "فيلا", ...extra } });
  await day("2026-11-24T19:59:59.000Z", "ig"); // 23:59 دبي
  await day("2026-11-24T20:00:00.000Z", "ig"); // 00:00 دبي من اليوم التالي
  await day("2026-11-25T08:00:00.000Z", "google");
  await day("2026-11-25T09:00:00.000Z", "971511111111 سالم", { budget: "سالم", type: "971511111111" });
  await store.put("lead:2026-11-25T10:00:00.000Z:abcdef12", "{}"); // بلا metadata
  await store.put("other:key", "{}");
  const r = await worker.fetch(get("/api/stats"), { WASIT_LEADS: store, ASSETS: assets() });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("cache-control"), "no-store");
  const s = await r.json();
  assert.deepEqual(s, {
    ok: true, tz: "Asia/Dubai", total: 5,
    days: { "2026-11-24": 1, "2026-11-25": 4 },
    sources: { ig: 2, google: 1, other: 2 },
    budget: { [lead.budget]: 3 },
    type: { "فيلا": 3 },
  });
  const text = JSON.stringify(s);
  for (const p of ["سالم", "971511111111", "undefined"]) assert.equal(text.includes(p), false, p);
  assert.equal((await worker.fetch(new Request("https://wasit.example/api/stats", { method: "POST" }), { WASIT_LEADS: store })).status, 405);
  assert.equal((await worker.fetch(get("/api/stats"), { ASSETS: assets() })).status, 503);
});

test("الصفحة: حقن القيم الست في سمات body بعد التهريب، وnoindex ما لم يكن WASIT_LIVE=1", async () => {
  const env = {
    ASSETS: assets(), WASIT_NAME: ' A "B" <C> & D\'s $& ', WASIT_WHATSAPP: "971500000000", WASIT_BRN: "12345",
    WASIT_OFFICE: "مكتب <ب>", WASIT_ORN: "678", WASIT_PERMIT: "$'x",
  };
  const r = await worker.fetch(get("/"), env);
  assert.equal(r.status, 200);
  const html = await r.text();
  const body = html.match(/<body[^>]*>/)[0];
  assert.equal(body, '<body data-name="A &quot;B&quot; &lt;C&gt; &amp; D&#39;s $&amp;" data-whatsapp="971500000000" data-brn="12345" data-office="مكتب &lt;ب&gt;" data-orn="678" data-permit="$&#39;x">');
  assert.equal(html.replace(body, ""), HTML.replace(/<body[^>]*>/, "")); // لا تغيير خارج وسم body
  assert.equal(r.headers.get("x-robots-tag"), "noindex");
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.equal(r.headers.get("etag"), null);
  assert.equal(r.headers.get("content-length"), null);
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  // بلا متغيرات: السمات فارغة كما في المستودع
  const r2 = await worker.fetch(get("/"), { ASSETS: assets() });
  assert.equal(await r2.text(), HTML);
});

test("WASIT_LIVE=1: يُحذف noindex على النطاق، ويبقى على ‎*.pages.dev‎", async () => {
  const live = await worker.fetch(get("/?src=ig"), { ASSETS: assets(), WASIT_LIVE: "1" });
  assert.equal(live.headers.get("x-robots-tag"), null);
  assert.doesNotMatch(await live.text(), /noindex/);
  const preview = await worker.fetch(get("/", {}, "abc.wasit.pages.dev"), { ASSETS: assets(), WASIT_LIVE: "1" });
  assert.equal(preview.headers.get("x-robots-tag"), "noindex");
  assert.match(await preview.text(), /<meta name="robots" content="noindex">/);
  const off = await worker.fetch(get("/"), { ASSETS: assets(), WASIT_LIVE: "true" });
  assert.equal(off.headers.get("x-robots-tag"), "noindex");
});

test("HTML يُطلب من الأصول بلا شرط (لا 304 بقيم قديمة)، وغير HTML يمر كما هو، و/api/* الأخرى 404", async () => {
  const a = assets();
  const r = await worker.fetch(get("/", { "if-none-match": '"abc"', "if-modified-since": "Mon, 23 Nov 2026 00:00:00 GMT" }), { ASSETS: a });
  assert.equal(r.status, 200);
  assert.equal(a.seen[0].headers.get("if-none-match"), null);
  assert.equal(a.seen[0].headers.get("if-modified-since"), null);
  const svg = await worker.fetch(get("/favicon.svg", { "if-none-match": '"svg"' }), { ASSETS: a });
  assert.equal(a.seen[1].headers.get("if-none-match"), '"svg"');
  assert.equal(svg.headers.get("etag"), '"svg"');
  assert.equal(await svg.text(), "<svg/>");
  const head = await worker.fetch(new Request("https://wasit.example/", { method: "HEAD" }), { ASSETS: a });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  const other = await worker.fetch(get("/api/other"), { ASSETS: a });
  assert.equal(other.status, 404);
  assert.equal(a.seen.length, 3);
});

test("المستودع العام: لا اسم ولا رقم في الصفحة، والسمات الست فارغة، وواتساب لا يُبنى إلا من data-whatsapp", () => {
  for (const f of ["index.html", "404.html", "_worker.js"]) {
    const s = readFileSync(new URL(`../site/${f}`, import.meta.url), "utf8");
    assert.doesNotMatch(s, /حمد|عمران/, f);
    assert.doesNotMatch(s, /(?<![\d.])\d{8,}(?![\d.])/, f); // لا رقم هاتف أو بطاقة
    assert.doesNotMatch(s, /wa\.me\/\d/, f);
  }
  assert.match(HTML, /<body data-name="" data-whatsapp="" data-brn="" data-office="" data-orn="" data-permit="">/);
  assert.match(HTML, /<meta name="robots" content="noindex">/);
  assert.equal(new Set([...HTML.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])).size, [...HTML.matchAll(/ id="([^"]+)"/g)].length); // لا معرّف مكرر
});
