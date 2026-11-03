import { ksaOfficerSalary, rules } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const O = rules.sa.militaryScale.officers;
const nextJanYear = () => new Date().getUTCFullYear() + 1;
const sync = () => {
  const R = O.ranks[form.rank.value] || O.ranks.mulazim;
  const n = R.steps.length;
  [...form.step.options].forEach((o) => {
    const i = Number(o.value);
    o.disabled = i > n;
    o.textContent = i <= n ? `${i} — ${num(R.steps[i - 1], 0)}` : String(i);
  });
  if (Number(form.step.value) > n) form.step.value = String(n);
};
form.rank.addEventListener("change", sync);

bind(form, result, (v) => {
  sync();
  const s = ksaOfficerSalary({ rank: form.rank.value, step: form.step.value });
  if (!s) return null;
  const R = O.ranks[s.rank];
  let html = big("راتبك الصافي الشهري (تقديري)", money(s.net, cur), `${R.nameAr} · الدرجة ${s.step} من ${s.maxStep}`);
  html += table(
    [
      ["الراتب الأساسي", money(s.basic, cur)],
      s.car ? ["بدل النقل", "سيارة حكومية أو 2,000 حتى تأمينها"] : ["بدل النقل", money(s.transport, cur)],
      ["الإجمالي", money(s.gross, cur)],
      ["استقطاع التقاعد 9% من الأساسي", `− ${money(s.deduction, cur)}`],
      ["الصافي", money(s.net, cur), { strong: true }],
      [`الصافي من يناير 2027 مع بدل ${num(s.allowance2027, 0)}`, money(s.net + s.allowance2027, cur)],
      s.nextBasic ? [`أساسيك بعد العلاوة في يناير ${nextJanYear()} (+${num(s.increment, 0)})`, money(s.nextBasic, cur)] : ["العلاوة القادمة", "آخر درجة في الرتبة: لا علاوة حتى الترقية"],
      s.promotion ? [`عند الترقية إلى ${O.ranks[s.promotion.rank].nameAr}: الدرجة ${s.promotion.step} (+${num(s.promotion.raise, 0)})`, money(s.promotion.basic, cur)] : null,
      ["حصة الدولة في التقاعد 13%", money(s.state, cur)],
    ],
    "تفصيل الراتب"
  );
  if (s.car) html += note("اللواء يعامل في بدل النقل معاملة المرتبة 15 المدنية: سيارة حكومية، أو 2,000 ريال شهرياً حتى تأمينها. لم نضفه إلى الإجمالي.", "info");
  if (s.rank === "naqib" || s.rank === "raid") html += note("علاوة النقيب 495 حتى الدرجة 7 ثم 265، وعلاوة الرائد 265، وهو شكل موروث من ملحق سلم 1431هـ نفسه، لذلك يتقارب أعلى النقيب وأدنى الرائد.", "info");
  html += note(`الجدول تقديري: متداول وغير منشور رسمياً، ويطابق ملحق 1431هـ × 1.15 بفارق قد يبلغ نحو ${num(O.maxDeviation, 0)} ريالاً في بعض الدرجات. بدلات الطبيعة والخطر والمناطق غير محسوبة؛ راجع مسير راتبك.`, "warn");
  return html;
});
