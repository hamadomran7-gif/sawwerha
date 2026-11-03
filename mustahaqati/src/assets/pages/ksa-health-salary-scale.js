import { ksaHealthSalary, rules } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const nextJanYear = () => new Date().getUTCFullYear() + 1;

bind(form, result, (v) => {
  const s = ksaHealthSalary({ cat: v.cat, level: v.level, step: v.step, system: v.system, transport: v.transport, infection: v.infection, danger: v.danger, supervision: v.supervision });
  if (!s) return null;
  const C = rules.sa.healthScale.cats[v.cat];
  const pct = num(s.rate * 100, 2);
  const ftName = ["consultantPhysician", "deputyPhysician", "residentPhysician", "consultantPharmacist", "seniorPharmacist", "pharmacist"].includes(v.cat) ? "بدل التفرغ" : "فرق ساعات العمل";
  let html = big("راتبك الصافي الشهري", money(s.net, cur), `${C.nameAr} · المستوى ${s.level} · الدرجة ${s.step}`);
  html += table(
    [
      ["الراتب الأساسي", money(s.basic, cur)],
      [`${ftName} ${num(s.ftPct * 100, 0)}% من أول مربوط المستوى (${num(s.first, 0)})`, money(s.fullTime, cur)],
      s.infection ? ["بدل الضرر أو العدوى", money(s.infection, cur)] : null,
      s.danger ? ["بدل الخطر", money(s.danger, cur)] : null,
      s.overCap ? [`بعد سقف 90% من أول المربوط (${num(s.cap)})`, money(s.capped, cur)] : null,
      ["بدل النقل", money(s.transport, cur)],
      s.supervision ? ["بدل الإشراف", money(s.supervision, cur)] : null,
      ["الإجمالي", money(s.gross, cur)],
      [`استقطاع التقاعد ${pct}% من الأساسي`, `− ${money(s.deduction, cur)}`],
      ["الصافي", money(s.net, cur), { strong: true }],
      [`الصافي من يناير 2027 مع بدل ${num(s.allowance2027, 0)}`, money(s.net + s.allowance2027, cur)],
      s.nextBasic
        ? [`أساسيك في 1 يناير ${nextJanYear()} (+${money(s.increment, cur)})`, money(s.nextBasic, cur)]
        : s.nextLevelFirst
          ? [`آخر درجة في المستوى؛ عند الترقية إلى المستوى ${s.level + 1}`, money(s.nextLevelFirst, cur)]
          : ["العلاوة القادمة", "آخر درجة في السلم"],
    ],
    "تفصيل الراتب"
  );
  if (s.overCap) html += note(`البدلات الخاضعة للسقف (${money(s.capItems, cur)}) تتجاوز 90% من أول مربوط المستوى، فخُفضت إلى ${money(s.capped, cur)}. النقل والإشراف خارج السقف.`, "warn");
  if (s.lastStep && s.nextLevelFirst) html += note("الانتقال إلى المستوى التالي بعد سنة على الأقل في نهاية المستوى وتقديرين أخيرين «جيد جداً» فأعلى (المادة 5 من لائحة الوظائف الصحية).", "info");
  if (s.topOfScale && v.cat === "consultantPhysician") html += note("الاستشاري في نهاية المستوى السابع يأخذ كل سنة مبلغاً يساوي علاوة المستوى (1,110) مكافأةً لا تغيّر أساسه.", "info");
  if (v.system === "gosiNew") html += note(`من عُيّن لأول مرة من 3 يوليو 2024 يخضع لنظام التأمينات الجديد: الاستقطاع اليوم ${pct}% ويرتفع نصف نقطة كل يوليو حتى 11%.`, "info");
  html += note("بدل 500 ريال الشهري بالأمر الملكي (25 أكتوبر 2026) للموظفين على سلالم الخدمة المدنية، من يناير 2027 بحسب ما نُقل، ولا يدخل في الأساسي فلا يُستقطع منه. ولا يشمل المنتقلين إلى شركة الصحة القابضة.", "info");
  html += note("بدلات الندرة والتميز والمناطق النائية والتدريب والمستشفيات النفسية والطب الشرعي غير محسوبة، لأنها تُصرف بقرارات فردية. والأرقام من سلم 1432هـ الساري؛ تحقق من مسيرك.", "info");
  return html;
});
