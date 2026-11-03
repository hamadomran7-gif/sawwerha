import { upcomingHolidays } from "../calc.js";
import { bind, table, big, note, arDate, daysAr, weeksAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const { country: CC, id: HID, md: MD, since: SINCE, name: NAME } = form.dataset;
const wd = new Intl.DateTimeFormat("ar-u-nu-latn", { weekday: "long", timeZone: "UTC" });
const D = (iso) => new Date(`${iso}T00:00:00Z`);
const full = (iso) => `${wd.format(D(iso))} ${arDate(iso)}`;
const cnt = (n) => (n === 1 ? "يوم واحد" : n === 2 ? "يومان" : n <= 10 ? `${n} أيام` : `${n} يوماً`);
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
let timer = null;
function startTicker() {
  clearInterval(timer);
  const el = result.querySelector(".ticker");
  if (!el) return;
  const target = Date.parse(`${el.dataset.to}T00:00:00+04:00`);
  const tick = () => {
    const ms = target - Date.now();
    if (ms <= 0) { el.innerHTML = "<span><b>اليوم</b><small>كل عام وأنتم بخير</small></span>"; clearInterval(timer); return; }
    const s = Math.floor(ms / 1000);
    el.innerHTML = [[Math.floor(s / 86400), "يوم"], [Math.floor((s % 86400) / 3600), "ساعة"], [Math.floor((s % 3600) / 60), "دقيقة"], [s % 60, "ثانية"]].map(([n, l]) => `<span><b>${String(n).padStart(2, "0")}</b><small>${l}</small></span>`).join("");
  };
  tick();
  timer = setInterval(tick, 1000);
}

bind(
  form,
  result,
  (v) => {
    const today = v.from || localToday();
    const y0 = Number(today.slice(0, 4));
    let date = `${y0}-${MD}`;
    if (date < today) date = `${y0 + 1}-${MD}`;
    const year = Number(date.slice(0, 4));
    const days = Math.round((D(date) - D(today)) / 86400000);
    const nth = SINCE ? year - Number(SINCE) : 0;
    const label = nth ? `${NAME} (الذكرى ${nth})` : NAME;
    let html = big(`باقي على ${NAME}`, days === 0 ? "اليوم" : daysAr(days), `${full(date)}${nth ? ` · الذكرى ${nth}` : ""}`);
    if (today === localToday() && days > 0) html += `<p class="ticker" data-to="${date}" aria-hidden="true"></p>`;
    const rows = [[`${label} ${year}`, full(date)]];
    if (days >= 7) rows.push(["المدة المتبقية", `${weeksAr(Math.floor(days / 7))}${days % 7 ? ` و${daysAr(days % 7)}` : ""}`]);
    const hol = upcomingHolidays({ country: CC, from: today }).filter((h) => h.id === HID && h.start.slice(0, 4) === String(year));
    if (hol.length) {
      const h = hol[0];
      rows.push(["عطلة القطاع الخاص", `${h.start === h.end ? full(h.start) : `${full(h.start)} – ${full(h.end)}`} (${cnt(h.days)})`, { strong: true }]);
      if (h.start !== date) rows.push(["ملاحظة", "العطلة الرسمية لا توافق يوم المناسبة نفسه هذا العام"]);
    } else rows.push(["عطلة القطاع الخاص", "تُعلن بقرار رسمي"]);
    html += table(rows, "الموعد");
    html += note("من يعمل يوم العطلة الرسمية يستحق أجراً إضافياً أو يوماً بديلاً بحسب قانون العمل في بلده.", "info");
    setTimeout(startTicker, 0);
    return html;
  },
  { save: false }
);
