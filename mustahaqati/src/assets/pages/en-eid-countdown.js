import { hijriEventCountdown, hijriParts, upcomingHolidays } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const EVENT = form.dataset.event === "eidAdha" ? "eidAdha" : "eidFitr";
const NAME = EVENT === "eidAdha" ? "Eid al-Adha" : "Eid al-Fitr";
const HDAY = EVENT === "eidAdha" ? "10 Dhu al-Hijjah" : "1 Shawwal";
const IDS = EVENT === "eidAdha" ? ["arafat", "eidAlAdha"] : ["eidAlFitr"];
const COUNTRY = { sa: "Saudi Arabia", ae: "UAE", qa: "Qatar", kw: "Kuwait", om: "Oman", bh: "Bahrain" };
const df = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const D = (iso) => new Date(`${iso}T00:00:00Z`);
const full = (iso) => df.format(D(iso));
const plus = (iso, n) => new Date(D(iso).getTime() + n * 86400000).toISOString().slice(0, 10);
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
let timer = null;
function startTicker() {
  clearInterval(timer);
  const el = result.querySelector(".ticker");
  if (!el) return;
  const target = Date.parse(`${el.dataset.to}T00:00:00+03:00`);
  const tick = () => {
    const ms = target - Date.now();
    if (ms <= 0) { el.innerHTML = "<span><b>Eid</b><small>Mubarak</small></span>"; clearInterval(timer); return; }
    const s = Math.floor(ms / 1000);
    el.innerHTML = [[Math.floor(s / 86400), "days"], [Math.floor((s % 86400) / 3600), "hours"], [Math.floor((s % 3600) / 60), "minutes"], [s % 60, "seconds"]].map(([n, l]) => `<span><b>${String(n).padStart(2, "0")}</b><small>${l}</small></span>`).join("");
  };
  tick();
  timer = setInterval(tick, 1000);
}

bind(
  form,
  result,
  (v) => {
    const today = v.from || localToday();
    const h = hijriParts(today);
    const ongoing = h && (EVENT === "eidFitr" ? h.month === 10 && h.day <= 3 : h.month === 12 && h.day >= 10 && h.day <= 13);
    const r = hijriEventCountdown({ event: EVENT, today });
    if (!r) return null;
    let html = ongoing
      ? big(`${NAME} Mubarak`, `Day ${h.day - (EVENT === "eidFitr" ? 0 : 9)} of Eid`, `Next ${NAME}: ${full(r.date)}, in ${plural(r.days, "day")}`)
      : big(`Days until ${NAME}`, r.days === 0 ? "Today" : plural(r.days, "day"), `${full(r.date)} · ${HDAY} ${r.hijriYear} AH by Umm al-Qura`);
    if (!ongoing && today === localToday()) html += `<p class="ticker" data-to="${r.date}" aria-hidden="true"></p>`;
    const rows = [[`${NAME} ${r.hijriYear} AH by Umm al-Qura`, full(r.date)], ["If moon sighting delays it a day", full(plus(r.date, 1))]];
    if (EVENT === "eidAdha") rows.push(["Day of Arafah", full(plus(r.date, -1))]);
    if (!ongoing) rows.push(["Time left", r.days >= 7 ? `${plural(Math.floor(r.days / 7), "week")}${r.days % 7 ? ` and ${plural(r.days % 7, "day")}` : ""}` : plural(r.days, "day")]);
    html += table(rows, "Dates");
    const hol = [];
    for (const [c, name] of Object.entries(COUNTRY)) {
      const list = upcomingHolidays({ country: c, from: today }).filter((x) => IDS.includes(x.id));
      if (!list.length) continue;
      const start = list.map((x) => x.start).sort()[0];
      const end = list.map((x) => x.end).sort().slice(-1)[0];
      const days = list.reduce((n, x) => n + x.days, 0);
      hol.push([name, `${start === end ? full(start) : `${full(start)} – ${full(end)}`} (${plural(days, "day")})`]);
    }
    if (hol.length) html += table(hol, "Expected private-sector Eid holiday");
    html += note("Dates follow the Umm al-Qura calendar; each country confirms Eid by moon sighting and sets the holiday by official decision, so dates can shift by a day. Government holidays are usually longer.", "info");
    setTimeout(startTicker, 0);
    return html;
  },
  { save: false }
);
