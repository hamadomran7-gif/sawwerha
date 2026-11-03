import { qatarPension, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "QAR");
const pc = (x, d = 1) => `${numEn(Math.round(x * 100 * 10 ** d) / 10 ** d)}%`;
const REASON = { age: "reaching retirement age", resign: "resignation", other: "service ending for other reasons", disciplinary: "disciplinary dismissal" };

bind(form, result, (v) => {
  const priv = v.sector === "private";
  form.querySelectorAll("[data-private]").forEach((el) => (el.hidden = !priv));
  form.querySelectorAll("[data-early]").forEach((el) => (el.hidden = v.reason === "age" || v.legacy === "no"));
  form.querySelector("[data-salary]").textContent = priv ? "Average contribution salary, last 3 years (QAR)" : "Last contribution salary (QAR)";
  if (v.ageYears === null || v.years === null || !v.salary) return null;
  const Q = rules.qa.pension;
  const r = qatarPension({
    sector: v.sector, gender: v.gender, reason: v.reason, ageYears: v.ageYears, ageMonths: v.ageMonths || 0, years: v.years, months: v.months || 0,
    actualYears: v.actualYears, salary: v.salary, firstYearSalary: v.firstYearSalary, legacy: v.legacy !== "no", birthYear: v.birthYear,
  });
  const ref = v.gender === "f" ? Q.refAgeFemale : Q.refAgeMale;
  let html;
  if (r.eligible) {
    html = big(r.payAge ? `Your monthly pension (paid from age ${r.payAge})` : "Your monthly pension", m(r.pension), `${pc(r.pension / r.S)} of the pension salary · ${REASON[v.reason]}`);
    html += table(
      [
        [priv ? "Pension salary (3-year average)" : "Pension salary (last contribution salary)", `${m(r.S)}${r.avgCapped ? " (130% cap)" : ""}`],
        ["Contribution period used", `${plural(r.Y, "year")}${r.legacyApplied ? ` → settled on ${plural(r.settleYears, "year")} (Article 82)` : ""}`],
        [`Rate: ${numEn(r.settleYears)} ÷ ${Q.divisor}`, `${pc(r.pctRaw)}${r.pctRaw > 1 ? " → 100% (cap)" : ""}`],
        ["Pension before reduction", m(r.gross)],
        r.reduction ? [`Reduction: ${plural(ref - r.age, "year")} below ${ref} × ${pc(v.reason === "disciplinary" ? Q.reductionDisciplinary : Q.reductionResign)}`, `${pc(r.reduction)} (−${m(r.gross * r.reduction)})`] : null,
        r.minApplied ? ["Raised to the government minimum", m(Q.minPensionGov)] : null,
        ["Monthly pension", m(r.pension), { strong: true }],
      ],
      "How it is calculated"
    );
    if (r.transitional) html += note(`The Decision 11/2024 table was applied for those born in ${Math.floor(v.birthYear)}: age ${r.th.age}, ${r.th.actual} years of actual service and ${r.th.contrib} years of contribution at least.`, "info");
    if (r.payAge) html += note(`You are under ${r.payAge} when service ends, so the pension is paid only after you reach that age and apply to the authority (Article 24). The reduction uses your age when service ends.`, "warn");
    if (v.reason !== "age" && v.sector === "gov") html += note(`The QAR ${numEn(Q.minPensionGov)} minimum does not apply on resignation, dismissal or service ending for other reasons (Article 30).`, "info");
    if (priv && v.reason === "age" && r.pension < Q.minPensionGov) html += note(`The QAR ${numEn(Q.minPensionGov)} minimum is set for government pensioners; the Cabinet may extend it to the private sector (Article 30).`, "info");
  } else {
    const need = v.reason === "age" ? `${Q.minYears} years of contribution including ${Q.minActualYears} actual` : `${r.th.contrib} years of contribution including ${r.th.actual} actual`;
    html = big(r.refundOnly ? "Refund of your contributions" : "Lump-sum compensation (no pension)", r.refundOnly ? m(r.refund) : m(r.lump), `Pension conditions not met: ${need} needed`);
    html += table(
      r.refundOnly
        ? [["Contribution period", plural(r.totalMonths, "month")], ["Entitlement", "Only the 7% contributions you paid, as the period is one year or less"], ["Estimate", m(r.refund), { strong: true }]]
        : [
            ["Pension salary", m(r.S)],
            ["Contribution period used", plural(r.Y, "year")],
            [`${numEn(r.S)} × ${numEn(r.Y)}`, m(r.lump), { strong: true }],
          ],
      "Article 42 and the executive regulations"
    );
    if (!r.refundOnly) html += note(`The compensation is paid in cases such as reaching 50 or disability, capped at 150% of your own paid contributions (about ${m(Q.lumpCapOfEmployeeShare * r.refund)} assuming a steady salary). The employer's contributions stay with the fund.`, "info");
  }
  if (r.salaryCapped) html += note(`The contribution salary is capped at QAR ${numEn(Q.salaryCap)} (Article 11).`, "info");
  html += table(
    [
      [`Your share ${pc(Q.employeeRate, 0)}`, m(r.employee)],
      [`Employer's share ${pc(Q.employerRate, 0)}`, m(r.employer)],
    ],
    "Monthly contributions on this salary"
  );
  html += note("Housing allowance counts towards the pension after 15 years of contributions on it, and the bonus for service beyond 30 years is set by the regulations. The General Retirement and Social Insurance Authority sets the official pension.", "info");
  return html;
});
