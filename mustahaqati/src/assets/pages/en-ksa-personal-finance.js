import { loanInstallment, ksaFinanceCheck } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const pc = (x, d = 1) => `${numEn(Math.round(x * 10 ** d) / 10 ** d)}%`; // values are already percentages

bind(form, result, (v) => {
  if (!v.principal || v.rate === null || !v.months) return null;
  const l = loanInstallment({ principal: v.principal, annualRatePct: v.rate, months: v.months, method: "reducing" });
  let html = big("Monthly instalment", m(l.installment), `${plural(v.months, "month")} · ${numEn(v.rate)}% APR`);
  html += table(
    [
      ["Total you will pay", m(l.totalPayment)],
      ["Total cost of finance (profit and fees)", m(l.totalInterest), { strong: true }],
    ],
    "Cost of the finance"
  );
  if (v.salary) {
    const c = ksaFinanceCheck({ installment: l.installment, salary: v.salary, otherObligations: v.other || 0, retiree: v.status === "retiree" });
    html += table(
      [
        [`Maximum instalments (${pc(c.limitPct, 0)} of salary)`, m(c.maxInstallment)],
        ["Your deduction ratio", `${pc(c.ratio)} — ${c.ok ? '<span class="status-ok">Within the limit</span>' : '<span class="status-bad">Over the limit</span>'}`],
      ],
      "SAMA deduction check"
    );
    html += c.ok
      ? note("The instalment is within the deduction limit. Banks may apply extra conditions (length of service, salary transfer, minimum salary).", "ok")
      : note(`The instalment exceeds the limit. To comply, your instalments including other obligations must not exceed ${m(c.maxInstallment)} a month.`, "warn");
  }
  return html;
});
