import { ksaEngineeringSalary, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const E = rules.sa.engineeringScale;
const nextJanYear = () => new Date().getUTCFullYear() + 1;
const sync = () => {
  const C = E.cats[form.cat.value] || E.cats.engineer;
  const n = Object.keys(C.levels).length;
  [...form.level.options].forEach((o) => (o.disabled = Number(o.value) > n));
  if (Number(form.level.value) > n) form.level.value = String(n);
  const L = C.levels[form.level.value];
  [...form.step.options].forEach((o) => (o.textContent = `${o.value} — ${numEn(L.steps[Number(o.value) - 1])}`));
};
form.cat.addEventListener("change", sync);
form.level.addEventListener("change", sync);

bind(form, result, (v) => {
  sync();
  const s = ksaEngineeringSalary({ cat: form.cat.value, level: form.level.value, step: form.step.value, system: v.system, project: v.project });
  if (!s) return null;
  const C = E.cats[s.cat];
  const pct = numEn(Math.round(s.rate * 1000) / 10);
  let html = big("Your monthly net salary", m(s.net), `${C.nameEn} · level ${s.level} · step ${s.step}`);
  html += table(
    [
      ["Basic salary", m(s.basic)],
      ["Transport allowance", m(s.transport)],
      s.project ? ["Project management allowance", m(s.project)] : null,
      ["Total", m(s.gross)],
      [`Pension deduction ${pct}% of basic`, `− ${m(s.deduction)}`],
      ["Net", m(s.net), { strong: true }],
      [`Net from January 2027 with the ${numEn(s.allowance2027)} allowance`, m(s.net + s.allowance2027)],
      s.nextBasic
        ? [`Your basic on 1 January ${nextJanYear()} (+${numEn(s.increment)})`, m(s.nextBasic)]
        : s.nextLevelFirst
          ? [`Last step of the level; on moving to level ${s.level + 1}`, m(s.nextLevelFirst)]
          : ["Next increment", "Last step of the category: none until promotion"],
      ["Equivalent civil service rank", numEn(s.civilRank)],
    ],
    "Salary breakdown"
  );
  if (s.lastStep && s.nextLevelFirst) html += note("Moving to the next level needs at least one fiscal year on the last step and a 'very good' rating or better in the last two years (Article 8).", "info");
  if (s.topOfCategory && s.cat !== "consultant") html += note(`Last level of the ${C.nameEn} category. Promotion to the next category needs experience (${numEn(E.experience[E.order[E.order.indexOf(s.cat) + 1]])} years after the bachelor's) and Saudi Council of Engineers classification.`, "info");
  if (v.system === "gosiNew") html += note(`Those first appointed from 3 July 2024 are on the new GOSI system: the deduction is ${pct}% today and rises half a point each July to 11%.`, "info");
  if (s.project) html += note("The project management allowance is granted by the minister's decision, for up to 30% of an entity's engineers, and is not combined with another allowance for the same purpose.", "info");
  html += note("The SAR 500 monthly allowance from January 2027 covers employees on civil service scales and is not added to basic pay, so no pension is deducted from it.", "info");
  html += note("Figures come from a table the press published from Umm Al-Qura (27/12/2024) and match the regulation. Other allowances follow the equivalent rank; check your payslip.", "info");
  return html;
});
