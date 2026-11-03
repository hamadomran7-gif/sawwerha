import { gccFuelCost } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const money = (n) => moneyEn(n, "QAR");
const NAME = { premium91: "Premium 91", super95: "Super 95", diesel: "Diesel" };
const mf = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const mon = (k) => mf.format(new Date(`${k}-01T00:00:00Z`));
const sign = (n) => (n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2));
const r2 = (n) => Math.round(n * 100) / 100;

bind(form, result, (v) => {
  const r = gccFuelCost({ country: "qa", fuel: v.fuel, tank: v.tank || 0, km: v.km || 0, per100: v.per100 || 0 });
  if (!r) return null;
  const diff = r.prev !== null ? r2(r.tankCost - r.tankPrev) : null;
  let html = big(`Full tank of ${NAME[r.fuel]} in ${mon(r.month)}`, money(r.tankCost), `QAR ${r.price.toFixed(2)} a litre${diff !== null ? ` · ${diff < 0 ? `${money(-diff)} less than ${mon(r.prevMonth)}` : diff > 0 ? `${money(diff)} more than ${mon(r.prevMonth)}` : `same as ${mon(r.prevMonth)}`}` : ""}`);
  html += table(
    [
      ["Price a litre", `QAR ${r.price.toFixed(2)}`],
      r.prev !== null ? [`${mon(r.prevMonth)} price`, `QAR ${r.prev.toFixed(2)}${r.change ? ` (${sign(r.change)}, ${sign(r.changePct)}%)` : " (unchanged)"}`, { muted: true }] : null,
      ["Litres a month", `${numEn(r.litres)} L`],
      ["Monthly fuel cost", money(r.monthly), { strong: true }],
      ["Yearly cost at this month's prices", money(r.yearly)],
    ],
    "Your cost"
  );
  html += table(
    Object.entries(r.all).map(([k, x]) => [`${NAME[k]}: QAR ${x.price.toFixed(2)}${x.prev !== null && x.price !== x.prev ? ` (${sign(r2(x.price - x.prev))})` : ""}`, money(x.tank), k === r.fuel ? { strong: true } : {}]),
    `A ${numEn(v.tank || 0)}-litre tank with each fuel`
  );
  html += note("QatarEnergy announces prices on the last day of each month, effective from the 1st; there is no VAT on fuel.", "info");
  return html;
});
