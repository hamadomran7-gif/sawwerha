// الدفع عبر زينة (Ziina Business API) مع بديل الروابط الثابتة.
// توثيق زينة: https://docs.ziina.com — تحقق من المسارات عند التفعيل.

const ZIINA = "https://api-v2.ziina.com/api";

export function staticLink(env, code) {
  return env[`ZIINA_LINK_${code}`] || "";
}

/** ينشئ رابط دفع لطلب. يعيد {id, url} أو null إذا لم يتوفر مفتاح API. */
export async function createPaymentLink(env, order, customer) {
  if (!env.ZIINA_API_KEY) {
    const url = staticLink(env, order.package_code);
    return url ? { id: null, url } : null;
  }
  const body = {
    amount: Math.round(Number(order.price) * 100), // بالفلس
    currency_code: "AED",
    message: `${env.BRAND || "Sawwerha"} — طلب #${order.id} — ${order.package_code}`,
    success_url: `${env.PUBLIC_URL || "https://sawwerha.com"}/paid?order=${order.id}`,
    cancel_url: `${env.PUBLIC_URL || "https://sawwerha.com"}/cancel?order=${order.id}`,
    failure_url: `${env.PUBLIC_URL || "https://sawwerha.com"}/failed?order=${order.id}`,
    test: env.ZIINA_TEST === "true",
    transaction_source: "directApi",
  };
  const res = await fetch(`${ZIINA}/payment_intent`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.ZIINA_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Ziina ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return { id: data.id, url: data.redirect_url };
}

/** يعيد true إذا اكتمل الدفع. */
export async function isPaid(env, paymentId) {
  if (!env.ZIINA_API_KEY || !paymentId) return false;
  const res = await fetch(`${ZIINA}/payment_intent/${paymentId}`, { headers: { Authorization: `Bearer ${env.ZIINA_API_KEY}` } });
  if (!res.ok) return false;
  const data = await res.json();
  return String(data.status || "").toLowerCase() === "completed";
}
