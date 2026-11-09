import { loanInstallment, kuwaitLoanCheck, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const kd = (n) => `KD ${f3.format(n)}`;
const pc = (n, d = 1) => `${numEn(Math.round(n * 10 ** d) / 10 ** d)}%`;
const L = rules.kw.loan;

bind(form, result, (v) => {
  if (!v.principal || v.rate === null || !v.months) return null;
  const l = loanInstallment({ principal: v.principal, annualRatePct: v.rate, months: v.months });
  let html = big("Monthly instalment", kd(l.installment), `${plural(v.months, "month")} · reducing rate ${numEn(v.rate)}%`);
  html += table([["Total you will pay", kd(l.totalPayment)], ["Total interest", kd(l.totalInterest), { strong: true }]], "Cost of the loan");
  if (v.salary) {
    const c = kuwaitLoanCheck({ type: v.type, principal: v.principal, months: v.months, netSalary: v.salary, installment: l.installment, otherObligations: v.other || 0, retiree: v.who === "retiree", ratePct: v.rate });
    const ok = (b) => (b ? `<span class="status-ok">OK</span>` : `<span class="status-bad">Over the limit</span>`);
    const housing = v.type === "housing";
    html += table(
      [
        [housing ? "Maximum housing finance" : `Maximum amount (${L.consumerMultiple} × net salary, capped at KD ${numEn(L.consumerMaxAmount)})`, `${kd(c.maxAmount)} — ${ok(c.amountOk)}`],
        ["Maximum term", `${plural(c.maxMonths, "month")} — ${ok(c.monthsOk)}`],
        ["Debt burden (instalments ÷ net salary)", `${pc(c.ratio)} of a ${pc(c.limitPct, 0)} limit — ${ok(c.dbrOk)}`],
        ["Rate ceiling (discount rate + 3%)", `${pc(c.maxRatePct, 2)} — ${ok(c.rateOk)}`],
      ],
      "Central Bank of Kuwait checks"
    );
    html += c.amountOk && c.monthsOk && c.dbrOk && c.rateOk ? note("The loan is within the regulatory limits. Banks may apply stricter criteria.", "ok") : note("One of the conditions is not met; reduce the amount, the term or the instalment.", "warn");
  }
  return html;
});
