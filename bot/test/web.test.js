// قناة الموقع (‎/web/*‎) والمهمة الدورية الخفيفة وانتهاء صور KV — Worker كامل مع محاكاة D1 (node:sqlite) وKV.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import worker from "../src/index.js";
import { sniffImage, isWebPhone, ipHash, webConfig } from "../src/web.js";
import { mediaTtlSeconds } from "../src/media.js";

/* ---------- محاكاة D1 مع عدّاد الاستعلامات ---------- */
function makeD1() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(fs.readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
  const log = [];
  const prepare = (sql) => {
    log.push(sql);
    let params = [];
    const stmt = () => sqlite.prepare(sql);
    return {
      bind(...p) {
        params = p.map((v) => (v === undefined ? null : v));
        return this;
      },
      async first() {
        return stmt().get(...params) ?? null;
      },
      async run() {
        const r = stmt().run(...params);
        return { success: true, meta: { changes: r.changes, last_row_id: r.lastInsertRowid } };
      },
      async all() {
        return { results: stmt().all(...params) };
      },
    };
  };
  return { prepare, _raw: sqlite, _log: log };
}

/* ---------- محاكاة Workers KV (مع مدة الانتهاء) ---------- */
function makeKV() {
  const store = new Map();
  return {
    async put(key, value, opts = {}) {
      store.set(key, { value: value instanceof ArrayBuffer ? value : new TextEncoder().encode(String(value)).buffer, metadata: opts.metadata || null, ttl: opts.expirationTtl });
    },
    async getWithMetadata(key) {
      const o = store.get(key);
      return o ? { value: o.value, metadata: o.metadata } : { value: null, metadata: null };
    },
    _store: store,
  };
}

// لا اتصال بواتساب في هذه القناة: أي نداء لـ graph.facebook.com خطأ
const graphCalls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).includes("graph.facebook.com")) {
    graphCalls.push(String(url));
    return new Response(JSON.stringify({ messages: [{ id: "x" }] }), { status: 200 });
  }
  return realFetch(url, init);
};

const env = {
  DB: makeD1(),
  MEDIA: makeKV(),
  BRAND: "صوّرها",
  AGENT_TOKEN: "agent-secret",
  OWNER_PHONE: "971500000001",
  WA_TOKEN: "t",
  WA_PHONE_ID: "P",
  PRICE_SINGLE: "149",
  PRICE_LAUNCH: "499",
  PRICE_SUB_LITE: "499",
  PRICE_SUB_CONTENT: "899",
  ZIINA_LINK_SINGLE: "https://pay.ziina.com/sawwerha/149",
};
const ctx = () => {
  const waits = [];
  return { waitUntil: (p) => waits.push(p), done: () => Promise.all(waits) };
};

const SITE = "https://sawwerha.app";
const API = "https://api.sawwerha.app";
const jpeg = (n = 4096) => {
  const b = new Uint8Array(n);
  b.set([0xff, 0xd8, 0xff, 0xe0]);
  return b;
};
const png = (n = 4096) => {
  const b = new Uint8Array(n);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return b;
};

function upload(body, { type = "image/jpeg", category = "perfume", consent = "1", origin = SITE, ip = "203.0.113.7", length } = {}) {
  const headers = { "Content-Type": type, "CF-Connecting-IP": ip };
  if (origin) headers.Origin = origin;
  if (length !== null) headers["Content-Length"] = String(length ?? body.byteLength);
  const q = new URLSearchParams({ category, consent });
  return worker.fetch(new Request(`${API}/web/samples?${q}`, { method: "POST", headers, body }), env, ctx());
}
const get = (path, headers = {}) => worker.fetch(new Request(`${API}${path}`, { headers: { Origin: SITE, ...headers } }), env, ctx());
const agent = (path, init = {}) => worker.fetch(new Request(`${API}${path}`, { ...init, headers: { Authorization: "Bearer agent-secret", ...(init.headers || {}) } }), env, ctx());
const resetLimits = () => env.DB._raw.exec("DELETE FROM meta WHERE key GLOB 'web_*'; UPDATE orders SET status = 'delivered' WHERE status IN ('queued','processing');");

test("التعرّف على نوع الصورة من أول البايتات", () => {
  assert.equal(sniffImage(jpeg(16)), "image/jpeg");
  assert.equal(sniffImage(png(16)), "image/png");
  const webp = new Uint8Array(16);
  webp.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  assert.equal(sniffImage(webp), "image/webp");
  assert.equal(sniffImage(new TextEncoder().encode("<html><script>")), null);
  assert.equal(sniffImage(new Uint8Array([0xff, 0xd8])), null);
  assert.equal(isWebPhone("web:abc"), true);
  assert.equal(isWebPhone("971500000002"), false);
});

