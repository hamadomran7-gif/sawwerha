import { serviceDuration, ksaEndOfService, KSA_REASONS } from "../calc.js";
import { bind, money, num, table, big, note, duration, yearsAr } from "../app.js";

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
      [`السنوات الخمس الأولى: ${yearsAr(e.firstYears)} × نصف شهر`, money(e.firstAmount, cur)],
      e.secondYears > 0 ? [`ما بعد السنة الخامسة: ${yearsAr(e.secondYears)} × شهر كامل`, money(e.secondAmount, cur)] : null,
      ["المكافأة الكاملة (المادة 84)", money(e.gross, cur), { muted: e.fraction !== 1 }],
      ["النسبة المستحقة بحسب السبب", fractionLabel + (e.fraction > 0 && e.fraction < 1 ? ` (${num(e.fraction * 100, 1)}%)` : "")],
      ["المكافأة المستحقة", money(e.total, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  html += note(e.rule, e.fraction === 0 ? "warn" : "ok");
  if (e.disputed) html += note(`بعد تعديلات 19 فبراير 2025 صارت «الاستقالة» في النظام خاصة بالعقد محدد المدة، فيرى عدد من المختصين أن من ينهي عقداً غير محدد المدة بإشعار المادة 75 يستحق المكافأة كاملة: <strong>${money(e.gross, cur)}</strong>. لم يصدر موقف منشور للوزارة ولا مبدأ قضائي يحسم ذلك، فعرضنا الحساب الأحوط (المادة 85).`, "info");
  if (v.reason === "article_80") html += note(`سقوط المكافأة مشروط بثبوت الحالة وبأن يتيح لك صاحب العمل فرصة إبداء أسباب اعتراضك. إن لم يتحقق ذلك فقد يُعد الإنهاء غير مشروع وتُستحق المكافأة كاملة (${money(e.gross, cur)}) مع التعويض. التفاصيل في <a href="/ksa-article-80/" target="_blank" rel="noopener">صفحة المادة 80</a>.`, "info");
  if (v.reason === "article_81") html += note(`إثبات الحالة يقع عليك عملياً، فوثّق الإخلال كتابياً قبل ترك العمل. التفاصيل في <a href="/ksa-article-81/" target="_blank" rel="noopener">صفحة المادة 81</a>.`, "info");
  if (v.reason === "mutual") html += note("إن كان «الاتفاق» في حقيقته استقالة بطلبك من عقد محدد المدة، فقد تُطبق نسب المادة 85. اطلب أن يذكر الاتفاق المكتوب حقوقك صراحة.", "info");
  if ((v.reason === "resignation" || v.reason === "worker_notice") && d.decimalYears >= 2 && d.decimalYears < 10) {
    const years10 = 10 - d.decimalYears;
    const nextStep = d.decimalYears <= 5 ? `لو استمررت حتى تتجاوز 5 سنوات ترتفع النسبة إلى الثلثين، ومن 10 سنوات تُصرف كاملة.` : `بقي ${num(years10, 1)} سنة لتُصرف المكافأة كاملة عند الاستقالة.`;
    html += note(nextStep, "info");
  }
  return html;
});
