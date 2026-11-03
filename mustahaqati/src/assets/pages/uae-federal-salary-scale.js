import { uaeFederalSalary } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  const s = uaeFederalSalary({ grade: v.grade, married: v.married !== "no", children: v.children, scheme: v.scheme, qualification: v.qualification, increments: v.increments });
  if (!s) return null;
  const pct = num(s.rate * 100, 0);
  let html = big("راتبك الصافي الشهري", money(s.net, cur), `الدرجة ${s.grade} · ${v.married === "no" ? "أعزب" : "متزوج"}`);
  html += table(
    [
      [s.increments ? `الأساسي + ${num(s.increments, 0)} × ${num(s.annual, 0)} (تقديري)` : "الأساسي", money(s.basic, cur)],
      [`بدل السكن (${v.married === "no" ? "أعزب" : "متزوج"})`, money(s.housing, cur)],
      ["غلاء المعيشة", money(s.costOfLiving, cur)],
      ["العلاوة الاجتماعية", money(s.social, cur)],
      ["المواصلات شاملة منحة الرئيس", money(s.transport, cur)],
      s.children ? [`علاوة الأبناء: ${num(s.children / 600, 0)} × 600`, money(s.children, cur)] : null,
      s.qualification ? ["علاوة المؤهل", money(s.qualification, cur)] : null,
      ["الإجمالي", money(s.total, cur), { strong: true }],
      ["أساس الاشتراك (بلا المواصلات والمؤهل)", money(s.pensionBase, cur)],
      [`استقطاع المعاش ${pct}%`, `− ${money(s.contribution, cur)}`],
      ["الصافي", money(s.net, cur), { strong: true }],
      ["حصة الجهة 15%", money(s.employer, cur)],
    ],
    "تفصيل الراتب"
  );
  const scaleTotal = s.basic + s.housing + s.costOfLiving + s.social + s.transport;
  html += note(`مكافأة الأداء السنوية دفعة واحدة: حتى ${money(Math.min(scaleTotal * 2, 100000), cur)} لتقييم 5، وحتى ${money(Math.min(scaleTotal * 1.5, 100000), cur)} لتقييم 4، على إجمالي الجدول (${money(scaleTotal, cur)})، بسقف 100,000 درهم. وقد يُستبعد السكن من أساسها.`, "info");
  if (s.qualification) html += note("علاوة المؤهل من اللائحة السابقة وما نقلته الصحافة عن لائحة 2023، ولم ندخلها في أساس الاشتراك لأنها ليست في قائمة الهيئة العامة للمعاشات.", "info");
  if (s.increments) html += note("العلاوة الدورية تقديرية: أضفنا عمود «العلاوة السنوية» من الجدول لكل علاوة، وأبقينا البدلات ثابتة. وتُستحق في نظام إنجازاتي للمستويات 2 إلى 5 فقط.", "warn");
  html += note("الأرقام من جدول قرار مجلس الوزراء 23/2012 (ترجمة الهيئة الاتحادية)، ولم نجد جدولاً أحدث حتى نوفمبر 2026. قد تُصرف بدلات وظيفية أخرى؛ راجع كشف راتبك.", "info");
  return html;
});
