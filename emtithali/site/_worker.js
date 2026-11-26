// امتثالي (emtithali.com) — عامل Pages بالوضع المتقدم (advanced mode).
// أُعيدت كتابة دالة نموذج «اطلب عروض الأسعار» في 18 نوفمبر 2026 بموافقة حمد، لأن كود دالة Functions الأصلية
// غير متاح؛ والسلوك مطابق لما يرسله النموذج ويقرؤه (index.html: sendLead) ولشكل السجل المحفوظ في KV.
// _routes.json يجعل العامل يعمل على /api/* وحدها، وكل ما عداها أصول ثابتة.
// لا أسرار هنا: الربط LEADS (KV «dalil-leads») من إعدادات مشروع Pages.
// يُحفظ مع كل طلب metadata ‏{src, inv} للعدّ من قائمة المفاتيح دون قراءة القيم (فيها بيانات شخصية).
// طلب «أريد المدقق كواجهة API» من ‎/pint-ae-validator‎ (البند 84) يمر بـ‎/api/submit‎ نفسه بالحقل kind = "validator-api":
// إلزاميّه اسم الشركة والبريد والموافقة بدل الاسم والجوال، ولا يُحال إلى أي مزوّد.
// وعدّاد فحوص المدقق POST ‎/api/pint-check‎ في KV مستقل عن «dalil-leads» (الربط CHECKS)، انظر pintCheck أدناه.

const HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: HEADERS });

// بترتيب ما يرسله النموذج، ثم يُضاف received_at وsite كما في السجلات المحفوظة
const FIELDS = ["name", "company", "phone", "invoices_per_month", "current_system", "consent", "source", "sent_at", "email", "kind"];
const LIMITS = { name: 200, company: 200, phone: 40, invoices_per_month: 100, current_system: 100, consent: 200, source: 300, sent_at: 40, email: 200, kind: 40 };
const REQUIRED = ["name", "company", "phone"];
// أنواع الطلب غير طلب العروض، وإلزاميّ كلٍّ منها؛ ونوع غير معروف يُرفض
const KINDS = { "validator-api": ["company", "email", "consent"] };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
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
  if (rec.kind && !Object.prototype.hasOwnProperty.call(KINDS, rec.kind)) return json({ success: false, message: "Invalid field: kind" }, 400);
  for (const f of rec.kind ? KINDS[rec.kind] : REQUIRED) if (!rec[f]) return json({ success: false, message: `Missing field: ${f}` }, 400);
  if (rec.kind && !EMAIL.test(rec.email)) return json({ success: false, message: "Invalid field: email" }, 400);
  const now = new Date();
  rec.received_at = now.toISOString();
  rec.site = url.hostname;
  // فحص بلا كتابة: يتحقق ويرد بالنجاح دون حفظ (للتحقق بعد النشر)
  if (request.headers.get("x-dry-run") === "1") return json({ success: true, dry_run: true });
  if (!env.LEADS) return json({ success: false, message: "Storage unavailable" }, 503);
  const key = `lead:${stamp(now)}-${rand8()}`;
  const value = JSON.stringify(rec);
  // metadata للعدّ فقط، ولا يدخلها حقل شخصي أبداً. KV يرفض metadata أكبر من 1024 بايت بعد JSON.stringify،
  // وأسوأ محرف يصير 6 بايت (\u00XX)، فـ100 + 30 محرفاً تبقى دون الحد.
  const metadata = { src: (rec.source || "direct").slice(0, 100) };
  if (rec.invoices_per_month) metadata.inv = rec.invoices_per_month.slice(0, 30);
  // المفتاح نفسه في المحاولتين فلا يتكرر الطلب، ولا يضيع طلب بسبب metadata
  try { await env.LEADS.put(key, value, { metadata }); } catch (e) { await env.LEADS.put(key, value); }
  return json({ success: true });
}

// عدّاد فحوص مدقق PINT AE (البند 84): تُرسل الصفحة بعد كل فحص اكتمل POST ‎/api/pint-check‎ بجسم {"ok":<منطقي>,"n":<عدد المخالفات>} لا غير،
// فيُحفظ في KV ‏CHECKS (غير «dalil-leads») بمفتاح check:YYYYMMDDHHMMSS-xxxxxxxx بتوقيت UTC وقيمة فارغة وmetadata ‏{ok, n}.
// لا محتوى ملف ولا اسمه ولا TRN ولا عنوان IP. بلا ربط CHECKS يرد 204 دون حفظ، فالنشر قبل إنشاء الربط آمن.
// حدّ الكتابة لكل نسخة عامل يحمي حصة كتابة KV اليومية في الحساب، وهي مشتركة مع طلبات العروض.
const CHECK_MAX_BODY = 64;
const CHECK_MAX_N = 1000;
const CHECK_CAP = { hour: 30, day: 120 };
const checkUse = { hour: "", inHour: 0, day: "", inDay: 0 };
const noContent = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

function underCap(now) {
  const day = stamp(now).slice(0, 8), hour = stamp(now).slice(0, 10);
  if (checkUse.day !== day) { checkUse.day = day; checkUse.inDay = 0; }
  if (checkUse.hour !== hour) { checkUse.hour = hour; checkUse.inHour = 0; }
  if (checkUse.inHour >= CHECK_CAP.hour || checkUse.inDay >= CHECK_CAP.day) return false;
  checkUse.inHour++; checkUse.inDay++;
  return true;
}

async function pintCheck(request, env) {
  if (request.method !== "POST") return json({ success: false, message: "Use POST" }, 405);
  const text = await request.text();
  if (text.length > CHECK_MAX_BODY) return json({ success: false, message: "Request too large" }, 413);
  let body;
  try { body = JSON.parse(text); } catch (e) { return json({ success: false, message: "Bad JSON" }, 400); }
  const ok = body && typeof body === "object" && !Array.isArray(body) && Object.keys(body).sort().join(",") === "n,ok"
    && typeof body.ok === "boolean" && Number.isInteger(body.n) && body.n >= 0 && body.n <= CHECK_MAX_N && body.ok === (body.n === 0);
  if (!ok) return json({ success: false, message: "Bad event" }, 400);
  if (request.headers.get("x-dry-run") === "1" || !env.CHECKS) return noContent();
  const now = new Date();
  if (!underCap(now)) return noContent();
  // خطأ الكتابة (ومنه نفاد الحصة) لا يصل إلى الزائر: العدّاد قياس لا خدمة
  try { await env.CHECKS.put(`check:${stamp(now)}-${rand8()}`, "", { metadata: { ok: body.ok ? 1 : 0, n: body.n } }); } catch (e) { /* لا شيء */ }
  return noContent();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/submit") return submit(request, env, url);
    if (url.pathname === "/api/pint-check") return pintCheck(request, env);
    return env.ASSETS.fetch(request);
  },
};
