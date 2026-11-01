// صوّرها — بوت واتساب على Cloudflare Workers
import { handleInbound, deliveryActions, paidActions, paymentLinkMessage, PACKAGES, prices } from "./flow.js";
import * as wa from "./wa.js";
import * as db from "./db.js";
import { createPaymentLink, isPaid } from "./payments.js";

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
const unauthorized = () => json({ error: "unauthorized" }, 401);

function agentAuthed(request, env) {
  const h = request.headers.get("Authorization") || "";
  return env.AGENT_TOKEN && h === `Bearer ${env.AGENT_TOKEN}`;
}

/* ------------------------------------------------------------------ */
/* تنفيذ أفعال آلة الحالات                                             */
/* ------------------------------------------------------------------ */

async function storeInbound(env, orderId, mediaId, index) {
  const { bytes, mime } = await wa.downloadMedia(env, mediaId);
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const key = `orders/${orderId}/in/${index}.${ext}`;
  await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: mime } });
  return key;
}

async function aiReply(env, customer, text) {
  if (!env.ANTHROPIC_API_KEY) return null;
  const p = prices(env);
  const system = `أنت مساعد خدمة «${env.BRAND || "صوّرها"}»: خدمة آلية تنتج صور منتجات احترافية بالذكاء الاصطناعي لمتاجر الإمارات الصغيرة عبر واتساب. أجب بالعربية (أو بالإنجليزية إذا كتب العميل بها) في جملتين إلى ثلاث فقط. الأسعار بالدرهم: منتج واحد ${p.SINGLE}، إطلاق 5 منتجات ${p.LAUNCH}، اشتراك خفيف ${p.SUB_LITE}/شهر، اشتراك محتوى ${p.SUB_CONTENT}/شهر. التسليم: العيّنة المجانية 2–6 ساعات، الباقات 24 ساعة. الدفع مقدماً عبر رابط زينة. تعديل مجاني واحد. استرداد كامل إذا لم يُسلَّم خلال 48 ساعة. لا نغيّر شكل المنتج أو لونه أو النص عليه. لا تعد بشيء خارج هذه السياسات، ولا تدّعِ وجود موظف بشري، ولا تطلب بيانات شخصية. إذا كان السؤال خارج الخدمة فاعتذر باختصار ووجّه العميل لإرسال صورة منتجه.`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model: env.AI_MODEL || "claude-haiku-5-5", max_tokens: 300, system, messages: [{ role: "user", content: text.slice(0, 1000) }] }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.content || []).map((c) => c.text || "").join("").trim() || null;
  } catch {
    return null;
  }
}

async function execute(env, customer, order, actions) {
  const to = customer.phone;
  let currentOrder = order;
  for (const a of actions) {
    switch (a.type) {
      case "set_lang":
        if (a.lang !== customer.lang) await db.updateCustomer(env.DB, to, { lang: a.lang });
        customer.lang = a.lang;
        break;
      case "text":
        await wa.sendText(env, to, a.body);
        await db.logMessage(env.DB, { phone: to, direction: "out", type: "text", body: a.body });
        break;
      case "buttons":
        await wa.sendButtons(env, to, a.body, a.buttons);
        break;
      case "list":
        await wa.sendList(env, to, a);
        break;
      case "image":
        await wa.sendImageFromR2(env, to, a.key, a.caption);
        break;
      case "create_sample_order": {
        const id = await db.insertOrder(env.DB, { phone: to, kind: "sample", status: "awaiting_category", max_inputs: 1, price: 0 });
        const key = await storeInbound(env, id, a.mediaId, 1);
        await db.updateOrder(env.DB, id, { inputs: JSON.stringify([key]) });
        await db.updateCustomer(env.DB, to, { active_order: id, samples_used: (customer.samples_used || 0) + 1 });
        currentOrder = await db.getOrder(env.DB, id);
        break;
      }
      case "set_category":
        await db.updateCustomer(env.DB, to, { category: a.category });
        if (currentOrder) await db.updateOrder(env.DB, currentOrder.id, { category: a.category });
        break;
      case "queue_order":
        await db.updateOrder(env.DB, a.orderId, { status: "queued", ...(a.category ? { category: a.category } : {}) });
        break;
      case "create_package_order": {
        const pkg = PACKAGES[a.code];
        const id = await db.insertOrder(env.DB, { phone: to, kind: "package", package_code: a.code, category: a.category, status: "awaiting_payment", max_inputs: pkg.maxInputs, price: a.price });
        const o = await db.getOrder(env.DB, id);
        let link = null;
        try {
          link = await createPaymentLink(env, o, customer);
        } catch (e) {
          await notifyOwner(env, `تعذّر إنشاء رابط دفع للطلب #${id}: ${e.message}`);
        }
        if (link) await db.updateOrder(env.DB, id, { payment_link: link.url, payment_id: link.id });
        await db.updateCustomer(env.DB, to, { active_order: id });
        const body = paymentLinkMessage({ order: { ...o, payment_link: link?.url }, customer, link: link?.url });
        await wa.sendText(env, to, body);
        await db.logMessage(env.DB, { phone: to, direction: "out", type: "text", body });
        if (!link) await notifyOwner(env, `طلب #${id} (${a.code}، ${a.price} درهم) من ${to} بلا رابط دفع. أرسل الرابط يدوياً ثم أكّد بالأمر: paid ${id}`);
        currentOrder = await db.getOrder(env.DB, id);
        break;
      }
      case "append_input": {
        const o = await db.getOrder(env.DB, a.orderId);
        const inputs = JSON.parse(o.inputs || "[]");
        const key = await storeInbound(env, o.id, a.mediaId, inputs.length + 1);
        inputs.push(key);
        await db.updateOrder(env.DB, o.id, { inputs: JSON.stringify(inputs) });
        currentOrder = await db.getOrder(env.DB, o.id);
        break;
      }
      case "queue_revision": {
        const o = await db.getOrder(env.DB, a.orderId);
        await db.updateOrder(env.DB, o.id, { status: "queued", revision_note: a.note, revisions_used: (o.revisions_used || 0) + 1 });
        break;
      }
      case "ai_or_fallback": {
        const reply = await aiReply(env, customer, a.text);
        if (reply) {
          await wa.sendText(env, to, reply);
          await db.logMessage(env.DB, { phone: to, direction: "out", type: "ai", body: reply });
        } else {
          await wa.sendText(env, to, a.fallback);
          await wa.sendButtons(env, to, a.menu.body, a.menu.buttons);
        }
        break;
      }
      default:
        break;
    }
  }
  return currentOrder;
}

