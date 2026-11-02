import { ksaLeave } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const d1 = (n) => Math.round(n * 10) / 10;

bind(form, result, (v) => {
  if (!v.wage || v.years === null || v.months === null) return null;
  const l = ksaLeave({ wage: v.wage, yearsOfService: v.years, usedDays: v.used || 0, monthsInCurrentYear: v.months });
  let html = big("Leave days remaining this year", plural(d1(l.remaining), "day"), `Cash value ${m(l.amount)}`);
  html += table(
    [
      ["Annual entitlement", `${plural(l.entitlement, "day")}${v.years >= 5 ? " (after five consecutive years)" : ""}`],
      [`Earned for ${plural(v.months, "month")} of this year`, plural(d1(l.accrued), "day")],
      ["Used", plural(v.used || 0, "day")],
      ["Remaining", plural(d1(l.remaining), "day"), { strong: true }],
      ["Daily rate (wage ÷ 30)", m(l.dailyWage)],
      ["Value of the remaining leave", m(l.amount), { strong: true }],
    ],
    "Breakdown"
  );
  if (v.years >= 4 && v.years < 5) html += note("Once you complete five consecutive years, your entitlement rises to 30 days a year.", "info");
  return html;
});
