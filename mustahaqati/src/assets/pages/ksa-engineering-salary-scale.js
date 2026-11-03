import { ksaEngineeringSalary, rules } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const E = rules.sa.engineeringScale;
const nextJanYear = () => new Date().getUTCFullYear() + 1;
const sync = () => {
  const C = E.cats[form.cat.value] || E.cats.engineer;
  const n = Object.keys(C.levels).length;
  [...form.level.options].forEach((o) => (o.disabled = Number(o.value) > n));
  if (Number(form.level.value) > n) form.level.value = String(n);
  const L = C.levels[form.level.value];
  [...form.step.options].forEach((o) => (o.textContent = `${o.value} — ${num(L.steps[Number(o.value) - 1], 0)}`));
};
form.cat.addEventListener("change", sync);
form.level.addEventListener("change", sync);

bind(form, result, (v) => {
  sync();
  const s = ksaEngineeringSalary({ cat: form.cat.value, level: form.level.value, step: form.step.value, system: v.system, project: v.project });
  if (!s) return null;
  const C = E.cats[s.cat];
  const pct = num(Math.round(s.rate * 1000) / 10, 1).replace(/\.0$/, "");
  let html = big("راتبك الصافي الشهري", money(s.net, cur), `${C.nameAr} · المستوى ${s.level} · الدرجة ${s.step}`);
  html += table(
    [
      ["الراتب الأساسي", money(s.basic, cur)],
      ["بدل النقل", money(s.transport, cur)],
      s.project ? ["بدل إدارة المشاريع", money(s.project, cur)] : null,
      ["الإجمالي", money(s.gross, cur)],
      [`استقطاع التقاعد ${pct}% من الأساسي`, `− ${money(s.deduction, cur)}`],
      ["الصافي", money(s.net, cur), { strong: true }],
      [`الصافي من يناير 2027 مع بدل ${num(s.allowance2027, 0)}`, money(s.net + s.allowance2027, cur)],
      s.nextBasic
        ? [`أساسيك في 1 يناير ${nextJanYear()} (+${num(s.increment, 0)})`, money(s.nextBasic, cur)]
        : s.nextLevelFirst
          ? [`آخر درجة في المستوى؛ عند الانتقال إلى المستوى ${s.level + 1}`, money(s.nextLevelFirst, cur)]
          : ["العلاوة القادمة", "آخر درجة في الفئة: لا علاوة حتى الترقية"],
      ["المرتبة المعادلة في الخدمة المدنية", num(s.civilRank, 0)],
    ],
    "تفصيل الراتب"
  );
  if (s.lastStep && s.nextLevelFirst) html += note("الانتقال إلى المستوى التالي بعد سنة مالية على الأقل في آخر درجة وتقويم جيد جداً فأعلى في آخر سنتين (المادة 8).", "info");
  if (s.topOfCategory && s.cat !== "consultant") html += note(`آخر مستوى في فئة ${C.nameAr}. الترقية إلى الفئة التالية بالخبرة (${num(E.experience[E.order[E.order.indexOf(s.cat) + 1]], 0)} سنة بعد البكالوريوس) وتصنيف الهيئة السعودية للمهندسين.`, "info");
  if (v.system === "gosiNew") html += note(`من عُيّن لأول مرة من 3 يوليو 2024 يخضع لنظام التأمينات الجديد: الاستقطاع اليوم ${pct}% ويرتفع نصف نقطة كل يوليو حتى 11%.`, "info");
  if (s.project) html += note("بدل إدارة المشاريع بقرار من الوزير المختص، بحد 30% من مهندسي الجهة، ولا يُجمع مع بدل آخر للغرض نفسه.", "info");
  html += note("بدل 500 ريال الشهري من يناير 2027 لموظفي سلالم الخدمة المدنية، ولا يدخل في الأساسي فلا يُستقطع منه.", "info");
  html += note("الأرقام من جدول نشرته الصحافة عن أم القرى (27/12/2024) ومتسق مع اللائحة. البدلات الأخرى تتبع المرتبة المعادلة؛ راجع مسير راتبك.", "info");
  return html;
});
