import { ksaIqamaRenewal, rules } from "../calc.js";
import { bind, money, num, table, big, note, monthsAr, countAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const workersAr = (n) => countAr(n, "عامل واحد", "عاملان", "عمال", "عاملاً", "عامل");
const n = (x) => Math.max(0, Math.floor(Number(x) || 0));

bind(form, result, (v) => {
  const F = rules.sa.expatFees;
  const r = ksaIqamaRenewal({ high: v.high, low: v.low, exempt: v.exempt, months: Number(v.months) || 12, iqamaPerWorker: v.iqama });
  if (!r.workers) return null;
  const m = r.months;

  let html = big(`رسوم تجديد الإقامة لـ${monthsAr(m)}`, money(r.total, cur), `${workersAr(r.workers)}، على صاحب العمل`);
  html += table(
    [
      n(v.high) ? [`المقابل المالي: ${workersAr(n(v.high))} × ${num(F.levyHigh)} ريال × ${monthsAr(m)}`, money(r.levyHigh, cur)] : null,
      n(v.low) ? [`المقابل المالي: ${workersAr(n(v.low))} × ${num(F.levyLow)} ريال × ${monthsAr(m)}`, money(r.levyLow, cur)] : null,
      n(v.exempt) ? [`المقابل المالي على المعفين (${workersAr(n(v.exempt))})`, money(0, cur)] : null,
      [`رسم رخصة العمل: ${workersAr(r.workers)} × ${num((F.workPermitAnnual * m) / 12)}`, money(r.permit, cur)],
      r.iqama ? [`رسم هوية مقيم كما أدخلته: ${workersAr(r.workers)} × ${num(Number(v.iqama))}`, money(r.iqama, cur)] : null,
      ["المجموع على صاحب العمل", money(r.total, cur), { strong: true }],
    ],
    "على صاحب العمل (المادة 40 من نظام العمل)"
  );

  if (!r.iqama) html += note("المجموع بلا رسم هوية مقيم، لأن دليل الوزارة لا يذكر مبلغه؛ أدخله كما يظهر لك في أبشر أو مقيم لتضيفه.", "info");
  if (n(v.exempt)) html += note("إعفاء المنشأة الصغيرة المعلن من المقابل المالي وحده، فأبقت الحاسبة رسم رخصة العمل على العامل المعفى. تحقق من المبلغ في قوى.", "info");
  if (n(v.exempt) > 4) html += note("الحد الأقصى للإعفاء 4 عمال وافدين في المنشأة.", "warn");
  if (m < 12) html += note(`للمقارنة: سنة كاملة لعامل واحد ${money(F.levyHigh * 12 + F.workPermitAnnual, cur)} بمقابل ${num(F.levyHigh)}، أو ${money(F.levyLow * 12 + F.workPermitAnnual, cur)} بمقابل ${num(F.levyLow)}.`, "info");
  html += note("الفئة (800 أو 700) والمبلغ المستحق على كل عامل يظهران في منصة قوى عند إصدار رخصة العمل أو تجديدها. ورسوم المرافقين على رب الأسرة، وتحسبها صفحة رسوم المرافقين.", "info");
  return html;
});
