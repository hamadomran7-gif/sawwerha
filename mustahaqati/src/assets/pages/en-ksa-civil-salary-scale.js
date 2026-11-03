import { ksaGovSalary, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "SAR");
const nextJanYear = () => new Date().getUTCFullYear() + 1;

const limitSteps = () => {
  const R = rules.sa.civilScale.ranks[form.rank.value];
  if (!R) return;
  [...form.step.options].forEach((o) => (o.disabled = Number(o.value) > R.maxStep));
  if (Number(form.step.value) > R.maxStep) form.step.value = String(R.maxStep);
};
form.rank.addEventListener("change", limitSteps);

bind(form, result, (v) => {
  limitSteps();
  const s = ksaGovSalary({ scale: "civil", rank: form.rank.value, step: form.step.value, system: v.system });
  if (!s) return null;
  const C = rules.sa.civilScale;
  const pct = numEn(Math.round(s.rate * 10000) / 100);
  let html = big("Your monthly net salary", m(s.net), `Rank ${form.rank.value} · step ${form.step.value} of ${s.totalSteps}`);
  html += table(
    [
      ["Basic salary", m(s.basic)],
      s.car ? ["Transport allowance", "Government car (Article 44)"] : ["Transport allowance (Article 36)", m(s.transport)],
      ["Gross", m(s.gross)],
      [`Pension deduction ${pct}% of basic`, `− ${m(s.deduction)}`],
      ["Net", m(s.net), { strong: true }],
      [`Net from January 2027 with the SAR ${numEn(rules.sa.allowance2027.amount)} allowance (not part of basic)`, m(s.net + rules.sa.allowance2027.amount)],
      s.atMax ? ["Next increment", "None: this is the last step of the rank"] : [`Basic on 1 January ${nextJanYear()} (+${m(s.increment)})`, m(s.nextBasic)],
    ],
    "Salary breakdown"
  );
  if (s.car) html += note(`Rank 15 gets a government car instead of a transport allowance, and ${m(C.rank15CarAllowance)} a month until the car is provided, for up to ${numEn(C.rank15CarMaxMonths)} months.`, "info");
  if (v.system === "gosiNew") html += note(`Those first appointed from 3 July 2024 fall under the new social insurance system: the deduction is ${pct}% today and rises by half a point every July to 11%. We apply it to basic salary.`, "info");
  html += note("The transport allowance is not subject to the deduction, and there is no general housing allowance for civil servants. Job-specific allowances (nature of work, hazard, remote areas) are not included.", "info");
  html += note("Figures follow the scale in use since 1432H; check your payslip. Engineers have been on the engineering scale since 31 December 2024.", "info");
  return html;
});
