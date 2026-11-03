import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n);

bind(form, result, (v) => {
  const salary = Number(v.salary);
  if (!salary || salary <= 0) return null;
  const basis = Number(v.basis) || 30;
  const hours = Number(v.hours) || 8;
  const daily = salary / basis;
  const hourly = daily / hours;
  const absent = Math.max(0, Number(v.absent) || 0);
  const deduction = Math.min(salary, daily * absent);

  let html = big("Daily wage", m(daily), `Hourly wage ${m(hourly)}`);
  html += table(
    [
      ["Daily wage", m(daily), { strong: true }],
      [`Hourly wage (${plural(hours, "hour")} a day)`, m(hourly), { strong: true }],
      ["Per minute", m(hourly / 60)],
      ["Weekly wage", m((salary * 12) / 52)],
      ["Yearly wage", m(salary * 12)],
    ],
    `Salary ${m(salary)} ÷ ${basis}`
  );
  if (absent) {
    html += table(
      [
        [`Deduction for ${plural(absent, "day")}`, m(deduction)],
        ["Salary after the deduction", m(salary - deduction), { strong: true }],
      ],
      "Absent or unpaid leave days"
    );
  }
  if (basis !== 30) html += note(`Dividing by 30 gives a daily wage of ${m(salary / 30)}. The 30-day month is the legal standard for most entitlements.`, "info");
  return html;
});
