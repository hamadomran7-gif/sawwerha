import { ksaArt77, serviceDuration, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural, durationEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const fixedOnly = form.querySelectorAll("[data-fixed]");
const dayDiff = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

bind(form, result, (v) => {
  const fixed = v.type === "fixed";
  fixedOnly.forEach((el) => (el.hidden = !fixed));
  if (!v.wage || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, 0);
  if (!d) return note("The termination date must be after the start date.", "bad");
  let remaining = 0;
  if (fixed) {
    if (!v.contractEnd) return null;
    remaining = Math.max(0, dayDiff(v.end, v.contractEnd));
  }
  const a = ksaArt77({ wage: v.wage, type: v.type, years: d.decimalYears, remainingDays: remaining });
  const A = rules.sa.art77;
  let html = big("Compensation for termination without a valid reason", m(a.total), `Service: ${durationEn(d)} · on the last actual wage`);
  html += table(
    [
      ["Daily wage (actual wage ÷ 30)", m(a.daily)],
      fixed ? [`Wage for the rest of the contract (${plural(remaining, "day")})`, m(a.base)] : [`${numEn(Math.round(d.decimalYears * 100) / 100)} years × ${A.daysPerYear} days`, m(a.base)],
      ["Minimum (two months' wage)", m(a.minimum), { muted: !a.minimumApplied }],
      ["Compensation due", m(a.total), { strong: true }],
    ],
    "Breakdown (Article 77)"
  );
  if (a.minimumApplied) html += note("The calculated amount is below two months' wage, so the minimum applies.", "info");
  html += note("Legal sources treat this compensation as due in addition to the end-of-service award (Article 84). If your contract sets a specific compensation for this case, that applies instead.", "ok");
  if (!fixed) html += note("We pro-rate part years, as calculators and law firms do; the text does not mention them expressly.", "info");
  return html;
});
