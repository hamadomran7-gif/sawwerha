// اختبار تكاملي: Worker كامل مع محاكاة D1 (node:sqlite) وR2 وواجهة واتساب.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import worker from "../src/index.js";

/* ---------- محاكاة D1 ---------- */
function makeD1() {
  const sqlite = new DatabaseSync(":memory:");
  const schema = fs.readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
  sqlite.exec(schema);
  const wrap = (sql) => {
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
  return { prepare: wrap, _raw: sqlite };
}

/* ---------- محاكاة R2 ---------- */
function makeR2() {
  const store = new Map();
  return {
    async put(key, body, opts) {
      store.set(key, { bytes: body instanceof ArrayBuffer ? body : new TextEncoder().encode(String(body)).buffer, meta: opts?.httpMetadata || {} });
    },
    async get(key) {
      const o = store.get(key);
      if (!o) return null;
      return { arrayBuffer: async () => o.bytes, body: o.bytes, httpMetadata: { contentType: o.meta.contentType } };
    },
    _store: store,
  };
}

/* ---------- محاكاة واتساب ---------- */
const sent = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  if (u.includes("graph.facebook.com")) {
    if (u.endsWith("/messages")) {
      const body = JSON.parse(init.body);
      sent.push(body);
      return new Response(JSON.stringify({ messages: [{ id: "wamid.out" }] }), { status: 200 });
    }
    if (u.endsWith("/media")) return new Response(JSON.stringify({ id: "MEDIA_UP" }), { status: 200 });
    // بيانات وسائط واردة
    return new Response(JSON.stringify({ url: "https://cdn.example/x.jpg", mime_type: "image/jpeg" }), { status: 200 });
  }
  if (u.startsWith("https://cdn.example/")) return new Response(new Uint8Array([255, 216, 255, 1, 2, 3]).buffer, { status: 200 });
  return realFetch(url, init);
};

const env = {
  DB: makeD1(),
  MEDIA: makeR2(),
  BRAND: "صوّرها",
  WA_TOKEN: "t",
  WA_PHONE_ID: "PHONE",
  WA_VERIFY_TOKEN: "verify-me",
  WA_APP_SECRET: "",
  AGENT_TOKEN: "agent-secret",
  OWNER_PHONE: "971500000001",
  PRICE_SINGLE: "149",
  PRICE_LAUNCH: "499",
  PRICE_SUB_LITE: "499",
  PRICE_SUB_CONTENT: "899",
  FREE_SAMPLES_PER_PHONE: "1",
  ZIINA_LINK_SINGLE: "https://pay.ziina.com/sawwerha/149",
};

function ctx() {
  const waits = [];
  return { waitUntil: (p) => waits.push(p), done: () => Promise.all(waits) };
}

let waCounter = 0;
async function inbound(message) {
  const c = ctx();
  const payload = { entry: [{ changes: [{ value: { contacts: [{ wa_id: message.from, profile: { name: "عميل" } }], messages: [{ id: `wamid.${++waCounter}`, timestamp: "1700000000", ...message }] } }] }] };
  const res = await worker.fetch(new Request("https://bot.test/webhook", { method: "POST", body: JSON.stringify(payload) }), env, c);
  assert.equal(res.status, 200);
  await c.done();
}
const lastText = () => [...sent].reverse().find((m) => m.type === "text")?.text?.body || "";
const agent = (path, init = {}) => worker.fetch(new Request(`https://bot.test${path}`, { ...init, headers: { Authorization: "Bearer agent-secret", ...(init.headers || {}) } }), env, ctx());

const CUSTOMER = "971500000002";

test("التحقق من webhook", async () => {
  const ok = await worker.fetch(new Request("https://bot.test/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=123"), env, ctx());
  assert.equal(await ok.text(), "123");
  const bad = await worker.fetch(new Request("https://bot.test/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123"), env, ctx());
  assert.equal(bad.status, 403);
});

