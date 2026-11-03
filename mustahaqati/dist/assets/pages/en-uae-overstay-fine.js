import { overstayFine, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "AED");
const O = rules.ae.overstay;
const EVENT = { visit: "Visa expiry date", permit: "Departure permit issue date", newborn: "Date of birth", eid: "Emirates ID expiry date" };
const EXIT = { newborn: "Residence issue or exit date", eid: "Renewal date" };
const diffDays = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const days = (n) => plural(n, "day");

bind(form, result, (v) => {
  const t = v.type;
  form.querySelector('label[for="event"]').textContent = EVENT[t] || "Cancellation or residence expiry date";
  form.querySelector('label[for="exit"]').textContent = EXIT[t] || "Exit or status change date";
  const noPermit = t === "eid" || t === "newborn";
  form.querySelectorAll("[data-permit]").forEach((el) => (el.hidden = noPermit));
  const r = overstayFine({ country: "ae", type: t, event: v.event, exit: v.exit });
  if (!r) return null;
  const T = O.types[t];
  const perDay = T.perDay ?? O.perDay;
  const grace = t === "permit" ? "7 days from issue" : t === "newborn" ? "120 days from birth" : t === "eid" ? "30 days from expiry" : T.grace ? days(T.grace) : "None";
  const fees = v.permitFee && !noPermit ? O.departurePermit + O.smartFee : 0;

  let html;
  if (!r.days) {
    const left = diffDays(v.exit, r.lastAllowed);
    html = big("No fine", m(fees), `Last fine-free day ${dateEn(r.lastAllowed)}${left > 0 ? `, ${days(left)} left` : ""}`);
    html += table([["Grace period", grace], ["Last fine-free day", dateEn(r.lastAllowed)], fees ? ["Departure permit (200) + smart services (100)", m(fees)] : null], "Details");
  } else {
    html = big("Estimated fine", m(r.total + fees), `${days(r.days)} × ${m(perDay)} after ${dateEn(r.lastAllowed)}`);
    html += table(
      [
        ["Grace period", grace],
        ["Last fine-free day", dateEn(r.lastAllowed)],
        ["Overstay days (exit day counted)", days(r.days)],
        [`Fine: ${days(r.days)} × ${m(perDay)}`, m(r.gross)],
        r.capped ? [`After the ${m(r.cap)} cap (reached on day ${r.capDay})`, m(r.total)] : null,
        fees ? ["Departure permit (200) + smart services (100)", m(fees)] : null,
        ["Total", m(r.total + fees), { strong: true }],
      ],
      "Fine breakdown"
    );
    if (r.waiverDays) html += note(`If you could not travel because of the airspace closure, fines for ${days(r.waiverDays)} between 28 February and 9 July 2026 were waived, which brings the fine to ${m(r.totalAfterWaiver + fees)}.`, "info");
    if (r.totalAlt) html += note(`The u.ae government portal says AED 100 a day for newborn residence, which would make the fine ${m(r.totalAlt)}; we use 50 as stated on the ICP page.`, "warn");
  }
  if (t === "res60") html += note("The 60-day grace period applies to residence permits issued with a guarantor or host, which according to press reports citing ICP covers employees, families and domestic workers. Check the last exit date on your cancellation form or ICP smart services.", "warn");
  if (t === "eid") html += note(`Renewal fees are added: ${m(100)} for each year of residence and ${m(100)} for the smart app. The 30-day period after expiry comes from press reports.`, "info");
  html += note("Results are estimates and may differ by one day depending on how days are counted. No cap on the daily fine is published, and you can ask ICP or GDRFA Dubai for a waiver or reduction.", "info");
  return html;
});
