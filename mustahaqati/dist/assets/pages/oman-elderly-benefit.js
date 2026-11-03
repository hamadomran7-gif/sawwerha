import { omanElderlyBenefit, rules } from "../calc.js";
import { bind, num, table, big, note, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const E = rules.om.socialProtection.elderly;
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const omr = (n) => `${f3.format(n)} ر.ع`;
const mf = new Intl.DateTimeFormat("ar-u-nu-latn", { month: "long", year: "numeric", timeZone: "UTC" });
const monthOf = (iso) => mf.format(new Date(`${iso}T00:00:00Z`));

bind(form, result, (v) => {
  if (!v.birth) return null;
  const s = omanElderlyBenefit({ birth: v.birth, income: v.income, disabled: v.disabled });
  if (!s) return null;
  const status = s.eligibleNow ? `تستحق منذ ${monthOf(s.start)}` : `تبدأ في ${monthOf(s.start)} (بعد ${monthsAr(s.monthsToStart)})`;
  const bandText = { full: "كاملة (الدخل 1,020 أو أقل)", taper: "مخفضة تدريجياً (تقدير خطي)", none: "لا تُصرف (الدخل 1,250 فأكثر)" }[s.band];
  let html = big(s.eligibleNow ? "منفعتك الشهرية" : "منفعتك المتوقعة", omr(s.paid), status);
  html += table(
    [
      ["بداية الاستحقاق (شهر بلوغ 60)", monthOf(s.start)],
      [`منفعة كبار السن: ${bandText}`, omr(s.elderly)],
      s.disability ? ["منفعة الإعاقة", omr(s.disability)] : null,
      [s.paidAs === "disability" ? "المصروف: منفعة الإعاقة (الأعلى)" : "المصروف شهرياً", omr(s.paid), { strong: true }],
      ["سنوياً", omr(s.annual)],
    ],
    "تفصيل المنفعة"
  );
  if (s.band === "taper") html += note(`بين ${num(E.fullMax, 0)} و${num(E.zeroFrom, 0)} تُخفض المنفعة تدريجياً بآلية لم تُنشر. قدّرناها خطياً: 115 − نصف ما زاد على 1,020. قد يختلف المبلغ الفعلي.`, "warn");
  if (s.band === "none" && !s.disability) html += note("منذ أبريل 2026 لا تُصرف منفعة كبار السن لمن بلغ دخله الشهري 1,250 ريالاً فأكثر. وتعريف الدخل الرسمي لم يُنشر.", "warn");
  if (s.ageRaiseRisk) html += note("تبلغ 60 بعد 2030، وقد يكون سن الاستحقاق رُفع إلى 61 بحلول ذلك الوقت (سنة كل 7 أعوام من 2024). راجع الصندوق قريباً من موعدك.", "info");
  if (!s.eligibleNow) html += note("اختبار الدخل يُطبق بحسب دخلك عند الاستحقاق، فأعد الحساب إن تغير دخلك.", "info");
  html += note("تُجمع منفعة كبار السن مع المعاشات، ويُصرف الأعلى مع منفعة الإعاقة، وتحل محل منفعة الأرملة. وتُصرف قبل نهاية الشهر المستحقة عنه، بلا يوم ثابت معلن.", "info");
  return html;
});
