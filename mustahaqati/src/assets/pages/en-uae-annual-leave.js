import { serviceDuration, uaeLeaveAccrued, uaeLeaveEncashment } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural, durationEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");

bind(form, result, (v) => {
  if (!v.basic || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, 0);
  if (!d) return note("The calculation date must be after the start date.", "bad");
  const acc = uaeLeaveAccrued({ years: d.years, months: d.months, days: d.days });
  const used = Number(v.used) || 0;
  const remaining = Math.max(0, acc.accruedDays - used);
  const enc = uaeLeaveEncashment({ basicSalary: v.basic, unusedDays: remaining });
  const months = d.years * 12 + d.months + d.days / 30;
  const rule = months <= 6 ? "No leave accrues before six months of service." : months < 12 ? "In the first year, after six months: 2 days for each month of service." : "30 days for each year of service, pro rata for part years.";
  let html = big("Remaining leave", plural(Math.round(remaining * 10) / 10, "day"), `Cash value ${m(enc.amount)}`);
  html += table(
    [
      ["Service", durationEn(d)],
      ["Days accrued since you started", plural(Math.round(acc.accruedDays * 10) / 10, "day")],
      ["Days taken", plural(used, "day")],
      ["Days remaining", plural(Math.round(remaining * 10) / 10, "day"), { strong: true }],
      ["Daily rate (basic ÷ 30)", m(enc.dailyWage)],
      ["Cash in lieu at the end of service", m(enc.amount), { strong: true }],
    ],
    "Breakdown"
  );
  html += note(rule, "info");
  if (used > acc.accruedDays) html += note("You have taken more days than you accrued; the advance leave may be deducted from your salary or final dues.", "warn");
  return html;
});
