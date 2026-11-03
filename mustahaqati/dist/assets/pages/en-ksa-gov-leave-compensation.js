import { ksaGovLeaveComp, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "SAR");
const days = (n) => plural(n, "day");
const L = rules.sa.govLeave;

bind(form, result, (v) => {
  if (!v.basic) return null;
  const r = ksaGovLeaveComp({ basic: v.basic, newDays: v.newDays, oldDays: v.oldDays, reason: v.reason });
  if (!r.balance) return big("No balance to pay", m(0), "Enter your leave balance");
  let html = big("Leave encashment", m(r.amount), `${days(r.days)} × ${m(r.daily)}`);
  html += table(
    [
      [`Daily rate: basic ÷ ${L.divisor}`, m(r.daily)],
      ["Your balance", days(r.balance)],
      r.full ? ["Days paid (full balance)", days(r.days)] : null,
      !r.full && v.oldDays ? ["From the older balance", days(r.oldCounted)] : null,
      !r.full ? [`From the newer balance (up to ${L.newCap})`, days(r.newCounted)] : null,
      r.lostDays ? ["Days not paid", days(r.lostDays), { muted: true }] : null,
      ["Payment", m(r.amount), { strong: true }],
    ],
    "How it is calculated"
  );
  if (r.lostDays && !r.full) html += note(`${days(r.lostDays)} worth ${m(r.lostDays * r.daily)} would be lost. If your retirement is planned, take the excess first: up to ${L.maxTakenPerYear} days a year, or ${L.maxTakenSenior} with 25 years of service or at age 50.`, "warn");
  if (v.reason === "death") html += note("Payment on death goes to the heirs according to a ministry legal opinion; the current text does not name the beneficiary.", "info");
  if (v.reason === "dismissal") html += note("The text does not exclude disciplinary dismissal from payment, and we found no recent official opinion confirming payment in that case.", "info");
  html += note("The calculation uses the last basic salary without allowances; dividing by 30 is our reading of the definition of a month in Article 1. Check your balance in your employer's system.", "info");
  return html;
});
