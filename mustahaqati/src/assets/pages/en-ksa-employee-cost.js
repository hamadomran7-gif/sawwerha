import { gosiContribution, ksaExpatFees } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const toggle = () => form.querySelectorAll("[data-nat]").forEach((el) => (el.hidden = el.dataset.nat !== form.nat.value));
form.nat.addEventListener("change", toggle);

bind(form, result, (v) => {
  toggle();
  const basic = Number(v.basic) || 0;
  if (!basic) return null;
  const housing = Number(v.housing) || 0;
  const other = Number(v.other) || 0;
  const salary = basic + housing + other;
  const isSaudi = v.nat !== "expat";
  const g = gosiContribution({ basic, housing, isSaudi, newSubscriber: v.newSub === "yes" });
  const years = Math.max(0, Number(v.years) || 0);
  const eos = (salary * (years >= 5 ? 1 : 0.5)) / 12;
  const medical = (Number(v.medical) || 0) / 12;
  let levy = 0, permit = 0, iqama = 0, ticket = 0;
  if (!isSaudi) {
    const f = ksaExpatFees({ months: 12, includeWorker: true, expatsExceed: v.ratio !== "low", iqamaFee: v.iqamaFee });
    levy = v.ratio === "exempt" ? 0 : f.worker.levy / 12;
    permit = f.worker.permit / 12;
    iqama = f.worker.iqama / 12;
    ticket = (Number(v.ticket) || 0) / 12;
  }
  const total = salary + g.employerAmount + eos + medical + levy + permit + iqama + ticket;
  const over = salary ? ((total - salary) / salary) * 100 : 0;
  let html = big("Monthly cost to the company", m(total), `${m(total * 12)} a year, ${numEn(over)}% above salary`);
  html += table(
    [
      ["Gross salary", m(salary)],
      [`Employer GOSI (${numEn(g.employerRate * 100)}% of ${numEn(g.base)})`, m(g.employerAmount)],
      !isSaudi ? [v.ratio === "exempt" ? "Expat levy (exempt)" : "Expat levy", m(levy)] : null,
      !isSaudi ? ["Work permit and iqama (monthly)", m(permit + iqama)] : null,
      ["Medical insurance (monthly)", m(medical)],
      !isSaudi && ticket ? ["Air ticket (monthly)", m(ticket)] : null,
      [`End-of-service provision (wage ÷ ${years >= 5 ? 12 : 24})`, m(eos)],
      ["Monthly cost", m(total), { strong: true }],
      ["Yearly cost", m(total * 12), { strong: true }],
    ],
    "Monthly breakdown"
  );
  html += table(
    [
      ["Employee's GOSI share", m(g.employeeAmount)],
      ["Net pay to the employee", m(salary - g.employeeAmount), { strong: true }],
    ],
    "For comparison: what the employee receives"
  );
  if (g.capped) html += note("The GOSI base is capped at SAR 45,000.", "info");
  if (!isSaudi) html += note("The levy, iqama and work permit fees are the employer's under Article 40 and may not be charged to the worker. The worker's dependent fees are the worker's own.", "info");
  html += note("Not included: first-time recruitment and visa costs, the cost of covering annual leave, and any employment subsidy the employer may receive for Saudi staff.", "info");
  return html;
});
