import { gosiContribution, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const p = (r) => `${numEn(Math.round(r * 10000) / 100)}%`;
const G = rules.sa.gosi;

bind(form, result, (v) => {
  if (v.basic === null || v.basic === undefined) return null;
  const isSaudi = v.status !== "expat";
  const newSubscriber = v.status === "saudi_new";
  const g = gosiContribution({ basic: v.basic || 0, housing: v.housing || 0, isSaudi, newSubscriber });
  let html = big("Total monthly contribution (employee + employer)", m(g.employeeAmount + g.employerAmount), `On a contributory wage of ${m(g.base)}${g.capped ? " after the cap" : ""}`);
  html += table(
    [
      isSaudi ? [`Pension — employee ${p(g.pensionRate)}`, m(g.pensionEmployee)] : null,
      isSaudi ? [`SANED — employee ${p(G.sanedRate)}`, m(g.sanedEmployee)] : null,
      [`Employee share (${p(g.employeeRate)})`, m(g.employeeAmount), { strong: true }],
      isSaudi ? [`Pension — employer ${p(g.pensionRate)}`, m(g.base * g.pensionRate)] : null,
      [`Occupational hazards — employer ${p(G.hazardsRate)}`, m(g.hazardsEmployer)],
      isSaudi ? [`SANED — employer ${p(G.sanedRate)}`, m(g.base * G.sanedRate)] : null,
      [`Employer share (${p(g.employerRate)})`, m(g.employerAmount), { strong: true }],
      ["Employee share per year", m(g.employeeAmount * 12), { muted: true }],
      ["Employer share per year", m(g.employerAmount * 12), { muted: true }],
    ],
    "Contribution breakdown"
  );
  if (!isSaudi) html += note("Non-Saudi: only the 2% occupational hazards contribution, paid by the employer. Nothing is deducted from the employee.", "ok");
  if (newSubscriber) html += note("New subscribers since 3 July 2024 pay a graded pension rate that rises by half a point each July until it reaches 11%. The rate shown is today's.", "info");
  if (g.capped) html += note(`Contributions are calculated on the contributory wage cap (SAR ${numEn(G.wageCeiling)}).`, "info");
  return html;
});
