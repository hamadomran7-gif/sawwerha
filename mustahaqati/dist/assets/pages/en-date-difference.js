import { dateDiff, hijriParts } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { plural, durationEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const MONTHS = ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Shaban", "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"];
const hText = (iso) => {
  const h = hijriParts(new Date(`${iso}T00:00:00Z`));
  return h ? `${h.day} ${MONTHS[h.month - 1]} ${h.year} AH` : "—";
};
const full = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const fmt = (iso) => `${full.format(new Date(`${iso}T00:00:00Z`))} · ${hText(iso)}`;
const WK = { "fri-sat": "Friday and Saturday", "sat-sun": "Saturday and Sunday", fri: "Friday only", none: "no weekend" };

bind(form, result, (v) => {
  if (!v.start || !v.end) return null;
  const d = dateDiff({ start: v.start, end: v.end, inclusive: !!v.inclusive, weekend: v.weekend });
  if (!d) return null;
  const [a, b] = d.sign > 0 ? [v.start, v.end] : [v.end, v.start];
  let html = big("Period between the dates", plural(d.total, "day"), d.total ? durationEn(d) : "The dates are the same");
  html += table(
    [
      ["From", fmt(a)],
      ["To", fmt(b)],
      ["Days", plural(d.total, "day"), { strong: true }],
      ["In weeks", d.restDays ? `${plural(d.weeks, "week")} and ${plural(d.restDays, "day")}` : plural(d.weeks, "week")],
      ["In years, months and days", d.total ? durationEn(d) : "—"],
      [`Working days (weekend: ${WK[v.weekend] || ""})`, plural(d.workDays, "day")],
    ],
    v.inclusive ? "Counting the end date" : "Not counting the end date"
  );
  if (d.sign < 0) html += note("The end date is before the start date, so the period was counted the other way round.", "info");
  html += note("Working days exclude the weekend only, not public holidays or Eid.", "info");
  return html;
});