test("بصمة IP يومية ثابتة وقصيرة ولا تحوي العنوان", async () => {
  const a = await ipHash("203.0.113.7", "2026-11-18");
  assert.match(a, /^[0-9a-f]{16}$/);
  assert.equal(a, await ipHash("203.0.113.7", "2026-11-18"));
  assert.notEqual(a, await ipHash("203.0.113.7", "2026-11-19"));
  assert.ok(!a.includes("203"));
});

test("الإعداد الافتراضي: 30 عيّنة يومياً و2 لكل IP و20 في الطابور و10MB", () => {
  const c = webConfig({});
  assert.deepEqual([c.dailyCap, c.ipCap, c.queueCap, c.maxBytes], [30, 2, 20, 10 * 1024 * 1024]);
  assert.ok(c.origins.includes("https://sawwerha.app") && c.origins.includes("https://www.sawwerha.app"));
  assert.equal(webConfig({ WEB_UPLOADS: "off" }).open, false);
});

test("CORS: طلب التمهيد مسموح من الموقع فقط", async () => {
  const ok = await worker.fetch(new Request(`${API}/web/samples`, { method: "OPTIONS", headers: { Origin: SITE } }), env, ctx());
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get("Access-Control-Allow-Origin"), SITE);
  assert.match(ok.headers.get("Access-Control-Allow-Methods"), /POST/);
  const www = await worker.fetch(new Request(`${API}/web/samples`, { method: "OPTIONS", headers: { Origin: "https://www.sawwerha.app" } }), env, ctx());
  assert.equal(www.status, 204);
  const bad = await worker.fetch(new Request(`${API}/web/samples`, { method: "OPTIONS", headers: { Origin: "https://evil.example" } }), env, ctx());
  assert.equal(bad.status, 403);
  assert.equal(bad.headers.get("Access-Control-Allow-Origin"), null);
});

