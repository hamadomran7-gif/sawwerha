import { uaeFederalSalary } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");

bind(form, result, (v) => {
  const s = uaeFederalSalary({ grade: v.grade, married: v.married !== "no", children: v.children, scheme: v.scheme, qualification: v.qualification, increments: v.increments });
  if (!s) return null;
  const pct = Math.round(s.rate * 100);
  let html = big("Your monthly net salary", m(s.net), `Grade ${s.grade} · ${v.married === "no" ? "single" : "married"}`);
  html += table(
    [
      [s.increments ? `Basic + ${numEn(s.increments)} × ${numEn(s.annual)} (estimate)` : "Basic", m(s.basic)],
      [`Housing (${v.married === "no" ? "single" : "married"})`, m(s.housing)],
      ["Cost of living", m(s.costOfLiving)],
      ["Social allowance", m(s.social)],
      ["Transport incl. the President's grant", m(s.transport)],
      s.children ? [`Children's allowance: ${numEn(s.children / 600)} × 600`, m(s.children)] : null,
      s.qualification ? ["Qualification allowance", m(s.qualification)] : null,
      ["Total", m(s.total), { strong: true }],
      ["Pension base (excluding transport and qualification)", m(s.pensionBase)],
      [`Pension deduction ${pct}%`, `− ${m(s.contribution)}`],
      ["Net", m(s.net), { strong: true }],
      ["Employer share 15%", m(s.employer)],
    ],
    "Salary breakdown"
  );
  const scaleTotal = s.basic + s.housing + s.costOfLiving + s.social + s.transport;
  html += note(`The annual performance bonus is a one-off payment: up to ${m(Math.min(scaleTotal * 2, 100000))} for rating 5 and up to ${m(Math.min(scaleTotal * 1.5, 100000))} for rating 4, on the table total (${m(scaleTotal)}), capped at AED 100,000. Housing may be excluded from its base.`, "info");
  if (s.qualification) html += note("The qualification allowance comes from the previous regulation and press reports on the 2023 regulation; we left it out of the pension base because it is not on the pension authority's list.", "info");
  if (s.increments) html += note("The annual increment is an estimate: we added the table's 'annual allowance' column for each increment and kept allowances fixed. Under Injazati it is due only to levels 2 to 5.", "warn");
  html += note("Figures are from the Cabinet Resolution 23/2012 table (FAHR translation); we found no newer table up to November 2026. Other job-related allowances may apply; check your payslip.", "info");
  return html;
});
