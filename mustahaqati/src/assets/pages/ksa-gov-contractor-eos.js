import { ksaGovContractorAward, rules } from "../calc.js";
import { bind, money, table, big, note, yearsAr, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const C = rules.sa.govContractor;

bind(form, result, (v) => {
  form.querySelectorAll("[data-abolished]").forEach((el) => (el.hidden = v.reason !== "abolished"));
  if (!v.salary) return null;
  const r = ksaGovContractorAward({ salary: v.salary, years: v.years, months: v.months, reason: v.reason, remainingMonths: v.remainingMonths });
  if (r.forfeited) return big("لا مكافأة", money(0, cur), "الفصل التأديبي وحالات المادة 19 تُسقط المكافأة والتعويض") + note("من حالات المادة 19: عدم تنفيذ قرار النقل، أو عدم العودة بعد الإجازة 15 يوماً دون عذر، أو الإخلال الجوهري بالعقد، أو السلوك المخل بالشرف، أو الحكم بالسجن أكثر من سنة.", "warn");
  if (r.treatedAsSaudi) return big("يُعامل معاملة الموظف السعودي", "—", "الوفاة أو العجز الدائم بسبب العمل") + note("نص النموذج على معاملة المتعاقد في هذه الحالة معاملة الموظف السعودي، أي وفق أحكام إصابات العمل في الخدمة المدنية لا مكافأة نصف الشهر. وتتحمل الجهة عند الوفاة نقل الجثمان وإعادة الأسرة.", "info");
  if (v.reason === "abolished") {
    let html = big("تعويض إلغاء الوظيفة", money(r.compensation, cur), `${monthsAr(Math.min(C.abolishedMonths, Number(v.remainingMonths) || 0))} من الراتب، أو باقي العقد أيهما أقل`);
    html += table([["التعويض (م18/ب)", money(r.compensation, cur), { strong: true }], r.eligible ? ["مكافأة نصف الشهر لو أضيفت", money(r.award, cur), { muted: true }] : null], "التفاصيل");
    return html + note("لم ينص النموذج على إضافة مكافأة نصف الشهر إلى تعويض إلغاء الوظيفة؛ فنعرضها للمقارنة فقط.", "warn");
  }
  if (!r.eligible) return big("لا مكافأة", money(0, cur), `السنوات الكاملة: ${yearsAr(r.fullYears)}، والشرط ${yearsAr(C.minYears)} متصلة`) + note(`تُستحق المكافأة بعد ${yearsAr(C.minYears)} متصلة على العقد على الأقل، وتُحسب عن السنوات الكاملة فقط.`, "info");
  let html = big("مكافأة نهاية الخدمة", money(r.award, cur), `عن ${yearsAr(r.fullYears)} × نصف راتب شهر`);
  html += table(
    [
      ["السنوات الكاملة المحسوبة", yearsAr(r.fullYears)],
      [`0.5 × ${money(v.salary, cur)} × ${r.fullYears}`, money(r.raw, cur)],
      r.capped ? [`بعد الحد الأقصى ${money(C.cap, cur)}`, money(r.award, cur)] : null,
      ["المكافأة", money(r.award, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  if (v.reason === "resign") html += note("الاستقالة لا تنقص مكافأة المتعاقد في الجهات الحكومية، خلافاً لنظام العمل.", "ok");
  html += note("الحساب على الراتب الشهري في العقد دون بدلي السكن والنقل. ولم يُحسم دخول بدل غلاء المعيشة، ولا تعويض رصيد الإجازة المتبقي عند نهاية العقد.", "info");
  return html;
});
