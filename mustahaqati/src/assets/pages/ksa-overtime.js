import { ksaOvertime, rules } from "../calc.js";
import { bind, money, num, table, big, note, hoursAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";

bind(form, result, (v) => {
  if (!v.basic || v.hours === null || v.hours === undefined) return null;
  const actual = (v.basic || 0) + (v.allowances || 0);
  const o = ksaOvertime({ basic: v.basic, actual, hours: v.hours });
  const O = rules.sa.overtime;
  const wrong = v.hours * (v.basic / 30 / 8) * 1.5;
  let html = big("أجر الساعات الإضافية المستحق", money(o.total, cur), `${hoursAr(v.hours)} × ${money(o.rate, cur)} للساعة`);
  html += table(
    [
      ["أجر الساعة الفعلي (الفعلي ÷ 30 ÷ 8)", money(o.hourlyActual, cur)],
      ["أجر الساعة الأساسي (الأساسي ÷ 30 ÷ 8)", money(o.hourlyBasic, cur), { muted: true }],
      ["الزيادة (50% من أجر الساعة الأساسي)", money(o.premiumPerHour, cur)],
      ["أجر الساعة الإضافية", money(o.rate, cur)],
      ["المستحق عن الساعات", money(o.total, cur), { strong: true }],
    ],
    "تفصيل الحساب (المادة 107)"
  );
  if (v.allowances > 0) html += note(`الصيغة الخاطئة الشائعة «1.5 × أجر الساعة الأساسي» تعطي ${money(wrong, cur)} فقط، لأنها تتجاهل البدلات في أجر الساعة.`, "warn");
  html += note(`بديل نظامي بموافقتك: إجازة تعويضية مدفوعة لا تقل عن ${hoursAr(o.compLeaveHours)} (ساعة ونصف عن كل ساعة إضافية)، تُستخدم خلال ${O.compLeaveUseWithinDays} يوماً، وبحد أقصى ${O.compLeaveMaxDaysPerYear} يوماً في السنة.`, "info");
  if (v.hours > O.annualCapHours) html += note(`الحد السنوي للساعات الإضافية ${O.annualCapHours} ساعة، ويجوز تجاوزه بموافقة العامل.`, "warn");
  return html;
});
