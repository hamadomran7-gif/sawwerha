import { hijriEventCountdown, ramadanHours } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { plural, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const EVENT = { ramadan: "Ramadan", eidFitr: "Eid al-Fitr", arafat: "the Day of Arafat", eidAdha: "Eid al-Adha", hijriNewYear: "the Islamic New Year" };
const TITLE = { ramadan: "Ramadan", eidFitr: "Eid al-Fitr", arafat: "Day of Arafat", eidAdha: "Eid al-Adha", hijriNewYear: "Islamic New Year" };
const HDAY = { ramadan: "1 Ramadan", eidFitr: "1 Shawwal", arafat: "9 Dhu al-Hijjah", eidAdha: "10 Dhu al-Hijjah", hijriNewYear: "1 Muharram" };
const COUNTRY = { ae: "UAE", sa: "Saudi Arabia", qa: "Qatar", kw: "Kuwait", om: "Oman", bh: "Bahrain" };
const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const full = (iso) => fmt.format(new Date(`${iso}T00:00:00Z`));
const hrs = (n) => `${numEn(n)} ${Number(n) === 1 ? "hour" : "hours"}`;

bind(form, result, (v) => {
  const r = hijriEventCountdown({ event: v.event, today: new Date() });
  if (!r) return null;
  let html;
  if (r.ongoing) {
    html = big("It is Ramadan now", `Day ${r.ongoing.day}`, r.ongoing.daysToEid > 0 ? `${plural(r.ongoing.daysToEid, "day")} until Eid al-Fitr (expected ${full(r.ongoing.eid)})` : "Eid al-Fitr is today or tomorrow, depending on the sighting");
  } else {
    html = big(`Days until ${EVENT[r.event]}`, r.days === 0 ? "Today" : plural(r.days, "day"), `${full(r.date)} · ${HDAY[r.event]} ${r.hijriYear}`);
  }
  const rows = [
    [`${TITLE[r.event]} ${r.hijriYear} (Umm al-Qura)`, full(r.date)],
    ["Time left", r.days >= 7 ? `${plural(r.weeks, "week")}${r.restDays ? ` and ${plural(r.restDays, "day")}` : ""}` : plural(r.days, "day")],
  ];
  if (r.event === "ramadan" && !r.ongoing) {
    rows.push(["Expected Eid al-Fitr", full(r.eid)]);
    rows.push(["Days of Ramadan (Umm al-Qura)", plural(r.length, "day")]);
  }
  html += table(rows, "Date");
  const h = ramadanHours({ country: v.country, normal: v.normal, days: v.days, muslim: v.muslim !== "no" });
  if (h) {
    html += table(
      [
        ["Your normal hours", `${hrs(h.normalDaily)} a day (${hrs(h.normalWeekly)} a week)`],
        ["Your Ramadan hours", `${hrs(h.daily)} a day (${hrs(h.weekly)} a week)`, { strong: true }],
        ["Reduction", h.cut > 0 ? `${hrs(h.cut)} a day` : "None"],
      ],
      `Ramadan working hours — ${COUNTRY[v.country]}`
    );
    if (!h.applies) html += note("The Ramadan reduction in this country is for Muslim workers; non-Muslims keep their normal hours unless the employer decides otherwise.", "info");
    if (v.country === "kw") html += note("Kuwait caps Ramadan hours at 36 a week with no daily limit, so we spread them over your working days.", "info");
    if (v.country === "ae") html += note("In the UAE normal hours are cut by two hours a day for all workers, and anything beyond that is overtime.", "info");
  }
  html += note("Dates follow the Umm al-Qura calendar; each country announces the start of the month by moon sighting, so the date may differ by a day.", "info");
  return html;
});
