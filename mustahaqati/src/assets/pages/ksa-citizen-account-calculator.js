import { ksaCitizenAccountMax, ksaNextPayDates } from "../calc.js";
import { bind, money, num, table, big, note, arDate } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const show = () => form.querySelectorAll("[data-family]").forEach((el) => (el.hidden = form.type.value === "independent"));
form.type.addEventListener("change", show);
const todayIso = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);

bind(form, result, (v) => {
  show();
  const r = ksaCitizenAccountMax({ type: v.type, adults: v.adults, children: v.children, income: v.income, assets: v.assets });
  const next = ksaNextPayDates({ item: "citizen", today: todayIso(), count: 2 });
  let html;
  if (r.overIncome) {
    html = big("لا دعم بهذا الدخل", money(0, cur), `دخل الأسرة ${money(r.income, cur)} يتجاوز الحد الأقصى للحد المانع 20,000`);
  } else if (r.assetsOver) {
    html = big("غير مؤهل", money(0, cur), "الأصول تتجاوز حد القدرة المالية");
  } else {
    html = big("الحد الأعلى لدعمك الشهري", money(r.upper, cur), r.type === "independent" ? "مستقل" : `أسرة من ${num(r.members, 0)} أفراد`);
  }
  html += table(
    [
      [r.type === "independent" ? "المستقل" : "رب الأسرة", money(r.head, cur)],
      r.adults ? [`التابعون 18 فأكثر: ${num(r.adults, 0)} × 360`, money(r.perAdult * r.adults, cur)] : null,
      r.children ? [`التابعون دون 18: ${num(r.children, 0)} × 216`, money(r.perChild * r.children, cur)] : null,
      r.capped ? ["قبل سقف الأسرة", money(r.uncapped, cur)] : null,
      r.capped ? ["بعد سقف أسرة الأساس (2,088)", money(r.upper, cur), { strong: true }] : ["الدعم الكامل", money(r.upper, cur), { strong: true }],
      next[0] ? ["الدفعة القادمة", arDate(next[0].date)] : null,
      next[1] ? ["التي بعدها", arDate(next[1].date)] : null,
    ],
    "الحد الأعلى بالأوزان المعلنة"
  );
  if (!r.overIncome && !r.assetsOver) {
    html += note(`يُصرف الدعم كاملاً (${money(r.upper, cur)}) إن لم يتجاوز دخل أسرتك حد الإعفاء الخاص بها، ويقل فوقه تدريجياً حتى ينعدم عند الحد المانع (20,000 حداً أقصى، وأقل للأسر الأصغر). البرنامج لا ينشر هذين الحدين، والمبلغ الدقيق في حاسبته التقديرية الرسمية.`, "warn");
    html += note(`للمقارنة: متوسط ما صُرف للأسرة في دفعة أكتوبر 2026 نحو ${money(r.avgFamily, cur)}، وحصل 72% من المؤهلين على دعم.`, "info");
  }
  if (r.capped) html += note("منذ دفعة أكتوبر 2023 لا يتجاوز دعم أي أسرة الدعم الكامل لأسرة من 6 (رب أسرة وتابعان 18 فأكثر و3 دون 18).", "info");
  if (v.assets === "unknown") html += note("حد القدرة المالية 4 ملايين ريال لأسرة من 6 و1,371,200 للمستقل، ويشمل العقار والمركبات والنقد والاستثمارات. حدود الأحجام الأخرى غير منشورة.", "info");
  if (r.type === "independent") html += note("المستقل: 18 سنة فأكثر، وغير متزوج، وسكن مستقل موثق مطابق للعنوان الوطني، مع زيارة تحقق.", "info");
  html += note("الدعم الإضافي (الذي رفع استحقاق المستقل من 417 إلى 720) مقرر حتى نهاية 2026، ولم يصدر قرار لعام 2027 حتى 3 نوفمبر 2026. والأوزان و720 من تصريحات البرنامج وتعميم 2017، لا من وثيقة رسمية حديثة.", "info");
  return html;
});
