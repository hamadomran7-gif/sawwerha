// قناة الطلب من الموقع (sawwerha.app/try/) — بلا واتساب.
// صاحب المتجر يرفع صورة منتجه ← طلب عيّنة في الطابور نفسه ← وكيل الإنتاج ينتجها كالمعتاد ←
// تظهر في صفحة خاصة (sawwerha.app/s/#<رمز>) مع الباقات. المعرّف في orders.phone هو «web:<رمز>»،
// والرمز crypto.randomUUID() عشوائي لا يُخمَّن ولا يحتاج أي سر. التفاصيل في docs/04-قناة-الرفع-من-الموقع.md.
// لا معالجة صور هنا (حد CPU في الخطة المجانية 10 مللي ثانية): فحص الحجم وأول البايتات فقط.
import * as db from "./db.js";
import { putMedia, getMedia } from "./media.js";
import { CATEGORIES, prices } from "./flow.js";

export const WEB_PREFIX = "web:";
export const isWebPhone = (phone) => String(phone || "").startsWith(WEB_PREFIX);

const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const NAME_RE = /^[\w.-]{1,80}$/;
const DEFAULT_ORIGINS = ["https://sawwerha.app", "https://www.sawwerha.app"];
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MIN_BYTES = 1024;

const num = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : d;
};

/** الحدود (قابلة للضبط من متغيرات البوت دون تعديل الكود). */
export function webConfig(env) {
  return {
    dailyCap: num(env.WEB_DAILY_CAP, 30), // عيّنات الموقع في اليوم (UTC): 30 × 4 كتابات = 120 من 1,000 كتابة KV المجانية
    ipCap: num(env.WEB_IP_DAILY_CAP, 2), // لكل عنوان IP في اليوم
    queueCap: num(env.WEB_QUEUE_CAP, 20), // لا رفع جديد إن امتلأ الطابور
    maxBytes: Math.round(num(env.WEB_MAX_MB, 10) * 1024 * 1024),
    origins: String(env.WEB_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean).concat(DEFAULT_ORIGINS),
    site: env.PUBLIC_URL || "https://sawwerha.app",
    open: String(env.WEB_UPLOADS || "on").toLowerCase() !== "off",
  };
}

/** يتعرّف على JPEG وPNG وWebP من أول البايتات (لا يُوثق بنوع المحتوى المعلن وحده). */
export function sniffImage(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}

