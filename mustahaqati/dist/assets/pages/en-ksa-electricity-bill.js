import { ksaElectricityBill, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const hal = (p) => `${numEn(Math.round(p * 100))} halalas`;
const ampsEl = form.querySelector("#amps");
const ampsText = ampsEl ? [...ampsEl.options].map((o) => o.textContent.replace(/\s*\(.*\)$/, "")) : [];

bind(form, result, (v) => {
  const res = v.sector === "residential";
  form.querySelectorAll("[data-res]").forEach((el) => (el.hidden = !res));
  form.querySelectorAll("[data-other]").forEach((el) => (el.hidden = res));
  const E = rules.sa.electricity;
  // Breaker-capacity labels show the selected sector's fee from the Saudi Energy Company table
  const fees = res ? E.residentialFixed.map((b) => b[2]) : E.sectorFixed[v.sector] || [];
  if (ampsEl) [...ampsEl.options].forEach((o, i) => (o.textContent = fees[i] !== undefined ? `${ampsText[i]} (SAR ${numEn(fees[i])})` : ampsText[i]));
  if (v.kwh === null || v.kwh === undefined) return null;
  const manual = !res && v.fixedOther !== null && v.fixedOther !== undefined && v.fixedOther !== "";
  const n = ksaElectricityBill({ kwh: v.kwh, sector: v.sector, amps: v.amps, days: v.days || 30, tariff: "new", fixedOverride: res ? null : v.fixedOther });
  let html = big("Your monthly bill on the 2027 tariff (incl. VAT)", m(n.total), `Before VAT ${m(n.subtotal)} · ${numEn(Number(v.kwh) || 0)} kWh`);
  html += table(
    [
      [`First ${numEn(Math.min(Number(v.kwh) || 0, E.tierKwh))} kWh × ${hal(n.p1)}`, m(n.t1 * n.p1)],
      n.t2 > 0 ? [`Above that: ${numEn(n.t2)} kWh × ${hal(n.p2)}`, m(n.t2 * n.p2)] : null,
      ["Consumption", m(n.consumption)],
      [`Fixed fee (${m(n.fixedMonthly)} a month${manual ? " as entered" : ""} × ${numEn(v.days || 30)} days ÷ 30)`, m(n.fixed)],
      ["Before VAT", m(n.subtotal)],
      [`VAT ${numEn(E.vat * 100)}%`, m(n.vat)],
      ["Total", m(n.total), { strong: true }],
    ],
    "New bill breakdown"
  );
  if (res) {
    const hasOld = v.oldFee !== null && v.oldFee !== undefined && v.oldFee !== "";
    const o = ksaElectricityBill({ kwh: v.kwh, sector: "residential", days: v.days || 30, tariff: "old", fixedOverride: hasOld ? v.oldFee : 0 });
    const diff = n.total - o.total;
    html += table(
      [
        [`Consumption on the current tariff (${hal(o.p1)} and ${hal(o.p2)})`, m(o.consumption)],
        hasOld ? ["Current meter fee", m(o.fixed)] : null,
        ["Current bill incl. VAT", m(o.total)],
        ["New bill incl. VAT", m(n.total)],
        ["Monthly difference", `${diff >= 0 ? "+" : "−"}${m(Math.abs(diff))}${o.total ? ` (${numEn(Math.round((diff / o.total) * 1000) / 10)}%)` : ""}`, { strong: true }],
      ],
      "Compared with the current tariff"
    );
    if (!hasOld) html += note("The comparison leaves out the meter fee on your current bill because its schedule is not published in detail; enter it from your bill for an exact comparison.", "info");
  } else {
    html += note(manual ? "The fixed fee you entered replaces the Saudi Energy Company table for this sector." : `Fixed fee of SAR ${numEn(n.fixedMonthly)} a month before VAT, from the Saudi Energy Company table for your account type and breaker capacity (see "Non-residential fixed fees" below); if your bill shows a different fee, enter it in the fixed-fee field to use it instead.`, "info");
  }
  html += note(`Eligible citizens receive SAR ${numEn(E.supportMonthly)} a month in support under the eligibility rules: civil and military state employees, retirees, families of deceased subscribers and retirees, and social security families.`, "ok");
  html += note("The new tariff applies to consumption from 1 January 2027; earlier consumption is billed at the current tariff. Your official bill is the reference.", "info");
  return html;
});
