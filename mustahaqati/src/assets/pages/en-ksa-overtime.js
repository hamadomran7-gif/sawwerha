import { ksaOvertime, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");

bind(form, result, (v) => {
  if (!v.basic || v.hours === null || v.hours === undefined) return null;
  const actual = (v.basic || 0) + (v.allowances || 0);
  const o = ksaOvertime({ basic: v.basic, actual, hours: v.hours });
  const O = rules.sa.overtime;
  const wrong = v.hours * (v.basic / 30 / 8) * 1.5;
  let html = big("Overtime pay owed", m(o.total), `${plural(v.hours, "hour")} × ${m(o.rate)} an hour`);
  html += table(
    [
      ["Actual hourly wage (actual ÷ 30 ÷ 8)", m(o.hourlyActual)],
      ["Basic hourly wage (basic ÷ 30 ÷ 8)", m(o.hourlyBasic), { muted: true }],
      ["Premium (50% of the basic hourly wage)", m(o.premiumPerHour)],
      ["Overtime hourly rate", m(o.rate)],
      ["Overtime pay", m(o.total), { strong: true }],
    ],
    "Breakdown (Article 107)"
  );
  if (v.allowances > 0) html += note(`The common but wrong formula "1.5 × basic hourly wage" gives only ${m(wrong)}, because it leaves allowances out of the hourly wage.`, "warn");
  html += note(`Alternative with your consent: paid compensatory leave of at least ${plural(o.compLeaveHours, "hour")} (1.5 hours per overtime hour), used within ${O.compLeaveUseWithinDays} days, up to ${O.compLeaveMaxDaysPerYear} days a year.`, "info");
  if (v.hours > O.annualCapHours) html += note(`The annual overtime limit is ${O.annualCapHours} hours, which may be exceeded with the employee's consent.`, "warn");
  return html;
});
