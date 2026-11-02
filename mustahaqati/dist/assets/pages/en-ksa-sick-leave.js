import { ksaSickLeave, shiftDate, shiftMonths, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const label = (f) => (f === 1 ? "on full pay" : f === 0 ? "unpaid" : "at three-quarters pay");

bind(form, result, (v) => {
  if (!v.wage || v.days === null || v.days === undefined) return null;
  const s = ksaSickLeave({ wage: v.wage, days: v.days });
  const rows = s.rows.filter((r) => r.days > 0).map((r) => [`${plural(r.days, "day")} ${label(r.frac)}`, m(r.amount)]);
  let html = big("Sick leave pay owed", m(s.paid), `${plural(Math.min(v.days, rules.sa.sickLeave.maxDays), "day")} in the year · on the actual wage`);
  html += table(
    [
      ["Daily wage (actual wage ÷ 30)", m(s.daily)],
      ...rows,
      ["Paid for the sick days", m(s.paid), { strong: true }],
      ["Pay for the same days if you had worked", m(s.normal), { muted: true }],
      ["Deduction due to sick leave", m(s.deduction)],
    ],
    "Breakdown (Article 117)"
  );
  if (v.first) html += note(`Your sick-leave year began on ${dateEn(v.first)} and ends on ${dateEn(shiftDate(shiftMonths(v.first, 12), -1))}. The first sick leave after that opens a new year with a full balance.`, "info");
  if (s.exceeded) html += note("You have passed 120 days in the year; the law does not require pay beyond that.", "warn");
  html += note("If you are found to have worked elsewhere during sick leave, the employer may withhold your sick pay or recover it (Article 118).", "info");
  return html;
});
