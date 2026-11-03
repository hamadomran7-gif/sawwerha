import { qatarCivilSalary, rules } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const S = rules.qa.civilScale;
const stepFields = [...form.querySelectorAll("[data-steps]")];
const RATING = { exceptional: "أداء استثنائي", exceeds: "يتجاوز التوقعات", meets: "يحقق التوقعات", below: "دون التوقعات", weak: "أداء ضعيف" };
const limit = () => {
  const fixed = S.fixed[form.grade.value] !== undefined;
  stepFields.forEach((el) => (el.hidden = fixed));
  const G = S.grades.find((g) => g.id === form.grade.value);
  if (!G) return;
  const n = G.steps.length;
  [...form.step.options].forEach((o) => {
    const i = Number(o.value);
    o.disabled = i > n;
    o.textContent = i <= n ? `${i} — ${num(G.steps[i - 1], 0)}` : String(i);
  });
  if (Number(form.step.value) > n) form.step.value = String(n);
};
form.grade.addEventListener("change", limit);

bind(form, result, (v) => {
  limit();
  const s = qatarCivilSalary({ grade: form.grade.value, step: form.step.value, basic: v.basic, married: v.married === "yes", transport: v.transport, rating: v.rating });
  if (!s) return null;
  const G = S.grades.find((g) => g.id === s.grade);
  const fixed = !G;
  const custom = !fixed && v.basic !== null && v.basic > 0;
  const title = fixed ? form.grade.options[form.grade.selectedIndex].text : `الدرجة ${G.nameAr}`;
  const sub = fixed ? `${title} · راتب ثابت` : custom ? `${title} · أساسي مُدخل` : `${title} · الخطوة ${num(Number(form.step.value), 0)} من ${num(G.steps.length, 0)}`;
  const status = v.married === "yes" ? "متزوج" : "أعزب";
  let next;
  if (fixed) next = ["العلاوة الدورية", "راتب ثابت للوظيفة"];
  else if (!s.pct) next = ["العلاوة القادمة", "لا علاوة للأداء الضعيف"];
  else if (s.atMax) next = [`مكافأة شهرية بدل العلاوة (${RATING[v.rating]})`, money(s.raise, cur)];
  else next = [`أساسيك في 1 يناير القادم (${RATING[v.rating]}: +${num(Math.min(s.raise, s.max - s.basic), 0)})`, money(s.nextBasic, cur)];
  let html = big("راتبك الصافي الشهري", money(s.net, cur), sub);
  html += table(
    [
      ["الراتب الأساسي", money(s.basic, cur)],
      [`العلاوة الاجتماعية (${status})`, money(s.social, cur)],
      [`بدل السكن (${status})`, money(s.housing, cur)],
      s.transport ? ["بدل التنقل", money(s.transport, cur)] : null,
      ["الإجمالي", money(s.gross, cur), { strong: true }],
      [`استقطاع التقاعد 7% على ${num(s.base, 0)} (الأساسي والاجتماعية والسكن)`, `− ${money(s.deduction, cur)}`],
      ["الصافي", money(s.net, cur), { strong: true }],
      next,
    ],
    "تفصيل الراتب"
  );
  if (custom && v.basic > s.max) html += note(`أساسيك المُدخل أعلى من نهاية مربوط الدرجة (${money(s.max, cur)})، فاعتمدنا النهاية. راجع درجتك.`, "warn");
  if (custom && G && v.basic < G.start) html += note(`أساسيك المُدخل أقل من بداية الدرجة (${money(G.start, cur)}). راجع درجتك.`, "warn");
  if (s.overflowBonus > 0 && s.pct) html += note(`علاوتك (${money(s.raise, cur)}) تتجاوز نهاية المربوط، فيصير أساسيك ${money(s.max, cur)} ويُصرف الباقي ${money(s.overflowBonus, cur)} مكافأة خلال السنة، ثم مكافأة شهرية بقدر العلاوة حسب تقييمك.`, "info");
  if (!s.transport) html += note("لم نُدخل بدل التنقل (1,000 إلى 2,000 ريال حسب الدرجة). أضف ما في كشفك؛ وهو خارج وعاء التقاعد.", "info");
  if (fixed) html += note("راتب الوكيل والوكيل المساعد ثابت في الجدول، وافترضنا العلاوة الاجتماعية وبدل السكن بالفئة العليا.", "info");
  if (v.married === "yes") html += note("منذ أكتوبر 2025 تُصرف العلاوة الاجتماعية بفئة متزوج لكلا الزوجين القطريين، أما بدل السكن فبفئة متزوج للأعلى استحقاقاً والآخر بفئة أعزب.", "info");
  html += note("حافز الزواج (12,000 ريال سنوياً لكل زوج بشروط) وحوافز الأداء (راتبان أو راتب أساسي) تُصرف خارج الراتب الشهري، فلم نضفها.", "info");
  html += note("الجدول من ترجمة غير رسمية للقانون 15/2016 (ثقة متوسطة)، والبدلات ونسب العلاوة من القانون 25/2025 والقرار 34/2025. قد تختلف درجة تعيينك أو بدلاتك؛ راجع كشف راتبك.", "warn");
  return html;
});
