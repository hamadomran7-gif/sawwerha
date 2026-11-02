import { serviceDuration, kuwaitIndemnity, KW_REASONS, rules } from "../calc.js";
import { bind, money, num, table, big, note, duration } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "د.ك";

bind(form, result, (v) => {
  if (!v.wage || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, 0);
  if (!d) return note("تاريخ آخر يوم عمل يجب أن يكون بعد تاريخ المباشرة.", "bad");
  const k = kuwaitIndemnity({ wage: v.wage, years: d.decimalYears, reason: v.reason, divisor: Number(v.divisor) || 26 });
  const R = rules.kw.eos;
  const fr = k.fraction === 1 ? "كاملة" : k.fraction === 0 ? "لا شيء" : k.fraction > 0.6 ? "الثلثان" : "النصف";
  let html = big("مكافأة نهاية الخدمة المستحقة", money(k.total, cur), `مدة الخدمة: ${duration(d)} (${num(d.decimalYears, 2)} سنة) · ${KW_REASONS[v.reason] || ""}`);
  html += table(
    [
      [`الأجر اليومي (الشهري ÷ ${k.divisor})`, money(k.dailyWage, cur)],
      [`أول 5 سنوات: ${num(k.firstYears, 2)} سنة × ${R.daysFirst} يوماً`, money(k.firstAmount, cur)],
      k.secondYears > 0 ? [`ما بعد الخامسة: ${num(k.secondYears, 2)} سنة × أجر شهر`, money(k.secondAmount, cur)] : null,
      ["السقف (أجر 18 شهراً)", money(k.cap, cur), { muted: !k.capped }],
      ["المكافأة الكاملة", money(k.gross, cur), { muted: k.fraction !== 1 }],
      ["النسبة المستحقة بحسب السبب", fr],
      ["المكافأة المستحقة", money(k.total, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  if (k.capped) html += note("بلغت المكافأة السقف القانوني: أجر سنة ونصف.", "warn");
  if (v.reason === "resignation" && d.decimalYears < 10) html += note("نسب الاستقالة (المادة 53): لا شيء دون 3 سنوات، والنصف من 3 إلى أقل من 5، والثلثان من 5 إلى أقل من 10، وكاملة من 10 سنوات.", "info");
  const alt = kuwaitIndemnity({ wage: v.wage, years: d.decimalYears, reason: v.reason, divisor: k.divisor === 26 ? 30 : 26 });
  html += note(`بقسمة الأجر على ${alt.divisor} بدلاً من ${k.divisor} تكون المكافأة ${money(alt.total, cur)}. القانون لا يحدد القاسم صراحةً، والقسمة على 26 هي الممارسة المتبعة.`, "info");
  return html;
});
