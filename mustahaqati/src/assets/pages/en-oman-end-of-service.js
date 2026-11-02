import { omanGratuity, serviceDuration } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, durationEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "OMR");

bind(form, result, (v) => {
  if (!v.basic || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, 0);
  if (!d) return note("The last working day must be after the start date.", "bad");
  if (v.reason === "art40") return big("End-of-service gratuity", m(0), `Service: ${durationEn(d)}`) + note("No gratuity is due on dismissal for one of the Article 40 cases. The worker may contest the reason for dismissal.", "warn");
  const o = omanGratuity({ basicSalary: v.basic, start: v.start, end: v.end });
  let html = big("Your end-of-service gratuity", m(o.total), `Service: ${durationEn(d)}`);
  html += table(
    [
      o.preYears > 0 ? [`Before 31 July 2023: ${numEn(o.preYears)} years (15 days for the first 3 years, then a month) = ${numEn(o.preMonths)} months`, m(o.preAmount)] : null,
      o.postYears > 0 ? [`From 31 July 2023: ${numEn(o.postYears)} years × a month's basic pay`, m(o.postAmount)] : null,
      ["Gratuity due", m(o.total), { strong: true }],
    ],
    "Breakdown"
  );
  if (o.preYears > 0) html += note(`Service before the new Labour Law is calculated under the previous law, as the Ministry of Labour explains. If all your service were paid at a month per year, the gratuity would be ${m(o.literalTotal)}.`, "info");
  html += note("Resigning does not reduce the gratuity. When the savings scheme for non-Omanis starts (no later than 19 July 2027), gratuity stops accruing for later service and a 9% contribution of basic salary replaces it.", "ok");
  return html;
});
