import { omanJobSecurity } from "../calc.js";
import { bind, money, table, big, note, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const m = (x) => money(x, cur);

bind(form, result, (v) => {
  if (!v.avgWage) return null;
  const r = omanJobSecurity({ avgWage: v.avgWage, reason: v.reason });
  if (!r.eligible) return big("لا يُستحق البدل", m(0), v.reason === "resignation" ? "الاستقالة الاختيارية لا تستحق البدل" : "الفصل التأديبي لا يستحق البدل") + note("البدل لمن انتهت خدمته لظروف خارجة عن إرادته. وما زال اشتراكك محفوظاً لاستحقاق لاحق.", "warn");
  let html = big("بدل الأمان الوظيفي", m(r.total), `على ${monthsAr(r.months)}`);
  html += table(
    [
      ...r.rows.map((x) => [`${monthsAr(x.months)} × ${Math.round(x.rate * 100)}%${x.raisedToMin ? " (رُفع إلى الحد الأدنى)" : ""}`, `${m(x.monthly)} × ${x.months} = ${m(x.amount)}`]),
      ["المجموع", m(r.total), { strong: true }],
    ],
    "تفصيل البدل"
  );
  html += table([["اشتراكك الشهري (0.5%)", m(r.contribEmployee)], ["اشتراك جهة العمل (0.5%)", m(r.contribEmployer)]], "الاشتراك في فرع الأمان الوظيفي");
  html += note("قاعدة السنة (60% ثم 50% ثم 40%) منقولة عن إعلان يناير 2026 كما نشرته الصحف، ونص القانون ستة أشهر بنسبة 60%. للعُمانيين فقط، وشرط مدة الاشتراك في اللائحة التنفيذية.", "info");
  return html;
});
