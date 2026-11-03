import { kuwaitUtilityBill } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const kd = (n) => `KD ${n.toFixed(3)}`;
const NAME = { private: "Private housing", investment: "Investment housing", commercial: "Commercial", government: "Government", industrial: "Industrial and agricultural", other: "Other sectors" };

bind(form, result, (v) => {
  const b = kuwaitUtilityBill({ category: v.category, kwh: v.kwh || 0, water: v.water || 0, waterUnit: v.waterUnit });
  let html = big("Estimated monthly electricity and water bill", kd(b.total), `Electricity ${kd(b.electricity)} · water ${kd(b.water)}`);
  html += table(
    [
      ["Tariff applied", NAME[b.category] + (v.category === "kuwaitiInvestment" ? " (Kuwaiti in investment housing)" : "")],
      [`Electricity: ${numEn(v.kwh || 0)} kWh × ${Math.round(b.priceKwh * 1000)} fils`, kd(b.electricity)],
      [`Water: ${numEn(b.gallons)} gallons (${b.m3.toFixed(2)} m³) × KD ${b.pricePer1000.toFixed(3)} per 1,000 gallons`, kd(b.water)],
      ["Total", kd(b.total), { strong: true }],
    ],
    "Bill breakdown"
  );
  if (b.elecSupport > 0) html += note(`Electricity really costs about 48 fils per kWh, so at full cost your power would be ${kd(b.realElec)}: the state covers about ${kd(b.elecSupport)} a month.`, "info");
  if (v.category === "kuwaitiInvestment") html += note("A Kuwaiti living in investment housing pays the private-housing rate for one unit, provided they have no other housing support and register with the ministry.", "info");
  html += note("The applied tariff has no slabs: one price per kWh by property type. The Hafez programme can cut up to 90% a year for households that reduce use; the calculator leaves it out.", "info");
  return html;
});
