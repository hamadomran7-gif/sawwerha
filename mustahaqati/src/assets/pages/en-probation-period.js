import { probationEnd } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const aeOnly = form.querySelectorAll("[data-ae]");
const saOnly = form.querySelectorAll("[data-sa]");

bind(form, result, (v) => {
  const ae = v.country === "ae";
  aeOnly.forEach((el) => (el.hidden = !ae));
  saOnly.forEach((el) => (el.hidden = ae));
  if (!v.start) return null;
  const p = probationEnd({ country: v.country, start: v.start, months: v.months, days: v.days, excluded: v.excluded });
  const len = ae ? plural(p.lengthLabel, "month") : plural(p.lengthLabel, "day");
  let html = big("Last day of probation", dateEn(p.lastDay), `${len}${!ae && p.excluded ? ` + ${plural(p.excluded, "excluded day")}` : ""}`);
  html += table(
    [
      ["Start date", dateEn(v.start)],
      ["Probation length", len],
      !ae && p.excluded ? ["Days excluded", plural(p.excluded, "day")] : null,
      ["Last day of probation", dateEn(p.lastDay), { strong: true }],
      ["First day after probation", dateEn(p.firstAfter)],
    ],
    "Dates"
  );
  if (p.capped) html += note(ae ? "Probation in the UAE may not exceed 6 months from the start date, so we used 6 months." : "Probation in Saudi Arabia may not exceed 180 days in total, so we used 180 days.", "warn");
  if (ae) html += note("During probation: the employer may end the contract with 14 days' written notice; the employee may move to another UAE employer with one month's notice, or leave the UAE with 14 days' notice. There is no paid sick leave during probation.", "info");
  else html += note("Probation and its length must be stated in the contract. Either party may end the contract during probation without an end-of-service award or compensation. An employee may not be put on probation twice with the same employer, unless agreed in writing for a different job or six months after the previous relationship ended. The executive regulations set which leave is excluded; enter those days in the field above.", "info");
  return html;
});
