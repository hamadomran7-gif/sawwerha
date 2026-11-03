import { omanCivilSalary } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const omr = (n) => (n === null || n === undefined || isNaN(n) ? "—" : `OMR ${f3.format(n)}`);
const nextJan = () => new Date().getUTCFullYear() + 1;

bind(form, result, (v) => {
  const s = omanCivilSalary({ grade: v.grade, increments: v.increments });
  if (!s) return null;
  let html = big("Your monthly net salary", omr(s.net), `Grade ${s.grade} · ${s.increments ? `after ${numEn(s.increments)} increment${s.increments === 1 ? "" : "s"}` : "start of grade"}`);
  html += table(
    [
      [s.increments ? `Basic: ${numEn(s.basicStart)} + ${numEn(s.increments)} × ${numEn(s.increment)}` : "Basic (start of grade)", omr(s.basic)],
      ["Housing allowance", omr(s.housing)],
      ["Electricity allowance", omr(s.electricity)],
      ["Water allowance", omr(s.water)],
      ["Phone allowance", omr(s.phone)],
      ["Transport allowance", omr(s.transport)],
      ["Cost-of-living allowance", omr(s.costOfLiving)],
      ["Total", omr(s.total), { strong: true }],
      [`Social protection 7.5%${s.total > s.pensionBase ? " on the 3,000 cap" : ""}`, `− ${omr(s.pension)}`],
      ["Job security 0.5%", `− ${omr(s.jobSecurity)}`],
      ["Net", omr(s.net), { strong: true }],
      [`Your basic on 1 January ${nextJan()} (+${numEn(s.increment)})`, omr(s.nextBasic)],
      s.promotion ? [`On promotion to grade ${s.promotion.grade}: basic / total`, `${omr(s.promotion.basic)} / ${omr(s.promotion.total)}`] : ["Promotion", "Grade 1 is the highest grade"],
    ],
    "Salary breakdown"
  );
  html += note("The annual increment comes on 1 January after six months of service and is withheld after a 'weak' rating. Allowances are fixed per grade, so they do not rise with increments, and change to the new grade's allowances on promotion.", "info");
  html += note("Figures are from the Royal Decree 78/2013 scale in force since 2014; we found no replacement up to November 2026. Job-specific allowances outside the scale are not shown; check your payslip.", "info");
  return html;
});
