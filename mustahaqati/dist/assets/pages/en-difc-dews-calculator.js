import { difcDews, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");

bind(form, result, (v) => {
  if (!v.basic || v.years == null) return null;
  const R = rules.ae.difcDews;
  if ((v.prior || 0) > v.years) return note("Service before 1 February 2020 cannot exceed your total service.", "bad");
  const d = difcDews({ monthlyBasic: v.basic, monthlyWage: v.wage || 0, years: v.years, priorYears: v.prior || 0 });
  const nowMonthly = d.rateNow === R.rateFirstFiveYears ? d.monthlyFirst : d.monthlyAfter;
  let html = big("Employer contribution per month now", m(nowMonthly), `${numEn(d.rateNow)}% of a monthly basic wage of ${m(d.basic)}`);
  html += table(
    [
      [`First ${R.firstPeriodYears} years: ${numEn(R.rateFirstFiveYears)}% per month`, m(d.monthlyFirst)],
      [`After that: ${numEn(R.rateAfterFiveYears)}% per month`, m(d.monthlyAfter)],
      [`Per year, first ${R.firstPeriodYears} years / after`, `${m(d.annualFirst)} / ${m(d.annualAfter)}`],
      [`${numEn(d.monthsFirst)} months at ${numEn(R.rateFirstFiveYears)}%`, m(d.totalFirst)],
      d.monthsAfter > 0 ? [`${numEn(d.monthsAfter)} months at ${numEn(R.rateAfterFiveYears)}%`, m(d.totalAfter)] : null,
      ["Total contributions over the period (minimum)", m(d.total), { strong: true }],
    ],
    "How it is calculated"
  );
  if (d.floorApplied) html += note("The basic wage was raised to half of the monthly wage, the legal floor in Article 66(8)(b).", "warn");
  if ((v.prior || 0) > 0) html += note("No contributions are due for service before 1 February 2020; that service earns a gratuity under Article 66(2) on termination, unless it is transferred to the plan with your consent.", "info");
  html += note(`These are minimums before investment returns and plan fees. Each month's contribution is due by day ${R.paymentDueDayNextMonth} of the following month.`, "info");
  return html;
});
