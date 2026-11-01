import { serviceDuration, uaeLeaveAccrued, uaeLeaveEncashment } from "../calc.js";
import { bind, money, num, table, big, note, duration } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  if (!v.basic || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, 0);
  if (!d) return note("تاريخ الحساب يجب أن يكون بعد تاريخ المباشرة.", "bad");
  const acc = uaeLeaveAccrued({ years: d.years, months: d.months, days: d.days });
  const remaining = Math.max(0, acc.accruedDays - (v.used || 0));
  const enc = uaeLeaveEncashment({ basicSalary: v.basic, unusedDays: remaining });
  let html = big("الأيام المتبقية من الإجازة", `${num(remaining, 1)} يوماً`, `قيمتها النقدية ${money(enc.amount, cur)}`);
  html += table(
    [
      ["مدة الخدمة", duration(d)],
      ["الأيام المستحقة منذ المباشرة", `${num(acc.accruedDays, 1)} يوماً`],
      ["الأيام المستخدمة", `${num(v.used || 0, 0)} يوماً`],
      ["الأيام المتبقية", `${num(remaining, 1)} يوماً`, { strong: true }],
      ["الأجر اليومي للبدل (الأساسي ÷ 30)", money(enc.dailyWage, cur)],
      ["البدل النقدي عند انتهاء الخدمة", money(enc.amount, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  html += note(acc.note, "info");
  if ((v.used || 0) > acc.accruedDays) html += note("الأيام المستخدمة أكبر من المستحقة؛ قد يكون لديك إجازة مقدَّمة تُخصم من راتبك أو من مستحقاتك.", "warn");
  return html;
});
