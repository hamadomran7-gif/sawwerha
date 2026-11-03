import { kuwaitCivilSalary, rules } from "../calc.js";
import { bind, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const kwd = (n) => (n === null || n === undefined || isNaN(n) ? "—" : `${f3.format(n)} د.ك`);
const limit = () => {
  const G = rules.kw.civilScale.grades.find((g) => g.id === form.grade.value);
  if (!G) return;
  [...form.step.options].forEach((o) => (o.disabled = Number(o.value) > G.steps));
  if (Number(form.step.value) > G.steps) form.step.value = String(G.steps);
};
form.grade.addEventListener("change", limit);

bind(form, result, (v) => {
  limit();
  const s = kuwaitCivilSalary({ grade: form.grade.value, step: form.step.value, married: v.married === "yes", children: v.children, special: v.special });
  if (!s) return null;
  let html = big("راتبك الصافي الشهري", kwd(s.net), `${s.nameAr} · الخطوة ${s.step} من ${s.maxStep}`);
  html += table(
    [
      ["الأساسي", kwd(s.basic)],
      [`العلاوة الاجتماعية (${v.married === "yes" ? "متزوج" : "أعزب"})`, kwd(s.social)],
      s.children ? [`علاوة الأولاد: ${num(s.children / 50, 0)} × 50`, kwd(s.children)] : null,
      ["غلاء المعيشة", kwd(s.costOfLiving)],
      s.special ? ["المكافأة الخاصة", kwd(s.special)] : null,
      ["الإجمالي", kwd(s.gross), { strong: true }],
      [`استقطاع التأمينات على ${num(s.base, 0)} (الأساسي والاجتماعية والأولاد)`, `− ${kwd(s.deduction)}`],
      ["الصافي", kwd(s.net), { strong: true }],
      s.nextBasic ? [`أساسيك بعد العلاوة القادمة (+${num(s.increment, 0)})`, kwd(s.nextBasic)] : ["العلاوة القادمة", "آخر المربوط: لا علاوة حتى الترقية"],
    ],
    "تفصيل الراتب"
  );
  if (Number(v.children) > 7) html += note("علاوة الأولاد بحد أقصى 7 أولاد.", "info");
  html += note("العلاوة الدورية في أول يناير أو أول يوليو التالي لمضي سنة. وغلاء المعيشة 120 لا يدخل وعاء التأمينات، والمكافأة الخاصة إن أضفتها لم نُدخلها في الوعاء لأن ذلك غير معروف.", "info");
  html += note("الجدول متداول في موقع متخصص ومتسق مع مصادر صحفية رسمية جزئياً، وليس نصاً رسمياً فتحناه. قد تضيف جهتك بدلات أو كادراً خاصاً؛ راجع كشف راتبك.", "warn");
  return html;
});
