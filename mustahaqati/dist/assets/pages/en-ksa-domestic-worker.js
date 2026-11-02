import { ksaDomesticSettlement, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural, durationEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");

bind(form, result, (v) => {
  if (!v.wage || !v.start || !v.end) return null;
  const D = rules.sa.domestic;
  const s = ksaDomesticSettlement({ wage: v.wage, start: v.start, end: v.end, mode: v.mode, reason: v.reason, leaveDays: v.leaveDays, compMonths: v.compMonths });
  if (!s) return note("The last working day must be after the start date.", "bad");
  const workerEnded = v.reason === "worker_art27" || v.reason === "worker_noreason";
  let html = big(s.total >= 0 ? "Domestic worker's dues" : "Net amount owed to the employer", m(Math.abs(s.total)), `Service: ${durationEn(s.duration)}`);
  html += table(
    [
      [v.reason === "art26" ? "End-of-service benefit (lost under Article 26)" : `End-of-service benefit: ${numEn(s.blocks)} × a month's wage`, m(s.eos)],
      s.comp > 0 ? ["Compensation for unlawful termination (Article 25)", m(s.comp)] : null,
      s.comp < 0 ? ["Compensation owed to the employer for leaving without reason (Article 25)", m(s.comp)] : null,
      s.leave ? [`Unused leave: ${plural(Number(v.leaveDays), "day")} × ${numEn(s.daily)}`, m(s.leave)] : null,
      ["Total", m(s.total), { strong: true }],
    ],
    "Breakdown"
  );
  if (v.mode === "blocks" && s.blocksExact > s.blocks && v.reason !== "art26") html += note(`Service is ${numEn(s.years)} years, or ${numEn(s.blocksExact)} four-year blocks. The regulation says nothing about fractions, so only complete blocks are counted. Pro rata, the benefit would be ${m(s.blocksExact * Number(v.wage))}.`, "info");
  if (v.reason === "worker_noreason") html += note("In this case the worker bears the return ticket, and the employer may claim two months' wage as compensation, deducted from the dues (our reading of Articles 24 and 25).", "warn");
  if (v.reason === "employer_unlawful" || v.reason === "end") html += note("The worker's return ticket is paid by the employer.", "info");
  html += note(`Dues are payable within ${workerEnded ? "two weeks" : "one week"} (Article 23). Deductions may not exceed ${D.deductionCapPct}% of the wage, and claims lapse ${D.claimTimeLimitMonths} months after the contract ends.`, "ok");
  return html;
});
