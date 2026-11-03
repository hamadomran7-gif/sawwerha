import { ksaMilitarySalary, rules } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const nextJanYear = () => new Date().getUTCFullYear() + 1;

bind(form, result, (v) => {
  const s = ksaMilitarySalary({ rank: v.rank, step: v.step });
  if (!s) return null;
  const R = rules.sa.militaryScale.enlisted[v.rank];
  let html = big("راتبك الصافي الشهري", money(s.net, cur), `${R.nameAr} · الدرجة ${s.step} من ${s.maxStep}`);
  html += table(
    [
      ["الراتب الأساسي", money(s.basic, cur)],
      ["بدل النقل", money(s.transport, cur)],
      ["الإجمالي", money(s.gross, cur)],
      ["استقطاع التقاعد العسكري 9% من الأساسي", `− ${money(s.deduction, cur)}`],
      ["الصافي", money(s.net, cur), { strong: true }],
      [`الصافي من يناير 2027 مع بدل ${num(s.allowance2027, 0)}`, money(s.net + s.allowance2027, cur)],
      s.nextBasic ? [`أساسيك بعد العلاوة القادمة (يناير ${nextJanYear()} عادةً، +${money(s.increment, cur)})`, money(s.nextBasic, cur)] : ["العلاوة القادمة", "لا علاوة: هذه آخر درجة في الرتبة"],
    ],
    "تفصيل الراتب"
  );
  html += note(`تدفع الدولة ما يقابل 13% من الأساسي (${money(s.state, cur)}) لمعاشك، فلا يُخصم منك.`, "info");
  html += note("الجدول متداول غير منشور رسمياً، ومتسق حسابياً، وأول مربوط الجندي فيه يطابق سلم 2010 بعد تثبيت غلاء المعيشة 15%. تحقق من مسير رواتبك.", "warn");
  html += note("بدل 500 ريال الشهري للضباط والأفراد من 1 يناير 2027 بالأمر الملكي (25 أكتوبر 2026)، ولا يدخل في الأساسي فلا يُستقطع منه للتقاعد. وعلاوات الخطر والعدوى والفنية والأمنية والطيران غير محسوبة.", "info");
  return html;
});
