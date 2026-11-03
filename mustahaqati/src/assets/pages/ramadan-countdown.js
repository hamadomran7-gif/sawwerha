import { hijriEventCountdown, ramadanHours } from "../calc.js";
import { bind, table, big, note, arDate, daysAr, weeksAr, hoursAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const EVENT = { ramadan: "رمضان", eidFitr: "عيد الفطر", arafat: "يوم عرفة", eidAdha: "عيد الأضحى", hijriNewYear: "رأس السنة الهجرية" };
const HDAY = { ramadan: "1 رمضان", eidFitr: "1 شوال", arafat: "9 ذو الحجة", eidAdha: "10 ذو الحجة", hijriNewYear: "1 محرم" };
const COUNTRY = { ae: "الإمارات", sa: "السعودية", qa: "قطر", kw: "الكويت", om: "عُمان", bh: "البحرين" };
const wd = new Intl.DateTimeFormat("ar-u-nu-latn", { weekday: "long", timeZone: "UTC" });
const full = (iso) => `${wd.format(new Date(`${iso}T00:00:00Z`))} ${arDate(iso)}`;

bind(form, result, (v) => {
  const r = hijriEventCountdown({ event: v.event, today: new Date() });
  if (!r) return null;
  let html;
  if (r.ongoing) {
    html = big("نحن في رمضان", `اليوم ${r.ongoing.day}`, r.ongoing.daysToEid > 0 ? `باقي على عيد الفطر ${daysAr(r.ongoing.daysToEid)} (${full(r.ongoing.eid)} متوقعاً)` : "عيد الفطر غداً أو اليوم بحسب الرؤية");
  } else {
    html = big(`باقي على ${EVENT[r.event]}`, r.days === 0 ? "اليوم" : daysAr(r.days), `${full(r.date)} · ${HDAY[r.event]} ${r.hijriYear}`);
  }
  const rows = [
    [`${EVENT[r.event]} ${r.hijriYear} بتقويم أم القرى`, full(r.date)],
    ["المدة المتبقية", r.days >= 7 ? `${weeksAr(r.weeks)}${r.restDays ? ` و${daysAr(r.restDays)}` : ""}` : daysAr(r.days)],
  ];
  if (r.event === "ramadan" && !r.ongoing) {
    rows.push(["عيد الفطر المتوقع", full(r.eid)]);
    rows.push(["عدد أيام رمضان بتقويم أم القرى", daysAr(r.length)]);
  }
  html += table(rows, "الموعد");
  const h = ramadanHours({ country: v.country, normal: v.normal, days: v.days, muslim: v.muslim !== "no" });
  if (h) {
    html += table(
      [
        ["دوامك العادي", `${hoursAr(h.normalDaily)} يومياً (${hoursAr(h.normalWeekly)} أسبوعياً)`],
        ["دوامك في رمضان", `${hoursAr(h.daily)} يومياً (${hoursAr(h.weekly)} أسبوعياً)`, { strong: true }],
        ["التخفيض", h.cut > 0 ? `${hoursAr(h.cut)} يومياً` : "لا تخفيض"],
      ],
      `ساعات الدوام في رمضان — ${COUNTRY[v.country]}`
    );
    if (!h.applies) html += note("تخفيض رمضان في هذه الدولة للعامل المسلم؛ وغير المسلم يبقى على ساعاته العادية ما لم يقرر صاحب العمل غير ذلك.", "info");
    if (v.country === "kw") html += note("في الكويت سقف رمضان 36 ساعة أسبوعياً بلا حد يومي، فوزعناه على أيام عملك.", "info");
    if (v.country === "ae") html += note("في الإمارات تُخفض الساعات العادية ساعتين يومياً لكل العاملين، وما زاد عليها عمل إضافي.", "info");
  }
  html += note("التواريخ بتقويم أم القرى، وتعلن كل دولة بداية الشهر برؤية الهلال، فقد يختلف الموعد يوماً.", "info");
  return html;
});
