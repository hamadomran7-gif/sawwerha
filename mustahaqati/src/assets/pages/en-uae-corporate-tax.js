import { uaeCorporateTax, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");

bind(form, result, (v) => {
  const C = rules.ae.corporateTax;
  if (v.person === "qfzp") {
    return note("A Qualifying Free Zone Person pays 0% on qualifying income and 9% on non-qualifying income, cannot use Small Business Relief, and must meet special conditions (including a de minimis limit on non-qualifying income) that this calculator does not model. Please consult a tax adviser.", "warn");
  }
  if (v.revenue === null || v.income === null) return null;
  const r = uaeCorporateTax({ taxableIncome: v.income, revenue: v.revenue, losses: v.losses || 0, person: v.person, mne: !!v.mne, periodEndYear: Number(v.year), electSbr: !!v.sbr });
  if (r.status === "outOfScope") {
    return big("Not subject to corporate tax", m(0), `Your business turnover does not exceed ${m(C.naturalPersonTurnover)} a year`) +
      note("An individual is taxable only if the business's turnover exceeds AED 1 million a year. Salary and personal investment income are outside the scope anyway.", "ok");
  }
  let html = r.status === "sbr"
    ? big("Tax due with Small Business Relief", m(0), `Instead of ${m(r.taxWithoutSbr)} without the relief`)
    : big("Corporate tax due", m(r.tax), `Effective rate ${numEn(Math.round(r.effective * 10000) / 100)}% of taxable income`);
  html += table(
    [
      ["Taxable income", m(Number(v.income) || 0)],
      r.lossUsed ? [`Losses offset (capped at ${numEn(C.lossOffsetCap * 100)}% of income)`, m(r.lossUsed)] : null,
      r.lossUsed ? ["Income after loss relief", m(r.taxableAfterLoss)] : null,
      ["0% band", m(Math.min(r.taxableAfterLoss, C.zeroBand))],
      [`Taxed at ${numEn(C.rate * 100)}%`, m(Math.max(0, r.taxableAfterLoss - C.zeroBand))],
      ["Tax without Small Business Relief", m(r.taxWithoutSbr), { muted: r.status === "sbr" }],
      ["Tax due", m(r.tax), { strong: true }],
      (Number(v.losses) || 0) > 0 ? ["Losses left to carry forward", m(r.lossLeft), { muted: true }] : null,
    ],
    "Breakdown"
  );
  if (r.status === "sbr") html += note("You elected Small Business Relief: you are treated as having no taxable income for this period. The period's losses are not carried forward, and you must still register and file.", "ok");
  else if (r.sbrEligible && !v.sbr) html += note("You qualify for Small Business Relief but did not elect it. Electing brings the tax to zero, at the cost of not carrying forward this period's losses.", "info");
  else if (!r.sbrEligible) {
    const why = (Number(v.revenue) || 0) > C.sbrRevenueMax ? `revenue exceeds ${m(C.sbrRevenueMax)}` : v.mne ? "member of a large multinational group" : Number(v.year) > C.sbrLastPeriodEndYear ? `the relief covers tax periods ending by 31 December ${C.sbrLastPeriodEndYear}` : "";
    if (why) html += note(`Small Business Relief does not apply: ${why}.`, "info");
  }
  if ((Number(v.income) || 0) < 0) html += note("Your income is negative: no tax is due, and the loss carries forward subject to the rules.", "info");
  html += note("This is a guide: it does not cover adjustments to net profit, other reliefs or tax group rules.", "info");
  return html;
});