async function notifyOwner(env, text) {
  if (!env.OWNER_PHONE) return;
  try {
    await wa.sendText(env, env.OWNER_PHONE, `🔔 ${text}`);
  } catch {}
}

/* ------------------------------------------------------------------ */
/* أوامر المالك                                                        */
/* ------------------------------------------------------------------ */

async function ownerCommand(env, text) {
  const s = text.trim();
  const [cmd, arg] = s.split(/\s+/);
  if (/^(تقرير|report)$/i.test(cmd)) {
    const r = await db.report(env.DB, Number(arg) || 7);
    return formatReport(r);
  }
  if (/^(status|حالة)$/i.test(cmd)) {
    const r = await db.report(env.DB, 1);
    return `الطابور: ${r.queue} · بانتظار الدفع: ${r.awaitingPayment} · فشل: ${r.failed}\nآخر إشارة من الجهاز: ${r.agentLastSeen || "لا شيء"}`;
  }
  if (/^paid$/i.test(cmd) && arg) {
    const o = await db.getOrder(env.DB, Number(arg));
    if (!o) return `لا يوجد طلب #${arg}`;
    await markPaid(env, o);
    return `تم تأكيد دفع الطلب #${arg} وإبلاغ العميل.`;
  }
  if (/^(pause|ايقاف|إيقاف)$/i.test(cmd)) {
    await db.setMeta(env.DB, "paused", "1");
    return "تم إيقاف استقبال الطلبات.";
  }
  if (/^(resume|تشغيل)$/i.test(cmd)) {
    await db.setMeta(env.DB, "paused", "0");
    return "عادت الخدمة للعمل.";
  }
  return "الأوامر: تقرير [أيام] · status · paid <رقم الطلب> · pause · resume";
}

function formatReport(r) {
  return [
    `📊 تقرير آخر ${r.days} أيام`,
    `عملاء جدد: ${r.newCustomers}`,
    `عيّنات مجانية: ${r.freeSamples}`,
    `طلبات مدفوعة: ${r.paidOrders} — الإيراد: ${r.revenueAed} درهم`,
    `طلبات سُلِّمت: ${r.delivered}`,
    `في الطابور الآن: ${r.queue} · بانتظار الدفع: ${r.awaitingPayment} · فشل: ${r.failed}`,
    `آخر إشارة من جهاز الإنتاج: ${r.agentLastSeen || "لا شيء"}`,
  ].join("\n");
}

async function markPaid(env, order) {
  if (order.status !== "awaiting_payment") return;
  await db.updateOrder(env.DB, order.id, { status: "awaiting_photos" });
  const customer = await db.getCustomer(env.DB, order.phone);
  const { actions, state } = paidActions({ order, customer });
  await execute(env, customer, order, actions);
  await db.updateCustomer(env.DB, order.phone, { state, active_order: order.id });
}

