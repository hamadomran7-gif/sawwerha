import { overstayFine, rules } from "../calc.js";
import { bind, money, table, big, note, arDate, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";
const O = rules.ae.overstay;
const EVENT = { visit: "تاريخ انتهاء التأشيرة", permit: "تاريخ إصدار إذن المغادرة", newborn: "تاريخ الولادة", eid: "تاريخ انتهاء الهوية" };
const EXIT = { newborn: "تاريخ إصدار الإقامة أو المغادرة", eid: "تاريخ التجديد" };
const diffDays = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

bind(form, result, (v) => {
  const t = v.type;
  form.querySelector('label[for="event"]').textContent = EVENT[t] || "تاريخ الإلغاء أو انتهاء الإقامة";
  form.querySelector('label[for="exit"]').textContent = EXIT[t] || "تاريخ المغادرة أو تعديل الوضع";
  const noPermit = t === "eid" || t === "newborn";
  form.querySelectorAll("[data-permit]").forEach((el) => (el.hidden = noPermit));
  const r = overstayFine({ country: "ae", type: t, event: v.event, exit: v.exit });
  if (!r) return null;
  const T = O.types[t];
  const perDay = T.perDay ?? O.perDay;
  const grace = t === "permit" ? "7 أيام من الإصدار" : t === "newborn" ? "120 يوماً من الولادة" : t === "eid" ? "30 يوماً من الانتهاء" : T.grace ? daysAr(T.grace) : "لا مهلة";
  const fees = v.permitFee && !noPermit ? O.departurePermit + O.smartFee : 0;

  let html;
  if (!r.days) {
    const left = diffDays(v.exit, r.lastAllowed);
    html = big("لا غرامة", money(fees, cur), `آخر يوم دون غرامة ${arDate(r.lastAllowed)}${left > 0 ? `، باقٍ ${daysAr(left)}` : ""}`);
    html += table([["مهلة السماح", grace], ["آخر يوم دون غرامة", arDate(r.lastAllowed)], fees ? ["إذن المغادرة (200) + الخدمات الذكية (100)", money(fees, cur)] : null], "التفاصيل");
  } else {
    html = big("الغرامة التقديرية", money(r.total + fees, cur), `${daysAr(r.days)} × ${money(perDay, cur)} بعد ${arDate(r.lastAllowed)}`);
    html += table(
      [
        ["مهلة السماح", grace],
        ["آخر يوم دون غرامة", arDate(r.lastAllowed)],
        ["أيام التجاوز (يُحتسب يوم المغادرة)", daysAr(r.days)],
        [`الغرامة: ${daysAr(r.days)} × ${money(perDay, cur)}`, money(r.gross, cur)],
        r.capped ? [`بعد الحد الأقصى ${money(r.cap, cur)} (بلغته في اليوم ${r.capDay})`, money(r.total, cur)] : null,
        fees ? ["إذن المغادرة (200) + الخدمات الذكية (100)", money(fees, cur)] : null,
        ["المجموع", money(r.total + fees, cur), { strong: true }],
      ],
      "تفصيل الغرامة"
    );
    if (r.waiverDays) html += note(`إن تعذّر سفرك بسبب إغلاق الأجواء، فغرامات ${daysAr(r.waiverDays)} بين 28 فبراير و9 يوليو 2026 مُعفاة، فتصبح الغرامة ${money(r.totalAfterWaiver + fees, cur)}.`, "info");
    if (r.totalAlt) html += note(`البوابة الرسمية u.ae تذكر 100 درهم يومياً لإقامة المولود، فتصبح الغرامة ${money(r.totalAlt, cur)}؛ واعتمدنا 50 بحسب صفحة الهيئة الاتحادية للهوية والجنسية.`, "warn");
  }
  if (t === "res60") html += note("مهلة 60 يوماً للإقامات الصادرة بكفيل أو مستضيف، وتشمل بحسب ما نقلته الصحف عن الهيئة الموظفين والأسر والعمالة المنزلية. تحقق من آخر يوم للمغادرة في نموذج الإلغاء أو الخدمات الذكية للهيئة.", "warn");
  if (t === "eid") html += note(`تُضاف رسوم التجديد: ${money(100, cur)} عن كل سنة إقامة و${money(100, cur)} للتطبيق الذكي. ومهلة 30 يوماً بعد الانتهاء منقولة عن الصحف.`, "info");
  html += note("الحساب تقديري وقد يختلف يوماً واحداً بحسب طريقة العد. لا سقف منشوراً للغرامة اليومية، ويجوز طلب الإعفاء أو التخفيض من الهيئة أو من إقامة دبي.", "info");
  return html;
});
