import { schoolCountdown } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cc = form.dataset.country;
const TZ = { sa: "+03:00", kw: "+03:00", qa: "+03:00", bh: "+03:00", ae: "+04:00", om: "+04:00" }[cc] || "+03:00";
const LOW = { qa: "Qatar's calendar comes from matching press reports, and the Eid breaks from the expected official holidays.", om: "Oman's calendar comes from press reports of Ministerial Decision 190/2026, holidays from the expected official holidays, and the break between terms is an estimate.", bh: "Bahrain's calendar comes from press reports, and emergency decisions can override it, as in 2026.", kw: "The official calendar leaves out national holidays and both Eids, so we added them from the expected official holidays." };
const df = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const D = (iso) => new Date(`${iso}T00:00:00Z`);
const full = (iso) => df.format(D(iso));
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
let timer = null;
function startTicker() {
  clearInterval(timer);
  const el = result.querySelector(".ticker");
  if (!el) return;
  const target = Date.parse(`${el.dataset.to}T00:00:00${TZ}`);
  const tick = () => {
    const ms = target - Date.now();
    if (ms <= 0) { el.innerHTML = "<span><b>Started</b><small>the holiday</small></span>"; clearInterval(timer); return; }
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
    const r = schoolCountdown({ country: cc, variant: v.variant || undefined, today, audience: v.audience === "teachers" ? "teachers" : "students" });
    if (!r) return null;
    let html = "";
    if (r.ongoing) {
      const o = r.ongoing;
      html += big(`You are on the ${o.nameEn}`, o.returnDate ? (r.daysToReturn === 0 ? "Back today" : `Back in ${plural(r.daysToReturn, "day")}`) : "Until the next school year", o.returnDate ? `Return ${full(o.returnDate)}` : "");
    } else if (r.next) {
      const n = r.next;
      html += big(`Days until the ${n.nameEn}`, r.daysToNext === 0 ? "Today" : plural(r.daysToNext, "day"), `Starts ${full(n.offStart)}${n.days ? ` · ${plural(n.days, "day")} with the weekend` : ""}${n.returnDate ? ` · back ${full(n.returnDate)}` : ""}`);
      if (today === localToday()) html += `<p class="ticker" data-to="${n.offStart}" aria-hidden="true"></p>`;
    }
    const rows = [];
    if (r.next && r.schoolDays !== null) rows.push([`School days left before the ${r.next.nameEn}`, plural(r.schoolDays, "day")]);
    if (r.lastDay && r.daysToLastDay !== null) rows.push(["Last school day for students", `${full(r.lastDay)} · in ${plural(r.daysToLastDay, "day")}`]);
    if (rows.length) html += table(rows, r.variantNameEn ? `Calendar: ${r.variantNameEn}` : "School year");
    html += table(
      r.upcoming.map((x) => [x.nameEn, `${x.offEnd ? `${full(x.offStart)} – ${full(x.offEnd)}` : `From ${full(x.offStart)}`}${x.days ? ` (${plural(x.days, "day")})` : ""}${x.returnDate ? `<br><small>Back ${full(x.returnDate)}</small>` : ""}`]),
      "Upcoming holidays"
    );
    html += note("Lengths include the adjoining weekend. The ministry or education offices may announce extra days off or change dates.", "info");
    if (LOW[cc]) html += note(LOW[cc], "warn");
    if (v.audience === "teachers" && cc === "sa") html += note("No separate end date for teachers has been published for 1448; follow your education office's announcement.", "warn");
    setTimeout(startTicker, 0);
    return html;
  },
  { save: false }
);
