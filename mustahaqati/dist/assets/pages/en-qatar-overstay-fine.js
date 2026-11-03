import { overstayFine, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "QR");
const days = (n) => plural(n, "day");
const O = rules.qa.overstay;
const EVENT = { cancelled: "Residence cancellation date", visit: "Visit expiry date", notCompleted: "Entry date" };
const EXIT = { notCompleted: "Residence completion date" };

bind(form, result, (v) => {
  const t = v.type;
  form.querySelector('label[for="event"]').textContent = EVENT[t];
  form.querySelector('label[for="exit"]').textContent = EXIT[t] || "Exit or settlement date";
  const r = overstayFine({ country: "qa", type: t, event: v.event, exit: v.exit });
  if (!r) return null;
  const T = O.types[t];
  const grace = T.grace ? days(T.grace) : "None";
  if (!r.days) return big("No fine", m(0), `Last fine-free day ${dateEn(r.lastAllowed)}`) + note(`Grace period: ${grace}.`, "info");
  let html = big("Estimated fine", m(r.totalCapReported ?? r.total), `${days(r.days)} × ${m(T.perDay)} after ${dateEn(r.lastAllowed)}`);
  html += table(
    [
      ["Grace period", grace],
      ["Last fine-free day", dateEn(r.lastAllowed)],
      ["Overstay days (exit day counted)", days(r.days)],
      [`${days(r.days)} × ${m(T.perDay)}`, m(r.gross)],
      r.capped ? [`After the ${m(r.cap)} cap`, m(r.total)] : null,
      r.totalCapReported !== undefined && r.totalCapReported < r.gross ? [`After the reported ${m(T.capReported)} cap`, m(r.totalCapReported), { strong: true }] : ["Fine", m(r.total), { strong: true }],
    ],
    "Fine breakdown"
  );
  if (t === "visit") html += note(`The ${m(T.capReported)} cap on the visit fine comes from an unofficial source; without it the fine is ${m(r.gross)}.`, "warn");
  if (t === "cancelled") html += note("The 14-day period follows a Ministry of Interior statement in June 2026 (previously 30 days); it is unclear whether it also applies when a residence expires, and no cap on the fine is published.", "warn");
  if (t === "notCompleted") html += note("QR 10 a day is the settlement amount, capped at QR 6,000; if the case is referred, the fine can reach QR 10,000 (Article 40).", "info");
  html += note("Figures come from Ministry of Interior statements as reported by the press. Results are estimates and may differ by one day depending on how days are counted.", "info");
  return html;
});
