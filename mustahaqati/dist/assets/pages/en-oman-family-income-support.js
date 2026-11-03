import { omanFamilyIncomeSupport, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const S = rules.om.socialProtection;
const f2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const omr = (n) => `OMR ${f2.format(n)}`;

bind(form, result, (v) => {
  if (!v.members) return null;
  const s = omanFamilyIncomeSupport({ members: v.members, caregivers: v.caregivers, income: v.income, idleMen: v.idleMen, children: v.children, students: v.students });
  let html = big("Your family's monthly total", omr(s.totalSchool), s.eligible ? `Income support ${f2.format(s.fis)} + child benefit ${numEn(s.childSchool)}` : "No income support: your income reaches the target");
  html += table(
    [
      [`Target: 115 × √${numEn(s.n)}${s.caregivers ? ` (${numEn(s.caregivers)} carer${s.caregivers > 1 ? "s" : ""} counted as two)` : ""}`, omr(s.target)],
      ["Actual household income", omr(s.actual)],
      s.imputed ? [`Imputed income: ${numEn(s.imputed / S.fis.imputedMale)} × 115`, omr(s.imputed)] : null,
      ["Counted income", omr(s.counted)],
      [s.raisedToMin ? `Income support (gap of ${f2.format(s.gap)} raised to the minimum)` : "Family income support", omr(s.fis), { strong: true }],
      s.children ? [`Child benefit in the school year: ${numEn(s.students)} × ${numEn(s.studentRate)} + ${numEn(s.children - s.students)} × 10`, omr(s.childSchool)] : null,
      s.children && s.childSchool !== s.childSummer ? ["Child benefit outside the school year", omr(s.childSummer)] : null,
      ["Monthly total", omr(s.totalSchool), { strong: true }],
      s.totalSchool !== s.totalSummer ? ["Total outside the school year", omr(s.totalSummer)] : null,
    ],
    "Benefit breakdown"
  );
  if (s.raisedToMin) html += note(`The gap is below the minimum (${numEn(s.min)}), and Article 45 says the benefit must not be lower once entitlement is confirmed, so we raised it.`, "info");
  if (!s.eligible) html += note("Your counted income equals or exceeds the target, so no income support is due. The OMR 10 child benefit per child still applies.", "warn");
  if (s.students && s.studentRate === S.child.student) html += note("The OMR 20 child benefit for school students in income-support families applies from February 2026 during the school year, without applying. Whether it returns to 10 in the summer holiday has not been announced, so we show both.", "info");
  html += note("The child and disability benefits and one person's elderly benefit in a household of two or more are not counted. The Fund may impute income to some women able to work and applies asset and domestic worker limits. This is an estimate until the Fund decides your application.", "info");
  return html;
});
