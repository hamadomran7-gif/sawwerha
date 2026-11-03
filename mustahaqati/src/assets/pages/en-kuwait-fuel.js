import { gccFuelCost } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const NAME = { g91: "Premium 91", g95: "Super 95", ultra98: "Ultra 98", diesel: "Diesel" };
const kd = (n) => `KD ${n.toFixed(3)}`;
const fils = (p) => `${Math.round(p * 1000)} fils`;

bind(form, result, (v) => {
  const r = gccFuelCost({ country: "kw", fuel: v.fuel, tank: v.tank || 0, km: v.km || 0, per100: v.per100 || 0 });
  if (!r) return null;
  let html = big(`Full tank of ${NAME[r.fuel]}`, kd(r.tankCost), `${fils(r.price)} a litre`);
  html += table(
    [
      ["Price a litre", `${fils(r.price)} (KD ${r.price.toFixed(3)})`],
      ["Litres a month", `${numEn(r.litres)} L`],
      ["Monthly fuel cost", kd(r.monthly), { strong: true }],
      ["Yearly cost", kd(r.yearly)],
    ],
    "Your cost"
  );
  html += table(Object.entries(r.all).map(([k, x]) => [`${NAME[k]}: ${fils(x.price)}`, kd(x.tank), k === r.fuel ? { strong: true } : {}]), `A ${numEn(v.tank || 0)}-litre tank with each fuel`);
  if (r.fuel === "ultra98") html += note("Ultra 98 is repriced every quarter; this is the Q3 2026 decision (275 fils) and we found no published Q4 decision.", "warn");
  else html += note("Premium 91, Super 95 and diesel prices have been fixed since the September 2016 reform, and Kuwait has no VAT.", "info");
  return html;
});
