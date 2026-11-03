import { ksaRetirementAge, ageCalc } from "../calc.js";
import { bind, num, table, big, note, arDate, yearsAr, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const ym = (m) => {
  const y = Math.floor(m / 12);
  const r = m % 12;
  return r ? `${yearsAr(y)} و${monthsAr(r)}` : yearsAr(y);
};
const ageAt = (birth, iso) => {
  const a = ageCalc({ birth, asOf: iso });
  return a ? (a.months ? `${yearsAr(a.years)} و${monthsAr(a.months)}` : yearsAr(a.years)) : "—";
};
const CAT = { new: "مشترك جديد (من 3 يوليو 2024)", transitional: "مشترك سابق مشمول بالتعديلات", legacy: "مشترك سابق غير مشمول بالتعديلات" };

bind(form, result, (v) => {
  const legacyFields = form.querySelectorAll("[data-legacy]");
  const today = new Date().toISOString().slice(0, 10);
  if (!v.birth || !v.start) return null;
  const sys = v.system === "auto" ? null : v.system === "new";
  const r = ksaRetirementAge({ birth: v.birth, start: v.start, newMember: sys, monthsAtEff: v.monthsAtEff, gapMonths: v.gapMonths || 0 });
  legacyFields.forEach((el) => (el.hidden = !!(r && r.isNew)));
  if (!r) return null;
  const normalSub = r.category === "legacy" ? `عند 60 سنة هجرية (عمرك يومها ${ageAt(v.birth, r.normalDate)} ميلادياً)` : `عند ${ym(r.normalAgeMonths)}`;
  let html = big("تاريخ تقاعدك النظامي", arDate(r.normalDate), `${normalSub} · ${CAT[r.category]}`);
  const rows = [["فئتك", CAT[r.category]]];
  if (!r.isNew) {
    rows.push(["عمرك في 3 يوليو 2024", `${num(r.ageOnEff, 2)} سنة`]);
    rows.push(["أشهر اشتراكك في 3 يوليو 2024", monthsAr(r.monthsOnEff)]);
  }
  rows.push(["السن النظامية", r.category === "legacy" ? "60 سنة هجرية" : ym(r.normalAgeMonths), { strong: true }]);
  rows.push(["أقل مدة للمعاش عند السن النظامية", `${monthsAr(r.minMonths)} (${yearsAr(r.minMonths / 12)})`]);
  rows.push(["مدة التقاعد المبكر", `${monthsAr(r.earlyMonthsNeeded)} (${ym(r.earlyMonthsNeeded)})${r.earlyMinAgeMonths ? ` مع بلوغ ${ym(r.earlyMinAgeMonths)}` : " بأي سن"}`]);
  if (r.earlyDate) rows.push([r.earlyDate <= today ? "أكملت شروط المبكر في" : "تكمل شروط المبكر في", `${arDate(r.earlyDate)} (عمرك ${ageAt(v.birth, r.earlyDate)})`, { strong: true }]);
  else rows.push(["التقاعد المبكر", "لن تكمل مدته قبل السن النظامية إن استمر اشتراكك كما هو"]);
  html += table(rows, "التفاصيل");
  if (r.category === "new") html += note(`المعاش المبكر للمشترك الجديد يُخصم منه ${num(r.earlyReductionPerYear * 100, 0)}% عن كل سنة قبل 65، وتأجيل التقاعد بعد 65 يزيده 3% عن كل سنة.`, "info");
  if (r.category === "transitional") html += note("المعادلة وطريقة الحساب لم تتغير للمشمولين؛ الذي تغيّر السن ومدة المبكر فقط. ولموظف التقاعد المدني: الإحالة عند 60 هجرية لم تُعدَّل، وعلاقتها بالسن الجديدة غير محسومة رسمياً.", "warn");
  if (r.category === "legacy" && r.monthsOnEff >= 240) html += note("أشهر اشتراكك في 3 يوليو 2024 بلغت 240 فأكثر، فلا تشملك التعديلات أياً كان عمرك.", "info");
  html += note("تاريخ المبكر يفترض اشتراكاً متصلاً بعد 3 يوليو 2024 دون انقطاع. والسن الدقيقة يحددها بيان التأمينات.", "info");
  return html;
});
