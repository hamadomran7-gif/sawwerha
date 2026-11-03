import { pregnancyDueDate, maternityLeaveFromDue, MATERNITY_COUNTRIES } from "../calc.js";
import { bind, table, big, note, dateInputToday } from "../app.js";
import { plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const LABEL = { lmp: "First day of the last period", conception: "Conception (ovulation) date", ivf5: "Embryo transfer date", ivf3: "Embryo transfer date", due: "Due date set by your doctor" };
const NAME = { sa: "Saudi Arabia", ae: "UAE", qa: "Qatar", kw: "Kuwait", bh: "Bahrain", om: "Oman" };
const PAGE = {
  sa: "/en/saudi-maternity-leave-calculator/", ae: "/en/uae-maternity-leave-calculator/", qa: "/en/qatar-maternity-leave-calculator/",
  kw: "/en/kuwait-maternity-leave-calculator/", bh: "/en/bahrain-maternity-leave-calculator/", om: "/en/oman-maternity-leave-calculator/",
};
const EARLIEST = {
  sa: "Earliest start (4 weeks before the due date)",
  ae: "Earliest start (last day of the month before the birth month)",
  qa: "Earliest start (15 days before the due date)",
  kw: "Earliest start with the birth still inside the leave",
  bh: "Earliest start with the birth still inside the leave",
  om: "Earliest start (14 days before the due date)",
};
const TRI = ["", "First", "Second", "Third"];
const ga = (w, d) => (w <= 0 ? plural(d, "day") : d ? `${plural(w, "week")} and ${plural(d, "day")}` : plural(w, "week"));
const length = (c, days) => (c === "sa" ? `${plural(days / 7, "week")} (${plural(days, "day")})` : plural(days, "day"));

const sync = () => {
  form.querySelectorAll("[data-method]").forEach((el) => (el.hidden = el.dataset.method !== form.method.value));
  document.getElementById("date-label").textContent = LABEL[form.method.value] || LABEL.lmp;
};
form.method.addEventListener("change", sync);
if (!form.date.value) dateInputToday(form.date, -70);

bind(form, result, (v) => {
  sync();
  if (!v.date) return null;
  const p = pregnancyDueDate({ method: v.method, date: v.date, cycle: v.cycle || 28, today: new Date() });
  if (!p) return null;
  let html = big("Estimated due date", dateEn(p.edd), "40 weeks from the first day of the last period");

  const rows = [];
  if (p.stage === "during") {
    rows.push(["How far along you are today", ga(p.weeks, p.days), { strong: true }]);
    rows.push(["Trimester", TRI[p.trimester]]);
    if (p.daysLeft > 0) rows.push(["Time to the due date", `${plural(p.daysLeft, "day")} (${ga(Math.floor(p.daysLeft / 7), p.daysLeft % 7)})`]);
    else if (p.daysLeft === 0) rows.push(["Time to the due date", "Today is the due date"]);
    else rows.push(["Past the due date by", plural(-p.daysLeft, "day")]);
  }
  rows.push(["First day of the last period (equivalent)", dateEn(p.lmp), { muted: true }]);
  html += table(rows, "Your pregnancy today");
  if (p.stage === "before") html += note("The date you entered has not come yet, so the pregnancy has not started by this count. Check the date.", "warn");
  if (p.stage === "after") html += note("The count is past 42 weeks from the last period; check the date you entered.", "warn");

  const M = p.milestones;
  html += table(
    [
      ["End of the first trimester (13 weeks 6 days)", dateEn(M.t1End)],
      ["End of the second trimester (27 weeks 6 days)", dateEn(M.t2End)],
      ["Early term (37 weeks)", dateEn(M.earlyTerm)],
      ["Full term (39 weeks)", dateEn(M.fullTerm)],
      ["Due date (40 weeks)", dateEn(p.edd), { strong: true }],
      ["Post-term (42 weeks)", dateEn(M.postTerm)],
    ],
    "Pregnancy milestones"
  );

  const c = NAME[v.country] ? v.country : "sa";
  const L = maternityLeaveFromDue({ country: c, due: p.edd });
  html += table(
    [
      ["Leave length", length(c, L.days)],
      [EARLIEST[c], dateEn(L.earliest)],
      ["Back to work if leave starts on the due date", dateEn(L.backOnDue), { strong: true }],
      ["Back to work if leave starts at the earliest date", dateEn(L.backEarliest)],
      c === "sa" ? ["End of the 6 mandatory weeks after birth", dateEn(L.mandatoryUntil)] : null,
      c === "bh" && L.banUntil ? ["End of the 40-day ban on work after birth", dateEn(L.banUntil)] : null,
    ],
    `Maternity leave in ${NAME[c]}`
  );
  if (c === "qa") html += note("In Qatar the leave is due after one year of service with the employer.", "info");
  if (c === "bh") html += note("If leave starts more than 20 days before birth, part of the 40-day ban falls after the paid days end.", "info");
  html += note(`For pay, extensions and nursing hours: <a href="${PAGE[c]}">${NAME[c]} maternity leave calculator</a>.`, "info");

  const cmp = MATERNITY_COUNTRIES.map((k) => {
    const x = maternityLeaveFromDue({ country: k, due: p.edd });
    return `<tr${k === c ? ' class="sel"' : ""}><th scope="row"><a href="${PAGE[k]}">${NAME[k]}</a></th><td>${plural(x.days, "day")}</td><td>${dateEn(x.earliest)}</td><td>${dateEn(x.backOnDue)}</td></tr>`;
  });
  html += `<div class="table-scroll"><table class="shares"><caption>Maternity leave for your due date across the GCC</caption><thead><tr><th scope="col">Country</th><th scope="col">Length</th><th scope="col">Earliest start</th><th scope="col">Back to work if leave starts on the due date</th></tr></thead><tbody>${cmp.join("")}</tbody></table></div>`;
  html += note("The due date is an estimate and a first-trimester ultrasound is more accurate; if it differs, go by your doctor's date. Leave dates assume birth on the due date.", "info");
  return html;
});
