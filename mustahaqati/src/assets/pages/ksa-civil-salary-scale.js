import { ksaGovSalary, rules } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const nextJanYear = () => new Date().getUTCFullYear() + 1;

const limitSteps = () => {
  const R = rules.sa.civilScale.ranks[form.rank.value];
  if (!R) return;
  [...form.step.options].forEach((o) => (o.disabled = Number(o.value) > R.maxStep));
  if (Number(form.step.value) > R.maxStep) form.step.value = String(R.maxStep);
};
form.rank.addEventListener("change", limitSteps);

bind(form, result, (v) => {
  limitSteps();
  const s = ksaGovSalary({ scale: "civil", rank: form.rank.value, step: form.step.value, system: v.system });
  if (!s) return null;
  const C = rules.sa.civilScale;
  const pct = num(s.rate * 100, 2);
  let html = big("راتبك الصافي الشهري", money(s.net, cur), `المرتبة ${form.rank.value} · الدرجة ${form.step.value} من ${s.totalSteps}`);
  html += table(
    [
      ["الراتب الأساسي", money(s.basic, cur)],
      s.car ? ["بدل النقل", "سيارة حكومية (المادة 44)"] : ["بدل النقل (المادة 36)", money(s.transport, cur)],
      ["الإجمالي", money(s.gross, cur)],
      [`استقطاع التقاعد ${pct}% من الأساسي`, `− ${money(s.deduction, cur)}`],
      ["الصافي", money(s.net, cur), { strong: true }],
      s.atMax ? ["العلاوة القادمة", "لا علاوة: هذه آخر درجة في المرتبة"] : [`أساسيك في 1 يناير ${nextJanYear()} (+${money(s.increment, cur)})`, money(s.nextBasic, cur)],
    ],
    "تفصيل الراتب"
  );
  if (s.car) html += note(`المرتبة 15 لا يُصرف لها بدل نقل؛ تؤمَّن لها سيارة حكومية، ويُصرف ${money(C.rank15CarAllowance, cur)} شهرياً حتى تأمينها بحد ${C.rank15CarMaxMonths} أشهر.`, "info");
  if (v.system === "gosiNew") html += note(`من عُيّن لأول مرة من 3 يوليو 2024 يخضع لنظام التأمينات الجديد: الاستقطاع اليوم ${pct}% ويرتفع نصف نقطة كل يوليو حتى 11%. حسبناه على الأساسي.`, "info");
  html += note("لا يدخل بدل النقل في الاستقطاع، ولا يوجد بدل سكن عام لموظفي الخدمة المدنية. البدلات الفئوية (طبيعة العمل والخطر والمناطق النائية) غير محسوبة.", "info");
  html += note("الأرقام بحسب السلم المتداول منذ 1432هـ؛ تحقق من مسير رواتبك. المهندسون على سلم الوظائف الهندسية منذ 31 ديسمبر 2024.", "info");
  return html;
});