/* ------------------------------------------------------------------ */
/* Webhook واتساب                                                       */
/* ------------------------------------------------------------------ */

async function handleWebhook(request, env, ctx) {
  const raw = await request.text();
  const ok = await wa.verifySignature(raw, request.headers.get("X-Hub-Signature-256"), env.WA_APP_SECRET);
  if (!ok) return new Response("bad signature", { status: 403 });
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }
  const messages = wa.parseWebhook(payload);
  // نرد 200 فوراً ونعالج في الخلفية حتى لا يعيد Meta الإرسال
  ctx.waitUntil(processMessages(env, messages));
  return new Response("ok");
}

async function processMessages(env, messages) {
  for (const m of messages) {
    try {
      const fresh = await db.logMessage(env.DB, { phone: m.from, direction: "in", type: m.type, body: m.text || m.buttonId || "", waId: m.waId });
      if (!fresh) continue; // رسالة مكررة
      if (m.waId) wa.markRead(env, m.waId);
      if (env.OWNER_PHONE && m.from === env.OWNER_PHONE && m.type === "text") {
        const reply = await ownerCommand(env, m.text);
        await wa.sendText(env, m.from, reply);
        continue;
      }
      const customer = await db.ensureCustomer(env.DB, m.from, m.name);
      const order = await db.activeOrder(env.DB, customer);
      const paused = (await db.getMeta(env.DB, "paused")) === "1";
      const { actions, state } = handleInbound({ customer, order, msg: m, env, paused });
      await execute(env, customer, order, actions);
      await db.updateCustomer(env.DB, m.from, { state, last_seen: new Date().toISOString() });
    } catch (e) {
      console.error("message failed", m.from, e);
      await notifyOwner(env, `خطأ في معالجة رسالة من ${m.from}: ${String(e.message || e).slice(0, 200)}`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* واجهة وكيل الإنتاج                                                   */
/* ------------------------------------------------------------------ */

async function handleAgent(request, env, url) {
  if (!agentAuthed(request, env)) return unauthorized();
  const path = url.pathname;

  if (path === "/api/heartbeat" && request.method === "POST") {
    await db.setMeta(env.DB, "agent_last_seen", new Date().toISOString());
    return json({ ok: true, paused: (await db.getMeta(env.DB, "paused")) === "1" });
  }

  if (path === "/api/jobs/next" && request.method === "GET") {
    await db.setMeta(env.DB, "agent_last_seen", new Date().toISOString());
    const o = await db.claimNextJob(env.DB);
    if (!o) return json({ job: null });
    const customer = await db.getCustomer(env.DB, o.phone);
    const pkg = o.package_code ? PACKAGES[o.package_code] : null;
    return json({
      job: {
        id: o.id,
        kind: o.kind,
        package_code: o.package_code,
        category: o.category || customer?.category || "other",
        inputs: JSON.parse(o.inputs || "[]"),
        previous_outputs: JSON.parse(o.outputs || "[]"),
        outputs_per_product: o.kind === "sample" ? 3 : pkg ? pkg.outputsPerProduct : 5,
        revision_note: o.revision_note || null,
        lang: customer?.lang || "ar",
        attempt: o.attempts,
      },
    });
  }

  let m;
  if ((m = path.match(/^\/api\/media\/(.+)$/)) && request.method === "GET") {
    const obj = await env.MEDIA.get(decodeURIComponent(m[1]));
    if (!obj) return json({ error: "not found" }, 404);
    return new Response(obj.body, { headers: { "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream" } });
  }

  if ((m = path.match(/^\/api\/jobs\/(\d+)\/outputs\/([\w.-]+)$/)) && request.method === "PUT") {
    const id = Number(m[1]);
    const o = await db.getOrder(env.DB, id);
    if (!o) return json({ error: "no such order" }, 404);
    const key = `orders/${id}/out/${m[2]}`;
    await env.MEDIA.put(key, await request.arrayBuffer(), { httpMetadata: { contentType: request.headers.get("Content-Type") || "image/jpeg" } });
    return json({ ok: true, key });
  }

  if ((m = path.match(/^\/api\/jobs\/(\d+)\/complete$/)) && request.method === "POST") {
    const id = Number(m[1]);
    const body = await request.json().catch(() => ({}));
    const o = await db.getOrder(env.DB, id);
    if (!o) return json({ error: "no such order" }, 404);
    const outputs = Array.isArray(body.outputs) && body.outputs.length ? body.outputs : JSON.parse(o.outputs || "[]");
    if (!outputs.length) return json({ error: "no outputs" }, 400);
    await db.updateOrder(env.DB, id, { outputs: JSON.stringify(outputs), status: "done", error: null });
    const customer = await db.getCustomer(env.DB, o.phone);
    const order = await db.getOrder(env.DB, id);
    try {
      const { actions, state } = deliveryActions({ order, customer, env });
      await execute(env, customer, order, actions);
      await db.updateOrder(env.DB, id, { status: "delivered", delivered_at: new Date().toISOString() });
      await db.updateCustomer(env.DB, o.phone, { state, active_order: id });
    } catch (e) {
      await db.updateOrder(env.DB, id, { error: `delivery: ${String(e.message || e).slice(0, 300)}` });
      await notifyOwner(env, `فشل تسليم الطلب #${id}: ${String(e.message || e).slice(0, 200)}`);
      return json({ ok: false, error: "delivery failed" }, 500);
    }
    return json({ ok: true });
  }

  if ((m = path.match(/^\/api\/jobs\/(\d+)\/fail$/)) && request.method === "POST") {
    const id = Number(m[1]);
    const body = await request.json().catch(() => ({}));
    const o = await db.getOrder(env.DB, id);
    if (!o) return json({ error: "no such order" }, 404);
    const giveUp = (o.attempts || 0) >= 3;
    await db.updateOrder(env.DB, id, { status: giveUp ? "failed" : "queued", error: String(body.error || "unknown").slice(0, 500) });
    if (giveUp) await notifyOwner(env, `فشل الطلب #${id} ثلاث مرات: ${String(body.error || "").slice(0, 200)}`);
    return json({ ok: true, requeued: !giveUp });
  }

  if (path === "/api/report" && request.method === "GET") {
    return json(await db.report(env.DB, Number(url.searchParams.get("days")) || 7));
  }

  if (path === "/api/orders" && request.method === "GET") {
    const status = url.searchParams.get("status");
    const rows = status
      ? await env.DB.prepare("SELECT id, phone, kind, package_code, status, price, created_at, updated_at FROM orders WHERE status = ? ORDER BY id DESC LIMIT 100").bind(status).all()
      : await env.DB.prepare("SELECT id, phone, kind, package_code, status, price, created_at, updated_at FROM orders ORDER BY id DESC LIMIT 100").all();
    return json(rows.results);
  }

  return json({ error: "not found" }, 404);
}

/* ------------------------------------------------------------------ */
/* المهام الدورية                                                        */
/* ------------------------------------------------------------------ */

async function cron(env) {
  // 1) المدفوعات المعلّقة
  const pending = await env.DB.prepare("SELECT * FROM orders WHERE status = 'awaiting_payment' AND payment_id IS NOT NULL ORDER BY id DESC LIMIT 50").all();
  for (const o of pending.results || []) {
    if (await isPaid(env, o.payment_id)) await markPaid(env, o);
  }
  // 2) إلغاء طلبات لم تُدفع خلال 7 أيام
  await env.DB.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE status = 'awaiting_payment' AND created_at < datetime('now', '-7 days')").run();
  // 3) طلبات علقت في المعالجة أكثر من 3 ساعات تعود للطابور
  await env.DB.prepare("UPDATE orders SET status = 'queued', updated_at = datetime('now') WHERE status = 'processing' AND updated_at < datetime('now', '-3 hours')").run();
  // 4) تنبيه المالك إذا الجهاز متوقف والطابور ممتلئ
  const last = await db.getMeta(env.DB, "agent_last_seen");
  const queue = await env.DB.prepare("SELECT COUNT(*) n FROM orders WHERE status IN ('queued','processing')").first();
  const offline = !last || Date.now() - Date.parse(last) > 2 * 3600 * 1000;
  if (offline && queue.n > 0) {
    const flagged = await db.getMeta(env.DB, "offline_alert_sent");
    if (flagged !== "1") {
      await notifyOwner(env, `جهاز الإنتاج متوقف منذ أكثر من ساعتين وفي الطابور ${queue.n} طلب. شغّل الجهاز وتطبيق الوكيل.`);
      await db.setMeta(env.DB, "offline_alert_sent", "1");
    }
  } else if (!offline) {
    await db.setMeta(env.DB, "offline_alert_sent", "0");
  }
}

/* ------------------------------------------------------------------ */
/* الموجّه                                                               */
/* ------------------------------------------------------------------ */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/webhook") {
      if (request.method === "GET") {
        if (url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === env.WA_VERIFY_TOKEN) {
          return new Response(url.searchParams.get("hub.challenge") || "", { status: 200 });
        }
        return new Response("forbidden", { status: 403 });
      }
      if (request.method === "POST") return handleWebhook(request, env, ctx);
    }
    if (url.pathname.startsWith("/api/")) return handleAgent(request, env, url);
    if (url.pathname === "/health") return json({ ok: true, brand: env.BRAND });
    return new Response("Sawwerha bot", { status: 200 });
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(cron(env));
  },
};

export { execute, ownerCommand, markPaid };
