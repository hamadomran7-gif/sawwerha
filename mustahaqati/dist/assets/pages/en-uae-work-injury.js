import { uaeWorkInjury } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "AED");

bind(form, result, (v) => {
  if (!v.basic) return null;
  const deg = Math.min(100, Math.max(0, v.degree || 0)) / 100;
  const r = uaeWorkInjury({ basic: v.basic, total: v.total || v.basic, treatmentDays: v.treatmentDays, degree: deg });
  const totalDis = deg >= 1;
  const comp = totalDis ? r.death : r.partial;
  let html = deg
    ? big(totalDis ? "Total disability compensation" : "Partial disability compensation", m(comp), r.treatmentPay ? `plus ${m(r.treatmentPay)} during treatment = ${m(comp + r.treatmentPay)}` : "paid by the employer within 10 days of the medical report")
    : big("Pay during treatment", m(r.treatmentPay), "paid by the employer on top of all treatment costs");
  if (r.fullDays || r.halfDays)
    html += table(
      [
        r.fullDays ? [`${plural(r.fullDays, "day")} at full pay (${m(r.daily)} a day)`, m(r.fullPay)] : null,
        r.halfDays ? [`${plural(r.halfDays, "day")} at half pay`, m(r.halfPay)] : null,
        ["Pay during treatment", m(r.treatmentPay), { strong: true }],
      ],
      "During treatment (on total salary)"
    );
  if (r.uncoveredDays) html += note(`The law sets no pay for ${plural(r.uncoveredDays, "day")} beyond the first year.`, "warn");
  html += table(
    [
      [`24 months' basic wage: 24 × ${m(v.basic)}`, m(r.raw)],
      r.clamped ? [r.raw > r.death ? "After the AED 200,000 cap" : "After the AED 18,000 minimum", m(r.death)] : null,
      deg && !totalDis ? [`Partial disability: ${numEn(deg * 100, 0)}% × ${m(r.death)}`, m(r.partial), { strong: true }] : null,
      totalDis ? ["Total disability (same as death)", m(r.death), { strong: true }] : null,
      !deg ? ["Death or total disability compensation", m(r.death), { strong: true }] : null,
    ],
    "Lump-sum compensation"
  );
  if (deg && !totalDis && r.partialAlt !== r.partial) html += note(`On another reading that applies the AED 18,000 and 200,000 limits after the percentage, compensation would be ${m(r.partialAlt)}.`, "info");
  html += note(
    deg && !totalDis
      ? `For UAE nationals registered with GPSSA: the authority pays ${numEn(deg * 100, 0)}% × AED 75,000 = ${m(r.gpssaPartial)}, and for death or total disability a pension as if service were 35 years.`
      : "For UAE nationals registered with GPSSA: a pension for death or total disability as if service were 35 years, and for partial disability the percentage × AED 75,000.",
    "info"
  );
  html += note("End-of-service gratuity is due on top when the contract ends, and the right is lost only in the Article 38 cases. Results are estimates: the disability percentage is set by the competent medical authority.", "info");
  return html;
});
