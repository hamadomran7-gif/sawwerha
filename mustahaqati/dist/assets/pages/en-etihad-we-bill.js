import { etihadWeBill } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const money = (n) => moneyEn(n, "AED");
const slab = (rows, unit, fils) =>
  rows.map((x) => [`${x.to === null ? (x.from === 0 ? `${x.qty.toLocaleString("en-US")} ${unit}` : `Above ${numEn(x.from)}: ${x.qty.toLocaleString("en-US")} ${unit}`) : `${numEn(x.from)}–${numEn(x.to)} ${unit}`} × ${fils ? `${(x.price * 100).toFixed(1)} fils` : `AED ${x.price.toFixed(2)}`}`, money(x.cost), { muted: true }]);

bind(form, result, (v) => {
  const b = etihadWeBill({ category: v.category, kwh: v.kwh || 0, m3: v.m3 || 0, other: v.other || 0 });
  let html = big("Estimated monthly electricity and water bill", money(b.total), `Before VAT ${money(b.base)} · VAT ${money(b.vat)}`);
  html += table(
    [
      ["Electricity (tariff)", money(b.electricity)],
      ...slab(b.elecRows, "kWh", true),
      b.surcharge ? [`Surcharge (${Math.round(b.surchargeRate * 100)} fils per kWh)`, money(b.surcharge)] : null,
      ["Water", money(b.water)],
      ...slab(b.waterRows, "m³", false),
      ["VAT 5%", money(b.vat)],
      b.other ? ["Other charges on your bill", money(b.other)] : null,
      ["Total", money(b.total), { strong: true }],
    ],
    "Bill breakdown"
  );
  if (b.perKwh) html += note(`Your average price per kWh with the surcharge: ${(b.perKwh * 100).toFixed(2)} fils before VAT.`, "info");
  if (b.category === "national") html += note("The citizens' home tariff is 7.5 fils per kWh and AED 3.30 per m³: one slab and no surcharge.", "info");
  return html;
});
