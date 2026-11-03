import { ksaSaned, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");

bind(form, result, (v) => {
  if (!v.avg) return null;
  if (v.reason === "resigned") return big("SANED benefit", m(0), "Left by resignation") + note("SANED is not paid to someone who left because they no longer wanted the job, or who was dismissed for a reason attributable to them.", "warn");
  const S = rules.sa.saned;
  const s = ksaSaned({ avgWage: v.avg, months: v.months || S.maxMonths });
  let html = big("Total SANED benefit", m(s.total), `Over ${plural(s.monthsFirst + s.monthsAfter, "month")} without work`);
  html += table(
    [
      [`Months 1–${Math.min(3, s.monthsFirst) || 3}: 60% of the average${s.cappedFirst ? " (capped at SAR 9,000)" : ""}`, `${m(s.first)} a month`],
      s.monthsAfter ? [`Months 4–${3 + s.monthsAfter}: 50% of the average${s.cappedAfter ? " (capped at SAR 7,500)" : ""}`, `${m(s.after)} a month`] : null,
      ["Total", m(s.total), { strong: true }],
    ],
    "Breakdown"
  );
  html += note(`Conditions: Saudi and under 60, at least ${S.firstClaimMonths} months of contributions in the last ${S.firstClaimWithin} months (first claim), job ended other than by resignation, application within ${S.applyWithinDays} days, registration and an active job search.`, "info");
  return html;
});