/** بصمة يومية لعنوان IP (لا يُخزَّن العنوان نفسه، وتتغير البصمة كل يوم وتُحذف عدّاداتها). */
export async function ipHash(ip, day) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${day}|${ip}`));
  return [...new Uint8Array(d)].slice(0, 8).map((x) => x.toString(16).padStart(2, "0")).join("");
}

function corsHeaders(cfg, origin) {
  if (!origin || !cfg.origins.includes(origin)) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function reply(cors, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...cors },
  });
}

/** شكل الطلب كما تراه الصفحة الخاصة (بلا معرّف الهاتف ولا مفاتيح التخزين). */
function view(o, token, apiBase) {
  const ready = o.status === "delivered" || o.status === "done";
  const outputs = ready ? JSON.parse(o.outputs || "[]") : [];
  return {
    id: o.id,
    code: `W${o.id}`,
    kind: o.kind,
    package: o.package_code || null,
    status: o.status,
    category: o.category || "other",
    price: o.price || 0,
    created_at: o.created_at,
    delivered_at: o.delivered_at || null,
    images: outputs.map((k) => `${apiBase}/web/media/${token}/${o.id}/${encodeURIComponent(String(k).split("/").pop())}`),
  };
}

function packagesInfo(env) {
  const p = prices(env);
  return {
    SINGLE: { price: p.SINGLE, images: 6, pay_link: env.ZIINA_LINK_SINGLE || null, web: true },
    LAUNCH: { price: p.LAUNCH, images: 25, pay_link: env.ZIINA_LINK_LAUNCH || null, web: false },
    SUB_LITE: { price: p.SUB_LITE, images: 15, pay_link: env.ZIINA_LINK_SUB_LITE || null, web: false },
    SUB_CONTENT: { price: p.SUB_CONTENT, images: 30, pay_link: env.ZIINA_LINK_SUB_CONTENT || null, web: false },
  };
}

function contactInfo(env) {
  return { whatsapp: env.WA_PUBLIC_NUMBER || "971507241548", email: env.SUPPORT_EMAIL || "support@sawwerha.app" };
}

/* ------------------------------------------------------------------ */
/* POST /web/samples?category=&consent=1  (الجسم: بايتات الصورة)        */
/* ------------------------------------------------------------------ */
async function createSample(request, env, url, cfg, cors) {
  if (!cors["Access-Control-Allow-Origin"]) return reply(cors, { error: "origin" }, 403);
  if (!cfg.open) return reply(cors, { error: "closed" }, 503);
  if (url.searchParams.get("consent") !== "1") return reply(cors, { error: "consent" }, 400);
  const catParam = url.searchParams.get("category");
  const category = CATEGORIES.some((c) => c.id === catParam) ? catParam : "other";
  const declared = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
  if (!EXT[declared]) return reply(cors, { error: "type" }, 415);
  const lenHeader = request.headers.get("Content-Length");
  if (lenHeader == null || lenHeader === "") return reply(cors, { error: "length" }, 411);
  if (Number(lenHeader) > cfg.maxBytes) return reply(cors, { error: "size" }, 413);

  // الحدود قبل قراءة الجسم وقبل أي كتابة
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const day = new Date().toISOString().slice(0, 10);
  const dayKey = `web_day_${day}`;
  const ipKey = `web_ip_${day}_${await ipHash(ip, day)}`;
  const s = await db.webLimits(env.DB, dayKey, ipKey);
  if (s.paused === "1") return reply(cors, { error: "paused" }, 503);
  if (Number(s.day_n || 0) >= cfg.dailyCap) return reply(cors, { error: "daily_cap" }, 429);
  if (Number(s.ip_n || 0) >= cfg.ipCap) return reply(cors, { error: "ip_cap" }, 429);
  if (Number(s.queue || 0) >= cfg.queueCap) return reply(cors, { error: "busy" }, 503);

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > cfg.maxBytes) return reply(cors, { error: "size" }, 413);
  if (bytes.byteLength < MIN_BYTES) return reply(cors, { error: "empty" }, 400);
  const sniffed = sniffImage(new Uint8Array(bytes, 0, Math.min(16, bytes.byteLength)));
  if (!sniffed || sniffed !== declared) return reply(cors, { error: "type" }, 415);

  const token = crypto.randomUUID();
  const key = `web/${token}/in/1.${EXT[sniffed]}`;
  await putMedia(env, key, bytes, sniffed);
  const id = await db.insertOrder(env.DB, { phone: WEB_PREFIX + token, kind: "sample", category, status: "queued", max_inputs: 1, inputs: [key], price: 0 });
  await db.webCount(env.DB, dayKey, ipKey, s.day_n == null);
  return reply(cors, { token, order: id, code: `W${id}`, status: "queued", page: `${cfg.site}/s/#${token}` }, 201);
}

/* ------------------------------------------------------------------ */
/* GET /web/samples/<رمز>                                              */
/* ------------------------------------------------------------------ */
async function sampleStatus(token, env, url, cors) {
  const rows = await db.ordersByPhone(env.DB, WEB_PREFIX + token);
  const sample = rows.find((o) => o.kind === "sample");
  if (!sample) return reply(cors, { error: "not_found" }, 404);
  const pack = rows.filter((o) => o.kind === "package").at(-1) || null;
  const s = view(sample, token, url.origin);
  if (sample.status === "queued") s.ahead = await db.queueAhead(env.DB, sample);
  let p = null;
  if (pack) {
    p = view(pack, token, url.origin);
    if (pack.status === "queued") p.ahead = await db.queueAhead(env.DB, pack);
  }
  return reply(cors, { sample: s, package: p, packages: packagesInfo(env), contact: contactInfo(env) });
}

