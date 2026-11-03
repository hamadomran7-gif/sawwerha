import { omanPension, omanOldAge, ageCalc, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "OMR");
const pc = (x, d = 1) => `${numEn(Math.round(x * 100 * 10 ** d) / 10 ** d)}%`;
const r2 = (x) => numEn(Math.round(x * 100) / 100);
const yrs = (x) => `${r2(x)} years`;
const addYears = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + n);
  return d.toISOString().slice(0, 10);
};
const fullAgeDate = (birth, gender) => {
  const gap = gender === "f" ? rules.om.pension.womanGap : 0;
  for (let a = 45; a <= 70; a++) {
    const d = addYears(birth, a);
    if (a >= omanOldAge(d) - gap) return { a, d };
  }
  return null;
};

bind(form, result, (v) => {
  if (!v.birth || !v.retire || v.avgWage === null) return null;
  if (!ageCalc({ birth: v.birth, asOf: v.retire })) return null;
  const O = rules.om.pension;
  const args = {
    gender: v.gender, birth: v.birth, retire: v.retire, priorYears: v.priorYears || 0, finalSalary: v.finalSalary || 0,
    postYears: v.postYears, avgWage: v.avgWage, growth: v.growth === null ? null : v.growth / 100, guarantee: v.guarantee || 0,
  };
  const r = omanPension(args);
  if (!r) return null;
  let html;
  const parts = [
    r.post ? [`Service since 2024: 2% × ${r2(r.avgFV)} × ${r2(r.post)}`, m(r.partA)] : null,
    r.post ? ["Average future value of your wages", `${m(r.avgFV)} (factor ${numEn(Math.round(r.avgFactor * 10000) / 10000)})`, { muted: true }] : null,
    r.prior ? [`Earlier service: 2% × ${r2(r.revalued)} × ${r2(r.prior)}`, m(r.partB)] : null,
    r.prior ? ["Revalued final salary", `${m(r.revalued)} (factor ${numEn(Math.round(r.priorFactor * 10000) / 10000)})`, { muted: true }] : null,
    ["Pension before any reduction", m(r.gross)],
  ];

  if (r.status === "deferred") {
    const f = fullAgeDate(v.birth, v.gender);
    const later = f ? omanPension({ ...args, retire: f.d, postYears: r.post }) : null;
    html = big("No pension is due on this date", later ? m(later.pension) : "—", f ? `Estimated pension on reaching ${f.a} (${dateEn(f.d)}) without further work` : "");
    html += table(
      [
        ["Your age when service ends", yrs(r.ageExact)],
        ["Unreduced retirement age", `${r.noReductionAge}`],
        ["Your actual service", yrs(r.service)],
        ["Needed for early retirement", `${O.earlyMinServiceYears} years of service and age ${r.noReductionAge - O.earlyMaxYears}, or ${r.anyAgeYears} years at any age`],
      ],
      "Your position on the retirement date"
    );
    html += note("There is no lump sum or refund of contributions for anyone who does not receive a pension (Article 84), but your rights are not lost when service is interrupted, and the pension is paid on reaching the age.", "info");
  } else {
    html = big(r.status === "early" ? "Your estimated monthly early pension" : "Your estimated monthly pension", m(r.pension), `Age ${yrs(r.ageExact)} · service ${yrs(r.service)}${r.wage ? ` · ${pc(r.pension / r.wage)} of your wage` : ""}`);
    html += table(
      [
        ...parts,
        r.status === "early" ? [`Early reduction: ${r2(r.yearsEarly)} years before ${r.noReductionAge}`, `${pc(r.reduction, 2)} (−${m(r.gross * r.reduction)})`] : null,
        r.guaranteeApplied ? ["Cash guarantee (higher than calculated)", m(r.pension)] : null,
        ["Monthly pension", m(r.pension), { strong: true }],
      ],
      "How it is calculated (Article 73)"
    );
    if (r.status === "early") html += note("The reductions (5% a year for the first five years, then 1%) follow Article 78 as published in translation; the calculator pro-rates part years by month as an estimate.", "info");
  }
  if (r.transitional) html += note(`You have ${r2(r.prior)} years of earlier service. Anyone with 20 years of actual service before the law was issued may retire early under their previous system's conditions (Article 77), and may have a cash guarantee higher than the figure above (Article 74). Check your Fund statement.`, "warn");
  if (r.oldAge > O.oldAge) html += note(`Old age on your retirement date is ${r.oldAge}, assuming it rises by one year every seven years from 2024 (Article 6), with the first rise in 2031 by inference.`, "warn");
  if (r.wageCapped) html += note(`Wages count up to OMR ${numEn(O.wageCap)} a month (Article 52).`, "info");
  html += table(
    [
      [`Your share ${pc(O.employeeRate)}`, m(r.employee)],
      [`Employer's share ${pc(O.employerRate, 0)}`, m(r.employer)],
    ],
    "Monthly old-age branch contributions on your average wage"
  );
  html += note("The pension is due together with the end of service (decision R/12/2026). The result is an estimate because the detailed revaluation method and wage growth after 2025 are not published.", "info");
  return html;
});
