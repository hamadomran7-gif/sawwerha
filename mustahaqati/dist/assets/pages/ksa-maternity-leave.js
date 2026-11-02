import { ksaMaternityPlan, rules } from "../calc.js";
import { bind, money, table, big, note, arDate, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";

bind(form, result, (v) => {
  if (!v.due) return null;
  const M = rules.sa.maternity;
  const p = ksaMaternityPlan({ due: v.due, start: v.start || v.due, wage: v.wage || 0 });
  let html = big("آخر يوم في إجازة الوضع المدفوعة", arDate(p.lastPaid), `${M.weeks} أسبوعاً (${daysAr(p.totalDays)}) بأجر كامل · العودة ${arDate(p.back)}`);
  html += table(
    [
      ["أبكر بداية ممكنة (4 أسابيع قبل الموعد المرجح)", arDate(p.earliest)],
      ["بداية الإجازة", arDate(p.start), { strong: true }],
      ["الموعد المرجح للوضع", arDate(v.due)],
      ["الأيام قبل الموعد ← بعده", `${daysAr(p.preDays)} ← ${daysAr(p.postDays)}`],
      ["نهاية الأسابيع الستة الإلزامية بعد الوضع", arDate(p.mandatoryUntil)],
      ["آخر يوم بأجر كامل", arDate(p.lastPaid), { strong: true }],
      ["العودة إلى العمل", arDate(p.back)],
      ["العودة مع تمديد شهر بلا أجر", arDate(p.extendedBack), { muted: true }],
      v.wage ? ["أجرك عن مدة الإجازة (كامل)", money(p.paid, cur)] : null,
    ],
    "التواريخ إذا تم الوضع في موعده المرجح"
  );
  if (p.tooEarly) html += note("لا يجوز أن تبدأ الإجازة قبل الموعد المرجح بأكثر من 4 أسابيع، فاعتمدنا أبكر تاريخ مسموح.", "warn");
  if (p.late) html += note("بدأنا الإجازة من الموعد المرجح نفسه، لأنها لا تبدأ بعد الوضع.", "warn");
  html += note("إذا تأخر الوضع حتى قلّ الباقي من الإجازة عن 6 أسابيع بعده، يُستكمل النقص بلا أجر. ولطفل مريض أو من ذوي الإعاقة يحتاج مرافقاً: شهر إضافي بأجر كامل، ثم شهر بلا أجر إن طلبتِ.", "info");
  return html;
});