test("رحلة كاملة: عيّنة ← تسليم ← باقة ← دفع ← صور ← تسليم", async () => {
  // 1) ترحيب
  await inbound({ from: CUSTOMER, type: "text", text: { body: "السلام عليكم" } });
  assert.match(lastText(), /أرسل صورة/);

  // 2) صورة ← عيّنة + قائمة الفئات
  await inbound({ from: CUSTOMER, type: "image", image: { id: "MEDIA1", mime_type: "image/jpeg" } });
  const order1 = await env.DB.prepare("SELECT * FROM orders WHERE phone = ?").bind(CUSTOMER).first();
  assert.equal(order1.kind, "sample");
  assert.equal(order1.status, "awaiting_category");
  assert.deepEqual(JSON.parse(order1.inputs), ["orders/1/in/1.jpg"]);
  assert.ok(env.MEDIA._store.has("orders/1/in/1.jpg"));
  assert.equal(sent.at(-1).type, "interactive");

  // 3) الفئة ← الطابور
  await inbound({ from: CUSTOMER, type: "interactive", interactive: { type: "list_reply", list_reply: { id: "cat_perfume", title: "عطور" } } });
  const o = await env.DB.prepare("SELECT status, category FROM orders WHERE id = 1").first();
  assert.equal(o.status, "queued");
  assert.equal(o.category, "perfume");

  // 4) الوكيل يسحب الطلب
  const job = await (await agent("/api/jobs/next")).json();
  assert.equal(job.job.id, 1);
  assert.equal(job.job.outputs_per_product, 3);
  assert.equal(job.job.category, "perfume");
  const none = await (await agent("/api/jobs/next")).json();
  assert.equal(none.job, null);

  // 5) تنزيل المدخل
  const media = await agent("/api/media/orders/1/in/1.jpg");
  assert.equal(media.status, 200);

  // 6) رفع النتائج والإكمال
  for (const n of ["white_1.jpg", "life_1.jpg", "life_2.jpg"]) {
    const r = await agent(`/api/jobs/1/outputs/${n}`, { method: "PUT", body: new Uint8Array([1, 2, 3]), headers: { "Content-Type": "image/jpeg" } });
    assert.equal(r.status, 200);
  }
  const before = sent.length;
  const done = await agent("/api/jobs/1/complete", { method: "POST", body: JSON.stringify({ outputs: ["orders/1/out/white_1.jpg", "orders/1/out/life_1.jpg", "orders/1/out/life_2.jpg"] }) });
  assert.equal((await done.json()).ok, true);
  const images = sent.slice(before).filter((m) => m.type === "image");
  assert.equal(images.length, 3);
  assert.ok(sent.slice(before).some((m) => m.type === "interactive" && m.interactive.type === "list"));
  const c1 = await env.DB.prepare("SELECT state, samples_used FROM customers WHERE phone = ?").bind(CUSTOMER).first();
  assert.equal(c1.state, "offer");
  assert.equal(c1.samples_used, 1);

  // 7) اختيار باقة SINGLE ← رابط دفع ثابت
  await inbound({ from: CUSTOMER, type: "interactive", interactive: { type: "list_reply", list_reply: { id: "pkg_SINGLE", title: "x" } } });
  assert.match(lastText(), /149 درهم/);
  assert.match(lastText(), /pay\.ziina\.com/);
  const o2 = await env.DB.prepare("SELECT * FROM orders WHERE id = 2").first();
  assert.equal(o2.status, "awaiting_payment");
  assert.equal(o2.price, 149);

  // 8) المالك يؤكد الدفع
  await inbound({ from: env.OWNER_PHONE, type: "text", text: { body: "paid 2" } });
  const o3 = await env.DB.prepare("SELECT status FROM orders WHERE id = 2").first();
  assert.equal(o3.status, "awaiting_photos");
  const custMsg = [...sent].reverse().find((m) => m.to === CUSTOMER && m.type === "text");
  assert.match(custMsg.text.body, /تم استلام الدفع/);

  // 9) صورة واحدة تكفي لحزمة SINGLE ← الطابور
  await inbound({ from: CUSTOMER, type: "image", image: { id: "MEDIA2", mime_type: "image/jpeg" } });
  const o4 = await env.DB.prepare("SELECT status, inputs FROM orders WHERE id = 2").first();
  assert.equal(o4.status, "queued");
  assert.deepEqual(JSON.parse(o4.inputs), ["orders/2/in/1.jpg"]);

  // 10) الوكيل ينتج ويسلّم
  const job2 = await (await agent("/api/jobs/next")).json();
  assert.equal(job2.job.id, 2);
  assert.equal(job2.job.outputs_per_product, 6);
  await agent("/api/jobs/2/outputs/white_1.jpg", { method: "PUT", body: new Uint8Array([1]) });
  const done2 = await agent("/api/jobs/2/complete", { method: "POST", body: JSON.stringify({ outputs: ["orders/2/out/white_1.jpg"] }) });
  assert.equal(done2.status, 200);
  const c2 = await env.DB.prepare("SELECT state FROM customers WHERE phone = ?").bind(CUSTOMER).first();
  assert.equal(c2.state, "delivered");

  // 11) تعديل مجاني
  await inbound({ from: CUSTOMER, type: "interactive", interactive: { type: "button_reply", button_reply: { id: "revise", title: "تعديل" } } });
  await inbound({ from: CUSTOMER, type: "text", text: { body: "خلفية أفتح" } });
  const o5 = await env.DB.prepare("SELECT status, revision_note, revisions_used FROM orders WHERE id = 2").first();
  assert.equal(o5.status, "queued");
  assert.equal(o5.revision_note, "خلفية أفتح");
  assert.equal(o5.revisions_used, 1);

  // 12) التقرير
  const rep = await (await agent("/api/report?days=7")).json();
  assert.equal(rep.paidOrders, 1);
  assert.equal(rep.revenueAed, 149);
  assert.equal(rep.freeSamples, 1);
});

