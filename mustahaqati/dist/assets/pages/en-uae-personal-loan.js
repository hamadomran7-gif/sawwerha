import { loanInstallment, uaePersonalLoanCheck, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");
const P = rules.ae.personalLoan;
const pc = (n, d = 1) => `${numEn(Math.round(n * 10 ** d) / 10 ** d)}%`;

bind(form, result, (v) => {
  if (!v.principal || v.rate === null || !v.months) return null;
  const l = loanInstallment({ principal: v.principal, annualRatePct: v.rate, months: v.months, method: v.method });
  let html = big("Monthly instalment", m(l.installment), `${plural(v.months, "month")} · ${v.method === "flat" ? "flat" : "reducing"} rate ${numEn(v.rate)}%`);
  html += table(
    [
      ["Total you will pay", m(l.totalPayment)],
      ["Total interest", m(l.totalInterest), { strong: true }],
      v.method === "flat" && l.equivalentReducingPct ? ["Approximate equivalent reducing rate", pc(l.equivalentReducingPct, 2)] : null,
    ],
    "Cost of the loan"
  );
  if (v.salary) {
    const c = uaePersonalLoanCheck({ principal: v.principal, months: v.months, salary: v.salary, installment: l.installment, otherObligations: v.other || 0 });
    const ok = (b) => (b ? `<span class="status-ok">OK</span>` : `<span class="status-bad">Over the limit</span>`);
    html += table(
      [
        [`Maximum amount (${P.maxSalaryMultiple} × salary)`, `${m(c.maxAmount)} — ${ok(c.amountOk)}`],
        ["Maximum term", `${plural(P.maxMonths, "month")} — ${ok(c.monthsOk)}`],
        ["Debt burden (instalments ÷ salary)", `${pc(c.dbr)} of a ${pc(P.maxDeductionRatio * 100, 0)} limit — ${ok(c.dbrOk)}`],
      ],
      "Central Bank checks"
    );
    if (c.amountOk && c.monthsOk && c.dbrOk) html += note("The loan is within the regulatory limits. Banks may apply stricter criteria.", "ok");
    else html += note("One of the conditions is not met; reduce the amount, the term or the instalment to comply.", "warn");
  }
  return html;
});
