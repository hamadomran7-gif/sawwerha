import { uaeNextPayDates, UAE_PAY_ITEMS } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const NAME = { federal: "federal government salaries", gpssa: "GPSSA pensions", adpf: "Abu Dhabi Pension Fund pensions", private: "private-sector pay due dates" };
const ON = { federal: "payday", gpssa: "the pension", adpf: "the pension", private: "the pay due date" };
const RULE = {
  federal: "The 30th of each month under a Ministry of Finance circular (2019), moved earlier if it falls on a holiday. Moving Saturday and Sunday to the Friday, and February to its last working day, is our inference. Payment may be brought forward before Eid by directive.",
  gpssa: "2026 dates are from GPSSA's official schedule (based on the 27th, adjusted for holidays); 2027 dates are estimates until the schedule is published in January.",
  adpf: "The 26th of each month according to the fund, with early payments announced before Eid. It has not said what happens when the 26th falls on a weekend.",
  private: "Since 1 June 2026 wages are due on the 1st of each calendar month for the previous month (Resolution 0340/2026), and later payment counts as late, with measures from day 2.",
};
const wdf = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" });
const df = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const mf = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const D = (iso) => new Date(`${iso}T00:00:00Z`);
const full = (iso) => df.format(D(iso));
const left = (n) => (n === 0 ? "today" : n >= 7 ? `${plural(n, "day")} (${plural(Math.floor(n / 7), "week")}${n % 7 ? ` and ${plural(n % 7, "day")}` : ""})` : plural(n, "day"));
function why(p) {
  const out = [];
  if (p.official) out.push("official GPSSA schedule");
  if (p.reason === "holiday") out.push("public holiday, moved earlier");
  else if (p.shifted && !p.official) out.push(`the ${Number(p.nominal.slice(8))}th is a ${wdf.format(D(p.nominal))}, moved to ${wdf.format(D(p.date))}`);
  if (p.estimate) out.push("estimate");
  if (p.unsure) out.push(`falls on ${p.holiday ? "the " + p.holiday.en + " holiday" : "a " + wdf.format(D(p.date))}; rule not published`);
  if (p.forMonth) out.push(`pay for ${mf.format(D(p.forMonth + "-01"))}`);
  return out.join("; ");
}
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
let timer = null;
function startTicker() {
  clearInterval(timer);
  const el = result.querySelector(".ticker");
  if (!el) return;
  const target = Date.parse(`${el.dataset.to}T00:00:00+04:00`);
  const tick = () => {
    const ms = target - Date.now();
    if (ms <= 0) { el.innerHTML = "<span><b>Today</b><small>payment day</small></span>"; clearInterval(timer); return; }
    const s = Math.floor(ms / 1000);
    const parts = [[Math.floor(s / 86400), "days"], [Math.floor((s % 86400) / 3600), "hours"], [Math.floor((s % 3600) / 60), "minutes"], [s % 60, "seconds"]];
    el.innerHTML = parts.map(([n, l]) => `<span><b>${String(n).padStart(2, "0")}</b><small>${l}</small></span>`).join("");
  };
  tick();
  timer = setInterval(tick, 1000);
}

bind(
  form,
  result,
  (v) => {
    const item = UAE_PAY_ITEMS.includes(v.item) ? v.item : "federal";
    const list = uaeNextPayDates({ item, today: v.from || new Date(), count: 12 });
    if (!list.length) return null;
    const p = list[0];
    let html = big(`Days until ${ON[item]}`, p.days === 0 ? "Today" : plural(p.days, "day"), full(p.date));
    if (!v.from || v.from === localToday()) html += `<p class="ticker" data-to="${p.date}" aria-hidden="true"></p>`;
    if (why(p)) html += note(why(p).replace(/^./, (c) => c.toUpperCase()), p.unsure || p.estimate ? "warn" : "info");
    html += table(list.map((x) => [mf.format(D(x.month + "-01")), `${full(x.date)}${why(x) ? `<br><small>${why(x)}</small>` : ""}`]), `Upcoming ${NAME[item]}`);
    html += note(RULE[item], "info");
    setTimeout(startTicker, 0);
    return html;
  },
  { save: false }
);
