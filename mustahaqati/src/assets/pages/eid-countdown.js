import { hijriEventCountdown, hijriParts, upcomingHolidays } from "../calc.js";
import { bind, table, big, note, arDate, daysAr, weeksAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const EVENT = form.dataset.event === "eidAdha" ? "eidAdha" : "eidFitr";
const NAME = EVENT === "eidAdha" ? "عيد الأضحى" : "عيد الفطر";
const HDAY = EVENT === "eidAdha" ? "10 ذو الحجة" : "1 شوال";
const IDS = EVENT === "eidAdha" ? ["arafat", "eidAlAdha"] : ["eidAlFitr"];
const COUNTRY = { sa: "السعودية", ae: "الإمارات", qa: "قطر", kw: "الكويت", om: "عُمان", bh: "البحرين" };
const wd = new Intl.DateTimeFormat("ar-u-nu-latn", { weekday: "long", timeZone: "UTC" });
const D = (iso) => new Date(`${iso}T00:00:00Z`);
const full = (iso) => `${wd.format(D(iso))} ${arDate(iso)}`;
const plus = (iso, n) => new Date(D(iso).getTime() + n * 86400000).toISOString().slice(0, 10);
const cnt = (n) => (n === 1 ? "يوم واحد" : n === 2 ? "يومان" : n <= 10 ? `${n} أيام` : `${n} يوماً`);
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
let timer = null;
function startTicker() {
  clearInterval(timer);
  const el = result.querySelector(".ticker");
  if (!el) return;
  const target = Date.parse(`${el.dataset.to}T00:00:00+03:00`);
  const tick = () => {
    const ms = target - Date.now();
    if (ms <= 0) { el.innerHTML = "<span><b>عيد</b><small>مبارك</small></span>"; clearInterval(timer); return; }
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
    const h = hijriParts(today);
    const ongoing = h && (EVENT === "eidFitr" ? h.month === 10 && h.day <= 3 : h.month === 12 && h.day >= 10 && h.day <= 13);
    const r = hijriEventCountdown({ event: EVENT, today });
    if (!r) return null;
    let html = ongoing
      ? big(`${NAME} مبارك`, `اليوم ${h.day - (EVENT === "eidFitr" ? 0 : 9)} من أيام العيد`, `${NAME} القادم ${full(r.date)} بعد ${daysAr(r.days)}`)
      : big(`باقي على ${NAME}`, r.days === 0 ? "اليوم" : daysAr(r.days), `${full(r.date)} · ${HDAY} ${r.hijriYear}هـ بتقويم أم القرى`);
    if (!ongoing && today === localToday()) html += `<p class="ticker" data-to="${r.date}" aria-hidden="true"></p>`;
    const rows = [[`${NAME} ${r.hijriYear}هـ بتقويم أم القرى`, full(r.date)], ["إن تأخر يوماً بحسب رؤية الهلال", full(plus(r.date, 1))]];
    if (EVENT === "eidAdha") rows.push(["يوم عرفة", full(plus(r.date, -1))]);
    if (!ongoing) rows.push(["المدة المتبقية", r.days >= 7 ? `${weeksAr(Math.floor(r.days / 7))}${r.days % 7 ? ` و${daysAr(r.days % 7)}` : ""}` : daysAr(r.days)]);
    html += table(rows, "الموعد");
    const hol = [];
    for (const [c, name] of Object.entries(COUNTRY)) {
      const list = upcomingHolidays({ country: c, from: today }).filter((x) => IDS.includes(x.id));
      if (!list.length) continue;
      const start = list.map((x) => x.start).sort()[0];
      const end = list.map((x) => x.end).sort().slice(-1)[0];
      const days = list.reduce((n, x) => n + x.days, 0);
      hol.push([name, `${start === end ? full(start) : `${full(start)} – ${full(end)}`} (${cnt(days)})`]);
    }
    if (hol.length) html += table(hol, "إجازة العيد المتوقعة للقطاع الخاص");
    html += note("التواريخ بتقويم أم القرى، وتعلن كل دولة العيد برؤية الهلال وتحدد إجازته بقرار رسمي، فقد يتغير الموعد يوماً. وإجازات القطاع الحكومي أطول عادة.", "info");
    setTimeout(startTicker, 0);
    return html;
  },
  { save: false }
);
