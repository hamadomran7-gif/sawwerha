import { serviceDuration, qatarGratuity, rules } from "../calc.js";
import { bind, money, num, table, big, note, duration } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال قطري";

bind(form, result, (v) => {
  if (!v.basic || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, 0);
  if (!d) return note("تاريخ آخر يوم عمل يجب أن يكون بعد تاريخ المباشرة.", "bad");
  const forfeited = v.reason === "art61";
  const g = qatarGratuity({ basicSalary: v.basic, years: d.decimalYears, forfeited });
  const R = rules.qa.eos;
  if (forfeited) return big("مكافأة نهاية الخدمة", money(0, cur), `مدة الخدمة: ${duration(d)}`) + note("لا تُستحق المكافأة عند الفصل لإحدى حالات المادة 61، ويحق للعامل التظلم إن نازع في سبب الفصل.", "warn");
  if (!g.eligible) return big("مكافأة نهاية الخدمة", money(0, cur), `مدة الخدمة: ${duration(d)}`) + note("لا تُستحق المكافأة قبل إكمال سنة خدمة (المادة 54).", "warn");
  let html = big("مكافأة نهاية الخدمة (الحد الأدنى القانوني)", money(g.total, cur), `مدة الخدمة: ${duration(d)} (${num(d.decimalYears, 2)} سنة)`);
  html += table(
    [
      ["الأجر اليومي (الأساسي ÷ 30)", money(g.dailyWage, cur)],
      [`${num(d.decimalYears, 2)} سنة × ${R.daysPerYear} يوماً`, `${num(g.days, 1)} يوماً`],
      ["المكافأة المستحقة", money(g.total, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  html += note("هذا هو الحد الأدنى في القانون؛ إذا نص عقدك على مكافأة أعلى فالعقد هو الذي يسري. لا تنقص المكافأة عند الاستقالة.", "ok");
  return html;
});
