import { upcomingHolidays } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const { country: CC, id: HID, md: MD, since: SINCE, name: NAME, target: TARGET, tz: TZ, law: LAW } = form.dataset;
const df = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const D = (iso) => new Date(`${iso}T00:00:00Z`);
const full = (iso) => df.format(D(iso));
const wdEn = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" });
const myEn = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th");
const tzToday = (tz) => { try { return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); } catch { return ""; } };
const localToday = () => { if (TZ) { const t = tzToday(TZ); if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t; } const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
let timer = null;
function startTicker() {
  clearInterval(timer);
  const el = result.querySelector(".ticker");
  if (!el) return;
  const target = Date.parse(`${el.dataset.to}T00:00:00+04:00`);
  const tick = () => {
    const ms = target - Date.now();
    if (ms <= 0) { el.innerHTML = "<span><b>Today</b><small>Happy National Day</small></span>"; clearInterval(timer); return; }
    const s = Math.floor(ms / 1000);
    el.innerHTML = [[Math.floor(s / 86400), "days"], [Math.floor((s % 86400) / 3600), "hours"], [Math.floor((s % 3600) / 60), "minutes"], [s % 60, "seconds"]].map(([n, l]) => `<span><b>${String(n).padStart(2, "0")}</b><small>${l}</small></span>`).join("");
  };
  tick();
  timer = setInterval(tick, 1000);
}

// Holiday mode (data-target="holiday"): counts to the start of the announced official holiday, not the day itself,
// shows it as under way on its days, then moves to next year's holiday. data-md lists the statutory days ("11-20,11-21"), data-law their basis.
function holidayMode(v) {
  const today = v.from || localToday();
  const h = upcomingHolidays({ country: CC, from: today }).find((x) => x.id === HID);
  if (!h) return big(`${NAME} holiday`, "Announced by official decision");
  const year = h.start.slice(0, 4);
  const range = h.start === h.end ? full(h.start) : `${full(h.start)} – ${full(h.end)}`;
  const occ = MD.split(",").map((md) => `${year}-${md.trim()}`);
  const occTxt = occ.map((iso) => `${wdEn.format(D(iso))} ${Number(iso.slice(8))}`).join(" and ") + ` ${myEn.format(D(occ[occ.length - 1]))}`;
  let html;
  if (h.ongoing) {
    const n = Math.round((D(today) - D(h.start)) / 86400000);
    html = big(`${NAME} holiday ${year}`, "Under way", `Day ${n + 1} of ${plural(h.days, "day")}: ${range}`);
  } else {
    const days = Math.round((D(h.start) - D(today)) / 86400000);
    html = big(`Days until the ${NAME} holiday ${year}`, plural(days, "day"), range);
    if (today === localToday() && days > 0) html += `<p class="ticker" data-to="${h.start}" aria-hidden="true"></p>`;
  }
  const rows = [[`Private-sector holiday ${year}`, `${range} (${plural(h.days, "day")})`, { strong: true }]];
  rows.push([LAW ? `${NAME} (${LAW})` : NAME, occTxt]);
  if (occ[0] !== h.start) rows.push(["Note", "This year the official holiday does not fall on the day itself"]);
  if (!h.official) rows.push(["Note", "Expected date under the law; the actual date is announced at the start of the year"]);
  html += table(rows, "Dates");
  html += note("Working on a public holiday earns extra pay or a substitute day under each country's labour law.", "info");
  setTimeout(startTicker, 0);
  return html;
}

bind(
  form,
  result,
  (v) => {
    if (TARGET === "holiday") return holidayMode(v);
    const today = v.from || localToday();
    const y0 = Number(today.slice(0, 4));
    let date = `${y0}-${MD}`;
    if (date < today) date = `${y0 + 1}-${MD}`;
    const year = Number(date.slice(0, 4));
    const days = Math.round((D(date) - D(today)) / 86400000);
    const nth = SINCE ? year - Number(SINCE) : 0;
    let html = big(`Days until ${NAME}`, days === 0 ? "Today" : plural(days, "day"), `${full(date)}${nth ? ` · ${ord(nth)} anniversary` : ""}`);
    if (today === localToday() && days > 0) html += `<p class="ticker" data-to="${date}" aria-hidden="true"></p>`;
    const rows = [[`${NAME} ${year}${nth ? ` (${ord(nth)})` : ""}`, full(date)]];
    if (days >= 7) rows.push(["Time left", `${plural(Math.floor(days / 7), "week")}${days % 7 ? ` and ${plural(days % 7, "day")}` : ""}`]);
    const hol = upcomingHolidays({ country: CC, from: today }).filter((h) => h.id === HID && h.start.slice(0, 4) === String(year));
    if (hol.length) {
      const h = hol[0];
      rows.push(["Private-sector holiday", `${h.start === h.end ? full(h.start) : `${full(h.start)} – ${full(h.end)}`} (${plural(h.days, "day")})`, { strong: true }]);
      if (h.start !== date) rows.push(["Note", "This year the official holiday does not fall on the day itself"]);
    } else rows.push(["Private-sector holiday", "Announced by official decision"]);
    html += table(rows, "Dates");
    html += note("Working on a public holiday earns extra pay or a substitute day under each country's labour law.", "info");
    setTimeout(startTicker, 0);
    return html;
  },
  { save: false }
);
