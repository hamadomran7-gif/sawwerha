import { uaeNetSalary, kuwaitNetSalary, qatarNetSalary, bahrainNetSalary, omanNetSalary } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cc = form.dataset.country;
const CUR = { ae: "AED", kw: "KWD", qa: "QAR", bh: "BHD", om: "OMR" }[cc];
const m = (x) => moneyEn(x, CUR);
const show = (sel, on) => form.querySelectorAll(sel).forEach((el) => (el.hidden = !on));
const L = {
  pension: "Pension contribution", basic: "Basic insurance (up to 1,500)", supplementary: "Supplementary insurance (1,500–2,750)", increase: "Pension increase", reward: "Financial reward",
  unemployment: "Unemployment insurance", injury: "Work injury", eos: "End-of-service (with the SIO)", maternity: "Maternity insurance", sick: "Sick leave insurance", jobSecurity: "Job security",
};

function compute(v) {
  const national = v.national !== "no";
  show("[data-national]", national);
  show("[data-expat]", !national);
  if (cc === "ae") { show("[data-nafis]", national && v.sector === "private"); return uaeNetSalary({ national, fund: v.fund, sector: v.sector, basic: v.basic, housing: v.housing, other: v.other, nafis: v.nafis === "yes" }); }
  if (cc === "kw") return kuwaitNetSalary({ national, sector: v.sector, salary: v.salary });
  if (cc === "qa") return qatarNetSalary({ national, basic: v.basic, social: v.social, housing: v.housing, other: v.other });
  if (cc === "bh") { show("[data-private]", national && v.sector !== "government"); return bahrainNetSalary({ national, sector: v.sector, basic: v.basic, allowances: v.allowances, year: v.year, over3: v.over3 === "yes" }); }
  if (cc === "om") return omanNetSalary({ national, gross: v.gross, basic: v.basic, today: new Date() });
  return null;
}

function notes(r, v) {
  const out = [];
  if (cc === "ae") {
    if (!r.national) out.push([`No pension contribution is deducted from expats; the employer pays the end-of-service gratuity when the contract ends. The unemployment insurance premium of ${m(r.iloePremium)} a month is usually paid outside payroll.`, "info"]);
    else {
      if (r.nafis) out.push([`Nafis's Eshtirak programme pays your share (${m(r.nafis)}) because your salary is between 6,000 and 20,000, so nothing is deducted from you.`, "info"]);
      if (r.raisedToMin) out.push(["The contribution salary is below the minimum, so the minimum was used.", "info"]);
      if (r.capped) out.push(["The contribution salary was capped at the fund's maximum.", "info"]);
      if (v.fund === "gpssaNew" && v.sector === "private" && r.base >= 20000) out.push(["At 20,000 or more the government does not cover 2.5% for the employer, which pays the full 15%.", "info"]);
      if (v.fund === "adpfCurrent") out.push(["The Abu Dhabi government also pays 6% a year from the general budget for existing members.", "info"]);
      if (v.fund === "sharjah") out.push(["Housing allowance is not part of the contribution salary in the Sharjah fund, so we left it out.", "info"]);
      if (v.sector === "government") out.push(["In government the contribution salary is basic plus specific allowances (cost of living, social and housing); enter only those that count.", "info"]);
    }
  }
  if (cc === "kw") {
    if (!r.national) out.push(["Expats are not insured with PIFSS, so net pay equals gross pay.", "info"]);
    else {
      if (r.raisedToMin) out.push(["The minimum insurable wage in the private sector is KWD 230, so that was used.", "info"]);
      if (r.capped) out.push(["No contributions are due on pay above KWD 2,750.", "info"]);
      out.push(["The financial reward contribution stops after 18 years of contributions from 2015, unemployment insurance applies to the private and oil sectors only, and the treasury's share does not affect your net pay.", "info"]);
    }
  }
  if (cc === "qa") {
    if (!r.national) out.push(["Expats are outside Qatar's social insurance scheme, so nothing is deducted; mandatory health insurance is on the employer.", "info"]);
    else {
      if (r.housingCapped) out.push(["Housing allowance counts towards the contribution salary up to QAR 6,000.", "info"]);
      if (r.capped) out.push(["The contribution salary was capped at QAR 100,000.", "info"]);
      out.push(["Housing provided in kind counts as if paid in cash, so enter its value as housing. Other allowances do not count.", "info"]);
    }
  }
  if (cc === "bh") {
    if (!r.national) out.push([`Since March 2024 your employer has paid the SIO an end-of-service contribution of ${(r.eosPct * 100).toFixed(1)}% of your wage (4.2% in the first 3 years, then 8.4%), plus 3% for work injury; 1% is deducted from you for unemployment insurance.`, "info"]);
    else if (r.government) out.push(["In government contributions are on basic salary: 7% from you and 20% from the employer (3% of it for work injury), plus 1% for unemployment.", "info"]);
    else {
      out.push([`The employer's pension share is ${(r.employerPct * 100).toFixed(0)}% in ${v.year || 2026}, rising 1% every January to 17% in 2028. The Labour Fund pays the employer's unemployment share.`, "info"]);
      if (r.allowancesCapped) out.push(["Fixed allowances count towards insurable pay up to 100% of basic.", "info"]);
      if (r.capped) out.push(["Insurable pay is capped at BHD 4,000.", "info"]);
    }
  }
  if (cc === "om") {
    if (!r.national) out.push([`Nothing is deducted from expats. A savings scheme of 9% of basic paid by the employer starts by 19 July 2027 at the latest${r.futureSavings ? ` (about ${m(r.futureSavings)} a month)` : ""}, and work injury cover at 1% by 19 July 2028.`, "info"]);
    else {
      if (r.capped) out.push(["Pension and work injury are capped at OMR 3,000; maternity, sick leave and job security apply to the full wage.", "info"]);
      out.push(["Insurable pay is the gross wage with all allowances. Job security applies to Omanis only.", "info"]);
    }
  }
  return out;
}

bind(form, result, (v) => {
  const r = compute(v);
  if (!r || !r.gross) return null;
  let html = big("Your net salary", m(r.net), r.employee ? `after ${m(r.employee)} of contributions` : "no contribution is deducted from your pay");
  const ee = r.rows.filter((x) => x.employee);
  const er = r.rows.filter((x) => x.employer);
  if (ee.length) html += table([...ee.map((x) => [L[x.id], m(x.employee)]), ["Total deducted from you", m(r.employee), { strong: true }]], "Deducted from your salary");
  if (er.length) html += table([...er.map((x) => [L[x.id], m(x.employer)]), ["Total employer share", m(r.employer), { strong: true }]], "Paid by your employer on top");
  html += table([["Gross salary", m(r.gross)], r.base ? ["Contribution salary", m(r.base)] : null, ["Net salary", m(r.net), { strong: true }], ["Your cost to the employer", m(r.cost)], r.gov ? ["Government share", m(r.gov)] : null], "Summary");
  return html + notes(r, v).map(([t, k]) => note(t, k)).join("");
});
