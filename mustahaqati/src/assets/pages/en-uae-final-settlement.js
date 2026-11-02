import { uaeFinalSettlement } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural, durationEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");

bind(form, result, (v) => {
  if (!v.basic || !v.start || !v.end) return null;
  const s = uaeFinalSettlement({
    basic: v.basic, gross: v.gross, start: v.start, end: v.end, unpaid: v.unpaid,
    leaveDays: v.leaveDays, endedBy: v.endedBy, noticeDays: v.noticeDays || 30, servedDays: v.servedDays,
    salaryDays: v.salaryDays, other: v.other, deductions: v.deductions,
  });
  if (!s) return note("The last working day must be after the start date.", "bad");
  const n = s.noticeInfo;
  let html = big(s.total >= 0 ? "Your final settlement" : "Net amount you owe", m(Math.abs(s.total)), `Service: ${durationEn(s.duration)}`);
  html += table(
    [
      [s.gratuity.eligible ? `Gratuity (${numEn(s.duration.decimalYears)} years)` : "Gratuity (less than one year)", m(s.gratuity.total)],
      [`Unused leave: ${plural(Number(v.leaveDays) || 0, "day")} × ${numEn(s.leave.dailyWage)}`, m(s.leave.amount)],
      s.salary ? [`Unpaid salary: ${plural(Number(v.salaryDays), "day")}`, m(s.salary)] : null,
      n.remainingDays
        ? [v.endedBy === "employer" ? `Notice pay for ${plural(n.remainingDays, "unserved day")}` : `Deduction for ${plural(n.remainingDays, "unserved notice day")}`, m(s.notice)]
        : ["Notice pay", "None (notice served)"],
      s.other ? ["Other dues", m(s.other)] : null,
      s.deductions ? ["Deductions", m(-s.deductions)] : null,
      ["Total", m(s.total), { strong: true }],
    ],
    "Breakdown"
  );
  if (n.adjusted) html += note(`The legal notice period is 30 to 90 days, so ${plural(n.noticeDays, "day")} was used.`, "info");
  if (!s.gratuity.eligible) html += note("No gratuity is due before one year of continuous service.", "warn");
  if (s.gratuity.capped) html += note("The gratuity is limited by the legal cap of two years' basic salary.", "info");
  html += note("Payable within 14 days of the end of employment (Article 53). Gratuity and leave pay use basic salary; notice pay and unpaid days use the full salary.", "ok");
  return html;
});
