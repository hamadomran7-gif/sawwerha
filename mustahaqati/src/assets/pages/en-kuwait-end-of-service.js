import { serviceDuration, kuwaitIndemnity, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural, durationEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "KWD");

bind(form, result, (v) => {
  if (!v.wage || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, 0);
  if (!d) return note("The last working day must be after the start date.", "bad");
  const k = kuwaitIndemnity({ wage: v.wage, years: d.decimalYears, reason: v.reason, divisor: Number(v.divisor) || 26 });
  const R = rules.kw.eos;
  const fr = k.fraction === 1 ? "Full" : k.fraction === 0 ? "None" : k.fraction > 0.6 ? "Two thirds" : "Half";
  let html = big("Your end-of-service indemnity", m(k.total), `Service: ${durationEn(d)}${d.months || d.days ? ` (${numEn(d.decimalYears)} years)` : ""}`);
  html += table(
    [
      [`Daily wage (monthly ÷ ${k.divisor})`, m(k.dailyWage)],
      [`First five years: ${plural(k.firstYears, "year")} × ${R.daysFirst} days`, m(k.firstAmount)],
      k.secondYears > 0 ? [`After year five: ${plural(k.secondYears, "year")} × a month's pay`, m(k.secondAmount)] : null,
      ["Cap (18 months' pay)", m(k.cap), { muted: !k.capped }],
      ["Full indemnity", m(k.gross), { muted: k.fraction !== 1 }],
      ["Share due for this reason", fr],
      ["Indemnity due", m(k.total), { strong: true }],
    ],
    "Breakdown"
  );
  if (k.capped) html += note("Your indemnity has reached the legal cap of 18 months' pay.", "warn");
  if (v.reason === "resignation" && d.decimalYears < 10) html += note("Resignation shares (Article 53): nothing under 3 years, half from 3 to under 5, two thirds from 5 to under 10, and full from 10 years.", "info");
  const alt = kuwaitIndemnity({ wage: v.wage, years: d.decimalYears, reason: v.reason, divisor: k.divisor === 26 ? 30 : 26 });
  html += note(`Dividing the wage by ${alt.divisor} instead of ${k.divisor} gives ${m(alt.total)}. The law does not state the divisor explicitly; 26 is the common practice.`, "info");
  return html;
});
