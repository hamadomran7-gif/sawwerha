import { omanIncomeTax, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const m3 = (x) => `OMR ${f3.format(x)}`;
const pc = (x) => `${numEn(Math.round(x * 10000) / 100)}%`;

bind(form, result, (v) => {
  if (v.monthlySalary === null) return null;
  const T = rules.om.incomeTax;
  const r = omanIncomeTax({
    omani: v.omani === "yes", monthlySalary: v.monthlySalary, months: v.months ?? 12, gratuity: v.gratuity, pension: v.pension,
    rent: v.rent, rentActualCost: v.rentActualCost, selfEmp: v.selfEmp, other: v.other, exemptIncome: v.exemptIncome,
    pensionContrib: v.pensionContrib, education: v.education, health: v.health, donations: v.donations, loanInterest: v.loanInterest,
  });
  let html = big("Annual income tax", m3(r.tax), r.tax ? `${pc(r.effective)} of your gross income · about ${m3(r.tax / 12)} a month` : r.filingRequired ? "Your income is above the threshold, but deductions remove the taxable amount" : "Your gross income does not exceed OMR 42,000");
  html += table(
    [
      ["Gross income", m3(r.G)],
      [`Amount above the threshold (${numEn(T.threshold)})`, m3(r.over)],
      r.rentCost ? ["Rental costs", m3(r.rentCost)] : null,
      r.selfCost ? ["Self-employment costs", m3(r.selfCost)] : null,
      r.contrib ? [`Pension contributions${r.contrib === r.autoContrib && r.autoContrib ? " (7.5%, capped at 3,000 a month)" : ""}`, m3(r.contrib)] : null,
      r.exemptions - r.contrib ? ["Other exemptions (education, health, donations, loan interest, exempt income)", m3(r.exemptions - r.contrib)] : null,
      ["Taxable income", m3(r.taxable), { strong: true }],
      ["Tax (5%)", m3(r.tax), { strong: true }],
    ],
    "How it is calculated"
  );
  if (r.donationsCapped) html += note(`Zakat and donations are exempt up to 5% of gross income, ${m3(r.donationsAllowed)} here.`, "info");
  if (r.filingRequired) {
    html += table(
      [
        ["Return", "Required within 6 months of the year end (first deadline 30 June 2029)"],
        r.withholding ? ["Estimated employer withholding for the year", `${m3(r.withholding)} (about ${m3(r.monthlyWithholding)} a month)`] : null,
        r.withholding && Math.abs(r.balance) > 0.0005 ? [r.balance > 0 ? "Balance to pay with your return" : "Refund through your return", m3(Math.abs(r.balance))] : null,
      ],
      "Filing and payment"
    );
  }
  if (v.resident === "no") html += note("Non-residents are taxed only on income earned in Oman, so enter that alone. Non-salary income paid by Omani entities may have the full 5% withheld.", "warn");
  else html += note("Residents are taxed on worldwide income, so include income from outside Oman too (new residents' foreign income is exempt for 18 months, once).", "info");
  html += note("This is an estimate; the executive regulations detailing the exemptions and monthly withholding have not been published yet. The tax starts with income for 2028.", "info");
  return html;
});
