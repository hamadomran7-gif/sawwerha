import { ksaWaterBill, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const range = (t) => (t.to ? `${numEn(t.from)}–${numEn(t.to)} m³` : t.from ? `Over ${numEn(t.from)} m³` : "All consumption");

bind(form, result, (v) => {
  const res = v.sector === "residential";
  form.querySelectorAll("[data-res]").forEach((el) => (el.hidden = !res));
  form.querySelectorAll("[data-meter]").forEach((el) => (el.hidden = v.sector === "government"));
  if (v.m3 === null || v.m3 === undefined) return null;
  const W = rules.sa.waterBill;
  const sewer = v.sewer !== "no";
  const withVat = v.vat !== "no";
  const n = ksaWaterBill({ m3: v.m3, sector: v.sector, meter: v.meter, units: v.units, sewer, vat: withVat });
  if (!n) return null;
  let html = big(`Monthly water bill, 2027 tariff (${withVat ? "incl. VAT" : "before VAT"})`, m(n.total), `${numEn(Number(v.m3) || 0)} m³${n.perM3 ? ` · ${m(n.perM3)} per m³ on average` : ""}`);
  const rows = n.tiers.map((t) => [`${range(t)}: ${numEn(t.qty)} m³ × ${numEn(t.price)}${sewer ? ` + sewage ${numEn(t.price * W.sewerShare)}` : ""}`, m(t.water + t.sewer)]);
  rows.push(["Water", m(n.water)]);
  if (sewer) rows.push(["Sewage (half the water charge)", m(n.sewer)]);
  rows.push([sewer ? `Fixed fees (${numEn(n.fixedWater)} water + ${numEn(n.fixedSewer)} sewage)` : "Fixed water fee", m(n.fixed)]);
  rows.push(["Before VAT", m(n.subtotal)]);
  if (withVat) rows.push([`VAT ${numEn(W.vat * 100)}%`, m(n.vat)]);
  rows.push(["Total", m(n.total), { strong: true }]);
  html += table(rows, "New bill breakdown");

  if (res) {
    const o = ksaWaterBill({ m3: v.m3, sector: "residential", sewer, tariff: "current", vat: withVat });
    const diff = n.total - o.total;
    const sign = diff >= 0 ? "+" : "−";
    html += table(
      [
        ["Bill at the current tariff (no meter fee)", m(o.total)],
        ["Bill at the new tariff", m(n.total)],
        ["Monthly difference", `${sign}${m(Math.abs(diff))}`, { strong: true }],
        ["Difference over a year", `${sign}${m(Math.abs(diff) * 12)}`],
      ],
      "Compared with the current tariff"
    );
    html += note("Current tariff (2016): 10 halalas per m³ up to 15, SAR 1 up to 30, 3 up to 45, 4 up to 60 and 6 above, with sewage at 50%. The comparison leaves out any meter fee on your current bill.", "info");
    if (Number(v.units) > 1) html += note("It has not been published whether the tier limits multiply with the number of units on one meter; the calculator applies the tiers to the whole consumption and adds only the extra-unit fees.", "warn");
  } else {
    html += note(v.sector === "government" ? "Government: SAR 10 per m³ for water and 5 for sewage, with fixed fees of SAR 1,000 for water and 500 for sewage." : "Non-residential: one tier of SAR 8 per m³ for water and 4 for sewage, with a fixed fee by meter size. Industrial and agricultural use is not covered by the change.", "info");
  }
  if (!sewer) html += note("The new tariff announcement does not say explicitly whether unconnected properties pay sewage; the calculator leaves it out, as under the current tariff.", "info");
  html += note(`SAR ${numEn(W.supportMonthly)} a month of support goes to eligible people: civil and military state employees, retirees, family members of deceased insured people and retirees, and social security families.`, "ok");
  html += note("The new figures come from the National Water Company's announcement as reported by the press, and apply to consumption from 1 January 2027. Your official bill is the reference.", "info");
  return html;
});