test("الرسائل المكررة تُتجاهل", async () => {
  const before = sent.length;
  const c = ctx();
  const payload = { entry: [{ changes: [{ value: { messages: [{ id: "wamid.dup", from: "971500000009", timestamp: "1", type: "text", text: { body: "hi" } }] } }] }] };
  await worker.fetch(new Request("https://bot.test/webhook", { method: "POST", body: JSON.stringify(payload) }), env, c);
  await c.done();
  const c2 = ctx();
  await worker.fetch(new Request("https://bot.test/webhook", { method: "POST", body: JSON.stringify(payload) }), env, c2);
  await c2.done();
  assert.equal(sent.slice(before).filter((m) => m.to === "971500000009").length, 1);
});

test("فشل الوكيل: إعادة للطابور ثم فشل نهائي بعد 3 محاولات", async () => {
  await env.DB.prepare("UPDATE orders SET status = 'delivered' WHERE status IN ('queued','processing')").run();
  await inbound({ from: "971500000010", type: "image", image: { id: "M", mime_type: "image/jpeg" } });
  await inbound({ from: "971500000010", type: "text", text: { body: "عطر" } });
  const id = (await env.DB.prepare("SELECT id FROM orders WHERE phone = ?").bind("971500000010").first()).id;
  for (let i = 1; i <= 3; i++) {
    const j = await (await agent("/api/jobs/next")).json();
    assert.equal(j.job.id, id);
    const r = await (await agent(`/api/jobs/${id}/fail`, { method: "POST", body: JSON.stringify({ error: "comfy down" }) })).json();
    assert.equal(r.requeued, i < 3);
  }
  const o = await env.DB.prepare("SELECT status FROM orders WHERE id = ?").bind(id).first();
  assert.equal(o.status, "failed");
});

test("المهمة الدورية تعيد الطلبات العالقة وتنبّه عند توقف الجهاز", async () => {
  await env.DB.prepare("INSERT INTO orders (phone, kind, status, updated_at) VALUES ('x','sample','processing', datetime('now','-4 hours'))").run();
  await env.DB.prepare("UPDATE meta SET value = '2020-01-01T00:00:00Z' WHERE key = 'agent_last_seen'").run();
  const before = sent.length;
  const c = ctx();
  await worker.scheduled({}, env, c);
  await c.done();
  const stuck = await env.DB.prepare("SELECT COUNT(*) n FROM orders WHERE status = 'processing' AND phone = 'x'").first();
  assert.equal(stuck.n, 0);
  assert.ok(sent.slice(before).some((m) => m.to === env.OWNER_PHONE && /متوقف/.test(m.text?.body || "")));
});

test("واجهة الوكيل محمية", async () => {
  const r = await worker.fetch(new Request("https://bot.test/api/jobs/next"), env, ctx());
  assert.equal(r.status, 401);
});

