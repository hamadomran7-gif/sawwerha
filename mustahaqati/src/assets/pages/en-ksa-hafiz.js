import { ksaHafiz, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "SAR");
const mo = (n) => plural(n, "month");
const H = rules.sa.hafiz;
const WHY = {
  young: "You are under 20.",
  old: "You have turned 40; the allowance is for ages 20 to 40.",
  family: "Your household income is above the limit for its size.",
  graduateWindow: "More than 24 months have passed since you graduated; graduates must apply before then.",
  wait: "Anyone who worked before can only apply 24 months after their job ended.",
};

bind(form, result, (v) => {
  form.querySelector('label[for="eventDate"]').textContent = v.status === "worked" ? "Date your last job ended" : "Graduation date";
  if (!v.birth) return null;
  const r = ksaHafiz({ birth: v.birth, today: new Date(), status: v.status, eventDate: v.eventDate, income: v.income, priorPayments: v.priorPayments, familySize: v.familySize, familyIncome: v.familyIncome });
  const groups = [];
  for (const x of r.rows) {
    const g = groups[groups.length - 1];
    if (g && g.base === x.base && g.pay === x.pay) g.n++;
    else groups.push({ base: x.base, pay: x.pay, n: 1 });
  }
  let html = r.eligible ? big("Your estimated allowance", m(r.total), `${mo(r.payments)} out of 15`) : big("You do not appear eligible now", m(0), "Reasons below");
  if (!r.eligible) html += note(r.reasons.map((x) => WHY[x]).join(" ") + (r.waitUntil ? ` You can apply from ${dateEn(r.waitUntil)}.` : ""), "warn");
  html += table(
    [
      ...groups.map((g) => [`${mo(g.n)} × ${m(g.pay)}${g.pay !== g.base ? ` (from ${m(g.base)})` : ""}`, m(g.pay * g.n)]),
      [r.eligible ? "Total" : "Total if you were eligible", m(r.total), { strong: r.eligible, muted: !r.eligible }],
      ["Your household income limit", m(r.familyCap)],
    ],
    "Payment schedule"
  );
  if (r.stoppedBy === "income") html += note("Payment stops when your own income reaches the allowance due in that tier.", "info");
  if (r.stoppedBy === "age") html += note("Payment stops when you turn 40.", "info");
  if (Number(v.priorPayments) > 0) html += note("Those who received earlier payments get the remaining ones up to 15; we assume they continue from the tier where you stopped.", "info");
  html += note(`Your own income is deducted, with a minimum payment of ${m(H.minPayment)}, and household income is an eligibility test, not a deduction. This is a guide; the Fund decides after checking your details.`, "info");
  return html;
});
