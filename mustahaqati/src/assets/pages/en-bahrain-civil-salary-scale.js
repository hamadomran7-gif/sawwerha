import { bahrainCivilSalary, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const S = rules.bh.civilScale;
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const bhd = (n) => (n === null || n === undefined || isNaN(n) ? "—" : `BHD ${f3.format(n)}`);
const NAMES = { generalRegular: "General jobs", generalShift: "General jobs, shift work", executive: "Executive jobs", educational: "Educational jobs" };
const sync = () => {
  const T = S.scales[form.scale.value] || S.scales.generalRegular;
  const ids = Object.keys(T.grades);
  [...form.grade.options].forEach((o) => (o.disabled = !ids.includes(o.value)));
  if (!ids.includes(form.grade.value)) form.grade.value = ids.includes("6") ? "6" : ids[0];
  const G = T.grades[form.grade.value];
  const n = G.values.length;
  [...form.index.options].forEach((o) => {
    const i = Number(o.value);
    o.disabled = i >= n;
    const label = G.ranked ? (i === 0 ? "Minimum (rank 0)" : `Rank ${i}`) : `Value ${i + 1}`;
    o.textContent = i < n ? `${label} — ${numEn(G.values[i])}` : label;
  });
  if (Number(form.index.value) >= n) form.index.value = String(n - 1);
};
form.scale.addEventListener("change", sync);
form.grade.addEventListener("change", sync);

bind(form, result, (v) => {
  sync();
  const s = bahrainCivilSalary({ scale: form.scale.value, grade: form.grade.value, index: form.index.value, living: Number(v.living) || 0, transport: v.transport, social: v.social });
  if (!s) return null;
  const pos = s.ranked ? (s.index === 0 ? "minimum" : `rank ${s.index}`) : `value ${s.index + 1} of ${S.scales[s.scale].grades[s.grade].values.length}`;
  let html = big("Your monthly net salary", bhd(s.net), `${NAMES[s.scale]} · grade ${s.grade} · ${pos}`);
  html += table(
    [
      ["Basic salary", bhd(s.basic)],
      s.living ? ["Living-standard improvement allowance", bhd(s.living)] : null,
      s.social ? ["Social allowance", bhd(s.social)] : null,
      s.transport ? ["Transport allowance", bhd(s.transport)] : null,
      ["Total", bhd(s.gross), { strong: true }],
      [`Pension 7% of basic (${numEn(s.basic)})`, `− ${bhd(s.pension)}`],
      ["Unemployment insurance 1%", `− ${bhd(s.unemployment)}`],
      ["Net", bhd(s.net), { strong: true }],
      s.nextBasic ? [`Your basic after the 1 January increment (+${numEn(s.nextBasic - s.basic)})`, bhd(s.nextBasic)] : ["Annual increment", "Top of the grade: none until promotion"],
    ],
    "Salary breakdown"
  );
  if (!s.social) html += note("You have not entered the social allowance: its amounts are in an annex to the regulation whose text we could not find, so the net above covers the known part. Add the amount on your payslip.", "warn");
  if (!s.living) html += note("The living-standard improvement allowance is BHD 85 or 100 since June 2023 for some employees, as set in an annex to the regulation, and is not paid to senior posts. Choose it if it is on your payslip.", "info");
  if (!s.ranked) html += note("Grades 2 and 3 are published with fewer than 16 values, most likely the upper ranks after removing anything below BHD 322. The values are correct; their rank numbers are uncertain.", "info");
  html += note("The annual increment is one rank on 1 January after a year from appointment or the last increment, with satisfactory performance and six months' actual service. The pension takes 7% of basic only (Law 13/2022), plus 1% for unemployment.", "info");
  html += note("The tables come from the Civil Service Bureau's open data with no effective date. You may get other allowances, such as the car allowance instead of transport; check your payslip.", "info");
  return html;
});
