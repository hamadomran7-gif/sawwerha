// النشر الآلي للريلز على إنستغرام عبر Instagram Graph API (Content Publishing).
// يعمل فقط بعد ضبط السرّين IG_USER_ID وIG_TOKEN (حساب احترافي مربوط بصفحة فيسبوك وبتطبيق ميتا).
// الجدول: من الأحد إلى الخميس، مقطع واحد يومياً بعد ساعة IG_POST_HOUR بتوقيت الخليج (افتراضياً 20:00).
// الحالة تُحفظ في جدول meta: ig_pending، ig_last_date، ig_next_index، ig_force.

const SITE = "https://sawwerha.app";
const TAIL = "\n\nالعيّنة الأولى مجانية على واتساب، وهي معاينة بعلامة مائية صغيرة؛ وصور الباقات بدونها — الرابط في الحساب.";

/** قائمة المقاطع بالترتيب (مستضافة على sawwerha.app/ads/) مع نص كل منشور. */
export const REELS = [
  { file: "reel-e-noon-rejected.mp4", caption: "صورتك على نون مرفوضة بسبب الخلفية أو الظل؟ نحوّل صورة جوالك إلى صورة رئيسية بخلفية بيضاء نقية، والمنتج نحو 80% من الإطار بهامش 10% كما تطلب نون، ومعها مشاهد لإنستغرام." + TAIL + "\n#تصوير_منتجات #نون #متجر_الكتروني #الامارات" },
  { file: "reel-f-phone-to-amazon.mp4", caption: "من صورة جوال إلى صورة أمازون: خلفية بيضاء نقية والمنتج يملأ 85% من الإطار كما تطلب أمازون، بدقة 2000 بكسل." + TAIL + "\n#صور_منتجات #امازون #تصوير_منتجات_دبي #بائعين" },
  { file: "reel-a-outcome.mp4", caption: "صورة جوال لمنتجك تصير صوراً احترافية: صورة بخلفية بيضاء ومشهدان لإنستغرام، وصور الباقات جاهزة للرفع على نون وأمازون." + TAIL + "\n#تصوير_منتجات #صور_منتجات #دبي" },
  { file: "reel-g-three-steps.mp4", caption: "3 خطوات فقط: صوّر منتجك بجوالك، أرسله على واتساب، واستلم 3 صور خلال ساعات. بلا استوديو ولا شحن." + TAIL + "\n#تصوير_منتجات #مشروع_منزلي #متجر_انستقرام #دبي" },
  { file: "reel-c-marketplace.mp4", caption: "تبيع على نون أو أمازون؟ الصورة الرئيسية بخلفية بيضاء نقية والمنتج كامل في الإطار، من صورة جوالك." + TAIL + "\n#نون #امازون #صور_منتجات" },
  { file: "reel-h-studio-vs-phone.mp4", caption: "استوديو تصوير أم جوالك؟ عندنا 6 صور لمنتجك بـ 149 درهماً من صورة جوال، بلا موعد ولا شحن، وتسلّمها خلال 24 ساعة مع تعديل مجاني." + TAIL + "\n#تصوير_منتجات_دبي #صور_منتجات #الامارات #تسويق" },
  { file: "reel-d-fidelity.mp4", caption: "نقصّ منتجك الحقيقي من صورتك ونبني المشهد حوله، فيبقى شكله ولونه ونصه من صورتك الأصلية." + TAIL + "\n#تصوير_منتجات #تسويق #مشروع_منزلي" },
  { file: "reel-b-price.mp4", caption: "6 صور لمنتجك بـ 149 درهماً من صورة جوال، وتسلّمها خلال 24 ساعة مع تعديل مجاني." + TAIL + "\n#تصوير_منتجات_دبي #متجر_الكتروني #الامارات" },
];

const POST_DAYS = [0, 1, 2, 3, 4]; // الأحد..الخميس (getUTCDay بعد إزاحة الخليج)

/** التاريخ والساعة بتوقيت الخليج (UTC+4). */
export function gulfNow(nowMs = Date.now()) {
  const g = new Date(nowMs + 4 * 3600 * 1000);
  return { date: g.toISOString().slice(0, 10), hour: g.getUTCHours(), day: g.getUTCDay() };
}

