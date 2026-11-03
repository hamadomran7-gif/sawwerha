import { upcomingHolidays } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const NAME = { ae: "UAE", sa: "Saudi Arabia", qa: "Qatar", kw: "Kuwait", om: "Oman", bh: "Bahrain" };
const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const D = (iso) => fmt.format(new Date(`${iso}T00:00:00Z`));
const now = new Date();
form.from.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

bind(
  form,
  result,
  (v) => {
    if (!v.from) return null;
    const rows = [];
    let soonest = null;
    for (const c of Object.keys(NAME)) {
      const up = upcomingHolidays({ country: c, from: v.from });
      if (!up.length) { rows.push([NAME[c], "No holiday in the table after this date"]); continue; }
      const h = up[0];
      const when = h.ongoing ? "ongoing" : h.daysUntil === 0 ? "today" : h.daysUntil === 1 ? "tomorrow" : `in ${plural(h.daysUntil, "day")}`;
      const range = h.days > 1 ? `${D(h.start)} – ${D(h.end)}` : D(h.start);
      rows.push([NAME[c], `${h.en}: ${range} (${when})${h.official ? "" : " · expected"}`]);
      if (!soonest || h.daysUntil < soonest.h.daysUntil) soonest = { c, h };
    }
    let html = soonest ? big("Next public holiday in the GCC", `${soonest.h.en} (${NAME[soonest.c]})`, soonest.h.ongoing ? "ongoing" : soonest.h.daysUntil === 0 ? "today" : `in ${plural(soonest.h.daysUntil, "day")} · ${D(soonest.h.start)}`) : "";
    html += table(rows, "Next holiday in each country");
    html += note("Private sector. Hijri-based dates are expected and may shift by a day with moon sighting.", "info");
    return html;
  },
  { save: false }
);
