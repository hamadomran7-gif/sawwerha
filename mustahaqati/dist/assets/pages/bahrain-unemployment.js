import { bahrainUnemployment } from "../calc.js";
import { bind, money, table, big, note, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => money(x, "دينار");

bind(form, result, (v) => {
  const first = v.reason === "firstJob";
  form.querySelectorAll("[data-comp]").forEach((el) => (el.hidden = first || v.reason === "resignation" || v.reason === "disciplinary"));
  const r = bahrainUnemployment({ avgWage: v.avgWage, contribMonths: first ? 0 : v.contribMonths, reason: v.reason, bahraini: v.bahraini !== "no", graduate: v.graduate !== "no" });
  if (r.kind === "none") {
    if (r.reason === "foreignAllowance") return big("لا تعويض ولا إعانة", m(0), "الإعانة للبحريني فقط") + note("الوافد يستحق التعويض بعد 12 شهر اشتراك متصلة، أما الإعانة لمن لم يكمل المدة أو يبحث لأول مرة فللبحريني فقط.", "warn");
    return big("لا يُستحق التعويض", m(0), v.reason === "resignation" ? "ترك العمل بمحض الإرادة" : "الفصل لأسباب تأديبية") + note("يُشترط للتعويض ألا يكون المتعطل قد ترك العمل بمحض إرادته أو فُصل لأسباب تأديبية (المادة 10).", "warn");
  }
  if (r.kind === "allowance") {
    let html = big("إعانة التعطل", m(r.total), `${m(r.monthly)} × ${monthsAr(r.months)}`);
    html += table([["الإعانة الشهرية", m(r.monthly)], ["المدة القصوى", monthsAr(r.months)], ["المجموع", m(r.total), { strong: true }]], "التفاصيل");
    if (r.short) html += note("مدة اشتراكك أقل من 12 شهراً متصلة، فتُصرف لك الإعانة بدلاً من التعويض (المادة 17/ب).", "info");
    return html + note("للبحريني من 18 سنة فأكثر غير المزاول لعمل تجاري أو مهني. أقر النواب في 2025 رفعها إلى 300 و250 ولم يصدر التعديل بعد.", "info");
  }
  let html = big("تعويض التعطل", m(r.total), `${m(r.monthly)} × ${monthsAr(r.months)}`);
  html += table(
    [
      ["60% من متوسط الأجر", m(r.raw)],
      r.capped ? ["بعد الحد الأعلى 1,000", m(r.monthly)] : null,
      r.raisedToMin ? ["بعد الحد الأدنى (200 أو الأجر)", m(r.monthly)] : null,
      ["التعويض الشهري", m(r.monthly), { strong: true }],
      ["المجموع لـ9 أشهر", m(r.total), { strong: true }],
      ["اشتراكك الشهري (1%)", m(r.contribEmployee), { muted: true }],
    ],
    "تفصيل التعويض"
  );
  if (v.bahraini === "no") html += note("الوافد يستحق التعويض ما دامت إقامته مشروعة، وارتباط الإقامة بصاحب العمل قد يقصّر مدة الصرف عملياً.", "warn");
  return html + note("يبدأ الصرف من اليوم الثامن لانتهاء العمل إن سجلت خلال 30 يوماً، ويسقط الحق إن لم تسجل خلال 3 أشهر.", "info");
});