/* ------------------------------------------------------------------ */
/* POST /web/samples/<رمز>/order  {code:"SINGLE"}                      */
/* ------------------------------------------------------------------ */
async function orderPackage(token, request, env, url, cors) {
  if (!cors["Access-Control-Allow-Origin"]) return reply(cors, { error: "origin" }, 403);
  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "");
  const info = packagesInfo(env);
  if (!info[code]) return reply(cors, { error: "package" }, 400);
  // الإصدار الأول: حزمة المنتج الواحد على الصورة المرفوعة نفسها؛ بقية الباقات بالتواصل لأنها تحتاج صوراً أخرى
  if (!info[code].web) return reply(cors, { error: "contact", contact: contactInfo(env) }, 409);
  const rows = await db.ordersByPhone(env.DB, WEB_PREFIX + token);
  const sample = rows.find((o) => o.kind === "sample");
  if (!sample) return reply(cors, { error: "not_found" }, 404);
  if (sample.status !== "delivered") return reply(cors, { error: "sample_not_ready" }, 409);
  const open = rows.find((o) => o.kind === "package" && !["cancelled", "failed"].includes(o.status));
  if (open) return reply(cors, { package: view(open, token, url.origin), pay_link: info[open.package_code]?.pay_link || null, contact: contactInfo(env) });
  const price = prices(env)[code];
  const id = await db.insertOrder(env.DB, {
    phone: WEB_PREFIX + token,
    kind: "package",
    package_code: code,
    category: sample.category,
    status: "awaiting_payment",
    max_inputs: 1,
    inputs: JSON.parse(sample.inputs || "[]"),
    price,
  });
  const o = await db.getOrder(env.DB, id);
  return reply(cors, { package: view(o, token, url.origin), pay_link: info[code].pay_link, contact: contactInfo(env) }, 201);
}

/* ------------------------------------------------------------------ */
/* GET /web/media/<رمز>/<رقم الطلب>/<اسم الملف>                         */
/* ------------------------------------------------------------------ */
async function media(token, id, name, env) {
  const notFound = () => new Response("not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const o = await db.getOrder(env.DB, id);
  if (!o || o.phone !== WEB_PREFIX + token || !["delivered", "done"].includes(o.status)) return notFound();
  const key = `orders/${id}/out/${name}`;
  if (!JSON.parse(o.outputs || "[]").includes(key)) return notFound();
  const obj = await getMedia(env, key);
  if (!obj) return notFound();
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "image/jpeg",
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `inline; filename="sawwerha-W${id}-${name}"`,
    },
  });
}

/** موجّه ‎/web/*‎. */
export async function handleWeb(request, env, url) {
  const cfg = webConfig(env);
  const cors = corsHeaders(cfg, request.headers.get("Origin"));
  const path = url.pathname;
  if (request.method === "OPTIONS") return new Response(null, { status: cors["Access-Control-Allow-Origin"] ? 204 : 403, headers: cors });
  if (path === "/web/samples" && request.method === "POST") return createSample(request, env, url, cfg, cors);
  let m;
  if ((m = path.match(/^\/web\/samples\/([^/]+)$/)) && request.method === "GET") {
    if (!TOKEN_RE.test(m[1])) return reply(cors, { error: "not_found" }, 404);
    return sampleStatus(m[1], env, url, cors);
  }
  if ((m = path.match(/^\/web\/samples\/([^/]+)\/order$/)) && request.method === "POST") {
    if (!TOKEN_RE.test(m[1])) return reply(cors, { error: "not_found" }, 404);
    return orderPackage(m[1], request, env, url, cors);
  }
  if ((m = path.match(/^\/web\/media\/([^/]+)\/(\d+)\/([^/]+)$/)) && request.method === "GET") {
    const name = decodeURIComponent(m[3]);
    if (!TOKEN_RE.test(m[1]) || !NAME_RE.test(name)) return new Response("not found", { status: 404 });
    return media(m[1], Number(m[2]), name, env);
  }
  return reply(cors, { error: "not_found" }, 404);
}
