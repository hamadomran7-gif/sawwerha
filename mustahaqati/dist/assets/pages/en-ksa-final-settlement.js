import { ksaFinalSettlement } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural, durationEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const toggle = () => form.querySelectorAll("[data-notice]").forEach((el) => (el.hidden = form.noticeCase.value === "none"));
form.noticeCase.addEventListener("change", toggle);

bind(form, result, (v) => {
  toggle();
  if (!v.wage || !v.start || !v.end) return null;
  const s = ksaFinalSettlement({
    wage: v.wage, start: v.start, end: v.end, reason: v.reason, leaveDays: v.leaveDays,
    noticeCase: v.noticeCase, givenDays: v.givenDays, salaryDays: v.salaryDays, other: v.other, deductions: v.deductions,
  });
  if (!s) return note("The last working day must be after the start date.", "bad");
  const e = s.eos;
  const frac = e.fraction === 1 ? "full" : e.fraction === 0 ? "none" : e.fraction > 0.5 ? "two thirds" : "one third";
  const n = s.noticeInfo;
  let html = big(s.total >= 0 ? "Your final settlement" : "Net amount you owe", m(Math.abs(s.total)), `Service: ${durationEn(s.duration)}`);
  html += table(
    [
      [`End-of-service award (${frac})`, m(e.total)],
      [`Unused leave: ${plural(Number(v.leaveDays) || 0, "day")} × ${numEn(s.leave.dailyWage)}`, m(s.leave.amount)],
      s.salary ? [`Unpaid salary: ${plural(Number(v.salaryDays), "day")}`, m(s.salary)] : null,
      n && n.unservedDays ? [v.noticeCase === "employer" ? `Notice compensation for ${plural(n.unservedDays, "day")}` : `Deduction for ${plural(n.unservedDays, "unserved notice day")}`, m(s.notice)] : null,
      s.other ? ["Other dues", m(s.other)] : null,
      s.deductions ? ["Deductions", m(-s.deductions)] : null,
      ["Total", m(s.total), { strong: true }],
    ],
    "Breakdown"
  );
  if (e.disputed) html += note(`Since the 2025 amendments, several practitioners argue that an employee who ends an open-ended contract with notice is owed the full award (${m(e.gross)}). No official position settles this yet, so the cautious figure is shown.`, "info");
  const twoWeeks = ["resignation", "worker_notice", "resignation_marriage", "resignation_childbirth", "force_majeure", "article_81"].includes(v.reason);
  html += note(`Payable within ${twoWeeks ? "two weeks" : "one week"} of the contract ending (Article 88). Every item uses the last actual wage.`, "ok");
  return html;
});
