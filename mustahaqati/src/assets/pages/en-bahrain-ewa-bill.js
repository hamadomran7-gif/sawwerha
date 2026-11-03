import { bahrainEwaBill } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const bd = (n) => `BD ${n.toFixed(3)}`;
const fils = (p) => `${Math.round(p * 1000)} fils`;
const slabRows = (rows, unit) =>
  rows.map((x) => [`${x.to === null ? (x.from === 0 ? `${numEn(x.qty)} ${unit}` : `Above ${numEn(x.from)}: ${numEn(x.qty)} ${unit}`) : `${numEn(x.from)}–${numEn(x.to)} ${unit}`} × ${fils(x.price)}`, bd(x.cost), { muted: true }]);

bind(form, result, (v) => {
  const b = bahrainEwaBill({ category: v.category, kwh: v.kwh || 0, m3: v.m3 || 0, municipal: v.municipal || 0 });
  let html = big("Estimated monthly electricity and water bill", bd(b.total), `EWA ${bd(b.ewa)} incl. VAT${b.sewer ? ` · sewerage ${bd(b.sewer)}` : ""}${b.municipal ? ` · municipality ${bd(b.municipal)}` : ""}`);
  html += table(
    [
      ["Electricity", bd(b.electricity)],
      ...slabRows(b.elecRows, "kWh"),
      ["Water", bd(b.water)],
      ...slabRows(b.waterRows, "m³"),
      ["Fixed fee (BD 1 per account)", bd(b.fixedElec + b.fixedWater)],
      ["EWA bill", bd(b.ewa), { strong: true }],
      b.sewagePct ? [`Wastewater fee (${Math.round(b.sewagePct * 100)}% of the water charge)`, bd(b.sewer)] : null,
      b.municipal ? ["Municipality fees", bd(b.municipal)] : null,
      ["Total", bd(b.total), { strong: true }],
    ],
    "Bill breakdown"
  );
  if (b.category === "citizen" && b.support > 0) html += note(`Your first-home subsidy: at the unsubsidised rate (32 fils for electricity, 775 fils for water) the same use would cost ${bd(b.unsubsidised)}, so you save ${bd(b.support)} a month.`, "info");
  if (b.perKwh) html += note(`Your average price per kWh: ${(b.perKwh * 1000).toFixed(1)} fils. Tariffs already include VAT, so nothing is added on top.`, "info");
  if (b.category === "citizen") html += note("A citizen's first home pays no wastewater fee. In October 2026 Parliament backed a proposal to restore the previous subsidised tariffs; it has not been adopted.", "info");
  return html;
});
