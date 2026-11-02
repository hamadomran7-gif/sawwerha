import { uaeDomesticSettlement, uaeDomesticLeaveAccrued, uaeRecruitmentRefund, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural, durationEn } from "./en-common.js";

const $ = (id) => document.getElementById(id);
const form = $("calc");
const m = (n) => moneyEn(n, "AED");
const hint = form.querySelector("[data-leave-hint]");

bind(form, $("result"), (v) => {
  if (!v.basic || !v.start || !v.end) return null;
  const D = rules.ae.domestic;
  const s = uaeDomesticSettlement({ basic: v.basic, start: v.start, end: v.end, unpaid: v.unpaid, leaveDays: v.leaveDays, absence: v.absence === "yes", rate: v.rate });
  if (!s) return note("The last working day must be after the start date.", "bad");
  const months = s.duration.years * 12 + s.duration.months;
  if (hint) hint.textContent = `Leave accrued over ${plural(months, "month")}: ${plural(uaeDomesticLeaveAccrued(months), "day")}. Subtract the days already taken.`;
  let html = big("Worker's dues", m(s.total), `Service: ${durationEn(s.duration)}`);
  html += table(
    [
      ["Daily wage (basic ÷ 30)", m(s.daily)],
      [s.eligible ? `Gratuity: ${numEn(s.duration.decimalYears)} years × ${s.perYear} days` : v.absence === "yes" ? "Gratuity (lost: unlawful absence)" : "Gratuity (less than one year)", m(s.gratuity)],
      s.leave ? [`Unused leave: ${plural(Number(v.leaveDays), "day")}`, m(s.leave)] : null,
      ["Total", m(s.total), { strong: true }],
    ],
    "Breakdown"
  );
  if (Number(v.rate) === D.eosDaysPerYear || !v.rate) html += note("The 14-day rate is the one announced by the ministry; the decree leaves gratuity to a Cabinet decision, so check the ministry's calculator at settlement.", "info");
  html += note(`Dues are payable within ${D.finalDuesDeadlineDays} days of the contract ending, with the return ticket if the employer ends the contract for a reason not caused by the worker. Claims must be filed within ${D.claimTimeLimitMonths} months.`, "ok");
  return html;
});

bind($("refund"), $("refund-result"), (v) => {
  if (!v.cost) return null;
  const r = uaeRecruitmentRefund({ cost: v.cost, contractMonths: v.contractMonths, monthsWorked: v.monthsWorked, medicallyUnfit: v.medicallyUnfit });
  let html = big("Amount the agency refunds", m(r.refund), r.full ? "Full refund" : `Months left on the contract: ${r.remaining}`);
  if (!r.full) html += table([["Cost ÷ contract months", m(Number(v.cost) / (Number(v.contractMonths) || 24))], ["× months left", String(r.remaining)], ["Refund", m(r.refund), { strong: true }]]);
  html += note(`Refunded within ${rules.ae.domestic.refundDeadlineDays} days of returning the worker or reporting the absence. Direct hires are not covered.${r.full && v.medicallyUnfit ? " For medical unfitness, government fees are refunded too." : ""}`, "info");
  return html;
});
