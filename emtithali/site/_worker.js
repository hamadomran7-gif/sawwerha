// امتثالي (emtithali.com) — عامل Pages بالوضع المتقدم (advanced mode).
// أُعيدت كتابة دالة نموذج «اطلب عروض الأسعار» في 18 نوفمبر 2026 بموافقة حمد، لأن كود دالة Functions الأصلية
// غير متاح؛ والسلوك مطابق لما يرسله النموذج ويقرؤه (index.html: sendLead) ولشكل السجل المحفوظ في KV.
// _routes.json يجعل العامل يعمل على /api/* وحدها، وكل ما عداها أصول ثابتة.
// لا أسرار هنا: الربط LEADS (KV «dalil-leads») من إعدادات مشروع Pages.

const HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: HEADERS });

// بترتيب ما يرسله النموذج، ثم يُضاف received_at وsite كما في السجلات المحفوظة
const FIELDS = ["name", "company", "phone", "invoices_per_month", "current_system", "consent", "source", "sent_at", "email"];
const LIMITS = { name: 200, company: 200, phone: 40, invoices_per_month: 100, current_system: 100, consent: 200, source: 300, sent_at: 40, email: 200 };
const REQUIRED = ["name", "company", "phone"];
const MAX_BODY = 20000;

const pad = (n) => String(n).padStart(2, "0");
// مفتاح السجل: lead:YYYYMMDDHHMMSS-<8 hex> بتوقيت UTC، كالمفاتيح القائمة
const stamp = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
const rand8 = () => [...crypto.getRandomValues(new Uint8Array(4))].map((x) => x.toString(16).padStart(2, "0")).join("");

async function submit(request, env, url) {
  if (request.method !== "POST") return json({ success: false, message: "Use POST" }, 405);
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ success: false, message: "Request too large" }, 413);
  let body;
  try { body = JSON.parse(text); } catch (e) { return json({ success: false, message: "Bad JSON" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ success: false, message: "Bad JSON" }, 400);
  const rec = {};
  for (const f of FIELDS) {
    const v = body[f];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v !== "string") return json({ success: false, message: `Invalid field: ${f}` }, 400);
    const t = v.trim().slice(0, LIMITS[f]);
    if (t) rec[f] = t;
  }
  for (const f of REQUIRED) if (!rec[f]) return json({ success: false, message: `Missing field: ${f}` }, 400);
  const now = new Date();
  rec.received_at = now.toISOString();
  rec.site = url.hostname;
  // فحص بلا كتابة: يتحقق ويرد بالنجاح دون حفظ (للتحقق بعد النشر)
  if (request.headers.get("x-dry-run") === "1") return json({ success: true, dry_run: true });
  if (!env.LEADS) return json({ success: false, message: "Storage unavailable" }, 503);
  await env.LEADS.put(`lead:${stamp(now)}-${rand8()}`, JSON.stringify(rec));
  return json({ success: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/submit") return submit(request, env, url);
    return env.ASSETS.fetch(request);
  },
};
