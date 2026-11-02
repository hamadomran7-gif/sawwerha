import { iloe, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");
const I = rules.ae.iloe;

bind(form, result, (v) => {
  if (v.basic === null || v.basic === undefined) return null;
  const r = iloe({ basicSalary: v.basic });
  let html = big("Monthly compensation if you lose your job", m(r.monthly), `Category ${r.category} · for up to ${plural(r.months, "month")}`);
  html += table(
    [
      ["Category", r.category === "A" ? `A (basic up to AED ${numEn(I.categoryAMaxBasic)})` : `B (basic above AED ${numEn(I.categoryAMaxBasic)})`],
      ["Monthly premium", m(r.premium)],
      ["Annual premium", m(r.annualPremium), { muted: true }],
      [`${numEn(I.compensationRate * 100)}% of basic salary`, m((v.basic || 0) * I.compensationRate)],
      ["Monthly cap for your category", m(r.cap), { muted: !r.capped }],
      ["Monthly compensation", m(r.monthly), { strong: true }],
      [`Total over ${plural(r.months, "month")}`, m(r.total), { strong: true }],
    ],
    "Breakdown"
  );
  if (r.capped) html += note("60% of your salary is above your category's cap, so the payout is limited to the cap.", "warn");
  html += note(`Conditions: at least ${I.minSubscriptionMonths} months of continuous subscription, involuntary job loss, and a claim within ${I.claimWithinDays} days.`, "info");
  return html;
});
