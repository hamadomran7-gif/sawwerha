import { abuDhabiUtilityBill } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const money = (n) => moneyEn(n, "AED");
const sync = () => {
  const c = form.category.value;
  form.querySelectorAll("[data-home]").forEach((el) => (el.hidden = c === "commercial"));
  form.querySelectorAll("[data-rent]").forEach((el) => (el.hidden = c !== "expat"));
};
form.category.addEventListener("change", sync);
const band = (rows, unit, fils = false) =>
  rows.map((x, i) => [`${i === 0 && x.to !== null ? "Green band" : x.from > 0 ? "Red band (excess)" : "Flat rate"}: ${x.qty.toLocaleString("en-US")} ${unit} × ${fils ? `${(x.price * 100).toFixed(1)} fils` : `AED ${x.price.toFixed(2)}`}`, money(x.cost), { muted: true }]);

bind(form, result, (v) => {
  sync();
  const b = abuDhabiUtilityBill({ category: v.category, home: v.home, kwh: v.kwh || 0, m3: v.m3 || 0, days: v.days || 30, annualRent: v.annualRent || 0 });
  let html = big("Estimated monthly utility bill", money(b.total), `Electricity and water ${money(b.utilitiesTotal)} incl. VAT${b.municipality ? ` · municipality fee ${money(b.municipality)}` : ""}`);
  html += table(
    [
      ["Electricity", money(b.electricity)],
      ...band(b.elecRows, "kWh", true),
      ["Water", money(b.water)],
      ...band(b.waterRows, "m³"),
      ["VAT 5%", money(b.vat)],
      ["Electricity and water", money(b.utilitiesTotal), { strong: true }],
      b.municipality ? ["Municipality fee (5% of rent ÷ 12)", money(b.municipality)] : null,
      ["Total", money(b.total), { strong: true }],
    ],
    "Bill breakdown"
  );
  if (b.eCap !== null) {
    html += note(`Your green band for a ${numEn(b.days)}-day cycle: ${numEn(b.eCap)} kWh and ${b.wCap.toFixed(2)} m³. ${b.over.kwh || b.over.m3 ? `You went over by ${numEn(b.over.kwh)} kWh and ${b.over.m3.toFixed(2)} m³; the higher rate applies to the excess only.` : "All your use is inside it."}`, b.over.kwh || b.over.m3 ? "warn" : "info");
  }
  if (v.category === "national") html += note("UAE nationals pay no municipality fee on residential contracts for their own use.", "info");
  html += note("The band uses your average daily use over the billing cycle, so enter the cycle's days from your bill.", "info");
  return html;
});
