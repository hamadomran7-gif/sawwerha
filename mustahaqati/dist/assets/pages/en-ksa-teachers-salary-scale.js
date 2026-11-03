import { ksaGovSalary, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "SAR");
const NAMES = { assistant: "Teacher (assistant teacher)", practicing: "Practising teacher", advanced: "Advanced teacher", expert: "Expert teacher" };
const nextJanYear = () => new Date().getUTCFullYear() + 1;

const limit = () => {
  const R = rules.sa.teacherScale.ranks[form.rank.value];
  if (!R) return;
  const levels = Object.keys(R.levels).map(Number);
  const maxLevel = Math.max(...levels);
  [...form.level.options].forEach((o) => (o.disabled = Number(o.value) > maxLevel));
  if (Number(form.level.value) > maxLevel) form.level.value = String(maxLevel);
  const maxStep = R.levels[form.level.value].steps.length;
  [...form.step.options].forEach((o) => (o.disabled = Number(o.value) > maxStep));
  if (Number(form.step.value) > maxStep) form.step.value = String(maxStep);
};
form.rank.addEventListener("change", limit);
form.level.addEventListener("change", limit);

bind(form, result, (v) => {
  limit();
  const s = ksaGovSalary({ scale: "teacher", rank: form.rank.value, level: form.level.value, step: form.step.value, system: v.system, transport: v.transport });
  if (!s) return null;
  const pct = numEn(Math.round(s.rate * 10000) / 100);
  let html = big("Your monthly net salary", m(s.net), `${NAMES[form.rank.value]} · level ${form.level.value} · step ${form.step.value}`);
  html += table(
    [
      ["Basic salary", m(s.basic)],
      ["Transport allowance", m(s.transport)],
      ["Gross", m(s.gross)],
      [`Pension deduction ${pct}% of basic`, `− ${m(s.deduction)}`],
      ["Net", m(s.net), { strong: true }],
      ["Your position in the rank", `Step ${numEn(s.position)} of ${numEn(s.totalSteps)}`],
      s.atMax ? ["Next increment", "None: last step of the rank"] : [`Basic in January ${nextJanYear()} (+${m(s.increment)})`, m(s.nextBasic)],
    ],
    "Salary breakdown"
  );
  if (s.atMax) html += note("You have reached the last step of your rank; further increases come from promotion to the next rank under its rules and the professional licence.", "info");
  if (v.system === "gosiNew") html += note(`Those first appointed from 3 July 2024 fall under the new social insurance system: the deduction is ${pct}% today and rises by half a point every July to 11%.`, "info");
  html += note("Figures come from the Ministry of Education press release as reported by the press, and the transport allowance is a common figure with no official text per rank; check your payslip.", "info");
  return html;
});
