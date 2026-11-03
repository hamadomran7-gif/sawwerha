import { uaeNextPayDates, UAE_PAY_ITEMS } from "../calc.js";
import { bind, table, big, note, arDate, daysAr, weeksAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const NAME = { federal: "رواتب الحكومة الاتحادية", gpssa: "معاشات الهيئة العامة للمعاشات", adpf: "معاشات صندوق أبوظبي للتقاعد", private: "استحقاق أجر القطاع الخاص" };
const ON = { federal: "الراتب", gpssa: "المعاش", adpf: "المعاش", private: "استحقاق الأجر" };
const RULE = {
  federal: "يوم 30 من كل شهر بتعميم وزارة المالية (2019)، ويُقدَّم إن وافق عطلة. تقديمه من السبت والأحد إلى الجمعة، وفي فبراير إلى آخر يوم عمل، استنتاج منا. وقد يُبكَّر قبل العيد بتوجيه.",
  gpssa: "مواعيد 2026 من جدول الهيئة الرسمي (أساسه 27 مع التعديل حسب العطل)، ومواعيد 2027 تقديرية حتى يصدر جدولها في يناير.",
  adpf: "يوم 26 من كل شهر بحسب الصندوق، مع تبكير معلن قبل الأعياد. ولم يُعلن ما يحدث إن وافق 26 عطلة نهاية الأسبوع.",
  private: "منذ 1 يونيو 2026 يستحق الأجر يوم 1 من كل شهر ميلادي عن الشهر السابق (القرار 0340/2026)، وأي دفع بعده تأخير تبدأ إجراءاته من اليوم 2.",
};
const wdf = new Intl.DateTimeFormat("ar-u-nu-latn", { weekday: "long", timeZone: "UTC" });
const mf = new Intl.DateTimeFormat("ar-u-nu-latn", { month: "long", year: "numeric", timeZone: "UTC" });
const D = (iso) => new Date(`${iso}T00:00:00Z`);
const full = (iso) => `${wdf.format(D(iso))} ${arDate(iso)}`;
const left = (n) => (n === 0 ? "اليوم" : n >= 7 ? `${daysAr(n)} (${weeksAr(Math.floor(n / 7))}${n % 7 ? ` و${daysAr(n % 7)}` : ""})` : daysAr(n));
function why(p) {
  const out = [];
  if (p.official) out.push("جدول الهيئة الرسمي");
  if (p.reason === "holiday") out.push("يوافق عطلة رسمية، فيُقدَّم");
  else if (p.shifted && !p.official) out.push(`يوم ${Number(p.nominal.slice(8))} يوافق ${wdf.format(D(p.nominal))}، فيُقدَّم إلى ${wdf.format(D(p.date))}`);
  if (p.estimate) out.push("تقديري");
  if (p.unsure) out.push(`يوافق ${p.holiday ? "عطلة " + p.holiday.ar : wdf.format(D(p.date))}، والقاعدة غير منشورة`);
  if (p.forMonth) out.push(`أجر ${mf.format(D(p.forMonth + "-01"))}`);
  return out.join("؛ ");
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
    if (ms <= 0) { el.innerHTML = "<span><b>اليوم</b><small>موعد الصرف</small></span>"; clearInterval(timer); return; }
    const s = Math.floor(ms / 1000);
    const parts = [[Math.floor(s / 86400), "يوم"], [Math.floor((s % 86400) / 3600), "ساعة"], [Math.floor((s % 3600) / 60), "دقيقة"], [s % 60, "ثانية"]];
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
    let html = big(`باقي على ${ON[item]}`, p.days === 0 ? "اليوم" : daysAr(p.days), full(p.date));
    if (!v.from || v.from === localToday()) html += `<p class="ticker" data-to="${p.date}" aria-hidden="true"></p>`;
    if (why(p)) html += note(why(p), p.unsure || p.estimate ? "warn" : "info");
    html += table(list.map((x) => [mf.format(D(x.month + "-01")), `${full(x.date)}${why(x) ? `<br><small>${why(x)}</small>` : ""}`]), `مواعيد ${NAME[item]} القادمة`);
    html += note(RULE[item], "info");
    setTimeout(startTicker, 0);
    return html;
  },
  { save: false }
);
