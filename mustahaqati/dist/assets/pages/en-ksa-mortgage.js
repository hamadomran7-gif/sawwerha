import { ksaMortgage, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m$ = (n) => moneyEn(n, "SAR");
const BIND = { dbr: "your salary and the debt burden ratio", ltv: "the loan-to-value ratio", need: "the price after support" };
const p0 = (x) => `${numEn(Math.round(x * 10000) / 100)}%`;

bind(form, result, (v) => {
  if (!v.salary || !v.price) return null;
  const H = rules.sa.homeFinance;
  const maxAge = v.maxAge || H.ageAtMaturityDefault;
  const supportOk = v.citizen !== "no" && v.firstHome !== "no";
  const supportNote = v.support !== "none" && !supportOk ? note("Housing support is for a Saudi citizen's first home, so it was not applied.", "warn") : "";
  const m = ksaMortgage({
    salary: v.salary,
    otherIncome: v.otherIncome,
    personal: v.personal,
    otherDebts: v.otherDebts,
    retiree: v.retiree === "yes",
    price: v.price,
    apr: v.apr ?? H.aprIndicativeDefault,
    years: v.years || H.tenorMaxYearsDefault,
    age: v.age || 35,
    maxAge,
    tenorCap: Number(v.tenorCap) || H.tenorMaxYearsDefault,
    citizen: v.citizen !== "no",
    firstHome: v.firstHome !== "no",
    lender: v.lender,
    support: supportOk ? v.support : "none",
    redfReduced: v.redfReduced,
    capMode: v.capMode,
  });

  if (!m.years) return big("Maximum home finance", m$(0), "No term available") + note(`You have reached the bank's maximum age at the last instalment (${maxAge}). Some banks accept up to 77; adjust the limit in the advanced options.`, "warn");
  if (m.maxInstallment <= 0) return big("Maximum home finance", m$(0), "Your commitments use up the DBR") + note(`The overall DBR cap is ${p0(m.cap)} of your income (${m$(m.cap * m.income)}), and your current commitments reach or exceed it. Pay some of them off first.`, "warn") + (m.salaryCapOk ? "" : note(`Your personal finance instalments exceed ${p0(m.salaryCapPct)} of your salary, the regulatory limit for ${v.retiree === "yes" ? "retirees" : "employees"}.`, "warn"));

  let html = big("Your maximum home finance", m$(m.loan), `Instalment ${m$(m.installment)} a month for ${plural(m.years, "year")}`);
  html += table(
    [
      [`By salary: maximum instalment SAR ${numEn(Math.round(m.maxInstallment))} (${p0(m.cap)} of income less commitments)`, m$(m.loanDbr)],
      [`By property value: ${p0(m.ltv)} of the price`, m$(m.loanLtv)],
      m.dpSupport ? ["Needed after down payment support", m$(m.need)] : null,
      ["Finance available (the lowest)", m$(m.loan), { strong: true }],
      ["What limits your finance", BIND[m.binding]],
      [`Highest price your salary supports (with a ${p0(1 - m.ltvBasic)} down payment)`, m$(m.maxPrice)],
    ],
    "Finance limits"
  );
  html += table(
    [
      ["Monthly instalment", m$(m.installment)],
      ["Total DBR after the finance", p0(m.dbrAfter)],
      ["Total repaid", m$(m.totalPaid)],
      ["Of which profit", m$(m.profit)],
    ],
    "Instalment and cost"
  );
  html += table(
    [
      ["Down payment from your own funds", m$(m.downPayment)],
      m.dpSupport ? ["Down payment support (non-repayable)", m$(m.dpSupport)] : null,
      ["Admin fee", m$(m.adminFee)],
      ["VAT on the fee", m$(m.adminFeeVat)],
      ["Cash needed at signing", m$(m.cashAtSigning), { strong: true }],
      m.rett ? ["5% real estate transaction tax, if agreed that you pay it", m$(m.rett)] : ["Real estate transaction tax", `0 (the state covers SAR ${numEn(m.rettExempt)} on a first home)`],
    ],
    "At purchase"
  );
  if (!m.salaryCapOk) html += note(`Your personal finance instalments exceed ${p0(m.salaryCapPct)} of your salary, the regulatory limit for ${v.retiree === "yes" ? "retirees" : "employees"}; the bank may require you to repay part of them.`, "warn");
  if (!m.nonMortgageOk) html += note("Your non-mortgage commitments exceed 45% of your income, a regulatory limit for incomes under SAR 25,000; the bank may decline until you reduce them.", "warn");
  if (m.limitedBy === "age") html += note(`The term was shortened to ${plural(m.years, "year")} so your age does not exceed ${maxAge} at the last instalment. Some banks accept up to 75 or 77.`, "info");
  if (m.limitedBy === "tenor") html += note(`The term was shortened to ${plural(m.years, "year")}, the maximum you chose. Some banks offer 30 years.`, "info");
  if (m.binding === "dbr" && m.downPayment > (1 - m.ltv) * v.price + 1) html += note("Your salary limits the finance, so you need more than the minimum down payment. A longer term, repaying existing commitments or a cheaper property would raise it.", "info");
  if (m.band === "low") html += note(`Your income is in the SAR 15,000-or-less band, so the overall cap is ${p0(m.cap)}. The regulation allows 65% for housing-support beneficiaries, and banks have applied 55% since September 2025 according to the press.`, "info");
  if (m.band === "high") html += note(v.capMode === "high70" ? "For incomes of SAR 25,000 or more there is no overall regulatory cap; it is bank policy. You chose 70%, the highest some banks advertise." : "For incomes of SAR 25,000 or more there is no overall regulatory cap; it is bank policy. The calculator assumes 65%, and some banks go to 70%.", "info");
  html += supportNote;
  if (v.support === "profit" && supportOk) {
    html += note(
      m.profitSubsidyFirstMonth !== null
        ? `Profit support: the Fund pays the profit on the first SAR 500,000 of finance for 20 years — about ${m$(m.profitSubsidyFirstMonth)} in the first month, falling as you repay — so what you actually pay is less than the instalment above.`
        : "Profit support for incomes above SAR 14,000 is below 100% per the Fund's matrix; check your rate in Sakani.",
      "info"
    );
  }
  if (v.citizen === "no") html += note("Non-Saudis: banks finance up to 70%, some require a down payment of 30% or more, and property in Makkah and Madinah cannot be financed for non-Saudis.", "info");
  if (v.redfReduced && v.price > H.redfDpReductionMaxPrice) html += note("The down payment reduction does not apply because the price is above SAR 800,000.", "info");
  html += note("Estimates only: the profit rate, maximum term and age are set by the bank, which usually uses the lower of the price and the valuation.", "info");
  return html;
});
