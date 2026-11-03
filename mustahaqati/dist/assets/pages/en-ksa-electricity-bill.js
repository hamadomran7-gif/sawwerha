import { ksaElectricityBill, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const hal = (p) => `${numEn(Math.round(p * 100))} halalas`;

bind(form, result, (v) => {
  const res = v.sector === "residential";
  form.querySelectorAll("[data-res]").forEach((el) => (el.hidden = !res));
  form.querySelectorAll("[data-other]").forEach((el) => (el.hidden = res));
  if (v.kwh === null || v.kwh === undefined) return null;
  const E = rules.sa.electricity;
  const n = ksaElectricityBill({ kwh: v.kwh, sector: v.sector, amps: v.amps, days: v.days || 30, tariff: "new", fixedOverride: res ? null : v.fixedOther });
  let html = big("Your monthly bill on the 2027 tariff (incl. VAT)", m(n.total), `Before VAT ${m(n.subtotal)} · ${numEn(Number(v.kwh) || 0)} kWh`);
  html += table(
    [
      [`First ${numEn(Math.min(Number(v.kwh) || 0, E.tierKwh))} kWh × ${hal(n.p1)}`, m(n.t1 * n.p1)],
      n.t2 > 0 ? [`Above that: ${numEn(n.t2)} kWh × ${hal(n.p2)}`, m(n.t2 * n.p2)] : null,
      ["Consumption", m(n.consumption)],
      [res ? `Fixed fee (${m(n.fixedMonthly)} a month × ${numEn(v.days || 30)} days ÷ 30)` : "Fixed fee (as entered)", m(n.fixed)],
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
    html += note("Fixed fees for non-residential accounts have not been published in detail and depend on capacity and activity; enter yours if you know it.", "info");
  }
  html += note(`Eligible citizens receive SAR ${numEn(E.supportMonthly)} a month in support under the eligibility rules: civil and military state employees, retirees, families of deceased subscribers and retirees, and social security families.`, "ok");
  html += note("The new tariff applies to consumption from 1 January 2027; earlier consumption is billed at the current tariff. Your official bill is the reference.", "info");
  return html;
});
