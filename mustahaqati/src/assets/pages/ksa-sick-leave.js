import { ksaSickLeave, shiftDate, shiftMonths, rules } from "../calc.js";
import { bind, money, table, big, note, arDate, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const label = (f) => (f === 1 ? "بأجر كامل" : f === 0 ? "بدون أجر" : "بثلاثة أرباع الأجر");

bind(form, result, (v) => {
  if (!v.wage || v.days === null || v.days === undefined) return null;
  const s = ksaSickLeave({ wage: v.wage, days: v.days });
  const rows = s.rows.filter((r) => r.days > 0).map((r) => [`${daysAr(r.days)} ${label(r.frac)}`, money(r.amount, cur)]);
  let html = big("أجر الإجازة المرضية المستحق", money(s.paid, cur), `${daysAr(Math.min(v.days, rules.sa.sickLeave.maxDays))} خلال السنة · على الأجر الفعلي`);
  html += table(
    [
      ["أجر اليوم (الأجر الفعلي ÷ 30)", money(s.daily, cur)],
      ...rows,
      ["المدفوع عن أيام الإجازة", money(s.paid, cur), { strong: true }],
      ["أجر الأيام نفسها لو عملت", money(s.normal, cur), { muted: true }],
      ["الخصم بسبب الإجازة", money(s.deduction, cur)],
    ],
    "تفصيل الحساب (المادة 117)"
  );
  if (v.first) html += note(`سنتك المرضية بدأت في ${arDate(v.first)} وتنتهي في ${arDate(shiftDate(shiftMonths(v.first, 12), -1))}. أول إجازة مرضية بعدها تفتح سنة جديدة برصيد كامل.`, "info");
  if (s.exceeded) html += note("تجاوزت 120 يوماً في السنة؛ النظام لا يوجب أجراً عما زاد عليها.", "warn");
  html += note("إذا ثبت أنك عملت لدى جهة أخرى أثناء الإجازة المرضية، فلصاحب العمل حرمانك من أجرها أو استرداد ما دفعه (المادة 118).", "info");
  return html;
});
