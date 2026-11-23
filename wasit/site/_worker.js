// الوساطة العقارية (wasit) — عامل Pages بالوضع المتقدم (advanced mode) لصفحة الهبوط.
// البند 69 في «طابور البناء» (24 نوفمبر 2026): مبني غير منشور، والنشر معلّق بشروط مكتوبة في docs/03.
// يعمل على كل المسارات (لا _routes.json):
//   POST ‎/api/lead‎  يتحقق من الطلب ويحفظه في KV ‏WASIT_LEADS بمفتاح lead:<ISO>:<8 hex> مع metadata ‏{src, budget, type}.
//   GET  ‎/api/stats‎ عدد الطلبات بالأيام (بتوقيت دبي) والمصادر والميزانية والنوع، من قائمة المفاتيح وmetadata وحدها.
//   صفحات HTML: يحقن WASIT_NAME وWASIT_WHATSAPP وWASIT_BRN وWASIT_OFFICE وWASIT_ORN وWASIT_PERMIT في سمات body
//   بعد تهريب HTML، ويُبقي noindex ما لم يكن WASIT_LIVE=1 (وعلى ‎*.pages.dev‎ دائماً).
// لا أسرار ولا اسم ولا رقم هنا: القيم كلها متغيرات مشروع Pages، والتخزين ربط KV في إعداداته.

const HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: HEADERS });
const bad = (field) => json({ ok: false, error: field }, 400);

// خيارات القوائم كما في site/index.html حرفياً (الاختبار يطابقها بالصفحة)
const OPTIONS = {
  purpose: ["سكن", "استثمار", "الاثنان"],
  type: ["شقة", "تاون هاوس", "فيلا", "لم أقرر"],
  budget: ["أقل من 1.5 مليون", "1.5 إلى 2.5 مليون", "2.5 إلى 4 ملايين", "أكثر من 4 ملايين"],
  timing: ["خلال شهر", "خلال 3 أشهر", "خلال سنة", "أستكشف فقط"],
  pay: ["خطة دفع المطوّر", "نقداً", "تمويل بنكي", "لم أقرر"],
};
const MAX_BODY = 8000;
const SRC_RE = /^[a-z0-9_.-]{1,40}$/;

const str = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
// الأرقام العربية الهندية (٠–٩ و۰–۹) إلى 0–9، ثم حذف المسافات والشرطات و+ والأقواس كما تفعل الصفحة
const digits = (s) => s.replace(/[٠-٩۰-۹]/g, (c) => String(c.charCodeAt(0) & 15)).replace(/[\s\-+()]/g, "");
const rand8 = () => [...crypto.getRandomValues(new Uint8Array(4))].map((x) => x.toString(16).padStart(2, "0")).join("");

// المصدر للعدّ: قيمة src أو utm_source من الاستعلام، بحروف لاتينية صغيرة وأرقام فقط، وإلا other
function srcOf(source) {
  if (!source || source === "direct") return "direct";
  let v = "";
  try {
    const q = new URLSearchParams(source.startsWith("?") ? source.slice(1) : source);
    v = (q.get("src") || q.get("utm_source") || "").trim().toLowerCase();
  } catch (e) { v = ""; }
  return SRC_RE.test(v) ? v : "other";
}

// يعيد اسم الحقل المرفوض، أو null إن كان الطلب صالحاً
function invalid(b) {
  if (b.website !== undefined && b.website !== "") return "website"; // فخ الرسائل الآلية
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name || name.length > 80) return "name";
  if (typeof b.phone !== "string" || !/^\d{9,15}$/.test(digits(b.phone))) return "phone";
  for (const f of Object.keys(OPTIONS)) if (!OPTIONS[f].includes(b[f])) return f;
  if (b.consent !== true) return "consent";
  return null;
}

async function lead(request, env, url) {
  if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ ok: false, error: "too_large" }, 413);
  let b;
  try { b = JSON.parse(text); } catch (e) { return bad("json"); }
  if (!b || typeof b !== "object" || Array.isArray(b)) return bad("json");
  const field = invalid(b);
  if (field) return bad(field);
  const now = new Date();
  const rec = {
    name: b.name.trim(), phone: digits(b.phone), purpose: b.purpose, type: b.type, budget: b.budget,
    timing: b.timing, pay: b.pay, consent: true, source: str(b.source, 300) || "direct",
  };
  const page = str(b.page, 100), sent = str(b.at, 40);
  if (page) rec.page = page;
  if (sent) rec.sent_at = sent;
  rec.received_at = now.toISOString();
  rec.site = url.hostname;
  // فحص بلا كتابة بعد النشر: يتحقق ويرد بالنجاح دون حفظ
  if (request.headers.get("x-dry-run") === "1") return json({ ok: true, dry_run: true });
  if (!env.WASIT_LEADS) return json({ ok: false, error: "storage" }, 503);
  const key = `lead:${rec.received_at}:${rand8()}`;
  const value = JSON.stringify(rec);
  // metadata للعدّ فقط، ولا يدخلها حقل شخصي؛ وإن رُفضت يُحفظ الطلب بالمفتاح نفسه بلاها
  const metadata = { src: srcOf(rec.source), budget: rec.budget, type: rec.type };
  try { await env.WASIT_LEADS.put(key, value, { metadata }); } catch (e) { await env.WASIT_LEADS.put(key, value); }
  return json({ ok: true });
}

