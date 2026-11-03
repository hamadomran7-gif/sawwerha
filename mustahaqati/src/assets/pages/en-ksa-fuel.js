import { ksaFuelCost } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const money = (n) => moneyEn(n, "SAR");
const NAME = { g91: "Gasoline 91", g95: "Gasoline 95", diesel: "Diesel" };

bind(form, result, (v) => {
  const r = ksaFuelCost({ fuel: v.fuel, tank: v.tank || 0, km: v.km || 0, per100: v.per100 || 0 });
  if (!r) return null;
  let html = big(`Full tank of ${NAME[v.fuel]}`, money(r.tankCost), `SAR ${r.price.toFixed(2)} a litre incl. VAT`);
  html += table(
    [
      ["Litres a month", `${numEn(r.litres)} L`],
      ["Monthly fuel cost", money(r.monthly), { strong: true }],
      ["Yearly cost", money(r.yearly)],
    ],
    "Your cost"
  );
  html += table(Object.entries(r.all).map(([k, x]) => [`${NAME[k]}: SAR ${x.price.toFixed(2)}`, money(x.tank), k === v.fuel ? { strong: true } : {}]), `A ${numEn(v.tank || 0)}-litre tank with each fuel`);
  html += note("Gasoline 91, 95 and diesel stay fixed until Aramco's yearly review; gasoline 98 is priced monthly.", "info");
  return html;
});
