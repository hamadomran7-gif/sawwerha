import { schoolCountdown } from "../calc.js";
import { bind, table, big, note, arDate, daysAr, daysGen } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cc = form.dataset.country;
const TZ = { sa: "+03:00", kw: "+03:00", qa: "+03:00", bh: "+03:00", ae: "+04:00", om: "+04:00" }[cc] || "+03:00";
const LOW = { qa: "تقويم قطر من مصادر صحفية متطابقة، وعطلتا العيدين للمدارس من العطل الرسمية المتوقعة.", om: "تقويم عُمان من الصحافة عن القرار الوزاري 190/2026، والعطل من العطل الرسمية المتوقعة، وعطلة ما بين الفصلين تقديرية.", bh: "تقويم البحرين من الصحافة، وقد تعلو قرارات الطوارئ على التقويم كما حدث في 2026.", kw: "الرزنامة الرسمية لا تشمل العطل الوطنية والعيدين، فأضفناها من العطل الرسمية المتوقعة." };
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
  const target = Date.parse(`${el.dataset.to}T00:00:00${TZ}`);
  const tick = () => {
    const ms = target - Date.now();
    if (ms <= 0) { el.innerHTML = "<span><b>بدأت</b><small>الإجازة</small></span>"; clearInterval(timer); return; }
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
    const r = schoolCountdown({ country: cc, variant: v.variant || undefined, today, audience: v.audience === "teachers" ? "teachers" : "students" });
    if (!r) return null;
    let html = "";
    if (r.ongoing) {
      const o = r.ongoing;
      html += big(`أنت في ${o.nameAr}`, o.returnDate ? (r.daysToReturn === 0 ? "العودة اليوم" : `العودة بعد ${daysGen(r.daysToReturn)}`) : "حتى بداية العام الدراسي القادم", o.returnDate ? `العودة ${full(o.returnDate)}` : "");
    } else if (r.next) {
      const n = r.next;
      html += big(`باقي على ${n.nameAr}`, r.daysToNext === 0 ? "اليوم" : daysAr(r.daysToNext), `تبدأ ${full(n.offStart)}${n.days ? ` · ${cnt(n.days)} مع عطلة نهاية الأسبوع` : ""}${n.returnDate ? ` · العودة ${full(n.returnDate)}` : ""}`);
      if (today === localToday()) html += `<p class="ticker" data-to="${n.offStart}" aria-hidden="true"></p>`;
    }
    const rows = [];
    if (r.next && r.schoolDays !== null) rows.push([`أيام الدراسة المتبقية قبل ${r.next.nameAr}`, daysAr(r.schoolDays)]);
    if (r.lastDay && r.daysToLastDay !== null) rows.push(["آخر يوم دراسي للطلاب", `${full(r.lastDay)} · بعد ${daysGen(r.daysToLastDay)}`]);
    if (rows.length) html += table(rows, r.variantName ? `التقويم: ${r.variantName}` : "العام الدراسي");
    html += table(
      r.upcoming.map((x) => [x.nameAr, `${x.offEnd ? `${full(x.offStart)} – ${full(x.offEnd)}` : `من ${full(x.offStart)}`}${x.days ? ` (${cnt(x.days)})` : ""}${x.returnDate ? `<br><small>العودة ${full(x.returnDate)}</small>` : ""}`]),
      "الإجازات القادمة"
    );
    html += note("المدد تشمل عطلة نهاية الأسبوع الملاصقة للإجازة. وقد تعلن الوزارة أو إدارات التعليم إجازات طارئة أو تعدّل المواعيد.", "info");
    if (LOW[cc]) html += note(LOW[cc], "warn");
    if (v.audience === "teachers" && cc === "sa") html += note("لم يُنشر تاريخ منفصل لنهاية عمل المعلمين في 1448، فاعتمد إعلان إدارتك.", "warn");
    setTimeout(startTicker, 0);
    return html;
  },
  { save: false }
);