// يوم الطلب بتوقيت دبي (UTC+4 بلا توقيت صيفي) من ISO في المفتاح
function dubaiDay(name) {
  const t = Date.parse(name.slice(5, 29));
  return Number.isNaN(t) ? null : new Date(t + 4 * 3600 * 1000).toISOString().slice(0, 10);
}

async function stats(request, env) {
  if (request.method !== "GET") return json({ ok: false, error: "method" }, 405);
  if (!env.WASIT_LEADS) return json({ ok: false, error: "storage" }, 503);
  const out = { ok: true, tz: "Asia/Dubai", total: 0, days: {}, sources: {}, budget: {}, type: {} };
  const inc = (o, k) => { o[k] = (o[k] || 0) + 1; };
  let cursor;
  for (let i = 0; i < 50; i++) {
    const r = await env.WASIT_LEADS.list(cursor ? { prefix: "lead:", cursor } : { prefix: "lead:" });
    for (const k of r.keys) {
      const day = dubaiDay(k.name);
      if (!day) continue;
      const m = k.metadata || {};
      out.total++;
      inc(out.days, day);
      // لا يخرج من metadata إلا ما يطابق نمط المصدر أو خيارات القوائم، فلا تتسرب بيانات شخصية ولو عُبث بها
      inc(out.sources, typeof m.src === "string" && SRC_RE.test(m.src) ? m.src : "other");
      if (OPTIONS.budget.includes(m.budget)) inc(out.budget, m.budget);
      if (OPTIONS.type.includes(m.type)) inc(out.type, m.type);
    }
    if (r.list_complete || !r.cursor) break;
    cursor = r.cursor;
  }
  return json(out);
}

const ATTRS = [["name", "WASIT_NAME"], ["whatsapp", "WASIT_WHATSAPP"], ["brn", "WASIT_BRN"], ["office", "WASIT_OFFICE"], ["orn", "WASIT_ORN"], ["permit", "WASIT_PERMIT"]];
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
const NOINDEX_META = /<meta name="robots" content="noindex">\n?/i;

async function page(request, env, url) {
  // HTML يتغيّر بمتغيرات المشروع لا بالملف، فلا يُطلب الأصل بشرط ولا يُعاد ETag لئلا تبقى نسخة قديمة بقيم ناقصة
  const htmlish = url.pathname.endsWith("/") || url.pathname.endsWith(".html") || !/\.[a-z0-9]+$/i.test(url.pathname);
  let req = request;
  if (htmlish && (request.headers.has("if-none-match") || request.headers.has("if-modified-since"))) {
    const h = new Headers(request.headers);
    h.delete("if-none-match");
    h.delete("if-modified-since");
    req = new Request(request.url, { method: request.method, headers: h });
  }
  const res = await env.ASSETS.fetch(req);
  if (!(res.headers.get("content-type") || "").includes("text/html")) return res;
  const live = env.WASIT_LIVE === "1" && !url.hostname.endsWith(".pages.dev");
  let html = await res.text();
  html = html.replace(/<body\b[^>]*>/i, (tag) => {
    let t = tag;
    // الاستبدال بدالة، فلا تُفسَّر $& وأخواتها في القيم
    for (const [attr, key] of ATTRS) t = t.replace(`data-${attr}=""`, () => `data-${attr}="${esc(String(env[key] || "").trim())}"`);
    return t;
  });
  if (live) html = html.replace(NOINDEX_META, "");
  const h = new Headers(res.headers);
  for (const k of ["content-length", "etag", "last-modified"]) h.delete(k);
  if (live) h.delete("x-robots-tag");
  else h.set("x-robots-tag", "noindex");
  h.set("x-content-type-options", "nosniff");
  h.set("x-frame-options", "DENY");
  h.set("referrer-policy", "strict-origin-when-cross-origin");
  h.set("permissions-policy", "geolocation=(), microphone=(), camera=()");
  const empty = [101, 204, 205, 304].includes(res.status) || request.method === "HEAD";
  return new Response(empty ? null : html, { status: res.status, statusText: res.statusText, headers: h });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/lead") return lead(request, env, url);
    if (url.pathname === "/api/stats") return stats(request, env);
    if (url.pathname.startsWith("/api/")) return json({ ok: false, error: "not_found" }, 404);
    return page(request, env, url);
  },
};
