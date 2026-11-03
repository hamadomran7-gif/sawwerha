import { overstayFine } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "KD");
const days = (n) => plural(n, "day");
const EVENT = { visit: "Visit expiry date", temporary: "Temporary residence or notice expiry date", newborn: "Date of birth" };
const EXIT = { newborn: "Registration date" };

bind(form, result, (v) => {
  const t = v.type;
  form.querySelector('label[for="event"]').textContent = EVENT[t] || "Residence expiry date";
  form.querySelector('label[for="exit"]').textContent = EXIT[t] || "Exit or settlement date";
  const r = overstayFine({ country: "kw", type: t, event: v.event, exit: v.exit });
  if (!r) return null;
  if (!r.days) {
    return big("No fine", m(0), t === "newborn" ? `Last day to register: ${dateEn(r.lastAllowed)}` : `On or before ${dateEn(r.lastAllowed)}`) +
      note(t === "newborn" ? "A newborn can be registered within 4 months of birth without a fine." : "No grace period is published after a residence or visit expires; the fine starts the day after expiry.", "info");
  }
  let html = big("Fine", m(r.total), `${days(r.days)} after ${dateEn(r.lastAllowed)}${r.capped ? " · cap reached" : ""}`);
  html += table(
    [
      t === "newborn" ? ["Last fine-free registration day", dateEn(r.lastAllowed)] : ["Expiry date", dateEn(r.lastAllowed)],
      ["Days in violation (exit day counted)", days(r.days)],
      ...r.rows.map((x) => [`${days(x.days)} × ${m(x.perDay)}${r.rows.length > 1 ? (x.from === 1 ? " (first month)" : " (after the first month)") : ""}`, m(x.amount)]),
      r.capped ? [`After the ${m(r.cap)} cap (reached on day ${r.capDay})`, m(r.total)] : null,
      ["Fine due", m(r.total), { strong: true }],
    ],
    "Fine breakdown"
  );
  if (!r.capped && r.capDay) html += note(`The fine reaches its ${m(r.cap)} cap on day ${r.capDay} of the violation.`, "info");
  if (r.rows.length > 1 || t === "newborn") html += note("We assume the \"first month\" is 30 days; the published text does not say whether it is a calendar month.", "info");
  if (t === "newborn") html += note("The newborn tiers (2 then 4) come from two press reports; a third source reported KD 2 a day without tiers, with the same cap.", "warn");
  html += note("The fines are settlements: paying ends the violation; otherwise the case is referred and deportation is possible. Results are estimates and may differ by one day depending on how days are counted.", "info");
  return html;
});
