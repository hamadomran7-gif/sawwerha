import { dubaiPurchaseCosts } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");

bind(form, result, (v) => {
  if (!v.price) return null;
  const c = dubaiPurchaseCosts({
    price: v.price,
    buyerType: v.buyer,
    purpose: v.purpose === "offplan" ? "first" : v.purpose,
    offplan: v.purpose === "offplan",
    useMortgage: !!v.mortgage,
    annualRatePct: v.rate || 0,
    years: v.years || 25,
    includeAgent: !!v.agent,
    bankFeePct: v.bankfee || 0,
  });
  let html = big("Cash needed on purchase day", m(c.cashNeeded), v.mortgage ? `Down payment ${m(c.downPayment)} + fees ${m(c.fees)}` : `Full price ${m(v.price)} + fees ${m(c.fees)}`);
  html += table(
    [
      v.mortgage ? ["Maximum loan-to-value", `${numEn(c.ltv * 100)}%`] : null,
      v.mortgage ? ["Loan amount", m(c.loan)] : null,
      v.mortgage ? ["Down payment", m(c.downPayment), { strong: true }] : null,
      ["DLD transfer fee (4%)", m(c.transferFee)],
      ["Title deed and admin fees", m(c.titleFee)],
      ["Registration trustee (incl. VAT)", m(c.trusteeFee)],
      v.mortgage ? ["Mortgage registration (0.25% + 290)", m(c.mortgageReg)] : null,
      v.mortgage ? ["Property valuation (estimate)", m(c.valuation)] : null,
      v.mortgage && c.bankFee ? ["Bank arrangement fee", m(c.bankFee)] : null,
      v.agent ? ["Agent commission (2% + VAT)", m(c.agent)] : null,
      ["Total fees", m(c.fees), { strong: true }],
      v.mortgage ? ["Expected monthly payment", m(c.installment), { strong: true }] : null,
      v.mortgage ? ["Total interest over the loan term", m(c.totalInterest), { muted: true }] : null,
    ],
    "Cost breakdown"
  );
  html += note("Not included: the developer's NOC (AED 500–5,000), annual service charges and utility connections. Banks may lend less than the maximum.", "info");
  if (v.purpose === "offplan") html += note("Off-plan: the Central Bank sets no special ratio and banks usually finance 50% of the completed value. The unit is registered in the Oqood system for an extra fee.", "warn");
  return html;
});