/** هل حان وقت منشور جديد اليوم؟ */
export function isDue({ nowMs = Date.now(), lastDate, postHour = 20, force = false }) {
  const g = gulfNow(nowMs);
  if (force) return true;
  if (lastDate === g.date) return false;
  return POST_DAYS.includes(g.day) && g.hour >= postHour;
}

function graph(env) {
  const v = env.IG_GRAPH_VERSION || "v23.0";
  return `https://graph.facebook.com/${v}`;
}

async function call(url, init) {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const msg = data.error ? `${data.error.message || "error"} (${data.error.code || res.status})` : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function createContainer(env, reel) {
  const body = new URLSearchParams({
    media_type: "REELS",
    video_url: `${SITE}/ads/${reel.file}`,
    caption: reel.caption,
    share_to_feed: "true",
    access_token: env.IG_TOKEN,
  });
  const data = await call(`${graph(env)}/${env.IG_USER_ID}/media`, { method: "POST", body });
  return data.id;
}

async function containerStatus(env, id) {
  const data = await call(`${graph(env)}/${id}?fields=status_code,status&access_token=${encodeURIComponent(env.IG_TOKEN)}`);
  return data.status_code || "IN_PROGRESS";
}

async function publish(env, creationId) {
  const body = new URLSearchParams({ creation_id: creationId, access_token: env.IG_TOKEN });
  const data = await call(`${graph(env)}/${env.IG_USER_ID}/media_publish`, { method: "POST", body });
  return data.id;
}

/**
 * خطوة واحدة من آلة النشر، تُستدعى من المهمة الدورية كل 5 دقائق.
 * meta: {get(key), set(key, value)}؛ notify: دالة لإبلاغ المالك.
 * تعيد وصفاً لما حدث (للاختبارات والسجل).
 */
export async function instagramTick(env, meta, notify = async () => {}, nowMs = Date.now()) {
  if (!env.IG_USER_ID || !env.IG_TOKEN) return { skipped: "not configured" };
  const pendingRaw = await meta.get("ig_pending");
  if (pendingRaw) {
    const p = JSON.parse(pendingRaw);
    let status;
    try {
      status = await containerStatus(env, p.id);
    } catch (e) {
      status = "ERROR";
      p.error = String(e.message || e);
    }
    if (status === "FINISHED") {
      try {
        const mediaId = await publish(env, p.id);
        await meta.set("ig_pending", "");
        await meta.set("ig_last_date", p.date);
        await meta.set("ig_next_index", String((p.index + 1) % REELS.length));
        return { published: mediaId, index: p.index };
      } catch (e) {
        status = "PUBLISH_ERROR";
        p.error = String(e.message || e);
      }
    }
    const ageMin = (nowMs - p.created) / 60000;
    if (status === "IN_PROGRESS" && ageMin < 120) return { waiting: p.id, status };
    // خطأ أو انتهاء صلاحية أو تأخر طويل: نتجاوز المقطع ونبلّغ المالك
    await meta.set("ig_pending", "");
    await meta.set("ig_next_index", String((p.index + 1) % REELS.length));
    await notify(`تعذّر نشر مقطع إنستغرام (${REELS[p.index].file}): ${status}${p.error ? " — " + p.error.slice(0, 150) : ""}`);
    return { abandoned: p.id, status };
  }
  const force = (await meta.get("ig_force")) === "1";
  const lastDate = await meta.get("ig_last_date");
  const postHour = Number(env.IG_POST_HOUR || 20);
  if (!isDue({ nowMs, lastDate, postHour, force })) return { idle: true };
  const index = Number((await meta.get("ig_next_index")) || 0) % REELS.length;
  const reel = REELS[index];
  try {
    const id = await createContainer(env, reel);
    await meta.set("ig_force", "0");
    await meta.set("ig_pending", JSON.stringify({ id, index, created: nowMs, date: gulfNow(nowMs).date }));
    return { created: id, index };
  } catch (e) {
    await meta.set("ig_force", "0");
    await meta.set("ig_last_date", gulfNow(nowMs).date); // لا نكرر المحاولة اليوم
    await notify(`تعذّر بدء نشر مقطع إنستغرام: ${String(e.message || e).slice(0, 200)}`);
    return { error: String(e.message || e) };
  }
}
