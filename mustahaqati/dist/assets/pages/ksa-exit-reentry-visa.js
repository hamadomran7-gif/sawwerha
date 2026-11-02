import { ksaExitReentryFee } from "../calc.js";
import { bind, money, num, table, big, note, monthsAr, daysAr, countAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const personsAr = (n) => countAr(n, "فرد واحد", "فردان", "أفراد", "فرداً", "فرد");
const LABEL = { single: "مفردة", multiple: "متعددة" };

bind(form, result, (v) => {
  if (!v.days) return null;
  const outside = v.where === "outside";
  const r = ksaExitReentryFee({ type: v.type, days: v.days, persons: v.persons || 1, extendMonths: v.extendMonths || 0, outside });
  const other = ksaExitReentryFee({ type: v.type === "single" ? "multiple" : "single", days: v.days });

  let html = big("رسوم الخروج والعودة", money(r.total, cur), `${LABEL[v.type] || "مفردة"} · ${monthsAr(r.months)} · ${personsAr(r.persons)}`);
  const ext = Math.max(0, Math.floor(v.extendMonths || 0));
  html += table(
    [
      ["المدة", `${daysAr(Math.floor(v.days))} = ${monthsAr(r.months)}`],
      ["رسم الإصدار للفرد", money(r.base, cur)],
      ext ? [`التمديد: ${monthsAr(ext)} × ${num(r.perExtMonth)} ريال${outside ? " (من الخارج)" : ""}`, money(r.extension, cur)] : null,
      ["للفرد", money(r.perPerson, cur)],
      r.persons > 1 ? [`× ${personsAr(r.persons)}`, money(r.total, cur), { strong: true }] : ["الإجمالي", money(r.total, cur), { strong: true }],
      v.worker ? ["على صاحب العمل (تأشيرة العامل)", money(r.perPerson, cur)] : null,
      v.worker && r.persons > 1 ? ["على رب الأسرة", money(r.total - r.perPerson, cur)] : null,
    ],
    "تفصيل الحساب"
  );
  const cheaper = other.perPerson < r.base;
  html += note(`للمقارنة: التأشيرة ${v.type === "single" ? "المتعددة" : "المفردة"} للمدة نفسها ${money(other.perPerson, cur)} للفرد${cheaper ? "، وهي أرخص" : ""}.`, "info");
  html += note("الرسوم لا تُرد عند الإلغاء. لا تصدر التأشيرة إلا والإقامة سارية والجواز سارٍ 90 يوماً، ولا تُمدد إذا بقي على الإقامة أقل من 90 يوماً. وتُسدد رسوم المرافقين قبل إصدار تأشيرات الأسرة.", "info");
  return html;
});
