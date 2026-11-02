import { serviceDuration, uaeGratuity, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural, durationEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");

bind(form, result, (v) => {
  if (!v.basic || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, v.unpaid || 0);
  if (!d) return note("The last working day must be after the start date.", "bad");
  const g = uaeGratuity({ basicSalary: v.basic, years: d.decimalYears });
  const R = rules.ae.gratuity;
  if (!g.eligible) {
    return big("End-of-service gratuity", m(0), `Service: ${durationEn(d)}`) + note("No gratuity is due before completing one year of continuous service (Article 51).", "warn");
  }
  let html = big("Your end-of-service gratuity", m(g.total), `Service: ${durationEn(d)}${d.months || d.days ? ` (${numEn(d.decimalYears)} years)` : ""}`);
  html += table(
    [
      ["Daily wage (basic ÷ 30)", m(g.dailyWage)],
      [`First five years: ${plural(g.firstYears, "year")} × ${R.daysFirstFiveYears} days = ${plural(Math.round(g.firstDays * 10) / 10, "day")}`, m(g.firstAmount)],
      g.secondYears > 0 ? [`After year five: ${plural(g.secondYears, "year")} × ${R.daysAfterFiveYears} days = ${plural(Math.round(g.secondDays * 10) / 10, "day")}`, m(g.secondAmount)] : null,
      ["Total before cap", m(g.gross), { muted: !g.capped }],
      ["Legal cap (two years' basic salary)", m(g.cap), { muted: true }],
      ["Gratuity due", m(g.total), { strong: true }],
    ],
    "Breakdown"
  );
  if (g.capped) html += note("Your gratuity exceeds the legal cap, so it is limited to two years' basic salary.", "warn");
  html += note(`Payable within ${R.paymentDeadlineDays} days of the contract ending. Calculated on basic salary only, and not reduced if you resign.`, "ok");
  return html;
});
