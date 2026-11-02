import { serviceDuration, qatarGratuity, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, durationEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "QAR");

bind(form, result, (v) => {
  if (!v.basic || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, 0);
  if (!d) return note("The last working day must be after the start date.", "bad");
  const forfeited = v.reason === "art61";
  const g = qatarGratuity({ basicSalary: v.basic, years: d.decimalYears, forfeited });
  const R = rules.qa.eos;
  if (forfeited) return big("End-of-service gratuity", m(0), `Service: ${durationEn(d)}`) + note("No gratuity is due on dismissal for one of the Article 61 cases. The worker may contest the reason for dismissal.", "warn");
  if (!g.eligible) return big("End-of-service gratuity", m(0), `Service: ${durationEn(d)}`) + note("No gratuity is due before completing one year of service (Article 54).", "warn");
  let html = big("Your gratuity (legal minimum)", m(g.total), `Service: ${durationEn(d)}${d.months || d.days ? ` (${numEn(d.decimalYears)} years)` : ""}`);
  html += table(
    [
      ["Daily wage (basic ÷ 30)", m(g.dailyWage)],
      [`${numEn(d.decimalYears)} years × ${R.daysPerYear} days`, `${numEn(g.days)} days`],
      ["Gratuity due", m(g.total), { strong: true }],
    ],
    "Breakdown"
  );
  html += note("This is the legal minimum; if your contract gives a higher gratuity, the contract applies. Resigning does not reduce it.", "ok");
  return html;
});
