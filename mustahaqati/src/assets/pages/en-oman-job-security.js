import { omanJobSecurity } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "OMR");
const mo = (n) => plural(n, "month");

bind(form, result, (v) => {
  if (!v.avgWage) return null;
  const r = omanJobSecurity({ avgWage: v.avgWage, reason: v.reason });
  if (!r.eligible) return big("No allowance due", m(0), v.reason === "resignation" ? "Voluntary resignation does not qualify" : "Disciplinary dismissal does not qualify") + note("The allowance is for those whose employment ended for reasons beyond their control. Your contributions remain on record for a later claim.", "warn");
  let html = big("Job security allowance", m(r.total), `over ${mo(r.months)}`);
  html += table(
    [
      ...r.rows.map((x) => [`${mo(x.months)} × ${Math.round(x.rate * 100)}%${x.raisedToMin ? " (raised to the minimum)" : ""}`, `${m(x.monthly)} × ${x.months} = ${m(x.amount)}`]),
      ["Total", m(r.total), { strong: true }],
    ],
    "Allowance breakdown"
  );
  html += table([["Your monthly contribution (0.5%)", m(r.contribEmployee)], ["Employer contribution (0.5%)", m(r.contribEmployer)]], "Job security branch contributions");
  html += note("The one-year rule (60%, then 50%, then 40%) follows the January 2026 announcement as reported by the press; the text of the law gives six months at 60%. Omanis only, and the contribution period requirement is in the executive regulation.", "info");
  return html;
});
