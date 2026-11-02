import { uaeSpecialLeave, WEEKDAYS_AR, rules } from "../calc.js";
import { bind, table, big, note, arDate, daysAr, dateInputToday, countAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
if (!form.date.value) dateInputToday(form.date);

const workDaysAr = (n) => countAr(n, "يوم عمل واحد", "يوما عمل", "أيام عمل", "يوم عمل", "يوم عمل");
const wd = (iso) => WEEKDAYS_AR[new Date(`${iso}T00:00:00Z`).getUTCDay()];
const full = (iso) => `${wd(iso)} ${arDate(iso)}`;
const DATE_LABEL = { spouse: "تاريخ الوفاة", relative: "تاريخ الوفاة", parental: "تاريخ الولادة", study: "بداية إجازة الدراسة" };
const TITLE = { spouse: "إجازة الحداد على الزوج", relative: "إجازة الحداد", parental: "إجازة الوالدين", study: "إجازة الدراسة" };

const toggle = () => {
  const t = form.type.value;
  form.querySelectorAll("[data-for]").forEach((el) => (el.hidden = !el.dataset.for.split(" ").includes(t)));
  form.querySelector("[data-label]").textContent = DATE_LABEL[t];
};
form.type.addEventListener("change", toggle);

bind(form, result, (v) => {
  toggle();
  const r = uaeSpecialLeave({ type: v.type, date: v.date, start: v.start || null, weekend: v.weekend, years: v.years });
  if (!r) return null;
  const L = rules.ae.specialLeave;
  const isWork = r.type === "parental" || r.type === "study";
  let html = big(TITLE[r.type], isWork ? workDaysAr(r.workingDays) : daysAr(r.days), isWork ? `بأجر، تمتد ${daysAr(r.calendarDays)} مع العطلة الأسبوعية` : "بأجر، من تاريخ الوفاة");
  html += table([
    ["أول يوم", full(r.start)],
    ["آخر يوم", full(r.end), { strong: true }],
    ["العودة للعمل", full(r.back)],
    r.type === "parental" ? ["آخر موعد لإنهاء الإجازة", full(r.deadline)] : null,
  ]);
  if (r.type === "parental") {
    if (r.beforeBirth) html += note("تبدأ إجازة الوالدين من تاريخ الولادة أو بعده.", "warn");
    else if (!r.withinWindow) html += note(`تتجاوز الإجازة مهلة الأشهر الستة من الولادة (آخرها ${arDate(r.deadline)}). ابدأها مبكراً أو قسّمها قبل هذا التاريخ.`, "warn");
    html += note("تحق للأب أو الأم، ويجوز أخذها متصلة أو متفرقة. وهي إضافة إلى إجازة الوضع للأم.", "info");
  }
  if (r.type === "study") {
    if (!r.eligible) html += note(`تُستحق إجازة الدراسة بعد سنتين على الأقل من الخدمة لدى صاحب العمل، ومدتك أقل من ذلك.`, "warn");
    html += note(`${L.studyWorkingDays} أيام عمل في السنة لأداء الامتحانات لمن يدرس في مؤسسة تعليمية معتمدة في الدولة.`, "info");
  }
  html += note(isWork ? "لا تستبعد الحاسبة العطل الرسمية، فإن وقعت عطلة في المدة تأخر آخر يوم بقدرها." : "تُحسب أياماً متصلة من تاريخ الوفاة، ولصاحب العمل طلب ما يثبت الواقعة.", "info");
  return html;
});
