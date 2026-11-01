import { ksaLeave } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";

bind(form, result, (v) => {
  if (!v.wage || v.years === null || v.months === null) return null;
  const l = ksaLeave({ wage: v.wage, yearsOfService: v.years, usedDays: v.used || 0, monthsInCurrentYear: v.months });
  let html = big("الأيام المتبقية من إجازة هذه السنة", `${num(l.remaining, 1)} يوماً`, `قيمتها النقدية ${money(l.amount, cur)}`);
  html += table(
    [
      ["الاستحقاق السنوي", `${l.entitlement} يوماً ${v.years >= 5 ? "(بعد خمس سنوات متصلة)" : ""}`],
      [`المستحق عن ${num(v.months, 0)} شهراً من السنة الحالية`, `${num(l.accrued, 1)} يوماً`],
      ["المستخدم", `${num(v.used || 0, 0)} يوماً`],
      ["المتبقي", `${num(l.remaining, 1)} يوماً`, { strong: true }],
      ["قيمة اليوم (الأجر ÷ 30)", money(l.dailyWage, cur)],
      ["بدل الإجازة المتبقية", money(l.amount, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  if (v.years >= 4 && v.years < 5) html += note("عند إكمال خمس سنوات متصلة يرتفع استحقاقك إلى 30 يوماً سنوياً.", "info");
  return html;
});
