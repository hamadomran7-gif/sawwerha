import { uaeDewaBill, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const money = (n) => moneyEn(n, "AED");
const D = rules.ae.dewa;
const sync = () => {
  const c = form.category.value;
  form.querySelectorAll("[data-housing]").forEach((el) => (el.hidden = c !== "residential"));
};
form.category.addEventListener("change", sync);

const slabRows = (rows, unit) => rows.map((x) => [`${x.to === null ? `Above ${numEn(x.from)}` : `${numEn(x.from)}–${numEn(x.to)}`} ${unit} × ${x.price}`, money(x.cost), { muted: true }]);

bind(form, result, (v) => {
  sync();
  const b = uaeDewaBill({ category: v.category, kwh: v.kwh || 0, m3: v.m3 || 0, annualRent: v.annualRent || 0, elecMeter: v.elecMeter, waterMeter: v.waterMeter, fuelElec: v.fuelElec, fuelWater: v.fuelWater, asOf: new Date() });
  const municipal = b.sewer + b.housing;
  let html = big("Estimated monthly DEWA bill", money(b.total), `DEWA ${money(b.dewa + b.vat)} incl. VAT · Dubai Municipality ${money(municipal)}`);
  html += table(
    [
      ["Electricity by slab", money(b.electricity)],
      ...slabRows(b.elecRows, "kWh"),
      b.fuelElec ? [`Electricity fuel surcharge (AED ${b.fuelRates.electricity})`, money(b.fuelElec)] : null,
      ["Water by slab", money(b.water)],
      ...slabRows(b.waterRows, "m³"),
      b.fuelWater ? [`Water fuel surcharge (AED ${b.fuelRates.water})`, money(b.fuelWater)] : null,
      ["Meter charges", money(b.meterElec + b.meterWater)],
      ["DEWA items", money(b.dewa), { strong: true }],
      ["VAT 5%", money(b.vat)],
      [`Sewerage (${b.sewerFils} fils a gallon = AED ${numEn(b.sewerPerM3)}/m³)`, money(b.sewer)],
      v.category === "residential" ? ["Housing fee (5% of rent ÷ 12)", money(b.housing)] : null,
      ["Total", money(b.total), { strong: true }],
    ],
    "Bill breakdown"
  );
  if (b.perKwh) html += note(`Your average cost per kWh with the fuel surcharge: ${numEn(b.perKwh * 100)} fils before VAT.`, "info");
  if (new Date() < new Date("2027-01-01T00:00:00")) {
    const next = uaeDewaBill({ category: v.category, kwh: v.kwh || 0, m3: v.m3 || 0, annualRent: v.annualRent || 0, elecMeter: v.elecMeter, waterMeter: v.waterMeter, fuelElec: v.fuelElec, fuelWater: v.fuelWater, asOf: new Date("2027-01-15T08:00:00") });
    if (next.sewer > b.sewer) html += note(`From January 2027 sewerage rises to 2.8 fils a gallon, so this line becomes ${money(next.sewer)} instead of ${money(b.sewer)} for the same use.`, "warn");
  }
  if (v.category === "national") html += note("The UAE nationals' tariff is from Executive Council Resolution 16 of 2011 with water converted to cubic metres (10,000 gallons ≈ 45.46 m³); nationals' homes pay no fuel surcharge and no housing fee.", "info");
  html += note(`The fuel surcharge changes monthly (defaults: ${D.fuel.electricity} and ${D.fuel.water}, November 2026). The actual bill follows the meter reading and the days in the billing cycle.`, "info");
  return html;
});
