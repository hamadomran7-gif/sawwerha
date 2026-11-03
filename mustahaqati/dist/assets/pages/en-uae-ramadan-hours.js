import { uaeRamadanOvertime } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");

bind(form, result, (v) => {
  if (!v.basic || !v.normal || v.worked === null || v.worked === undefined) return null;
  const div = v.divisor === "reduced" ? Math.max(1, v.normal - 2) : 8;
  const r = uaeRamadanOvertime({ basic: v.basic, normalHours: v.normal, workedHours: v.worked, days: v.days || 0, night: !!v.night, divisor: div });
  if (!r.extraPerDay) {
    return big("Ramadan overtime pay", m(0), `Your Ramadan day: ${plural(r.reducedHours, "hour")}`) + note("You do not work beyond the reduced hours, so no overtime is due. Your salary is not reduced because of the shorter hours.", "ok");
  }
  let html = big("Expected overtime pay for Ramadan", m(r.total), `${plural(r.extraPerDay, "extra hour")} a day × ${plural(v.days || 0, "day")}`);
  html += table(
    [
      ["Normal day → Ramadan day", `${plural(v.normal, "hour")} → ${plural(r.reducedHours, "hour")}`],
      ["Extra hours a day", plural(r.extraPerDay, "hour")],
      [`Hourly wage (basic ÷ 30 ÷ ${numEn(div)})`, m(r.hourly)],
      [`Rate (${v.night ? "night +50%" : "+25%"})`, `× ${numEn(r.multiplier)}`],
      ["Daily overtime pay", m(r.perDay)],
      ["Total for the working days", m(r.total), { strong: true }],
    ],
    "Breakdown"
  );
  if (r.overLimit) html += note("The legal limit for overtime is two hours a day, except in cases of necessity.", "warn");
  html += note("Treating hours beyond the reduced Ramadan day as overtime is drawn from Article 19 and supported by published legal opinions; we found no official circular stating it. The hourly divisor (8 or the reduced hours) is also unsettled.", "info");
  return html;
});
