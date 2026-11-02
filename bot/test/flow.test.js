import { test } from "node:test";
import assert from "node:assert/strict";
import { handleInbound, deliveryActions, paidActions, detectLang, PACKAGES } from "../src/flow.js";
import { parseWebhook, verifySignature } from "../src/wa.js";

const env = { BRAND: "صوّرها", PRICE_SINGLE: "149", PRICE_LAUNCH: "499", PRICE_SUB_LITE: "499", PRICE_SUB_CONTENT: "899", FREE_SAMPLES_PER_PHONE: "1" };
const cust = (o = {}) => ({ phone: "9715000000", lang: "ar", state: "new", samples_used: 0, active_order: null, last_seen: null, ...o });
const texts = (r) => r.actions.filter((a) => a.type === "text").map((a) => a.body).join("\n");
const types = (r) => r.actions.map((a) => a.type);

test("كشف اللغة", () => {
  assert.equal(detectLang("كم السعر؟"), "ar");
  assert.equal(detectLang("how much"), "en");
  assert.equal(detectLang("123"), "ar");
});

test("أول رسالة نصية: ترحيب وطلب صورة", () => {
  const r = handleInbound({ customer: cust(), order: null, msg: { type: "text", text: "مرحبا" }, env });
  assert.equal(r.state, "awaiting_photo");
  assert.match(texts(r), /أرسل صورة واحدة/);
});

test("صورة من عميل جديد: إنشاء عيّنة وطلب الفئة", () => {
  const r = handleInbound({ customer: cust({ state: "awaiting_photo", last_seen: "x" }), order: null, msg: { type: "image", mediaId: "m1" }, env });
  assert.equal(r.state, "awaiting_category");
  assert.ok(types(r).includes("create_sample_order"));
  assert.ok(types(r).includes("list"));
});

test("اختيار الفئة يضع العيّنة في الطابور", () => {
  const order = { id: 5, kind: "sample", status: "awaiting_category", inputs: '["orders/5/in/1.jpg"]' };
  const r = handleInbound({ customer: cust({ state: "awaiting_category", last_seen: "x" }), order, msg: { type: "list", buttonId: "cat_perfume" }, env });
  assert.equal(r.state, "sample_queued");
  const q = r.actions.find((a) => a.type === "queue_order");
  assert.equal(q.orderId, 5);
  assert.equal(q.category, "perfume");
});

test("نص بدل الفئة: تُعتبر «أخرى» ولا يتعطل الطلب", () => {
  const order = { id: 5, kind: "sample", status: "awaiting_category", inputs: '["k"]' };
  const r = handleInbound({ customer: cust({ state: "awaiting_category", last_seen: "x" }), order, msg: { type: "text", text: "عطر" }, env });
  assert.equal(r.state, "sample_queued");
});

test("عيّنة ثانية مرفوضة وتُعرض الباقات", () => {
  const r = handleInbound({ customer: cust({ state: "offer", samples_used: 1, last_seen: "x" }), order: null, msg: { type: "image", mediaId: "m2" }, env });
  assert.equal(r.state, "offer");
  assert.ok(!types(r).includes("create_sample_order"));
  assert.ok(types(r).includes("list"));
});

test("تسليم العيّنة: صور + عرض الباقات", () => {
  const order = { id: 5, kind: "sample", outputs: '["o1","o2","o3"]' };
  const r = deliveryActions({ order, customer: cust({ lang: "ar" }), env });
  assert.equal(r.state, "offer");
  assert.equal(r.actions.filter((a) => a.type === "image").length, 3);
  assert.ok(types(r).includes("list"));
});

test("اختيار باقة: طلب بانتظار الدفع بالسعر الصحيح", () => {
  const r = handleInbound({ customer: cust({ state: "offer", last_seen: "x", category: "perfume" }), order: null, msg: { type: "list", buttonId: "pkg_LAUNCH" }, env });
  assert.equal(r.state, "awaiting_payment");
  const c = r.actions.find((a) => a.type === "create_package_order");
  assert.equal(c.code, "LAUNCH");
  assert.equal(c.price, 499);
  assert.equal(c.category, "perfume");
});

