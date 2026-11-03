import { ksaNextPayDates, ksaPayCountdown, KSA_PAY_ITEMS, HIJRI_MONTHS } from "../calc.js";
import { bind, table, big, note, arDate, daysAr, daysGen, weeksAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const MODE = form.dataset.mode || "item";
const NAME = { salary: "رواتب موظفي الدولة", citizen: "حساب المواطن", social: "الضمان الاجتماعي المطور", hafiz: "حافز", pension: "معاشات التأمينات (تقديري)", saned: "ساند (تقديري)" };
const ON = { salary: "الراتب", citizen: "حساب المواطن", social: "الضمان المطور", hafiz: "حافز", pension: "معاش التقاعد", saned: "ساند" };
const RULE = {
  salary: "يُصرف يوم 27 من كل شهر ميلادي؛ إن وافق الجمعة يُقدَّم إلى الخميس، وإن وافق السبت يُؤخَّر إلى الأحد. وقد تُبكّر وزارة المالية الصرف قبل العيد بقرار يُعلن في حينه.",
  citizen: "يُودَع يوم 10 من كل شهر ميلادي؛ إن وافق الجمعة يُقدَّم إلى الخميس، وإن وافق السبت يُؤخَّر إلى الأحد.",
  social: "يُودَع يوم 1 من كل شهر ميلادي، وإن وافق عطلة تحدد الوزارة موعداً آخر وتعلنه. ونتائج الأهلية تظهر بين 25 و27 من الشهر السابق.",
  hafiz: "يُودَع يوم 5 من كل شهر ميلادي، وتظهر نتائج الأهلية بين 2 و4 من الشهر. ولا تذكر هدف ما يحدث إن وافق عطلة.",
  pension: "موعد تقديري: لم تنشر التأمينات يوماً ثابتاً، والمتداول يوم 25 ويُقدَّم إلى آخر يوم عمل إن وافق عطلة. تحقق من تطبيق «تأميناتي».",
  saned: "موعد تقديري: المتداول نحو يوم 5 من الشهر، ولا تذكر التأمينات يوم الصرف.",
};
const wdf = new Intl.DateTimeFormat("ar-u-nu-latn", { weekday: "long", timeZone: "UTC" });
const mf = new Intl.DateTimeFormat("ar-u-nu-latn", { month: "long", year: "numeric", timeZone: "UTC" });
const D = (iso) => new Date(`${iso}T00:00:00Z`);
const full = (iso) => `${wdf.format(D(iso))} ${arDate(iso)}`;
const hij = (h) => (h ? `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year}هـ` : "");
const left = (n) => (n === 0 ? "اليوم" : n >= 7 ? `${daysAr(n)} (${weeksAr(Math.floor(n / 7))}${n % 7 ? ` و${daysAr(n % 7)}` : ""})` : daysAr(n));
function why(p) {
  const out = [];
  if (p.announced) out.push("موعد أعلنته الجهة");
  else if (p.shifted) out.push(`يوم ${Number(p.nominal.slice(8))} يوافق ${wdf.format(D(p.nominal))}، ${p.date < p.nominal ? "فيُقدَّم" : "فيُؤخَّر"} إلى ${wdf.format(D(p.date))}`);
  else if (p.unsure) out.push(`يوافق ${wdf.format(D(p.date))}، والجهة تعلن موعداً آخر`);
  if (p.holiday) out.push(`يوافق عطلة ${p.holiday.ar}، وقد يُعلن موعد آخر`);
  return out.join("؛ ");
}

const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
let timer = null;
function startTicker() {
  clearInterval(timer);
  const el = result.querySelector(".ticker");
  if (!el) return;
  const target = Date.parse(`${el.dataset.to}T00:00:00+03:00`);
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
    const today = v.from || new Date();
    let html = "";
    if (MODE === "all") {
      const next = ksaPayCountdown({ today });
      if (!next.length) return null;
      const n = next[0];
      html += big("أقرب صرف", `${ON[n.item]}: ${n.days === 0 ? "اليوم" : `بعد ${daysGen(n.days)}`}`, `${full(n.date)} · ${hij(n.hijri)}`);
      html += table(next.map((p) => [NAME[p.item], `${full(p.date)} · <strong>${left(p.days)}</strong><br><small>${hij(p.hijri)}${why(p) ? ` · ${why(p)}` : ""}</small>`]), "أقرب موعد لكل دفعة");
      const soon = KSA_PAY_ITEMS.flatMap((item) => ksaNextPayDates({ item, today, count: 3 })).filter((p) => p.days <= 62).sort((a, b) => a.date.localeCompare(b.date) || KSA_PAY_ITEMS.indexOf(a.item) - KSA_PAY_ITEMS.indexOf(b.item));
      html += table(soon.map((p) => [full(p.date), `${NAME[p.item]} · ${left(p.days)}`]), "كل مواعيد الصرف في الشهرين القادمين");
      html += note("معاشات التأمينات وساند مواعيد تقديرية لم تنشرها الجهة؛ وموعد الضمان وحافز قد يتغير إن وافق عطلة.", "info");
      return html;
    }
    const item = KSA_PAY_ITEMS.includes(v.item) ? v.item : form.dataset.item || "salary";
    const list = ksaNextPayDates({ item, today, count: 12 });
    if (!list.length) return null;
    const p = list[0];
    html += big(`باقي على ${ON[item]}`, p.days === 0 ? "اليوم" : daysAr(p.days), `${full(p.date)} · ${hij(p.hijri)}`);
    if (!v.from || v.from === localToday()) html += `<p class="ticker" data-to="${p.date}" aria-hidden="true"></p>`;
    if (why(p)) html += note(why(p), p.holiday || p.unsure ? "warn" : "info");
    html += table(list.map((x) => [mf.format(D(x.month + "-01")), `${full(x.date)}<br><small>${hij(x.hijri)}${why(x) ? ` · ${why(x)}` : ""}</small>`]), `مواعيد ${NAME[item]} القادمة`);
    html += note(RULE[item], item === "pension" || item === "saned" ? "warn" : "info");
    setTimeout(startTicker, 0);
    return html;
  },
  { save: false }
);
