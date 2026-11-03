import { uaeSpecialLeave, rules } from "../calc.js";
import { bind, table, big, note, dateInputToday } from "../app.js";
import { plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
if (!form.date.value) dateInputToday(form.date);

const DATE_LABEL = { spouse: "Date of death", relative: "Date of death", parental: "Date of birth", study: "Study leave start" };
const TITLE = { spouse: "Bereavement leave for a spouse", relative: "Bereavement leave", parental: "Parental leave", study: "Study leave" };

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
  let html = big(TITLE[r.type], isWork ? plural(r.workingDays, "working day") : plural(r.days, "day"), isWork ? `Paid, spanning ${plural(r.calendarDays, "day")} with weekends` : "Paid, from the date of death");
  html += table([
    ["First day", dateEn(r.start)],
    ["Last day", dateEn(r.end), { strong: true }],
    ["Back to work", dateEn(r.back)],
    r.type === "parental" ? ["Deadline to finish the leave", dateEn(r.deadline)] : null,
  ]);
  if (r.type === "parental") {
    if (r.beforeBirth) html += note("Parental leave starts on or after the date of birth.", "warn");
    else if (!r.withinWindow) html += note(`The leave runs past the six-month window after the birth (ending ${dateEn(r.deadline)}). Start earlier or split it before that date.`, "warn");
    html += note("Either the father or the mother may take it, in one block or separately. It is on top of the mother's maternity leave.", "info");
  }
  if (r.type === "study") {
    if (!r.eligible) html += note("Study leave is due after at least two years of service with the employer, and yours is shorter.", "warn");
    html += note(`${L.studyWorkingDays} working days a year to sit exams, for employees studying at an accredited institution in the UAE.`, "info");
  }
  html += note(isWork ? "The calculator does not skip public holidays; if one falls in the period, the last day moves by the same number of days." : "Counted as consecutive days from the date of death; the employer may ask for proof.", "info");
  return html;
});
