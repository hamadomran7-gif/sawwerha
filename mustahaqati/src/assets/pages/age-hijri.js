import { ageCalc, hijriParts, hijriAgeFromDays, HIJRI_MONTHS } from "../calc.js";
import { bind, num, table, big, note, duration } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");

function hijriText(h) {
  if (!h) return "غير متاح في هذا المتصفح";
  return `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} هـ`;
}

bind(form, result, (v) => {
  if (!v.birth) return null;
  const asOf = v.asof ? new Date(v.asof) : new Date();
  const a = ageCalc({ birth: v.birth, asOf });
  if (!a) return note("تاريخ الميلاد يجب أن يكون قبل تاريخ الحساب.", "bad");
  const hb = hijriParts(new Date(v.birth));
  const ht = hijriParts(asOf);
  const ha = hijriAgeFromDays(a.totalDays);
  let html = big("عمرك بالميلادي", duration(a), `بالهجري تقريباً: ${duration(ha)}`);
  html += table(
    [
      ["تاريخ ميلادك بالهجري (أم القرى)", hijriText(hb)],
      ["تاريخ الحساب بالهجري", hijriText(ht)],
      ["عدد الأيام التي عشتها", `${num(a.totalDays, 0)} يوماً`],
      ["بالأشهر الميلادية", `${num(a.years * 12 + a.months, 0)} شهراً`],
      ["بالأسابيع", `${num(Math.floor(a.totalDays / 7), 0)} أسبوعاً`],
      ["بقي على عيد ميلادك القادم", `${num(a.daysToBirthday, 0)} يوماً`],
    ],
    "تفاصيل"
  );
  return html;
});
