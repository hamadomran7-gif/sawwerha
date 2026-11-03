import { upcomingHolidays } from "../calc.js";
import { bind, table, big, note, arDate, daysAr, daysGen } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const NAME = { ae: "الإمارات", sa: "السعودية", qa: "قطر", kw: "الكويت", om: "عُمان", bh: "البحرين" };
const now = new Date();
form.from.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

bind(
  form,
  result,
  (v) => {
    if (!v.from) return null;
    const rows = [];
    let soonest = null;
    for (const c of Object.keys(NAME)) {
      const up = upcomingHolidays({ country: c, from: v.from });
      if (!up.length) { rows.push([NAME[c], "لا عطلة في الجدول بعد هذا التاريخ"]); continue; }
      const h = up[0];
      const when = h.ongoing ? "جارية الآن" : h.daysUntil === 0 ? "اليوم" : h.daysUntil === 1 ? "غداً" : `بعد ${daysGen(h.daysUntil)}`;
      const range = h.days > 1 ? `${arDate(h.start)} – ${arDate(h.end)}` : arDate(h.start);
      rows.push([NAME[c], `${h.ar}: ${range} (${when})${h.official ? "" : " · متوقع"}`]);
      if (!soonest || h.daysUntil < soonest.h.daysUntil) soonest = { c, h };
    }
    let html = soonest ? big("أقرب عطلة رسمية في الخليج", `${soonest.h.ar} (${NAME[soonest.c]})`, soonest.h.ongoing ? "جارية الآن" : soonest.h.daysUntil === 0 ? "اليوم" : `بعد ${daysGen(soonest.h.daysUntil)} · ${arDate(soonest.h.start)}`) : "";
    html += table(rows, "العطلة القادمة في كل دولة");
    html += note("للقطاع الخاص. والتواريخ الهجرية متوقعة وقد تتغير يوماً بحسب رؤية الهلال.", "info");
    return html;
  },
  { save: false }
);
