import { kuwaitLabourSupport, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const L = rules.kw.labourSupport;
const m = (x) => moneyEn(x, "KWD");

bind(form, result, (v) => {
  if (v.salary === null || v.salary === undefined) return null;
  const married = v.married === "yes";
  const r = kuwaitLabourSupport({ category: v.category, married, children: v.children, degree: v.degree, disability: v.disability, salary: v.salary });
  const label = form.querySelector(`#category option[value="${r.category}"]`)?.textContent || "";
  let html = big("Monthly labour support", m(r.total), `${married ? "Married" : "Single"} · ${label}`);
  const rows = [
    ["Social allowance", m(r.social)],
    ["Fixed increase (50 increase + 50 bonus + 120 cost of living)", m(r.fixed)],
    ["Qualification increase", m(r.qual)],
    [`25% difference on the social allowance (minimum ${L.diffMin})`, m(r.diff)],
    ["Table amount", m(r.base), { strong: true }],
  ];
  if (r.deduction) rows.push([`Bonus deducted (salary above KWD ${numEn(L.bonusThreshold)})`, "− " + m(r.deduction)]);
  if (r.childAmt) rows.push([`Children's allowance (${plural(r.kidsCounted, "child", "children")} × ${L.perChild})`, m(r.childAmt)]);
  if (r.degreeAmt) rows.push([v.degree === "phd" ? "PhD" : "Master's", m(r.degreeAmt)]);
  if (r.disabilityAmt) rows.push(["Disability addition", m(r.disabilityAmt)]);
  rows.push(["Monthly total", m(r.total), { strong: true }]);
  html += table(rows, "Support components");
  if (r.kids > L.maxChildren) html += note(`The children's allowance is paid up to the seventh child, so ${plural(L.maxChildren, "child", "children")} of ${plural(r.kids, "child", "children")} were counted.`, "info");
  if (r.alt !== null) html += note(`Some sources give a table amount of ${m(r.disputedBase)} for this category instead of ${m(r.base)}, which would make your support ${m(r.alt)}. PAM's official table settles this.`, "warn");
  if (Number(v.salary) === L.bonusThreshold) html += note("Your salary is exactly 1,250: it is not settled whether this counts as \"exceeding\"; if it does, KWD 50 would be deducted.", "info");
  if (married) html += note("The \"married\" rate for women working in the private sector has conditions we have not verified; in government, married women were usually paid the single rate.", "info");
  html += note(`Paid on the ${L.payDay}th of each month, and stops when you leave work at the non-government employer. Figures are from the PAM table in circulation.`, "info");
  return html;
});
