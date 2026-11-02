import { gccLeaveBalance, gccLeaveEncash, gccSickPay, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

// Shared English script for the Qatar, Kuwait, Oman and Bahrain leave pages (hidden field "country").
const form = document.getElementById("calc");
const result = document.getElementById("result");
const CUR = { qa: "QAR", kw: "KWD", om: "OMR", bh: "BHD" };
const DIGITS = { qa: 2, kw: 2, om: 2, bh: 2 }; // calc.js rounds to 2 decimals
const annualOnly = form.querySelectorAll("[data-annual]");
const sickOnly = form.querySelectorAll("[data-sick]");
const fracLabel = (f) => (f === 1 ? "on full pay" : f === 0 ? "unpaid" : f === 0.75 ? "at three-quarters pay" : f === 0.5 ? "on half pay" : f === 0.25 ? "at quarter pay" : `at ${numEn(f * 100)}% pay`);

function basisEn(c, kind, timing) {
  if (c === "qa") return "basic salary";
  if (c === "kw") return "last full wage (basic plus regular allowances)";
  if (c === "om") return kind === "annual" && timing === "inService" ? "basic salary (paid during service with your written consent)" : "gross pay";
  return kind === "annual" ? "basic salary plus social allowance" : "gross pay";
}

bind(form, result, (v) => {
  const c = v.country;
  const fmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: DIGITS[c], maximumFractionDigits: DIGITS[c] });
  const m = (n) => (n === null || n === undefined || isNaN(n) ? "—" : `${CUR[c]} ${fmt.format(n)}`);
  const sick = v.mode === "sick";
  annualOnly.forEach((el) => (el.hidden = sick));
  sickOnly.forEach((el) => (el.hidden = !sick));
  if (!v.basic) return null;
  const w = { basic: v.basic, allowances: v.allowances || 0, social: v.social || 0, divisor: v.divisor, timing: v.timing };

  if (sick) {
    if (v.sickDays === null || v.sickDays === undefined) return null;
    const s = gccSickPay({ country: c, days: v.sickDays, eligible: v.eligible !== false, ...w, divisor: undefined });
    const R = rules[c].sickLeave;
    if (!s.eligible) return big("Sick leave pay", m(0), "Before completing 3 months of service") + note(`Paid sick leave is not due before ${R.minServiceMonths} months of service.`, "warn");
    const rows = s.rows.filter((r) => r.days > 0).map((r) => [`${plural(r.days, "day")} ${fracLabel(r.frac)}`, m(r.amount)]);
    let html = big("Sick leave pay owed", m(s.paid), `${plural(Math.min(v.sickDays, R.maxDays), "day")} · on ${basisEn(c, "sick")}`);
    html += table(
      [
        [`Daily wage (÷ ${s.divisor})`, m(s.daily)],
        ...rows,
        ["Paid for the sick days", m(s.paid), { strong: true }],
        ["Pay for the same days if you had worked", m(s.normal), { muted: true }],
        ["Deduction due to sick leave", m(s.deduction)],
        s.employerShare !== null ? ["Paid by the employer (days 1–7)", m(s.employerShare)] : null,
        s.fundShare !== null ? ["Reimbursed by the Social Protection Fund (day 8 on)", m(s.fundShare)] : null,
      ],
      "Breakdown"
    );
    if (s.exceeded) html += note(`The maximum is ${plural(R.maxDays, "day")} a year.`, "warn");
    if (c === "qa") html += note("After the two paid weeks and the four weeks on half pay, leave continues unpaid. The employer may end your service at the end of the twelfth week if a medical report shows you cannot return.", "info");
    if (c === "kw") html += note("We divide by 30 because sick days are most likely calendar days; the law is silent on the divisor. Chronic illnesses are excluded by ministerial decision.", "info");
    if (c === "om") html += note("Since 19 July 2026 the employer pays the first seven days and the Social Protection Fund reimburses the rest at the same rates, for Omanis and non-Omanis. Your entitlement has not changed.", "info");
    if (c === "bh") html += note(`Unused full-pay and half-pay days accumulate up to ${plural(R.accumulationMaxDays, "day")}; if you have an accumulated balance, your paid days extend by that amount. Your annual leave balance may also be added to sick leave.`, "info");
    return html;
  }

  if (!v.start || !v.end) return null;
  const b = gccLeaveBalance({ country: c, start: v.start, end: v.end, taken: v.taken || 0 });
  if (!b) return note("The end date must be after the start date.", "bad");
  const e = gccLeaveEncash({ country: c, days: b.balance, ...w });
  const dd = (n) => (c === "kw" ? `${numEn(Math.round(n * 10) / 10)} working days` : plural(Math.round(n * 10) / 10, "day"));
  let html = big("Value of your annual leave balance", m(e.amount), `Balance ${dd(b.balance)} · on ${basisEn(c, "annual", v.timing)}`);
  html += table(
    [
      ["Service", `${plural(Math.floor(b.months), "month")}${b.months % 1 ? " and part of a month" : ""}`],
      ["Leave earned for the period", dd(b.accrued)],
      ["Taken", dd(b.taken)],
      ["Balance", dd(b.balance), { strong: true }],
      [`Daily wage (${fmt.format(e.monthly)} ÷ ${e.divisor})`, m(e.daily)],
      ["Leave encashment", m(e.amount), { strong: true }],
    ],
    "Breakdown"
  );
  if (c === "qa") {
    if (b.alt !== null) html += note("Your service is under one year. Article 79 ties leave to a full year of continuous service but grants part years pro rata, so there are two readings: no payment under the literal reading, or the pro-rata amount shown above.", "warn");
    html += note("Leave is 21 days for under five years of service and 28 days after, paid on basic salary. Only half of the leave may be carried to the next year, on written request.", "info");
  }
  if (c === "kw") {
    if (b.belowEligibility) html += note("Leave for the first year is not due before six months of service.", "warn");
    html += note("Leave is 30 working days, excluding rest days, public holidays and sick days. Dividing by 26 is the common practice but no text sets it; you can choose 30. Leave may accumulate up to two years, or more by agreement.", "info");
  }
  if (c === "om") {
    if (b.belowEligibility) html += note("Leave may not be taken before six months of service, and no text settles payment for the balance of someone who leaves before that.", "warn");
    html += note("The law does not say how part years or the daily divisor are counted, so we pro-rate (2.5 days a month) and divide by 30, as is common practice. Encashment at the end of service is on gross pay; during service it is on basic pay and needs your written consent.", "info");
  }
  if (c === "bh") html += note("30 calendar days at 2.5 days a month. The employer must settle your balance and its pay at least every two years, and you lose payment for days the employer scheduled and you refused in writing.", "info");
  return html;
});
