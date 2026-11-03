import { uaeNafisJobLoss } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "AED");
const CHILD = ["First child", "Second child", "Third child"];

bind(form, result, (v) => {
  if (v.age === null || v.age === undefined) return null;
  const r = uaeNafisJobLoss({ reason: v.reason, age: v.age, spouse: v.spouse === "yes", children: v.children, otherIncome: v.otherIncome });
  if (!r.eligible) {
    const WHY = {
      resignation: "The support is for those who lost their job for reasons beyond their control, which does not include voluntary resignation.",
      misconduct: "People dismissed for moral reasons or legal violations are excluded.",
      age: "The support is for Emiratis aged 18 to 60.",
    };
    return big("You do not appear eligible", m(0), "reason below") + note(WHY[r.why] || "", "warn");
  }
  let html = big("Monthly support", m(r.monthly), `for up to ${plural(r.consecutive, "month")} in a row and ${plural(r.maxMonths, "month")} in total`);
  const rows = r.rows.map((x) => [x.k === "self" ? "You" : x.k === "spouse" ? "Husband or wife (not working)" : CHILD[x.n - 1], m(x.amount)]);
  rows.push(["Total before deductions", m(r.gross)]);
  if (r.deduction) rows.push(["Your other income is deducted", "− " + m(r.deduction)]);
  rows.push(["Monthly support", m(r.monthly), { strong: true }]);
  rows.push([`Total over ${plural(r.consecutive, "consecutive month")}`, m(r.totalConsecutive)]);
  rows.push([`Maximum total (${plural(r.maxMonths, "month")})`, m(r.totalMax)]);
  html += table(rows, "Breakdown");
  if (r.kidsExtra) html += note("A maximum of three children is counted.", "info");
  if (r.deduction && r.monthly === 0) html += note("Your other income equals or exceeds the support, so nothing is paid.", "warn");
  html += note("You must have no source of income and be able to work, and refusing a job offer ends the right. Nafis decides after checking your details.", "info");
  return html;
});
