import { ksaOfficerSalary, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const O = rules.sa.militaryScale.officers;
const nextJanYear = () => new Date().getUTCFullYear() + 1;
const sync = () => {
  const R = O.ranks[form.rank.value] || O.ranks.mulazim;
  const n = R.steps.length;
  [...form.step.options].forEach((o) => {
    const i = Number(o.value);
    o.disabled = i > n;
    o.textContent = i <= n ? `${i} — ${numEn(R.steps[i - 1])}` : String(i);
  });
  if (Number(form.step.value) > n) form.step.value = String(n);
};
form.rank.addEventListener("change", sync);

bind(form, result, (v) => {
  sync();
  const s = ksaOfficerSalary({ rank: form.rank.value, step: form.step.value });
  if (!s) return null;
  const R = O.ranks[s.rank];
  let html = big("Your monthly net salary (estimate)", m(s.net), `${R.nameEn} · step ${s.step} of ${s.maxStep}`);
  html += table(
    [
      ["Basic salary", m(s.basic)],
      s.car ? ["Transport allowance", "Government car or 2,000 until provided"] : ["Transport allowance", m(s.transport)],
      ["Total", m(s.gross)],
      ["Pension deduction 9% of basic", `− ${m(s.deduction)}`],
      ["Net", m(s.net), { strong: true }],
      [`Net from January 2027 with the ${numEn(s.allowance2027)} allowance`, m(s.net + s.allowance2027)],
      s.nextBasic ? [`Your basic after the January ${nextJanYear()} increment (+${numEn(s.increment)})`, m(s.nextBasic)] : ["Next increment", "Last step of the rank: none until promotion"],
      s.promotion ? [`On promotion to ${O.ranks[s.promotion.rank].nameEn}: step ${s.promotion.step} (+${numEn(s.promotion.raise)})`, m(s.promotion.basic)] : null,
      ["State pension share 13%", m(s.state)],
    ],
    "Salary breakdown"
  );
  if (s.car) html += note("A Major General is treated as civil rank 15 for transport: a government car, or SAR 2,000 a month until one is provided. We have not added it to the total.", "info");
  if (s.rank === "naqib" || s.rank === "raid") html += note("A Captain's increment is 495 to step 7 and then 265, and a Major's is 265, a shape inherited from the 1431H annex itself, which is why a Captain's top steps come close to a Major's first steps.", "info");
  html += note(`This table is an estimate: it circulates unofficially and matches the 1431H annex × 1.15 within about SAR ${numEn(O.maxDeviation)} at some steps. Duty, hazard and regional allowances are not included; check your payslip.`, "warn");
  return html;
});
