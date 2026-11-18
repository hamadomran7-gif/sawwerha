// تخزين الوسائط — واجهة واحدة فوق R2 أو Workers KV (يُختار تلقائياً حسب نوع الربط MEDIA)
const isKV = (b) => b && typeof b.getWithMetadata === "function";

/** مدة بقاء الوسائط في KV بالثواني: MEDIA_TTL_DAYS (افتراضياً 90 يوماً كما في سياسة الخصوصية). */
export function mediaTtlSeconds(env) {
  const days = Number(env.MEDIA_TTL_DAYS || 90);
  return Math.max(60, Math.round((Number.isFinite(days) && days > 0 ? days : 90) * 86400));
}

/** يحفظ بايتات بمفتاح ونوع محتوى. في KV تنتهي الصورة تلقائياً بعد MEDIA_TTL_DAYS (سقف 1 GB في الخطة المجانية). */
export async function putMedia(env, key, bytes, mime) {
  if (isKV(env.MEDIA)) return env.MEDIA.put(key, bytes, { metadata: { contentType: mime }, expirationTtl: mediaTtlSeconds(env) });
  return env.MEDIA.put(key, bytes, { httpMetadata: { contentType: mime } });
}

/** يعيد كائناً بواجهة R2 المبسطة: body وarrayBuffer() وhttpMetadata.contentType، أو null. */
export async function getMedia(env, key) {
  if (isKV(env.MEDIA)) {
    const r = await env.MEDIA.getWithMetadata(key, { type: "arrayBuffer" });
    if (!r || !r.value) return null;
    const buf = r.value;
    return { body: buf, arrayBuffer: async () => buf, httpMetadata: { contentType: r.metadata?.contentType || "application/octet-stream" } };
  }
  return env.MEDIA.get(key);
}
