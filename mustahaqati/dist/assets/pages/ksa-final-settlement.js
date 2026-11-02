import { ksaFinalSettlement, KSA_REASONS } from "../calc.js";
import { bind, money, num, table, big, note, duration, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const toggle = () => form.querySelectorAll("[data-notice]").forEach((el) => (el.hidden = form.noticeCase.value === "none"));
form.noticeCase.addEventListener("change", toggle);

bind(form, result, (v) => {
  toggle();
  if (!v.wage || !v.start || !v.end) return null;
  const s = ksaFinalSettlement({
    wage: v.wage, start: v.start, end: v.end, reason: v.reason, leaveDays: v.leaveDays,
    noticeCase: v.noticeCase, givenDays: v.givenDays, salaryDays: v.salaryDays, other: v.other, deductions: v.deductions,
  });
  if (!s) return note("تاريخ آخر يوم عمل يجب أن يكون بعد تاريخ المباشرة.", "bad");
  const e = s.eos;
  const frac = e.fraction === 1 ? "كاملة" : e.fraction === 0 ? "لا شيء" : e.fraction > 0.5 ? "الثلثان" : "الثلث";
  const n = s.noticeInfo;
  let html = big(s.total >= 0 ? "مستحقاتك النهائية" : "صافي المخالصة عليك", money(Math.abs(s.total), cur), `مدة الخدمة: ${duration(s.duration)} · ${KSA_REASONS[v.reason] || ""}`);
  html += table(
    [
      [`مكافأة نهاية الخدمة (${frac})`, money(e.total, cur)],
      [`بدل الإجازات: ${daysAr(Number(v.leaveDays) || 0)} × ${num(s.leave.dailyWage)}`, money(s.leave.amount, cur)],
      s.salary ? [`أجر ${daysAr(Number(v.salaryDays))} لم يُصرف`, money(s.salary, cur)] : null,
      n && n.unservedDays
        ? [v.noticeCase === "employer" ? `تعويض ${daysAr(n.unservedDays)} من مهلة الإشعار` : `خصم ${daysAr(n.unservedDays)} من مهلة الإشعار لم تُراعَ`, money(s.notice, cur)]
        : null,
      s.other ? ["مستحقات أخرى", money(s.other, cur)] : null,
      s.deductions ? ["خصومات", money(-s.deductions, cur)] : null,
      ["الإجمالي", money(s.total, cur), { strong: true }],
    ],
    "تفصيل المخالصة"
  );
  html += note(e.rule, e.fraction === 0 ? "warn" : "ok");
  if (e.disputed) html += note(`بعد تعديلات 2025 يرى عدد من المختصين أن من ينهي عقداً غير محدد المدة بإشعار يستحق المكافأة كاملة (${money(e.gross, cur)})، ولم يصدر موقف رسمي يحسم ذلك، فعرضنا الحساب الأحوط.`, "info");
  const deadline = ["resignation", "worker_notice", "resignation_marriage", "resignation_childbirth", "force_majeure", "article_81"].includes(v.reason) ? "أسبوعين" : "أسبوع";
  html += note(`تُصرف خلال ${deadline} على الأكثر من انتهاء العقد (المادة 88). كل البنود على الأجر الفعلي الأخير.`, "ok");
  return html;
});