test("الإحالة: صديق يشتري أول باقة ← عيّنة مجانية إضافية للمُحيل (مرة واحدة)", async () => {
  const REFERRER = CUSTOMER;
  const ref = await env.DB.prepare("SELECT ref_code, bonus_samples FROM customers WHERE phone = ?").bind(REFERRER).first();
  assert.match(ref.ref_code, /^[A-Z2-9]{6}$/); // أُنشئ مع رسالة الدعوة بعد تسليم الباقة
  assert.ok(sent.some((m) => m.to === REFERRER && /شارك صوّرها/.test(m.text?.body || "")));
  const FRIEND = "971500000020";
  await inbound({ from: FRIEND, type: "text", text: { body: `مرحباً، أرسلني صديق إلى صوّرها (كود: ${ref.ref_code}) وأريد صور منتجي الثلاث المجانية` } });
  const f = await env.DB.prepare("SELECT referred_by FROM customers WHERE phone = ?").bind(FRIEND).first();
  assert.equal(f.referred_by, REFERRER);
  // الصديق يختار باقة ويدفع
  await inbound({ from: FRIEND, type: "interactive", interactive: { type: "list_reply", list_reply: { id: "pkg_SINGLE", title: "x" } } });
  const order = await env.DB.prepare("SELECT id FROM orders WHERE phone = ? AND kind = 'package'").bind(FRIEND).first();
  const before = sent.length;
  await inbound({ from: env.OWNER_PHONE, type: "text", text: { body: `paid ${order.id}` } });
  const r1 = await env.DB.prepare("SELECT bonus_samples FROM customers WHERE phone = ?").bind(REFERRER).first();
  assert.equal(r1.bonus_samples, (ref.bonus_samples || 0) + 1);
  assert.ok(sent.slice(before).some((m) => m.to === REFERRER && /صديقك اشترى/.test(m.text?.body || "")));
  // شراء ثانٍ من الصديق لا يمنح رصيداً جديداً
  await env.DB.prepare("UPDATE orders SET status = 'delivered' WHERE phone = ?").bind(FRIEND).run();
  await env.DB.prepare("UPDATE customers SET state = 'delivered' WHERE phone = ?").bind(FRIEND).run();
  await inbound({ from: FRIEND, type: "interactive", interactive: { type: "list_reply", list_reply: { id: "pkg_LAUNCH", title: "x" } } });
  const order2 = await env.DB.prepare("SELECT id FROM orders WHERE phone = ? AND package_code = 'LAUNCH'").bind(FRIEND).first();
  await inbound({ from: env.OWNER_PHONE, type: "text", text: { body: `paid ${order2.id}` } });
  const r2 = await env.DB.prepare("SELECT bonus_samples FROM customers WHERE phone = ?").bind(REFERRER).first();
  assert.equal(r2.bonus_samples, r1.bonus_samples);
  // لا إحالة ذاتية
  await inbound({ from: "971500000021", type: "text", text: { body: "مرحبا" } });
  const own = await env.DB.prepare("SELECT ref_code FROM customers WHERE phone = ?").bind(FRIEND).first();
  assert.equal(own.ref_code, null);
});

test("المتابعات: تذكير واحد بعد العيّنة وآخر للدفع المعلّق، بلا تكرار", async () => {
  const P1 = "971500000030", P2 = "971500000031";
  await env.DB.prepare("INSERT INTO customers (phone, lang, state, last_seen) VALUES (?, 'ar', 'offer', datetime('now','-20 hours'))").bind(P1).run();
  await env.DB.prepare("INSERT INTO customers (phone, lang, state, last_seen) VALUES (?, 'ar', 'awaiting_payment', datetime('now','-3 hours'))").bind(P2).run();
  await env.DB.prepare("INSERT INTO orders (phone, kind, package_code, status, price, payment_link, created_at) VALUES (?, 'package', 'SINGLE', 'awaiting_payment', 149, 'https://pay.ziina.com/x', datetime('now','-3 hours'))").bind(P2).run();
  const run = async () => { const c = ctx(); await worker.scheduled({}, env, c); await c.done(); };
  const before = sent.length;
  await run();
  const after1 = sent.slice(before);
  assert.ok(after1.some((m) => m.to === P1 && /أعجبتك صورك المجانية/.test(m.text?.body || "")));
  assert.ok(after1.some((m) => m.to === P1 && m.type === "interactive"));
  assert.ok(after1.some((m) => m.to === P2 && /بانتظار الدفع/.test(m.text?.body || "") && /pay\.ziina\.com/.test(m.text.body)));
  const mid = sent.length;
  await run();
  assert.equal(sent.slice(mid).filter((m) => m.to === P1 || m.to === P2).length, 0);
});
