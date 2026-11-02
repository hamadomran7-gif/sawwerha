import { ksaNetSalary, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const p = (r) => `${numEn(Math.round(r * 10000) / 100)}%`;

bind(form, result, (v) => {
  if (v.basic === null || v.basic === undefined) return null;
  const isSaudi = v.status !== "expat";
  const newSubscriber = v.status === "saudi_new";
  const inKindHousing = v.inkind ? (v.basic || 0) / 6 : 0;
  const r = ksaNetSalary({ basic: v.basic || 0, housing: v.inkind ? 0 : v.housing || 0, inKindHousing, transport: v.transport || 0, other: v.other || 0, isSaudi, newSubscriber });
  const g = r.gosi;
  let html = big("Monthly net salary", m(r.net), `Gross ${m(r.gross)} − GOSI ${m(g.employeeAmount)}`);
  html += table(
    [
      ["Contributory wage (basic + housing)", m(g.base) + (g.capped ? " (after the cap)" : "")],
      isSaudi ? [`Pension branch ${p(g.pensionRate)}`, m(g.pensionEmployee)] : null,
      isSaudi ? [`SANED ${p(rules.sa.gosi.sanedRate)}`, m(g.sanedEmployee)] : null,
      [`Total employee deduction (${p(g.employeeRate)})`, m(g.employeeAmount), { strong: true }],
      [`Employer share (${p(g.employerRate)}) — not deducted from you`, m(g.employerAmount), { muted: true }],
      ["Annual net salary", m(r.annualNet), { muted: true }],
    ],
    "Deduction breakdown"
  );
  if (!isSaudi) html += note("Non-Saudi: no contribution is deducted from your salary. The employer pays 2% for occupational hazards.", "ok");
  if (newSubscriber) html += note(`Today's pension rate for new subscribers is ${p(g.pensionRate)}, rising by half a point each July until it reaches 11%.`, "info");
  if (g.capped) html += note(`Basic plus housing is above the contribution cap (SAR ${numEn(rules.sa.gosi.wageCeiling)}), so GOSI is calculated on the cap only.`, "info");
  return html;
});