test("رحلة الموقع كاملة: رفع ← طابور ← إنتاج ← صفحة خاصة ← حزمة 149 ← دفع ← تسليم، بلا واتساب", async () => {
  // 1) الرفع
  const r = await upload(jpeg());
  assert.equal(r.status, 201);
  assert.equal(r.headers.get("Access-Control-Allow-Origin"), SITE);
  const up = await r.json();
  assert.match(up.token, /^[0-9a-f-]{36}$/);
  assert.equal(up.page, `${SITE}/s/#${up.token}`);
  assert.equal(up.status, "queued");
  const o = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(up.order).first();
  assert.equal(o.phone, `web:${up.token}`);
  assert.equal(o.kind, "sample");
  assert.equal(o.category, "perfume");
  assert.equal(o.status, "queued");
  const inKey = `web/${up.token}/in/1.jpg`;
  assert.deepEqual(JSON.parse(o.inputs), [inKey]);
  const stored = env.MEDIA._store.get(inKey);
  assert.equal(stored.metadata.contentType, "image/jpeg");
  assert.equal(stored.ttl, 90 * 86400); // تُحذف تلقائياً بعد 90 يوماً
  // لا عميل يُنشأ لطلب الموقع (فلا متابعات واتساب ولا تذكيرات)
  const cust = await env.DB.prepare("SELECT COUNT(*) n FROM customers").first();
  assert.equal(cust.n, 0);

  // 2) الصفحة الخاصة: في الطابور
  let st = await (await get(`/web/samples/${up.token}`)).json();
  assert.equal(st.sample.status, "queued");
  assert.equal(st.sample.code, `W${up.order}`);
  assert.equal(st.sample.ahead, 0);
  assert.deepEqual(st.sample.images, []);
  assert.equal(st.package, null);
  assert.equal(st.packages.SINGLE.price, 149);
  assert.equal(st.packages.SINGLE.pay_link, "https://pay.ziina.com/sawwerha/149");
  assert.equal(JSON.stringify(st).includes("web:"), false); // لا يظهر المعرّف الداخلي

  // 3) الوكيل يلتقطه كأي عيّنة (3 صور، فئة الطلب، لغة عربية)
  const job = (await (await agent("/api/jobs/next")).json()).job;
  assert.equal(job.id, up.order);
  assert.equal(job.kind, "sample");
  assert.equal(job.outputs_per_product, 3);
  assert.equal(job.category, "perfume");
  assert.deepEqual(job.inputs, [inKey]);
  const dl = await agent(`/api/media/${encodeURIComponent(inKey)}`);
  assert.equal(dl.status, 200);
  st = await (await get(`/web/samples/${up.token}`)).json();
  assert.equal(st.sample.status, "processing");

  // 4) النتائج والإكمال: لا نداء لواتساب
  const outs = ["p1_white_1.jpg", "p1_life_1.jpg", "p1_life_2.jpg"];
  for (const n of outs) {
    const put = await agent(`/api/jobs/${up.order}/outputs/${n}`, { method: "PUT", body: jpeg(2048), headers: { "Content-Type": "image/jpeg" } });
    assert.equal(put.status, 200);
  }
  assert.equal(env.MEDIA._store.get(`orders/${up.order}/out/p1_white_1.jpg`).ttl, 90 * 86400);
  const done = await agent(`/api/jobs/${up.order}/complete`, { method: "POST", body: JSON.stringify({ outputs: outs.map((n) => `orders/${up.order}/out/${n}`) }) });
  assert.deepEqual(await done.json(), { ok: true, test: true });
  assert.equal(graphCalls.length, 0);

  // 5) الصفحة الخاصة تعرض الصور، والصورة تُخدم لصاحب الرمز فقط
  st = await (await get(`/web/samples/${up.token}`)).json();
  assert.equal(st.sample.status, "delivered");
  assert.equal(st.sample.images.length, 3);
  assert.equal(st.sample.images[0], `${API}/web/media/${up.token}/${up.order}/p1_white_1.jpg`);
  const img = await get(new URL(st.sample.images[0]).pathname);
  assert.equal(img.status, 200);
  assert.equal(img.headers.get("Content-Type"), "image/jpeg");
  assert.match(img.headers.get("Cache-Control"), /private/);
  const other = crypto.randomUUID();
  assert.equal((await get(`/web/media/${other}/${up.order}/p1_white_1.jpg`)).status, 404);
  assert.equal((await get(`/web/media/${up.token}/${up.order}/not_an_output.jpg`)).status, 404);
  assert.equal((await get(`/web/media/${up.token}/${up.order}/..%2F..%2Fin%2F1.jpg`)).status, 404);
  assert.equal((await get(`/web/samples/${other}`)).status, 404);
  assert.equal((await get(`/web/samples/not-a-token`)).status, 404);

  // 6) طلب حزمة المنتج الواحد على الصورة نفسها
  const ord = (body, origin = SITE) => worker.fetch(new Request(`${API}/web/samples/${up.token}/order`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body) }), env, ctx());
  assert.equal((await ord({ code: "SINGLE" }, "https://evil.example")).status, 403);
  assert.equal((await ord({ code: "NOPE" })).status, 400);
  const launch = await ord({ code: "LAUNCH" });
  assert.equal(launch.status, 409);
  assert.equal((await launch.json()).error, "contact");
  const p1 = await ord({ code: "SINGLE" });
  assert.equal(p1.status, 201);
  const pj = await p1.json();
  assert.equal(pj.pay_link, "https://pay.ziina.com/sawwerha/149");
  assert.equal(pj.package.status, "awaiting_payment");
  assert.equal(pj.package.price, 149);
  assert.equal(pj.package.code, `W${pj.package.id}`);
  const again = await (await ord({ code: "SINGLE" })).json(); // لا تكرار
  assert.equal(again.package.id, pj.package.id);
  const pkgRow = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(pj.package.id).first();
  assert.equal(pkgRow.phone, `web:${up.token}`);
  assert.equal(pkgRow.package_code, "SINGLE");
  assert.equal(pkgRow.max_inputs, 1);
  assert.deepEqual(JSON.parse(pkgRow.inputs), [inKey]);

  // 7) تأكيد الدفع (أمر المالك) يدخله الطابور مباشرة دون رسائل للعميل
  const { markPaid } = await import("../src/index.js");
  await markPaid(env, pkgRow);
  assert.equal((await env.DB.prepare("SELECT status FROM orders WHERE id = ?").bind(pj.package.id).first()).status, "queued");
  st = await (await get(`/web/samples/${up.token}`)).json();
  assert.equal(st.package.status, "queued");
  assert.equal(st.package.ahead, 0);

  // 8) الوكيل ينتج الحزمة (6 صور بلا علامة مائية لأنها ليست عيّنة) وتظهر في الصفحة
  const job2 = (await (await agent("/api/jobs/next")).json()).job;
  assert.equal(job2.id, pj.package.id);
  assert.equal(job2.kind, "package");
  assert.equal(job2.outputs_per_product, 6);
  await agent(`/api/jobs/${job2.id}/outputs/p1_white_1.jpg`, { method: "PUT", body: jpeg(2048), headers: { "Content-Type": "image/jpeg" } });
  await agent(`/api/jobs/${job2.id}/complete`, { method: "POST", body: JSON.stringify({ outputs: [`orders/${job2.id}/out/p1_white_1.jpg`] }) });
  st = await (await get(`/web/samples/${up.token}`)).json();
  assert.equal(st.package.status, "delivered");
  assert.equal(st.package.images.length, 1);
  assert.equal(graphCalls.length, 0);
});

