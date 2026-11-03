import { ksaGovSalary, rules } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const NAMES = { assistant: "معلم (مساعد معلم)", practicing: "معلم ممارس", advanced: "معلم متقدم", expert: "معلم خبير" };
const nextJanYear = () => new Date().getUTCFullYear() + 1;

const limit = () => {
  const R = rules.sa.teacherScale.ranks[form.rank.value];
  if (!R) return;
  const levels = Object.keys(R.levels).map(Number);
  const maxLevel = Math.max(...levels);
  [...form.level.options].forEach((o) => (o.disabled = Number(o.value) > maxLevel));
  if (Number(form.level.value) > maxLevel) form.level.value = String(maxLevel);
  const maxStep = R.levels[form.level.value].steps.length;
  [...form.step.options].forEach((o) => (o.disabled = Number(o.value) > maxStep));
  if (Number(form.step.value) > maxStep) form.step.value = String(maxStep);
};
form.rank.addEventListener("change", limit);
form.level.addEventListener("change", limit);

bind(form, result, (v) => {
  limit();
  const s = ksaGovSalary({ scale: "teacher", rank: form.rank.value, level: form.level.value, step: form.step.value, system: v.system, transport: v.transport });
  if (!s) return null;
  const pct = num(s.rate * 100, 2);
  let html = big("راتبك الصافي الشهري", money(s.net, cur), `${NAMES[form.rank.value]} · المستوى ${form.level.value} · الدرجة ${form.step.value}`);
  html += table(
    [
      ["الراتب الأساسي", money(s.basic, cur)],
      ["بدل النقل", money(s.transport, cur)],
      ["الإجمالي", money(s.gross, cur)],
      [`استقطاع التقاعد ${pct}% من الأساسي`, `− ${money(s.deduction, cur)}`],
      ["الصافي", money(s.net, cur), { strong: true }],
      ["موقعك في الرتبة", `الدرجة ${num(s.position, 0)} من ${num(s.totalSteps, 0)}`],
      s.atMax ? ["العلاوة القادمة", "لا علاوة: آخر درجة في الرتبة"] : [`أساسيك في يناير ${nextJanYear()} (+${money(s.increment, cur)})`, money(s.nextBasic, cur)],
    ],
    "تفصيل الراتب"
  );
  if (s.atMax) html += note("بلغت آخر درجة في رتبتك؛ الزيادة بعدها بالترقية إلى الرتبة التالية وفق ضوابطها والرخصة المهنية.", "info");
  if (v.system === "gosiNew") html += note(`من عُيّن لأول مرة من 3 يوليو 2024 يخضع لنظام التأمينات الجديد: الاستقطاع اليوم ${pct}% ويرتفع نصف نقطة كل يوليو حتى 11%.`, "info");
  html += note("الأرقام من البيان الصحفي لوزارة التعليم كما نقلته الصحف، وبدل النقل متداول لا نص رسمي عليه لكل رتبة؛ تحقق من مسير راتبك.", "info");
  return html;
});
