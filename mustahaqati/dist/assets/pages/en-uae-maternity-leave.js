import { uaeMaternity, shiftDate, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");

bind(form, result, (v) => {
  if (!v.basic) return null;
  const total = (v.basic || 0) + (v.allowances || 0);
  const wage = v.basis === "basic" ? v.basic : total;
  const M = rules.ae.maternity;
  const r = uaeMaternity({ wage, extraUnpaidDays: v.extra || 0, sickChild: !!v.child, sickChildUnpaid: !!v.childUnpaid });
  let html = big("Maternity leave pay", m(r.paid), `${plural(r.totalDays, "day")} in total · ${v.basis === "basic" ? "on basic salary" : "on gross pay"}`);
  html += table(
    [
      ["Daily wage (÷ 30)", m(r.daily)],
      [`${plural(M.fullPayDays, "day")} on full pay`, m(r.full)],
      [`${plural(M.halfPayDays, "day")} on half pay`, m(r.half)],
      r.extraUnpaidDays ? [`${plural(r.extraUnpaidDays, "day")} unpaid for pregnancy-related illness`, m(0)] : null,
      v.child ? [`${plural(M.sickChildFullPayDays, "day")} on full pay to care for the baby`, m(r.child)] : null,
      r.childUnpaidDays ? [`${plural(r.childUnpaidDays, "day")} unpaid child care`, m(0)] : null,
      ["Total paid", m(r.paid), { strong: true }],
      ["Pay for the same period if you had worked", m(r.normal), { muted: true }],
      ["Difference from your usual salary", m(r.deduction)],
    ],
    "Breakdown"
  );
  if (v.start) {
    html += table(
      [
        ["Leave starts", dateEn(v.start)],
        ["Last day on full pay", dateEn(shiftDate(v.start, M.fullPayDays - 1))],
        ["Last of the 60 days", dateEn(shiftDate(v.start, M.fullPayDays + M.halfPayDays - 1))],
        ["Back to work", dateEn(shiftDate(v.start, r.totalDays)), { strong: true }],
      ],
      "Dates (taken in one block)"
    );
  }
  if (r.extraUnpaidDays) html += note("The extra pregnancy or delivery illness days are not counted as service when your end-of-service gratuity is calculated.", "warn");
  html += note(`Either parent also gets ${M.parentalWorkingDays} paid working days of parental leave within ${M.parentalWithinMonths} months of the birth, and you get nursing breaks of up to one hour a day for ${M.nursingMonths} months.`, "ok");
  return html;
});
