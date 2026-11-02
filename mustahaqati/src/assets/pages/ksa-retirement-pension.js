import { ksaPension, rules } from "../calc.js";
import { bind, money, num, table, big, note, arDate, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";

bind(form, result, (v) => {
  if (!v.birth || !v.start || !v.end || !v.avg) return null;
  const p = ksaPension({ system: v.system, birth: v.birth, start: v.start, end: v.end, gapMonths: v.gaps || 0, avgWage: v.avg });
  if (!p) return note("تاريخ التقاعد يجب أن يكون بعد تاريخ بداية الاشتراك.", "bad");
  const isNew = v.system === "new";
  const statusTxt = p.status === "normal" ? "معاش تقاعد بالسن النظامية" : p.status === "early" ? "معاش تقاعد مبكر" : "لا يستحق معاشاً في هذا التاريخ";
  let html = p.status === "none"
    ? big("المعاش الشهري", money(0, cur), `${monthsAr(p.months)} اشتراك · العمر ${num(p.ageAtEnd, 1)} سنة`)
    : big("معاشك الشهري التقديري", money(p.pension, cur), `${statusTxt} · ${num(p.pct, 2)}% من متوسط الأجر`);
  const rows = [
    ["النظام", isNew ? "النظام الجديد (من 3 يوليو 2024)" : p.transitional ? "النظام السابق — فئة انتقالية (تغيّر سنك ومدة المبكر)" : "النظام السابق"],
    ["مدة الاشتراك", `${monthsAr(p.months)} (${num(p.years, 2)} سنة)`],
    ["السن النظامية", arDate(p.normalDate) + (isNew ? " (65 سنة)" : p.transitional ? "" : " (60 سنة هجرية)")],
    ["المدة اللازمة للتقاعد المبكر", monthsAr(p.earlyMonthsNeeded) + (isNew ? " ومن عمر 55" : " بأي عمر")],
  ];
  if (isNew) {
    rows.push(["المعاش قبل الخصم (2.25% × السنوات)", money(p.base, cur)]);
    if (p.reduction) rows.push([`خصم التقاعد المبكر (${num(p.reduction * 100, 2)}%)`, money(p.base * p.reduction, cur)]);
    if (p.deferral) rows.push([`زيادة التأجيل بعد 65 (${num(p.deferral * 100, 2)}%)`, "مضافة"]);
    if (p.minimum) rows.push(["الحد الأدنى التقديري لمدتك", money(p.minimum, cur), { muted: true }]);
  } else {
    rows.push(["المعادلة", `${money(Number(v.avg), cur)} × ${p.months} ÷ 480`]);
    rows.push(["الحد الأدنى للمعاش", money(p.minimum, cur), { muted: true }]);
  }
  rows.push(["المعاش الشهري", money(p.pension, cur), { strong: true }]);
  html += table(rows, "تفصيل الحساب");
  if (p.status === "none") {
    if (isNew) html += note(`للمعاش في النظام الجديد: ${monthsAr(rules.sa.pension.new.minMonths)} على الأقل عند 65، أو ${monthsAr(rules.sa.pension.new.earlyMinMonths)} للمبكر من عمر 55. ومن لم يستوفِ ذلك عند 65 يُعوَّض: تعويض على مجموع الاشتراكات إن كانت مدته 60 شهراً فأكثر، أو دفعة واحدة إن قلّت.`, "warn");
    else html += note(`تحتاج ${monthsAr(p.earlyMonthsNeeded)} للمبكر، أو بلوغ السن النظامية مع ${monthsAr(p.minMonths)} على الأقل. ومن لا يستحق معاشاً يُصرف له تعويض الدفعة الواحدة، وتقديره لمدتك: <strong>${money(p.lumpSum, cur)}</strong>.`, "warn");
  }
  if (isNew) html += note("الحد الأدنى بين 180 و480 شهراً تقديري (ينزل خطياً من 4,000 إلى 2,000 ريال)، والتأمينات هي التي تحدده. ولم يحسم النص هل يُطبق الحد الأدنى بعد خصم المبكر.", "info");
  else html += note("افترضنا أن مدد الاشتراك كلها بعد 1422هـ وأن الأجر لم يتجاوز سقف 150% من أجر بداية آخر 5 سنوات. المدد السابقة لعام 1422هـ تُحسب بقاسم 600.", "info");
  return html;
});
