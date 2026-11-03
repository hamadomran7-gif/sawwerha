import { ksaGovContractorAward, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "SAR");
const yrs = (n) => plural(n, "year");
const C = rules.sa.govContractor;

bind(form, result, (v) => {
  form.querySelectorAll("[data-abolished]").forEach((el) => (el.hidden = v.reason !== "abolished"));
  if (!v.salary) return null;
  const r = ksaGovContractorAward({ salary: v.salary, years: v.years, months: v.months, reason: v.reason, remainingMonths: v.remainingMonths });
  if (r.forfeited) return big("No award", m(0), "Disciplinary dismissal and Article 19 cases forfeit the award and compensation") + note("Article 19 cases include refusing a transfer, not returning within 15 days after leave without a valid reason, a material breach of the contract, dishonourable conduct, or a prison sentence of more than a year.", "warn");
  if (r.treatedAsSaudi) return big("Treated as a Saudi employee", "—", "Death or permanent disability caused by work") + note("The contract says the contractor is then treated as a Saudi employee, that is under the civil service work injury rules, not the half-month award. On death, the employer pays to repatriate the body and return the family.", "info");
  if (v.reason === "abolished") {
    let html = big("Compensation for job abolition", m(r.compensation), `${plural(Math.min(C.abolishedMonths, Number(v.remainingMonths) || 0), "month")}' salary or the remaining contract, whichever is less`);
    html += table([["Compensation (Art. 18(b))", m(r.compensation), { strong: true }], r.eligible ? ["Half-month award if it were added", m(r.award), { muted: true }] : null], "Details");
    return html + note("The contract does not say whether the half-month award is added to the compensation for job abolition, so we show it for comparison only.", "warn");
  }
  if (!r.eligible) return big("No award", m(0), `${yrs(r.fullYears)} completed; ${yrs(C.minYears)} of continuous service are required`) + note(`The award is due after at least ${yrs(C.minYears)} of continuous service under the contract and is calculated on full years only.`, "info");
  let html = big("End-of-service award", m(r.award), `${yrs(r.fullYears)} completed × half a month's salary`);
  html += table(
    [
      ["Full years counted", yrs(r.fullYears)],
      [`0.5 × ${m(v.salary)} × ${r.fullYears}`, m(r.raw)],
      r.capped ? [`After the ${m(C.cap)} cap`, m(r.award)] : null,
      ["Award", m(r.award), { strong: true }],
    ],
    "How it is calculated"
  );
  if (v.reason === "resign") html += note("Resignation does not reduce a government contractor's award, unlike under the Labour Law.", "ok");
  html += note("The calculation uses the monthly contract salary without housing and transport allowances. Whether the cost-of-living allowance counts, and whether unused leave is paid at the end of the contract, are not settled.", "info");
  return html;
});
