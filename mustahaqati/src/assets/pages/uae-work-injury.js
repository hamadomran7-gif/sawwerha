import { uaeWorkInjury } from "../calc.js";
import { bind, money, num, table, big, note, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  if (!v.basic) return null;
  const deg = Math.min(100, Math.max(0, v.degree || 0)) / 100;
  const r = uaeWorkInjury({ basic: v.basic, total: v.total || v.basic, treatmentDays: v.treatmentDays, degree: deg });
  const totalDis = deg >= 1;
  const comp = totalDis ? r.death : r.partial;
  let html = deg
    ? big(totalDis ? "تعويض العجز الكلي" : "تعويض العجز الجزئي", money(comp, cur), r.treatmentPay ? `ومعه أجر فترة العلاج ${money(r.treatmentPay, cur)} = ${money(comp + r.treatmentPay, cur)}` : "يدفعه صاحب العمل خلال 10 أيام من التقرير الطبي")
    : big("أجر فترة العلاج", money(r.treatmentPay, cur), "يدفعه صاحب العمل مع كل تكاليف العلاج");
  if (r.fullDays || r.halfDays)
    html += table(
      [
        r.fullDays ? [`${daysAr(r.fullDays)} بالأجر الكامل (${money(r.daily, cur)} يومياً)`, money(r.fullPay, cur)] : null,
        r.halfDays ? [`${daysAr(r.halfDays)} بنصف الأجر`, money(r.halfPay, cur)] : null,
        ["أجر فترة العلاج", money(r.treatmentPay, cur), { strong: true }],
      ],
      "أثناء العلاج (على الراتب الإجمالي)"
    );
  if (r.uncoveredDays) html += note(`${daysAr(r.uncoveredDays)} بعد السنة الأولى لا ينص القانون على أجر عنها.`, "warn");
  html += table(
    [
      [`أجر أساسي 24 شهراً: 24 × ${money(v.basic, cur)}`, money(r.raw, cur)],
      r.clamped ? [r.raw > r.death ? "بعد الحد الأعلى 200,000" : "بعد الحد الأدنى 18,000", money(r.death, cur)] : null,
      deg && !totalDis ? [`العجز الجزئي: ${num(deg * 100, 0)}% × ${money(r.death, cur)}`, money(r.partial, cur), { strong: true }] : null,
      totalDis ? ["العجز الكلي (مثل تعويض الوفاة)", money(r.death, cur), { strong: true }] : null,
      !deg ? ["تعويض الوفاة أو العجز الكلي", money(r.death, cur), { strong: true }] : null,
    ],
    "التعويض المقطوع"
  );
  if (deg && !totalDis && r.partialAlt !== r.partial) html += note(`بقراءة أخرى تطبّق حدي 18,000 و200,000 على الناتج بعد النسبة يصبح التعويض ${money(r.partialAlt, cur)}.`, "info");
  html += note(
    deg && !totalDis
      ? `للمواطن المشترك في الهيئة العامة للمعاشات: تصرف الهيئة ${num(deg * 100, 0)}% × 75,000 = ${money(r.gpssaPartial, cur)}، وعن الوفاة أو العجز الكلي معاشاً كأن مدته 35 سنة.`
      : "للمواطن المشترك في الهيئة العامة للمعاشات: معاش عن الوفاة أو العجز الكلي كأن مدته 35 سنة، وعن العجز الجزئي نسبته × 75,000 درهم.",
    "info"
  );
  html += note("تُضاف مكافأة نهاية الخدمة عند انتهاء العقد، ولا يسقط الحق إلا في حالات المادة 38. والحاسبة تقديرية: نسبة العجز تحددها الجهة الطبية المختصة.", "info");
  return html;
});
