import { kuwaitCivilSalary, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const kwd = (n) => (n === null || n === undefined || isNaN(n) ? "—" : `KWD ${f3.format(n)}`);
const limit = () => {
  const G = rules.kw.civilScale.grades.find((g) => g.id === form.grade.value);
  if (!G) return;
  [...form.step.options].forEach((o) => (o.disabled = Number(o.value) > G.steps));
  if (Number(form.step.value) > G.steps) form.step.value = String(G.steps);
};
form.grade.addEventListener("change", limit);

bind(form, result, (v) => {
  limit();
  const s = kuwaitCivilSalary({ grade: form.grade.value, step: form.step.value, married: v.married === "yes", children: v.children, special: v.special });
  if (!s) return null;
  let html = big("Your monthly net salary", kwd(s.net), `${s.nameEn} · step ${s.step} of ${s.maxStep}`);
  html += table(
    [
      ["Basic", kwd(s.basic)],
      [`Social allowance (${v.married === "yes" ? "married" : "single"})`, kwd(s.social)],
      s.children ? [`Children's allowance: ${numEn(s.children / 50)} × 50`, kwd(s.children)] : null,
      ["Cost of living", kwd(s.costOfLiving)],
      s.special ? ["Special bonus", kwd(s.special)] : null,
      ["Total", kwd(s.gross), { strong: true }],
      [`Social insurance on ${numEn(s.base)} (basic, social and children)`, `− ${kwd(s.deduction)}`],
      ["Net", kwd(s.net), { strong: true }],
      s.nextBasic ? [`Basic after the next increment (+${numEn(s.increment)})`, kwd(s.nextBasic)] : ["Next increment", "Top of grade: none until promotion"],
    ],
    "Salary breakdown"
  );
  if (Number(v.children) > 7) html += note("The children's allowance is capped at 7 children.", "info");
  html += note("The increment comes on 1 January or 1 July after a year. The 120 cost-of-living allowance is outside the insurance base, and if you add the special bonus we leave it out of the base because its treatment is unknown.", "info");
  html += note("The table circulates on a specialist site and partly matches official press sources; it is not an official text we could open. Your employer may add allowances or a special cadre; check your payslip.", "warn");
  return html;
});
