import { dubaiRentIncrease, shiftDate, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");

bind(form, result, (v) => {
  const r = dubaiRentIncrease({ rent: v.rent, average: v.average });
  if (!r) return null;
  const R = rules.ae.dubaiRent;
  const below = r.gapPct > 0;
  let html = r.pct
    ? big("Maximum annual rent on renewal", m(r.maxRent), `A ${numEn(r.pct * 100)}% increase = ${m(r.increase)} a year`)
    : big("No increase allowed on renewal", m(Number(v.rent)), below ? `Your rent is only ${numEn(Math.round(r.gapPct * 10) / 10)}% below the average` : "Your rent equals or exceeds the average");
  html += table(
    [
      ["Current rent", m(Number(v.rent))],
      ["Index average for a similar unit", m(Number(v.average))],
      [below ? "Your rent is below the average by" : "Your rent is above the average by", `${numEn(Math.abs(r.gapPct))}%`],
      ["Maximum increase (Decree 43)", `${numEn(r.pct * 100)}%`],
      ["Annual increase", m(r.increase)],
      ["Monthly increase", m(r.monthlyIncrease), { muted: true }],
      ["Maximum new rent", m(r.maxRent), { strong: true }],
    ],
    "Breakdown"
  );
  if (v.expiry) {
    const deadline = shiftDate(v.expiry, -R.noticeDays);
    const today = new Date().toISOString().slice(0, 10);
    html += note(`Last date to notify you of any increase: ${dateEn(deadline)} (${R.noticeDays} days before the lease expires on ${dateEn(v.expiry)}).${today > deadline ? " That date has passed — if you were not notified by then, lawyers consider the increase unenforceable for this renewal." : ""}`, today > deadline ? "warn" : "info");
  }
  if (r.gapPct > 10 && r.gapPct < 11) html += note("The gap is between 10% and 11%. The decree says \"up to 10%\" and then \"11% to 20%\"; we treat anything above 10% as the second band. Check the index figure.", "info");
  html += note("The binding figure is what the Dubai Smart Rental Index shows for your unit, so enter its average exactly. Disputes go to the Rental Dispute Centre.", "info");
  return html;
});
