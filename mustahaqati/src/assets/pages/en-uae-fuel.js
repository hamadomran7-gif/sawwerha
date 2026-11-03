import { uaeFuelCost } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const money = (n) => moneyEn(n, "AED");
const NAME = { super98: "Super 98", special95: "Special 95", eplus91: "E-Plus 91", diesel: "Diesel" };
const mf = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const mon = (k) => mf.format(new Date(`${k}-01T00:00:00Z`));
const r2 = (n) => Math.round(n * 100) / 100;
const sign = (n) => (n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2));

bind(form, result, (v) => {
  const r = uaeFuelCost({ fuel: v.fuel, tank: v.tank || 0, km: v.km || 0, per100: v.per100 || 0 });
  if (!r) return null;
  let html = big(`Full tank of ${NAME[v.fuel]} in ${mon(r.month)}`, money(r.tankCost), `AED ${r.price.toFixed(2)} a litre${r.prev !== null ? ` · ${money(Math.abs(r.tankCost - r.tankPrev))} ${r.change < 0 ? "less" : r.change > 0 ? "more" : "the same"} than ${mon(r.prevMonth)}` : ""}`);
  html += table(
    [
      ["Price per litre", `AED ${r.price.toFixed(2)}`],
      r.prev !== null ? [`${mon(r.prevMonth)} price`, `AED ${r.prev.toFixed(2)} (${sign(r.change)}, ${sign(r.changePct)}%)`, { muted: true }] : null,
      ["Litres a month", `${numEn(r.litres)} L`],
      ["Monthly fuel cost", money(r.monthly), { strong: true }],
      ["Yearly cost at this month's prices", money(r.yearly)],
    ],
    "Your cost"
  );
  html += table(
    Object.entries(r.all).map(([k, x]) => [`${NAME[k]}: AED ${x.price.toFixed(2)}${x.prev !== null ? ` (${sign(r2(x.price - x.prev))})` : ""}`, money(x.tank), k === v.fuel ? { strong: true } : {}]),
    `A ${numEn(v.tank || 0)}-litre tank with each fuel`
  );
  html += note("Retail prices include VAT and change on the first of every month.", "info");
  return html;
});