test("رفض الرفع: الموافقة والأصل والنوع والحجم والطول", async () => {
  resetLimits();
  assert.equal((await upload(jpeg(), { consent: "0" })).status, 400);
  assert.equal((await upload(jpeg(), { origin: "https://evil.example" })).status, 403);
  assert.equal((await upload(jpeg(), { origin: null })).status, 403);
  assert.equal((await upload(jpeg(), { type: "text/html" })).status, 415);
  assert.equal((await upload(png(), { type: "image/jpeg" })).status, 415); // النوع المعلن يخالف البايتات
  assert.equal((await upload(new TextEncoder().encode("x".repeat(5000)), { type: "image/png" })).status, 415);
  assert.equal((await upload(jpeg(100))).status, 400); // أصغر من 1KB
  assert.equal((await upload(jpeg(), { length: 11 * 1024 * 1024 })).status, 413);
  assert.equal((await upload(jpeg(), { length: null })).status, 411);
  // فئة غير معروفة تُحفظ «أخرى»
  const r = await upload(png(), { type: "image/png", category: "weapons" });
  assert.equal(r.status, 201);
  const id = (await r.json()).order;
  assert.equal((await env.DB.prepare("SELECT category FROM orders WHERE id = ?").bind(id).first()).category, "other");
  // لم تُكتب عدّادات للمرفوض: رفع واحد مقبول = 1
  const day = new Date().toISOString().slice(0, 10);
  assert.equal((await env.DB.prepare("SELECT value FROM meta WHERE key = ?").bind(`web_day_${day}`).first()).value, "1");
});

test("الحدود: 2 لكل IP يومياً، وسقف يومي، وطابور ممتلئ، وإيقاف الخدمة", async () => {
  resetLimits();
  const ip = "198.51.100.1";
  assert.equal((await upload(jpeg(), { ip })).status, 201);
  assert.equal((await upload(jpeg(), { ip })).status, 201);
  const third = await upload(jpeg(), { ip });
  assert.equal(third.status, 429);
  assert.equal((await third.json()).error, "ip_cap");
  assert.equal((await upload(jpeg(), { ip: "198.51.100.2" })).status, 201); // عنوان آخر

  // سقف يومي
  resetLimits();
  const day = new Date().toISOString().slice(0, 10);
  await env.DB.prepare("INSERT INTO meta (key, value) VALUES (?, '30')").bind(`web_day_${day}`).run();
  const capped = await upload(jpeg(), { ip: "198.51.100.3" });
  assert.equal(capped.status, 429);
  assert.equal((await capped.json()).error, "daily_cap");

  // طابور ممتلئ
  resetLimits();
  for (let i = 0; i < 20; i++) await env.DB.prepare("INSERT INTO orders (phone, kind, status) VALUES ('971000000999', 'sample', 'queued')").run();
  const busy = await upload(jpeg(), { ip: "198.51.100.4" });
  assert.equal(busy.status, 503);
  assert.equal((await busy.json()).error, "busy");

  // إيقاف المالك ومفتاح الإغلاق
  resetLimits();
  await env.DB.prepare("INSERT INTO meta (key, value) VALUES ('paused', '1') ON CONFLICT(key) DO UPDATE SET value = '1'").run();
  assert.equal((await upload(jpeg(), { ip: "198.51.100.5" })).status, 503);
  await env.DB.prepare("UPDATE meta SET value = '0' WHERE key = 'paused'").run();
  env.WEB_UPLOADS = "off";
  assert.equal((await upload(jpeg(), { ip: "198.51.100.5" })).status, 503);
  delete env.WEB_UPLOADS;
  assert.equal((await upload(jpeg(), { ip: "198.51.100.5" })).status, 201);
});

