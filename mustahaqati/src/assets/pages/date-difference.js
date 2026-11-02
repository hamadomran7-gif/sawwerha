import { dateDiff, hijriParts, HIJRI_MONTHS } from "../calc.js";
import { bind, table, big, note, arDate, daysAr, weeksAr, duration } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const hText = (iso) => {
  const h = hijriParts(new Date(`${iso}T00:00:00Z`));
  return h ? `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} هـ` : "—";
};
const WK = { "fri-sat": "الجمعة والسبت", "sat-sun": "السبت والأحد", fri: "الجمعة فقط", none: "بلا عطلة" };

bind(form, result, (v) => {
  if (!v.start || !v.end) return null;
  const d = dateDiff({ start: v.start, end: v.end, inclusive: !!v.inclusive, weekend: v.weekend });
  if (!d) return null;
  let html = big("المدة بين التاريخين", daysAr(d.total), d.total ? duration(d) : "التاريخان متطابقان");
  html += table(
    [
      ["من", `${d.sign > 0 ? d.startWeekday : d.endWeekday} ${arDate(d.sign > 0 ? v.start : v.end)} · ${hText(d.sign > 0 ? v.start : v.end)}`],
      ["إلى", `${d.sign > 0 ? d.endWeekday : d.startWeekday} ${arDate(d.sign > 0 ? v.end : v.start)} · ${hText(d.sign > 0 ? v.end : v.start)}`],
      ["عدد الأيام", daysAr(d.total), { strong: true }],
      ["بالأسابيع", d.restDays ? `${weeksAr(d.weeks)} و${daysAr(d.restDays)}` : weeksAr(d.weeks)],
      ["بالسنوات والأشهر والأيام", d.total ? duration(d) : "—"],
      [`أيام العمل (العطلة: ${WK[v.weekend] || ""})`, daysAr(d.workDays)],
    ],
    v.inclusive ? "مع احتساب يوم النهاية" : "دون احتساب يوم النهاية"
  );
  if (d.sign < 0) html += note("تاريخ النهاية قبل تاريخ البداية، فحسبنا المدة بينهما بالعكس.", "info");
  html += note("أيام العمل تستبعد عطلة نهاية الأسبوع فقط، ولا تستبعد العطل الرسمية والأعياد.", "info");
  return html;
});
