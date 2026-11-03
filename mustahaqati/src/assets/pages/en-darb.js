import { abuDhabiDarbCost } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const money = (n) => moneyEn(n, "AED");

bind(form, result, (v) => {
  const r = abuDhabiDarbCost({ crossingsPerDay: v.crossingsPerDay || 0, days: v.days ?? 5 });
  let html = big("Monthly Darb cost", money(r.monthly), `About ${numEn(r.crossingsMonthly)} peak crossings a month at AED 4 each`);
  html += table(
    [
      ["Cost per day", money(r.daily)],
      ["Weekly cost", money(r.weekly)],
      ["Monthly cost (4.33 weeks)", money(r.monthly), { strong: true }],
      ["Yearly cost", money(r.yearly)],
    ],
    "Your cost"
  );
  html += note("No daily or monthly cap since 1 September 2025. Off-peak crossings, Sundays and public holidays are free, and eligible groups are exempt after registering.", "info");
  return html;
});
