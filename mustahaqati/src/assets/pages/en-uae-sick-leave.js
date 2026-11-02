import { uaeSickLeave, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");
const label = (f) => (f === 1 ? "on full pay" : f === 0 ? "unpaid" : "on half pay");

bind(form, result, (v) => {
  if (!v.basic || v.days === null || v.days === undefined) return null;
  const total = (v.basic || 0) + (v.allowances || 0);
  const wage = v.basis === "basic" ? v.basic : total;
  const s = uaeSickLeave({ wage, days: v.days, probation: v.stage === "probation" });
  const basisTxt = v.basis === "basic" ? "on basic salary" : "on gross pay (basic + allowances)";
  if (s.probation) {
    return (
      big("Sick leave pay during probation", m(0), `${plural(v.days, "day")} · ${basisTxt}`) +
      note(`There is no paid sick leave during probation. The employer may grant it unpaid on a medical report, reducing your salary by about ${m(s.deduction)}.`, "warn")
    );
  }
  const rows = s.rows.filter((r) => r.days > 0).map((r) => [`${plural(r.days, "day")} ${label(r.frac)}`, m(r.amount)]);
  let html = big("Sick leave pay owed", m(s.paid), `${plural(Math.min(v.days, rules.ae.sickLeave.maxDays), "day")} this service year · ${basisTxt}`);
  html += table(
    [
      ["Daily wage (÷ 30)", m(s.daily)],
      ...rows,
      ["Paid for the sick days", m(s.paid), { strong: true }],
      ["Pay for the same days if you had worked", m(s.normal), { muted: true }],
      ["Deduction from your salary", m(s.deduction)],
    ],
    "Breakdown"
  );
  if (s.exceeded) html += note("You have passed 90 days in this year of service. Once sick leave is used up, the employer may end your service if you cannot return, but must pay all your dues.", "warn");
  if (v.basis !== "basic") html += note("We used gross pay because the law says \"full pay\" and Article 1 defines pay as including allowances. Some employers use basic salary; choose \"Basic only\" to see the difference.", "info");
  else html += note("This uses basic salary, as some employers do. The wording of the law points to gross pay, which gives a higher figure.", "info");
  return html;
});
