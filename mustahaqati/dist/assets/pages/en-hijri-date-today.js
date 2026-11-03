import { hijriParts, hijriMonthGrid } from "../calc.js";
import { bind, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const MONTHS = ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qa'dah", "Dhu al-Hijjah"];
const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const gFull = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const gMonth = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const wd = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" });
const now = new Date();
const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const T = new Date(`${todayIso}T00:00:00Z`);
const h = hijriParts(T);

if (h) {
  form.month.value = String(h.month);
  form.year.value = String(h.year);
}

function grid(g) {
  const cells = [];
  for (let i = 0; i < g.firstWeekday; i++) cells.push('<td class="empty"></td>');
  for (const x of g.days) {
    const d = new Date(`${x.iso}T00:00:00Z`);
    cells.push(`<td${x.iso === todayIso ? ' class="today"' : ""}><b>${x.d}</b><small>${d.getUTCDate()}/${d.getUTCMonth() + 1}</small></td>`);
  }
  while (cells.length % 7) cells.push('<td class="empty"></td>');
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(`<tr>${cells.slice(i, i + 7).join("")}</tr>`);
  const g1 = new Date(`${g.start}T00:00:00Z`), g2 = new Date(`${g.end}T00:00:00Z`);
  const span = gMonth.format(g1) === gMonth.format(g2) ? gMonth.format(g1) : `${gMonth.format(g1)} – ${gMonth.format(g2)}`;
  return `<table class="cal"><caption>${MONTHS[g.month - 1]} ${g.year} AH · ${span}</caption><thead><tr>${WEEK.map((w) => `<th scope="col">${w}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

bind(
  form,
  result,
  (v) => {
    let html = h ? big("Today's Hijri date", `${wd.format(T)} ${h.day} ${MONTHS[h.month - 1]} ${h.year} AH`, gFull.format(T)) : "";
    const g = hijriMonthGrid({ year: v.year, month: v.month });
    if (!g) return html + note("The year is outside the Umm al-Qura calendar range (1300–1600 AH).", "warn");
    html += grid(g);
    html += note(`${MONTHS[g.month - 1]} ${g.year}: ${g.length} days, from ${gFull.format(new Date(`${g.start}T00:00:00Z`))} to ${gFull.format(new Date(`${g.end}T00:00:00Z`))}. By the Umm al-Qura calendar; moon sighting may shift it by a day.`, "info");
    return html;
  },
  { save: false }
);