test("بعد الدفع: جمع الصور حتى الحد ثم الطابور تلقائياً", () => {
  const p = paidActions({ order: { max_inputs: 2 }, customer: cust() });
  assert.equal(p.state, "paid_collecting");
  const order = { id: 9, kind: "package", status: "awaiting_photos", max_inputs: 2, inputs: "[]" };
  const r1 = handleInbound({ customer: cust({ state: "paid_collecting", last_seen: "x" }), order, msg: { type: "image", mediaId: "a" }, env });
  assert.equal(r1.state, "paid_collecting");
  assert.ok(types(r1).includes("append_input"));
  const order2 = { ...order, inputs: '["k1"]' };
  const r2 = handleInbound({ customer: cust({ state: "paid_collecting", last_seen: "x" }), order: order2, msg: { type: "image", mediaId: "b" }, env });
  assert.equal(r2.state, "package_queued");
  assert.ok(types(r2).includes("queue_order"));
});

test("زر انتهيت قبل أي صورة: رفض لطيف", () => {
  const order = { id: 9, kind: "package", status: "awaiting_photos", max_inputs: 5, inputs: "[]" };
  const r = handleInbound({ customer: cust({ state: "paid_collecting", last_seen: "x" }), order, msg: { type: "button", buttonId: "done_inputs" }, env });
  assert.equal(r.state, "paid_collecting");
  assert.ok(!types(r).includes("queue_order"));
});

test("تعديل مجاني واحد فقط", () => {
  const order = { id: 9, kind: "package", status: "delivered", revisions_used: 0 };
  const r1 = handleInbound({ customer: cust({ state: "delivered", last_seen: "x" }), order, msg: { type: "button", buttonId: "revise" }, env });
  assert.equal(r1.state, "revision_collecting");
  const r2 = handleInbound({ customer: cust({ state: "revision_collecting", last_seen: "x" }), order, msg: { type: "text", text: "خلفية أفتح" }, env });
  assert.equal(r2.state, "package_queued");
  assert.ok(types(r2).includes("queue_revision"));
  const r3 = handleInbound({ customer: cust({ state: "delivered", last_seen: "x" }), order: { ...order, revisions_used: 1 }, msg: { type: "button", buttonId: "revise" }, env });
  assert.match(texts(r3), /استُخدم التعديل/);
});

test("الأسئلة الشائعة", () => {
  const r = handleInbound({ customer: cust({ state: "offer", last_seen: "x" }), order: null, msg: { type: "text", text: "كم الأسعار؟" }, env });
  assert.match(texts(r), /149/);
  const e = handleInbound({ customer: cust({ state: "offer", last_seen: "x" }), order: null, msg: { type: "text", text: "how long does it take" }, env });
  assert.match(texts(e), /hours/);
  const h = handleInbound({ customer: cust({ state: "offer", last_seen: "x" }), order: null, msg: { type: "text", text: "ابي اكلم موظف" }, env });
  assert.match(texts(h), /آلية بالكامل/);
});

test("سؤال حر يذهب للذكاء الاصطناعي أو الرد الافتراضي", () => {
  const r = handleInbound({ customer: cust({ state: "offer", last_seen: "x" }), order: null, msg: { type: "text", text: "هل تصورون كيك؟" }, env });
  assert.ok(types(r).includes("ai_or_fallback"));
});

test("الإيقاف المؤقت", () => {
  const r = handleInbound({ customer: cust(), order: null, msg: { type: "image", mediaId: "m" }, env, paused: true });
  assert.match(texts(r), /متوقفة مؤقتاً/);
  assert.ok(!types(r).includes("create_sample_order"));
});

