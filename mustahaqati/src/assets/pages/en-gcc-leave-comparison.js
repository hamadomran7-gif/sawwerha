import { uaeSickLeave, ksaSickLeave, gccSickPay } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n);

bind(form, result, (v) => {
  const wage = Number(v.wage) || 0;
  const days = Math.max(1, Math.floor(Number(v.days) || 0));
  if (!wage || !days) return null;
  const full = (wage / 30) * days;
  const rows = [
    ["UAE", uaeSickLeave({ wage, days })],
    ["Saudi Arabia", ksaSickLeave({ wage, days })],
    ["Qatar", gccSickPay({ country: "qa", days, basic: wage })],
    ["Kuwait", gccSickPay({ country: "kw", days, basic: wage })],
    ["Oman", gccSickPay({ country: "om", days, basic: wage })],
    ["Bahrain", gccSickPay({ country: "bh", days, basic: wage })],
  ].map(([name, r]) => ({ name, paid: r.paid, normal: full, pct: full ? (r.paid / full) * 100 : 0, exceeded: r.exceeded }));
  const best = rows.reduce((a, b) => (b.paid > a.paid ? b : a));
  let html = big(`Highest pay for ${plural(days, "sick day")}`, best.name, `${m(best.paid)} out of ${m(best.normal)}`);
  html += table(
    rows
      .sort((a, b) => b.paid - a.paid)
      .map((r) => [`${r.name}${r.exceeded ? " (over the maximum)" : ""}`, `${m(r.paid)} · ${numEn(Math.round(r.pct))}% of pay`]),
    "Sick pay by country"
  );
  html += note("The comparison assumes the sickness falls within one year and that eligibility conditions are met (probation completed in the UAE, 3 months of service in Qatar and Bahrain). Days beyond the maximum are unpaid.", "info");
  return html;
});
