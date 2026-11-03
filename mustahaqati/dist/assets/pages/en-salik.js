import { uaeSalikCost } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const money = (n) => moneyEn(n, "AED");

bind(form, result, (v) => {
  const r = uaeSalikCost({ peakPerDay: v.peakPerDay || 0, lowPerDay: v.lowPerDay || 0, workdays: v.workdays ?? 5, sundayPerWeek: v.sundayPerWeek || 0, asOf: new Date() });
  let html = big("Monthly Salik cost", money(r.monthly), `About ${numEn(r.crossingsMonthly)} crossings a month${r.vat ? ` · incl. VAT of ${money(r.vatMonthly)}` : ""}`);
  html += table(
    [
      ["Peak crossing", money(r.peak)],
      ["Low-peak or Sunday crossing", money(r.low)],
      ["Cost per working day", money(r.daily)],
      ["Weekly cost", money(r.weekly)],
      ["Monthly cost (4.33 weeks)", money(r.monthly), { strong: true }],
      ["Yearly cost", money(r.yearly)],
    ],
    r.vat ? "Prices include 5% VAT" : "Before VAT"
  );
  html += note("Crossings from 1 to 6 AM are free (2 to 7 AM in Ramadan). Sunday rates do not apply on public holidays and public event days.", "info");
  return html;
});
