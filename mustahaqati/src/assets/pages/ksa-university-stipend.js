import { ksaUniversityStipend, ksaNextPayDates, HIJRI_MONTHS } from "../calc.js";
import { bind, money, table, big, note, arDate, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const NAME = { science: "تخصص علمي", humanities: "تخصص نظري", graduate: "دراسات عليا", disabilitySevere: "ذوو الإعاقة — الفئة الأولى", disabilityModerate: "ذوو الإعاقة — الفئة الثانية", tvtcCollege: "كلية تقنية", tvtcInstitute: "معهد ثانوي" };
const wdf = new Intl.DateTimeFormat("ar-u-nu-latn", { weekday: "long", timeZone: "UTC" });
const mf = new Intl.DateTimeFormat("ar-u-nu-latn", { month: "long", year: "numeric", timeZone: "UTC" });
const D = (iso) => new Date(`${iso}T00:00:00Z`);
const full = (iso) => `${wdf.format(D(iso))} ${arDate(iso)}`;
const hij = (h) => (h ? `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year}هـ` : "");
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
    const s = ksaUniversityStipend({ category: v.category, excellence: v.excellence });
    if (!s) return null;
    const list = ksaNextPayDates({ item: "stipend", today: v.from || new Date(), count: 6 });
    const p = list[0];
    let html = big("باقي على المكافأة", p.days === 0 ? "اليوم" : daysAr(p.days), `${full(p.date)} · ${hij(p.hijri)}`);
    if (!v.from || v.from === localToday()) html += `<p class="ticker" data-to="${p.date}" aria-hidden="true"></p>`;
    html += table(
      [
        [`المكافأة الشهرية (${NAME[s.category]})`, money(s.gross, cur)],
        s.deduction ? ["حسم صندوق الطلاب", `− ${money(s.deduction, cur)}`] : null,
        ["الصافي شهرياً", money(s.net, cur), { strong: true }],
        s.excellence ? ["مكافأة التفوق (مرة في العام)", money(s.excellence, cur)] : null,
        ["في 12 شهراً", money(s.annual, cur)],
        s.graduate ? ["بدل الكتب السنوي (مكافأة شهر)", money(s.graduate.books, cur)] : null,
      ],
      "تفصيل المكافأة"
    );
    html += table(list.map((x) => [mf.format(D(x.month + "-01")), `${full(x.date)}<br><small>${hij(x.hijri)}${x.shifted ? ` · يوم 27 يوافق ${wdf.format(D(x.nominal))}` : ""}</small>`]), "مواعيد الصرف القادمة");
    if (s.tvtc) html += note("مبلغ المتدرب من الأسئلة الشائعة للمؤسسة العامة للتدريب التقني (2023)، ولم نعرف هل يُحسم منه للصندوق، ولا يوم صرفه؛ المواعيد أعلاه للجامعات.", "warn");
    if (s.category.startsWith("disability")) html += note("مبلغا ذوي الإعاقة من جامعة جدة وحدها، والتصنيف بقرار من وزارة الموارد البشرية. تحقق من جامعتك.", "warn");
    if (v.excellence && !s.excellence) html += note("مكافأة التفوق 1,000 لطلاب البكالوريوس فقط.", "info");
    html += note("يوم 27 عرف الجامعات الكبرى لا قاعدة وطنية، وكل جامعة قد تقدّم الصرف في المناسبات. وفي الصيف لا تُصرف في بعض الجامعات إلا لمن سجّل في الفصل الصيفي.", "info");
    setTimeout(startTicker, 0);
    return html;
  },
  { save: false }
);