test("عدّادات الأيام السابقة تُحذف عند أول رفع في اليوم", async () => {
  resetLimits();
  await env.DB.prepare("INSERT INTO meta (key, value) VALUES ('web_day_2020-01-01', '9'), ('web_ip_2020-01-01_aaaa', '2'), ('agent_last_seen', '2026-11-18T00:00:00Z') ON CONFLICT(key) DO NOTHING").run();
  assert.equal((await upload(jpeg(), { ip: "192.0.2.10" })).status, 201);
  const old = await env.DB.prepare("SELECT COUNT(*) n FROM meta WHERE key LIKE 'web_%2020-01-01%'").first();
  assert.equal(old.n, 0);
  const today = await env.DB.prepare("SELECT COUNT(*) n FROM meta WHERE key GLOB 'web_*'").first();
  assert.equal(today.n, 2); // عدّاد اليوم وعدّاد العنوان
  assert.ok(await env.DB.prepare("SELECT 1 FROM meta WHERE key = 'agent_last_seen'").first()); // لا يُمس غيرها
});

test("المهمة الدورية الخاملة استعلام واحد، ولا تكتب عند عمل الجهاز", async () => {
  env.DB._raw.exec("DELETE FROM orders; DELETE FROM customers; DELETE FROM meta;");
  await env.DB.prepare("INSERT INTO meta (key, value) VALUES ('agent_last_seen', ?)").bind(new Date().toISOString()).run();
  const n0 = env.DB._log.length;
  const c = ctx();
  await worker.scheduled({}, env, c);
  await c.done();
  const queries = env.DB._log.slice(n0);
  assert.equal(queries.length, 1, queries.join("\n---\n"));
  assert.match(queries[0], /agent_last_seen/);
});

test("المهمة الدورية: إلغاء غير المدفوع بعد 7 أيام، وإعادة العالق، وتنبيه التوقف مرة واحدة ثم تصفيره", async () => {
  env.DB._raw.exec("DELETE FROM orders; DELETE FROM customers; DELETE FROM meta;");
  graphCalls.length = 0;
  await env.DB.prepare("INSERT INTO orders (phone, kind, package_code, status, price, created_at) VALUES ('web:x', 'package', 'SINGLE', 'awaiting_payment', 149, datetime('now','-8 days'))").run();
  await env.DB.prepare("INSERT INTO orders (phone, kind, status, updated_at) VALUES ('web:y', 'sample', 'processing', datetime('now','-4 hours'))").run();
  await env.DB.prepare("INSERT INTO meta (key, value) VALUES ('agent_last_seen', '2020-01-01T00:00:00Z')").run();
  const run = async () => { const c = ctx(); await worker.scheduled({}, env, c); await c.done(); };
  await run();
  const rows = (await env.DB.prepare("SELECT phone, status FROM orders ORDER BY id").all()).results;
  assert.deepEqual(rows.map((r) => r.status), ["cancelled", "queued"]);
  assert.equal(graphCalls.filter((u) => u.endsWith("/messages")).length, 1); // تنبيه المالك
  assert.equal((await env.DB.prepare("SELECT value FROM meta WHERE key = 'offline_alert_sent'").first()).value, "1");
  await run();
  assert.equal(graphCalls.filter((u) => u.endsWith("/messages")).length, 1); // لا تكرار
  await env.DB.prepare("UPDATE meta SET value = ? WHERE key = 'agent_last_seen'").bind(new Date().toISOString()).run();
  await run();
  assert.equal((await env.DB.prepare("SELECT value FROM meta WHERE key = 'offline_alert_sent'").first()).value, "0");
});

test("مدة بقاء الوسائط قابلة للضبط ولها حد أدنى", () => {
  assert.equal(mediaTtlSeconds({}), 90 * 86400);
  assert.equal(mediaTtlSeconds({ MEDIA_TTL_DAYS: "30" }), 30 * 86400);
  assert.equal(mediaTtlSeconds({ MEDIA_TTL_DAYS: "0" }), 90 * 86400);
  assert.equal(mediaTtlSeconds({ MEDIA_TTL_DAYS: "0.0001" }), 60);
});

test("مسار غير معروف تحت ‎/web/‎ يرد 404 بصيغة JSON", async () => {
  const r = await get("/web/nothing");
  assert.equal(r.status, 404);
  assert.equal((await r.json()).error, "not_found");
});