test("تحليل webhook واتساب", () => {
  const payload = {
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [{ wa_id: "97150", profile: { name: "حمد" } }],
              messages: [
                { id: "wamid.1", from: "97150", timestamp: "1700000000", type: "text", text: { body: "hi" } },
                { id: "wamid.2", from: "97150", timestamp: "1700000001", type: "image", image: { id: "MEDIA1", mime_type: "image/jpeg" } },
                { id: "wamid.3", from: "97150", timestamp: "1700000002", type: "interactive", interactive: { type: "list_reply", list_reply: { id: "pkg_SINGLE", title: "x" } } },
              ],
            },
          },
        ],
      },
    ],
  };
  const msgs = parseWebhook(payload);
  assert.equal(msgs.length, 3);
  assert.equal(msgs[0].name, "حمد");
  assert.equal(msgs[1].mediaId, "MEDIA1");
  assert.equal(msgs[2].buttonId, "pkg_SINGLE");
});

test("توقيع Meta", async () => {
  const secret = "s3cret";
  const body = '{"a":1}';
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const hex = "sha256=" + [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  assert.equal(await verifySignature(body, hex, secret), true);
  assert.equal(await verifySignature(body, "sha256=00", secret), false);
});

test("الباقات تحدد عدد المدخلات", () => {
  assert.equal(PACKAGES.LAUNCH.maxInputs, 5);
  assert.equal(PACKAGES.SINGLE.maxInputs, 1);
});

import { extractRefCode, referralInviteText } from "../src/flow.js";

test("الإحالة: التقاط الكود من أول رسالة وربطه", () => {
  assert.equal(extractRefCode("مرحباً، أرسلني صديق إلى صوّرها (كود: g2djf8) وأريد صوري"), "G2DJF8");
  assert.equal(extractRefCode("Hi, a friend sent me (code: PX2K6V)"), "PX2K6V");
  assert.equal(extractRefCode("كود الخصم ABCDEFG"), null);
  assert.equal(extractRefCode("السلام عليكم"), null);
  const r = handleInbound({ customer: { phone: "x", state: "new" }, order: null, msg: { type: "text", text: "مرحباً (كود: G2DJF8)" }, env: {} });
  assert.ok(r.actions.some((a) => a.type === "set_referrer" && a.code === "G2DJF8"));
  const old = handleInbound({ customer: { phone: "x", state: "offer", last_seen: "now" }, order: null, msg: { type: "text", text: "كود: G2DJF8" }, env: {} });
  assert.ok(!old.actions.some((a) => a.type === "set_referrer"));
});

test("الإحالة: العيّنة الإضافية المكتسبة تسمح بعيّنة ثانية", () => {
  const msg = { type: "image", mediaId: "M" };
  const blocked = handleInbound({ customer: { phone: "x", state: "offer", last_seen: "now", samples_used: 1, bonus_samples: 0 }, order: null, msg, env: {} });
  assert.ok(!blocked.actions.some((a) => a.type === "create_sample_order"));
  const ok = handleInbound({ customer: { phone: "x", state: "offer", last_seen: "now", samples_used: 1, bonus_samples: 1 }, order: null, msg, env: {} });
  assert.ok(ok.actions.some((a) => a.type === "create_sample_order"));
});

test("الإحالة: دعوة صديق بعد تسليم باقة مدفوعة فقط", () => {
  const pkg = deliveryActions({ order: { kind: "package", outputs: "[]" }, customer: { lang: "ar" }, env: {} });
  assert.ok(pkg.actions.some((a) => a.type === "referral_invite"));
  const sample = deliveryActions({ order: { kind: "sample", outputs: "[]" }, customer: { lang: "ar" }, env: {} });
  assert.ok(!sample.actions.some((a) => a.type === "referral_invite"));
  const txt = referralInviteText("ar", "G2DJF8", {});
  assert.match(txt, /wa\.me\/971507241548\?text=/);
  assert.match(decodeURIComponent(txt), /كود: G2DJF8/);
});
