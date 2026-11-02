import { ksaNotice } from "../calc.js";
import { bind, money, table, big, note, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";

bind(form, result, (v) => {
  if (!v.wage) return null;
  const employer = v.who === "employer";
  const n = ksaNotice({ wage: v.wage, monthly: v.pay !== "other", who: v.who, givenDays: v.given || 0 });
  const payer = employer ? "صاحب العمل يدفع لك" : "تدفع لصاحب العمل";
  let html = big(n.amount ? `التعويض عن مهلة الإشعار (${payer})` : "لا تعويض: المهلة مراعاة بالكامل", money(n.amount, cur), `المهلة النظامية ${daysAr(n.requiredDays)} · على الأجر الفعلي`);
  html += table(
    [
      ["مهلة الإشعار النظامية", daysAr(n.requiredDays)],
      ["الأيام المراعاة", daysAr(n.givenDays)],
      ["الأيام غير المراعاة", daysAr(n.unservedDays)],
      ["أجر اليوم (الأجر الفعلي ÷ 30)", money(n.daily, cur)],
      ["التعويض", money(n.amount, cur), { strong: true }],
      n.givenDays > 0 ? ["لو حُسب عن المهلة كاملة", money(n.fullAmount, cur), { muted: true }] : null,
    ],
    "تفصيل الحساب (المادتان 75 و76)"
  );
  if (n.givenDays > 0) html += note("نص المادة 76 «أجر العامل عن المهلة نفسها». حساب الجزء غير المراعى فقط هو الممارسة الشائعة، وعرضنا مبلغ المهلة كاملة للمقارنة.", "info");
  html += note("هذه المهلة للعقد غير محدد المدة. في العقد محدد المدة لا مهلة بالمادة 75: إنهاء صاحب العمل المبكر يخضع للمادة 77، والاستقالة تُعد مقبولة بعد 30 يوماً ولصاحب العمل تأجيلها حتى 60 يوماً.", "ok");
  return html;
});
