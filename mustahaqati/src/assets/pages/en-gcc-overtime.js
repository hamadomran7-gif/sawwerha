import { gccOvertime, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const C = form.dataset.country;
const CUR = { qa: "QAR", kw: "KWD", om: "OMR", bh: "BHD" }[C];
const DIG = C === "qa" ? 2 : 3;
const fmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: DIG, maximumFractionDigits: DIG });
const m = (x) => `${CUR} ${fmt.format(x)}`;
const pct = (mult) => `+${numEn((mult - 1) * 100)}%`;
const O = rules[C].overtime;
const LABEL = {
  day: "Daytime overtime",
  night: `Night overtime (${O.nightFrom}:00–${String(O.nightTo).padStart(2, "0")}:00)`,
  rest: "Work on the rest day",
  holiday: "Work on a public holiday",
};

bind(form, result, (v) => {
  form.querySelectorAll("[data-om]").forEach((el) => (el.hidden = C !== "om"));
  if (!v.wage) return null;
  const r = gccOvertime({ country: C, wage: v.wage, day: v.day, night: v.night, rest: v.rest, holiday: v.holiday, restCash: v.restMode !== "day", consent: v.consent !== "no", altDivisor: v.divisor === "alt" });
  if (!r || !r.rows.length) return big("Hourly wage", m(r ? r.hourly : 0), "Enter your overtime hours to see what you are owed");
  let html = big("Overtime pay due", m(r.total), `Hourly wage ${m(r.hourly)} · on top of your monthly salary`);
  html += table(
    [
      [`Hourly wage: ${r.basis === "basic" ? "basic salary" : "total wage"} ÷ ${numEn(r.divisor)}`, m(r.hourly)],
      ...r.rows.map((x) => [`${LABEL[x.type]}: ${numEn(x.hours)} h × ${numEn(x.mult)} (${pct(x.mult)})`, x.cash ? m(x.amount) : C === "om" ? "Compensatory leave instead of pay" : "Substitute rest day instead of pay"]),
      ["Total", m(r.total), { strong: true }],
    ],
    "How it is calculated"
  );
  if (r.substituteDays) html += note(`On top of the pay you are owed ${r.substituteDays === 1 ? "a substitute rest day" : "two substitute rest days"} (Articles 67 and 68).`, "info");
  const tips = {
    qa: "Working time may not exceed 10 actual hours a day including overtime. On the rest day (normally Friday): a substitute day or basic pay + 150%. In Ramadan, 6 hours a day and 36 a week for everyone.",
    kw: "Overtime needs a written order and is capped at 2 hours a day, 3 days a week, and 90 days and 180 hours a year. The law has no night premium. In Ramadan, 36 hours a week for everyone.",
    om: "Overtime needs your consent except for stocktaking and closing accounts (up to 15 days a year) and emergencies, capped at 12 hours a day in total. Normal hours are 8 a day and 40 a week; in Ramadan 6 a day or 30 a week for Muslims.",
    bh: "Working time may not exceed 10 actual hours a day including overtime, and time off cannot replace overtime pay. On rest days and holidays: pay + 150% or a substitute day, at your choice. In Ramadan, 6 hours a day for Muslim workers.",
  };
  html += note(tips[C], "info");
  html += note(`The law does not state the hourly divisor; we assume ${r.basis === "basic" ? "basic salary" : "total wage"} ÷ ${numEn(O.divisor)}, with ÷ ${numEn(O.divisorAlt)} as the alternative in the list above. Your contract may give you more.`, "warn");
  return html;
});
