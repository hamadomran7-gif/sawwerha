import { ksaPension, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const d2 = (n) => Math.round(n * 100) / 100;

bind(form, result, (v) => {
  if (!v.birth || !v.start || !v.end || !v.avg) return null;
  const p = ksaPension({ system: v.system, birth: v.birth, start: v.start, end: v.end, gapMonths: v.gaps || 0, avgWage: v.avg });
  if (!p) return note("The retirement date must be after the contribution start date.", "bad");
  const isNew = v.system === "new";
  const statusTxt = p.status === "normal" ? "Pension at the normal retirement age" : p.status === "early" ? "Early retirement pension" : "No pension on this date";
  let html = p.status === "none"
    ? big("Monthly pension", m(0), `${plural(p.months, "month")} of contributions · age ${numEn(Math.round(p.ageAtEnd * 10) / 10)}`)
    : big("Estimated monthly pension", m(p.pension), `${statusTxt} · ${numEn(d2(p.pct))}% of the average wage`);
  const rows = [
    ["System", isNew ? "New system (from 3 July 2024)" : p.transitional ? "Previous system — transitional group (new age and early-retirement rules)" : "Previous system"],
    ["Contribution period", `${plural(p.months, "month")} (${numEn(d2(p.years))} years)`],
    ["Normal retirement date", dateEn(p.normalDate) + (isNew ? " (age 65)" : p.transitional ? "" : " (60 Hijri years)")],
    ["Months needed for early retirement", plural(p.earlyMonthsNeeded, "month") + (isNew ? " and age 55" : " at any age")],
  ];
  if (isNew) {
    rows.push(["Pension before reduction (2.25% × years)", m(p.base)]);
    if (p.reduction) rows.push([`Early retirement reduction (${numEn(d2(p.reduction * 100))}%)`, m(p.base * p.reduction)]);
    if (p.deferral) rows.push([`Deferral increase after 65 (${numEn(d2(p.deferral * 100))}%)`, "Added"]);
    if (p.minimum) rows.push(["Estimated minimum for your service", m(p.minimum), { muted: true }]);
  } else {
    rows.push(["Formula", `${m(Number(v.avg))} × ${p.months} ÷ 480`]);
    rows.push(["Minimum pension", m(p.minimum), { muted: true }]);
  }
  rows.push(["Monthly pension", m(p.pension), { strong: true }]);
  html += table(rows, "Breakdown");
  if (p.status === "none") {
    if (isNew) html += note(`For a pension under the new system: at least ${rules.sa.pension.new.minMonths} months at 65, or ${rules.sa.pension.new.earlyMinMonths} months for early retirement from 55. Those who don't qualify at 65 are compensated: on total contributions with 60 months or more, or as a lump sum with fewer.`, "warn");
    else html += note(`You need ${plural(p.earlyMonthsNeeded, "month")} for early retirement, or the normal age with at least ${plural(p.minMonths, "month")}. Without a pension, a lump-sum compensation is paid; for your service it is about <strong>${m(p.lumpSum)}</strong>.`, "warn");
  }
  if (isNew) html += note("The minimum between 180 and 480 months is an estimate (falling linearly from SAR 4,000 to 2,000); GOSI sets it. The text does not settle whether the minimum applies after the early-retirement reduction.", "info");
  else html += note("We assume all contribution periods are after 1422H and that the wage did not exceed the cap of 150% of the wage at the start of the last 5 years. Periods before 1422H are divided by 600.", "info");
  return html;
});
