import { qatarCivilSalary, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "QAR");
const S = rules.qa.civilScale;
const stepFields = [...form.querySelectorAll("[data-steps]")];
const RATING = { exceptional: "exceptional", exceeds: "exceeds expectations", meets: "meets expectations", below: "below expectations", weak: "weak" };
const limit = () => {
  const fixed = S.fixed[form.grade.value] !== undefined;
  stepFields.forEach((el) => (el.hidden = fixed));
  const G = S.grades.find((g) => g.id === form.grade.value);
  if (!G) return;
  const n = G.steps.length;
  [...form.step.options].forEach((o) => {
    const i = Number(o.value);
    o.disabled = i > n;
    o.textContent = i <= n ? `${i} — ${numEn(G.steps[i - 1])}` : String(i);
  });
  if (Number(form.step.value) > n) form.step.value = String(n);
};
form.grade.addEventListener("change", limit);

bind(form, result, (v) => {
  limit();
  const s = qatarCivilSalary({ grade: form.grade.value, step: form.step.value, basic: v.basic, married: v.married === "yes", transport: v.transport, rating: v.rating });
  if (!s) return null;
  const G = S.grades.find((g) => g.id === s.grade);
  const fixed = !G;
  const custom = !fixed && v.basic !== null && v.basic > 0;
  const title = fixed ? form.grade.options[form.grade.selectedIndex].text : G.nameEn;
  const sub = fixed ? `${title} · fixed salary` : custom ? `${title} · basic entered` : `${title} · step ${numEn(Number(form.step.value))} of ${numEn(G.steps.length)}`;
  const status = v.married === "yes" ? "married" : "single";
  let next;
  if (fixed) next = ["Annual increment", "Fixed salary for the post"];
  else if (!s.pct) next = ["Next increment", "None for weak performance"];
  else if (s.atMax) next = [`Monthly bonus instead of the increment (${RATING[v.rating]})`, m(s.raise)];
  else next = [`Your basic on next 1 January (${RATING[v.rating]}: +${numEn(Math.min(s.raise, s.max - s.basic))})`, m(s.nextBasic)];
  let html = big("Your monthly net salary", m(s.net), sub);
  html += table(
    [
      ["Basic salary", m(s.basic)],
      [`Social allowance (${status})`, m(s.social)],
      [`Housing allowance (${status})`, m(s.housing)],
      s.transport ? ["Transport allowance", m(s.transport)] : null,
      ["Total", m(s.gross), { strong: true }],
      [`7% pension deduction on ${numEn(s.base)} (basic, social and housing)`, `− ${m(s.deduction)}`],
      ["Net", m(s.net), { strong: true }],
      next,
    ],
    "Salary breakdown"
  );
  if (custom && v.basic > s.max) html += note(`The basic you entered is above the top of the grade (${m(s.max)}), so we used the top. Check your grade.`, "warn");
  if (custom && G && v.basic < G.start) html += note(`The basic you entered is below the start of the grade (${m(G.start)}). Check your grade.`, "warn");
  if (s.overflowBonus > 0 && s.pct) html += note(`Your increment (${m(s.raise)}) passes the top of the grade, so your basic becomes ${m(s.max)} and the remaining ${m(s.overflowBonus)} is paid as a bonus during the year, followed by a monthly bonus equal to the increment for your rating.`, "info");
  if (!s.transport) html += note("We did not add the transport allowance (QAR 1,000 to 2,000 by grade). Enter the amount on your payslip; it is outside the pension base.", "info");
  if (fixed) html += note("The undersecretary's and assistant undersecretary's salaries are fixed in the table; we assumed the social and housing allowances at the top rates.", "info");
  if (v.married === "yes") html += note("Since October 2025 both Qatari spouses get the married social allowance, while the housing allowance goes at the married rate to the spouse with the higher entitlement and at the single rate to the other.", "info");
  html += note("The marriage incentive (QAR 12,000 a year for each spouse, under conditions) and performance incentives (two months' or one month's basic) are paid outside the monthly salary, so we left them out.", "info");
  html += note("The table comes from an unofficial translation of Law 15/2016 (medium confidence); allowances and increment rates are from Law 25/2025 and Decision 34/2025. Your appointment grade or allowances may differ; check your payslip.", "warn");
  return html;
});
