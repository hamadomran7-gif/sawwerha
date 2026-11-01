import { serviceDuration, ksaEndOfService, KSA_REASONS } from "../calc.js";
import { bind, money, num, table, big, note, duration } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";

bind(form, result, (v) => {
  if (!v.wage || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, 0);
  if (!d) return note("تاريخ آخر يوم عمل يجب أن يكون بعد تاريخ المباشرة.", "bad");
  const e = ksaEndOfService({ wage: v.wage, years: d.decimalYears, reason: v.reason });
  const fractionLabel = e.fraction === 1 ? "كاملة" : e.fraction === 0 ? "لا شيء" : e.fraction > 0.5 ? "الثلثان" : "الثلث";

  let html = big("مكافأة نهاية الخدمة المستحقة", money(e.total, cur), `مدة الخدمة: ${duration(d)} (${num(d.decimalYears, 2)} سنة) · ${KSA_REASONS[v.reason] || ""}`);
  html += table(
    [
      [`السنوات الخمس الأولى: ${num(e.firstYears, 2)} سنة × نصف شهر`, money(e.firstAmount, cur)],
      e.secondYears > 0 ? [`ما بعد السنة الخامسة: ${num(e.secondYears, 2)} سنة × شهر كامل`, money(e.secondAmount, cur)] : null,
      ["المكافأة الكاملة (المادة 84)", money(e.gross, cur), { muted: e.fraction !== 1 }],
      ["النسبة المستحقة بحسب السبب", fractionLabel + (e.fraction > 0 && e.fraction < 1 ? ` (${num(e.fraction * 100, 1)}%)` : "")],
      ["المكافأة المستحقة", money(e.total, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  html += note(e.rule, e.fraction === 0 ? "warn" : "ok");
  if (v.reason === "resignation" && d.decimalYears >= 2 && d.decimalYears < 10) {
    const years10 = 10 - d.decimalYears;
    const nextStep = d.decimalYears <= 5 ? `لو استمررت حتى تتجاوز 5 سنوات ترتفع النسبة إلى الثلثين، ومن 10 سنوات تُصرف كاملة.` : `بقي ${num(years10, 1)} سنة لتُصرف المكافأة كاملة عند الاستقالة.`;
    html += note(nextStep, "info");
  }
  return html;
});
