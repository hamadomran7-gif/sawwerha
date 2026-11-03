import { overstayFine } from "../calc.js";
import { bind, money, table, big, note, arDate, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "دينار";
const EVENT = { visit: "تاريخ انتهاء الزيارة", temporary: "تاريخ انتهاء الإقامة المؤقتة أو الإشعار", newborn: "تاريخ الولادة" };
const EXIT = { newborn: "تاريخ التسجيل" };

bind(form, result, (v) => {
  const t = v.type;
  form.querySelector('label[for="event"]').textContent = EVENT[t] || "تاريخ انتهاء الإقامة";
  form.querySelector('label[for="exit"]').textContent = EXIT[t] || "تاريخ المغادرة أو التسوية";
  const r = overstayFine({ country: "kw", type: t, event: v.event, exit: v.exit });
  if (!r) return null;
  if (!r.days) {
    return big("لا غرامة", money(0, cur), t === "newborn" ? `آخر يوم للتسجيل ${arDate(r.lastAllowed)}` : `قبل ${arDate(r.lastAllowed)} أو في يومه`) +
      note(t === "newborn" ? "يُسجل المولود خلال 4 أشهر من الولادة دون غرامة." : "لا مهلة سماح منشورة بعد انتهاء الإقامة أو الزيارة؛ الغرامة تبدأ من اليوم التالي للانتهاء.", "info");
  }
  let html = big("الغرامة", money(r.total, cur), `${daysAr(r.days)} بعد ${arDate(r.lastAllowed)}${r.capped ? " · بلغت الحد الأقصى" : ""}`);
  html += table(
    [
      t === "newborn" ? ["آخر يوم للتسجيل دون غرامة", arDate(r.lastAllowed)] : ["تاريخ الانتهاء", arDate(r.lastAllowed)],
      ["أيام المخالفة (يُحتسب يوم المغادرة)", daysAr(r.days)],
      ...r.rows.map((x) => [`${daysAr(x.days)} × ${money(x.perDay, cur)}${r.rows.length > 1 ? (x.from === 1 ? " (الشهر الأول)" : " (بعد الشهر الأول)") : ""}`, money(x.amount, cur)]),
      r.capped ? [`بعد الحد الأقصى ${money(r.cap, cur)} (بلغته في اليوم ${r.capDay})`, money(r.total, cur)] : null,
      ["الغرامة المستحقة", money(r.total, cur), { strong: true }],
    ],
    "تفصيل الغرامة"
  );
  if (!r.capped && r.capDay) html += note(`تبلغ الغرامة حدها الأقصى ${money(r.cap, cur)} في اليوم ${r.capDay} من المخالفة.`, "info");
  if (r.rows.length > 1 || t === "newborn") html += note("افترضنا أن «الشهر الأول» 30 يوماً، والنص المنشور لا يحدد هل هو شهر تقويمي.", "info");
  if (t === "newborn") html += note("تدرّج غرامة المولود (2 ثم 4) من مصدرين صحفيين، وذكر مصدر ثالث دينارين يومياً دون تدرج بالحد نفسه.", "warn");
  html += note("الغرامات تصالحية: سدادها ينهي المخالفة، وإلا يُحال المخالف ويجوز إبعاده. الحساب تقديري وقد يختلف يوماً بحسب طريقة العد.", "info");
  return html;
});
