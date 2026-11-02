import { ksaArt77, serviceDuration, rules } from "../calc.js";
import { bind, money, num, table, big, note, duration, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const fixedOnly = form.querySelectorAll("[data-fixed]");
const dayDiff = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

bind(form, result, (v) => {
  const fixed = v.type === "fixed";
  fixedOnly.forEach((el) => (el.hidden = !fixed));
  if (!v.wage || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, 0);
  if (!d) return note("تاريخ الإنهاء يجب أن يكون بعد تاريخ المباشرة.", "bad");
  let remaining = 0;
  if (fixed) {
    if (!v.contractEnd) return null;
    remaining = Math.max(0, dayDiff(v.end, v.contractEnd));
  }
  const a = ksaArt77({ wage: v.wage, type: v.type, years: d.decimalYears, remainingDays: remaining });
  const A = rules.sa.art77;
  let html = big("تعويض الإنهاء لسبب غير مشروع", money(a.total, cur), `مدة الخدمة: ${duration(d)} · على الأجر الفعلي الأخير`);
  html += table(
    [
      ["أجر اليوم (الأجر الفعلي ÷ 30)", money(a.daily, cur)],
      fixed ? [`أجر المدة الباقية من العقد (${daysAr(remaining)})`, money(a.base, cur)] : [`${num(d.decimalYears, 2)} سنة × ${A.daysPerYear} يوماً`, money(a.base, cur)],
      [`الحد الأدنى (أجر شهرين)`, money(a.minimum, cur), { muted: !a.minimumApplied }],
      ["التعويض المستحق", money(a.total, cur), { strong: true }],
    ],
    "تفصيل الحساب (المادة 77)"
  );
  if (a.minimumApplied) html += note("المبلغ المحسوب أقل من أجر شهرين، فيُستحق الحد الأدنى.", "info");
  html += note("يُستحق التعويض إضافةً إلى مكافأة نهاية الخدمة (المادة 84) حسب ما تعرضه المصادر القانونية. وإذا نص عقدك على تعويض محدد لهذه الحالة فهو الذي يسري.", "ok");
  if (!fixed) html += note("حسبنا كسور السنة بالنسبة كما تفعل الحاسبات ومكاتب المحاماة؛ النص لا يذكرها صراحة.", "info");
  return html;
});
