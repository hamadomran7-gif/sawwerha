import { gccFinalSettlement } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural, durationEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cc = form.dataset.country;
const CUR = { qa: "QAR", kw: "KWD", om: "OMR", bh: "BHD" }[cc];
const DP = cc === "qa" ? 2 : 3;
const m = (x) => moneyEn(Math.round(Number(x) * 10 ** DP) / 10 ** DP, CUR);
const toggle = () => form.querySelectorAll("[data-notice]").forEach((el) => (el.hidden = form.noticeCase.value === "none"));
form.noticeCase.addEventListener("change", toggle);
const EOS_NOTE = {
  qa: "Qatar gratuity: 21 days of the last basic wage per year after one year, with no cut for resignation; it is forfeited on dismissal under Article 61.",
  kw: "Kuwait indemnity: 15 days per year for the first 5 years then a month per year, on the last full wage, capped at 18 months; on resignation nothing before 3 years, half to 5, two thirds to 10.",
  om: "Oman gratuity: one month's basic wage per year since 31 July 2023, and before that 15 days per year for the first 3 years then a month, on the last basic wage.",
  bh: "Bahrain gratuity: half a month per year for the first 3 years then a month, on basic plus social allowance; the part for service since 1 March 2024 is paid by the Social Insurance Organization.",
};

bind(form, result, (v) => {
  toggle();
  if (!v.basic || !v.start || !v.end) return null;
  const s = gccFinalSettlement({
    country: cc, basic: v.basic, allowances: v.allowances, social: v.social, start: v.start, end: v.end,
    endedBy: v.endedBy === "worker" ? "worker" : "employer", forfeited: v.endedBy === "art61",
    leaveDays: v.leaveDays, noticeCase: v.noticeCase, servedDays: v.servedDays, salaryDays: v.salaryDays, other: v.other, deductions: v.deductions,
  });
  if (!s) return note("The last working day must be after the start date.", "bad");
  const n = s.noticeInfo;
  let html = big(s.total >= 0 ? "Your final settlement" : "Net settlement you owe", m(Math.abs(s.total)), `Service: ${durationEn(s.duration)}${s.sio ? ` · ${m(s.fromEmployer)} from the employer and ${m(s.sio)} from the SIO` : ""}`);
  let eosLabel = "End-of-service gratuity";
  if (cc === "kw" && s.eos.fraction !== undefined && s.eos.fraction < 1) eosLabel += s.eos.fraction === 0 ? " (nothing on resignation before 3 years)" : s.eos.fraction === 0.5 ? " (half on resignation)" : " (two thirds on resignation)";
  if (cc === "qa" && s.eos.forfeited) eosLabel += " (forfeited under Article 61)";
  if (cc === "qa" && s.eos.eligible === false) eosLabel += " (not due before one year)";
  const rows = [
    [eosLabel, m(s.eosTotal)],
    s.sio ? ["  of which paid by the Social Insurance Organization", m(s.sio), { muted: true }] : null,
    [`Leave pay: ${plural(Number(v.leaveDays) || 0, "day")} × ${numEn(s.leave.daily)}`, m(s.leave.amount)],
    s.salary ? [`Unpaid salary for ${plural(Number(v.salaryDays), "day")}`, m(s.salary)] : null,
    s.notice ? [v.noticeCase === "employer" ? `Pay for ${plural(n.unserved, "day")} of notice (${plural(n.days, "day")})` : `Deduction for ${plural(n.unserved, "day")} of unserved notice`, m(s.notice)] : null,
    s.other ? ["Other dues", m(s.other)] : null,
    s.deductions ? ["Deductions", m(-s.deductions)] : null,
    ["Total", m(s.total), { strong: true }],
  ];
  html += table(rows, "Settlement breakdown");
  html += note(EOS_NOTE[cc], "info");
  html += note(`Leave pay uses ${cc === "qa" ? "the basic wage" : cc === "kw" ? "the last full wage" : cc === "om" ? "the full wage" : "basic plus social allowance"} ÷ ${s.leave.divisor}; notice is ${plural(n.days, "day")} on ${cc === "qa" ? "the basic wage" : cc === "bh" ? "basic plus social allowance" : "the full wage"}.`, "info");
  if (cc === "om" && s.eos.literalTotal && Math.abs(s.eos.literalTotal - s.eos.total) > 0.01) html += note(`A literal reading of the new law over the whole service gives ${m(s.eos.literalTotal)}; we show the Labour Ministry's application of the old law to service before 31 July 2023.`, "info");
  return html;
});
