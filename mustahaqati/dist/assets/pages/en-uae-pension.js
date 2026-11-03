import { uaePension, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");
const r2 = (n) => Math.round(n * 100) / 100;

bind(form, result, (v) => {
  if (!v.birth || !v.first || !v.end || !v.avg) return null;
  const p = uaePension({ birth: v.birth, firstReg: v.first, end: v.end, avgSalary: v.avg, gender: v.gender });
  if (!p) return note("The end of service must be after the registration date.", "bad");
  const isNew = p.law === "new";
  const L = isNew ? rules.ae.pension.new : rules.ae.pension.legacy;
  const lawTxt = isNew ? "Decree-Law 57/2023 (registered from 31 October 2023)" : "Law 7/1999 (registered before 31 October 2023)";
  let html;
  if (p.status === "normal" || p.status === "early") {
    html = big("Estimated monthly pension", m(p.pension), `${p.status === "normal" ? "Retirement age with the required service" : "Pension on resignation"} · ${numEn(p.pct)}% of the pension salary`);
  } else {
    html = big(p.gratuity ? "No pension — end-of-service gratuity" : "No pension due yet", m(p.gratuity), `${numEn(r2(p.years))} years of contributions · age ${numEn(Math.round(p.age * 10) / 10)}`);
  }
  html += table(
    [
      ["Law that applies", lawTxt],
      ["Contribution period", `${numEn(r2(p.years))} years`],
      ["Age at end of service", `${numEn(Math.round(p.age * 10) / 10)} years`],
      ["Pension rate", `${numEn(p.pct)}%`],
      p.topUp ? ["Government top-up to the AED 10,000 minimum", m(p.topUp)] : null,
      p.bonusOver35 ? ["Bonus for years beyond 35 (3 months' salary a year)", m(p.bonusOver35)] : null,
      [`Your monthly contribution (${numEn(L.contribEmployee * 100)}%)`, m(p.employeeContribution), { muted: true }],
    ],
    "Breakdown"
  );
  if (p.status === "deferred") html += note(`You have 20 years of contributions but are under the resignation age (${p.resignAge}). We have not found an official source on whether the pension is deferred to that age or the gratuity is paid, so check with GPSSA before resigning.`, "warn");
  if (p.status === "none") html += note(isNew ? "Pension conditions under the new law: age 60 with 15 years of contributions, or 30 years of contributions with age 55 on resignation. Without a pension, a gratuity is paid: 1.5 months' salary for each of the first five years, then 2, then 3." : "Pension conditions under Law 7/1999: age 60 with 15 years, or resignation after 20 years at the specified age. Without a pension, an end-of-service gratuity is paid.", "info");
  if (!isNew && v.gender === "m" && v.first >= "2007-02-28" && p.years >= 18) html += note("For men who joined after 28 February 2007, the resignation age is 55 in the amendment and regulations, while some GPSSA answers say 50. Check with GPSSA before deciding.", "info");
  html += note("For Emiratis registered with GPSSA (federal government and private sector). It does not cover the Abu Dhabi Pension Fund or the Sharjah government.", "info");
  return html;
});
