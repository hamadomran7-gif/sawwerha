import { gccFuelCost } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const NAME = { m91: "M91 petrol", m95: "M95 petrol", diesel: "Diesel" };
const omr = (n) => `OMR ${n.toFixed(3)}`;
const baisa = (p) => `${Math.round(p * 1000)} baisa`;

bind(form, result, (v) => {
  const r = gccFuelCost({ country: "om", fuel: v.fuel, tank: v.tank || 0, km: v.km || 0, per100: v.per100 || 0 });
  if (!r) return null;
  let html = big(`Full tank of ${NAME[r.fuel]}`, omr(r.tankCost), `${baisa(r.price)} a litre incl. 5% VAT`);
  html += table(
    [
      ["Price a litre", `${baisa(r.price)} (OMR ${r.price.toFixed(3)})`],
      ["Litres a month", `${numEn(r.litres)} L`],
      ["Monthly fuel cost", omr(r.monthly), { strong: true }],
      ["Yearly cost", omr(r.yearly)],
    ],
    "Your cost"
  );
  html += table(Object.entries(r.all).map(([k, x]) => [`${NAME[k]}: ${baisa(x.price)}`, omr(x.tank), k === r.fuel ? { strong: true } : {}]), `A ${numEn(v.tank || 0)}-litre tank with each fuel`);
  html += note("Prices are frozen at their October 2021 level under a Royal directive, with the government covering the gap to world prices.", "info");
  return html;
});
