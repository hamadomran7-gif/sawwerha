import { uaeOvertime } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");
const TYPES = {
  day: "ordinary overtime (+25%)",
  night: "night overtime, 10 pm–4 am (+50%)",
  restday: "work on the weekly rest day (+50%)",
  holiday: "work on a public holiday (+50%)",
};

bind(form, result, (v) => {
  if (!v.basic || v.hours === null || v.hours === undefined) return null;
  const o = uaeOvertime({ basicSalary: v.basic, hours: v.hours, type: v.type });
  let html = big("Overtime pay owed", m(o.pay), `${plural(v.hours, "hour")} · ${TYPES[v.type] || ""}`);
  html += table(
    [
      ["Daily wage (basic ÷ 30)", m(o.dailyWage)],
      ["Normal hourly wage (daily ÷ 8)", m(o.hourlyWage)],
      [`Overtime hourly rate (× ${numEn(o.multiplier)})`, m(o.hourlyWage * o.multiplier)],
      [`Premium alone (${numEn((o.multiplier - 1) * 100)}%)`, m(o.premiumOnly), { muted: true }],
      ["Overtime pay", m(o.pay), { strong: true }],
    ],
    "Breakdown"
  );
  if (v.hours > 60) html += note("The legal limit is two hours a day, roughly 52 hours a month. More than that needs a justification of necessity.", "warn");
  if (v.type === "restday" || v.type === "holiday") html += note("Your employer may give you a substitute day off instead of paying for the day.", "info");
  return html;
});
