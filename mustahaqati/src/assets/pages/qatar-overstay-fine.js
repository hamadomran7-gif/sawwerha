import { overstayFine, rules } from "../calc.js";
import { bind, money, table, big, note, arDate, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const O = rules.qa.overstay;
const EVENT = { cancelled: "تاريخ إلغاء الإقامة", visit: "تاريخ انتهاء الزيارة", notCompleted: "تاريخ الدخول" };
const EXIT = { notCompleted: "تاريخ إتمام الإقامة" };

bind(form, result, (v) => {
  const t = v.type;
  form.querySelector('label[for="event"]').textContent = EVENT[t];
  form.querySelector('label[for="exit"]').textContent = EXIT[t] || "تاريخ المغادرة أو التسوية";
  const r = overstayFine({ country: "qa", type: t, event: v.event, exit: v.exit });
  if (!r) return null;
  const T = O.types[t];
  const grace = T.grace ? daysAr(T.grace) : "لا مهلة";
  if (!r.days) return big("لا غرامة", money(0, cur), `آخر يوم دون غرامة ${arDate(r.lastAllowed)}`) + note(`المهلة: ${grace}.`, "info");
  let html = big("الغرامة التقديرية", money(r.totalCapReported ?? r.total, cur), `${daysAr(r.days)} × ${money(T.perDay, cur)} بعد ${arDate(r.lastAllowed)}`);
  html += table(
    [
      ["المهلة", grace],
      ["آخر يوم دون غرامة", arDate(r.lastAllowed)],
      ["أيام التجاوز (يُحتسب يوم المغادرة)", daysAr(r.days)],
      [`${daysAr(r.days)} × ${money(T.perDay, cur)}`, money(r.gross, cur)],
      r.capped ? [`بعد الحد الأقصى ${money(r.cap, cur)}`, money(r.total, cur)] : null,
      r.totalCapReported !== undefined && r.totalCapReported < r.gross ? [`بعد السقف المتداول ${money(T.capReported, cur)}`, money(r.totalCapReported, cur), { strong: true }] : ["الغرامة", money(r.total, cur), { strong: true }],
    ],
    "تفصيل الغرامة"
  );
  if (t === "visit") html += note(`سقف ${money(T.capReported, cur)} لغرامة الزيارة منقول عن مصدر غير رسمي؛ دونه تبلغ الغرامة ${money(r.gross, cur)}.`, "warn");
  if (t === "cancelled") html += note("مهلة 14 يوماً بحسب تصريح وزارة الداخلية في يونيو 2026 (كانت 30)، ولم يتضح هل تسري على انتهاء الإقامة أيضاً، ولا سقف منشوراً للغرامة.", "warn");
  if (t === "notCompleted") html += note("10 ريالات يومياً هي مبلغ التصالح بحد 6,000؛ وإن أُحيلت المخالفة فالغرامة قد تصل إلى 10,000 ريال (المادة 40).", "info");
  html += note("الأرقام من تصريحات وزارة الداخلية كما نقلتها الصحف. الحساب تقديري وقد يختلف يوماً بحسب طريقة العد.", "info");
  return html;
});
