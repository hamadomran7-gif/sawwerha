import { probationEnd, WEEKDAYS_AR } from "../calc.js";
import { bind, table, big, note, arDate, daysAr, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const aeOnly = form.querySelectorAll("[data-ae]");
const saOnly = form.querySelectorAll("[data-sa]");
const wd = (iso) => WEEKDAYS_AR[new Date(`${iso}T00:00:00Z`).getUTCDay()];

bind(form, result, (v) => {
  const ae = v.country === "ae";
  aeOnly.forEach((el) => (el.hidden = !ae));
  saOnly.forEach((el) => (el.hidden = ae));
  if (!v.start) return null;
  const p = probationEnd({ country: v.country, start: v.start, months: v.months, days: v.days, excluded: v.excluded });
  let html = big("آخر يوم في فترة التجربة", arDate(p.lastDay), `${wd(p.lastDay)} · ${ae ? monthsAr(p.lengthLabel) : daysAr(p.lengthLabel)}${!ae && p.excluded ? ` + ${daysAr(p.excluded)} مستثناة` : ""}`);
  html += table(
    [
      ["بداية العمل", arDate(v.start)],
      ["مدة التجربة", ae ? monthsAr(p.lengthLabel) : daysAr(p.lengthLabel)],
      !ae && p.excluded ? ["أيام مستثناة من الحساب", daysAr(p.excluded)] : null,
      ["آخر يوم في التجربة", arDate(p.lastDay), { strong: true }],
      ["أول يوم بعد التجربة", arDate(p.firstAfter)],
    ],
    "التواريخ"
  );
  if (p.capped) html += note(ae ? "لا تزيد فترة التجربة في الإمارات على 6 أشهر من تاريخ المباشرة، فاعتمدنا 6 أشهر." : "لا يتجاوز مجموع فترة التجربة في السعودية 180 يوماً في جميع الأحوال، فاعتمدنا 180 يوماً.", "warn");
  if (ae) html += note("خلال التجربة: لصاحب العمل الإنهاء بإخطار كتابي قبل 14 يوماً، وللعامل الانتقال إلى صاحب عمل آخر في الدولة بإخطار قبل شهر، أو مغادرة الدولة بإخطار قبل 14 يوماً. لا إجازة مرضية مدفوعة خلال التجربة.", "info");
  else html += note("يجب النص على التجربة ومدتها صراحةً في العقد. ولكل طرف إنهاء العقد خلالها دون مكافأة أو تعويض. ولا يُوضع العامل تحت التجربة أكثر من مرة لدى صاحب العمل نفسه إلا باتفاق مكتوب لمهنة مختلفة أو بعد 6 أشهر من انتهاء العلاقة السابقة. أما الإجازات التي لا تُحسب من التجربة فتحددها اللائحة التنفيذية، فأدخل عددها في الحقل المخصص.", "info");
  return html;
});
