import { bahrainGratuity, serviceDuration } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, durationEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "BHD");

bind(form, result, (v) => {
  if (!v.wage || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, 0);
  if (!d) return note("The last working day must be after the start date.", "bad");
  const b = bahrainGratuity({ wage: v.wage, start: v.start, end: v.end });
  let html = big("Your end-of-service gratuity", m(b.total), `Service: ${durationEn(d)} = ${numEn(b.months)} months' wage`);
  html += table(
    [
      [`Paid by the employer: service before 1 March 2024 (${numEn(b.employerYears)} years)`, m(b.employerAmount)],
      [`Paid by the Social Insurance Organization: service since 1 March 2024 (${numEn(b.sioYears)} years)`, m(b.sioAmount)],
      ["Total", m(b.total), { strong: true }],
    ],
    "Who pays?"
  );
  html += note("Half a month for each of the first 3 years, then a month, on the last wage (basic plus social allowance), with no reduction for resignation. The SIO part is claimed through its website after your service ends and cannot exceed the contributions paid for you.", "ok");
  return html;
});
