import { uaeSickLeave, rules } from "../calc.js";
import { bind, money, num, table, big, note, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";
const label = (f) => (f === 1 ? "بأجر كامل" : f === 0 ? "بدون أجر" : `بنصف الأجر`);

bind(form, result, (v) => {
  if (!v.basic || v.days === null || v.days === undefined) return null;
  const total = (v.basic || 0) + (v.allowances || 0);
  const wage = v.basis === "basic" ? v.basic : total;
  const s = uaeSickLeave({ wage, days: v.days, probation: v.stage === "probation" });
  const basisTxt = v.basis === "basic" ? "على الأجر الأساسي" : "على الأجر الشامل (الأساسي + البدلات)";
  if (s.probation) {
    return (
      big("أجر الإجازة المرضية خلال فترة التجربة", money(0, cur), `${daysAr(v.days)} · ${basisTxt}`) +
      note(`لا إجازة مرضية مدفوعة خلال فترة التجربة. يجوز لصاحب العمل منحها بدون أجر بتقرير طبي، فيُخصم من راتبك نحو ${money(s.deduction, cur)}.`, "warn")
    );
  }
  const rows = s.rows.filter((r) => r.days > 0).map((r) => [`${daysAr(r.days)} ${label(r.frac)}`, money(r.amount, cur)]);
  let html = big("أجر الإجازة المرضية المستحق", money(s.paid, cur), `${daysAr(Math.min(v.days, rules.ae.sickLeave.maxDays))} في سنة الخدمة · ${basisTxt}`);
  html += table(
    [
      ["أجر اليوم (÷ 30)", money(s.daily, cur)],
      ...rows,
      ["المدفوع عن أيام الإجازة", money(s.paid, cur), { strong: true }],
      ["أجر الأيام نفسها لو عملت", money(s.normal, cur), { muted: true }],
      ["الخصم من راتبك بسبب الإجازة", money(s.deduction, cur)],
    ],
    "تفصيل الحساب"
  );
  if (s.exceeded) html += note(`تجاوزت 90 يوماً في سنة الخدمة. بعد استنفاد الإجازة يجوز لصاحب العمل إنهاء الخدمة إذا تعذّر رجوعك، على أن يدفع لك كل مستحقاتك.`, "warn");
  if (v.basis !== "basic") html += note(`حسبنا على الأجر الشامل لأن القانون يقول «بأجر كامل» والأجر في المادة 1 يشمل البدلات. بعض الشركات تحسبه على الأساسي؛ اختر «الأساسي فقط» لترى الفرق.`, "info");
  else html += note(`هذا الحساب على الأساسي كما تفعل بعض الشركات. مقتضى نص القانون الأجر الشامل، وهو أعلى.`, "info");
  return html;
});
