import { uaeFinalSettlement } from "../calc.js";
import { bind, money, num, table, big, note, duration, daysAr, yearsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  if (!v.basic || !v.start || !v.end) return null;
  const s = uaeFinalSettlement({
    basic: v.basic, gross: v.gross, start: v.start, end: v.end, unpaid: v.unpaid,
    leaveDays: v.leaveDays, endedBy: v.endedBy, noticeDays: v.noticeDays || 30, servedDays: v.servedDays,
    salaryDays: v.salaryDays, other: v.other, deductions: v.deductions,
  });
  if (!s) return note("تاريخ آخر يوم عمل يجب أن يكون بعد تاريخ المباشرة.", "bad");
  const n = s.noticeInfo;
  let html = big(s.total >= 0 ? "مستحقاتك النهائية" : "صافي التسوية عليك", money(Math.abs(s.total), cur), `مدة الخدمة: ${duration(s.duration)}`);
  html += table(
    [
      [s.gratuity.eligible ? `مكافأة نهاية الخدمة (${yearsAr(Math.round(s.duration.decimalYears * 100) / 100)})` : "مكافأة نهاية الخدمة (لم تكتمل سنة)", money(s.gratuity.total, cur)],
      [`بدل الإجازات: ${daysAr(Number(v.leaveDays) || 0)} × ${num(s.leave.dailyWage)}`, money(s.leave.amount, cur)],
      s.salary ? [`أجر ${daysAr(Number(v.salaryDays))} لم يُصرف`, money(s.salary, cur)] : null,
      n.remainingDays
        ? [v.endedBy === "employer" ? `بدل إنذار عن ${daysAr(n.remainingDays)} غير مراعاة` : `خصم بدل إنذار عن ${daysAr(n.remainingDays)} لم تعملها`, money(s.notice, cur)]
        : ["بدل الإنذار", "لا يوجد (المهلة مراعاة)"],
      s.other ? ["مستحقات أخرى", money(s.other, cur)] : null,
      s.deductions ? ["خصومات", money(-s.deductions, cur)] : null,
      ["الإجمالي", money(s.total, cur), { strong: true }],
    ],
    "تفصيل التسوية"
  );
  if (n.adjusted) html += note(`مهلة الإنذار في القانون بين 30 و90 يوماً، فحُسبت على ${daysAr(n.noticeDays)}.`, "info");
  if (!s.gratuity.eligible) html += note("لا تُستحق مكافأة نهاية الخدمة قبل إكمال سنة خدمة متصلة.", "warn");
  if (s.gratuity.capped) html += note("المكافأة محددة بالسقف القانوني: أجر سنتين أساسي.", "info");
  html += note("تُصرف خلال 14 يوماً من انتهاء علاقة العمل (المادة 53). المكافأة وبدل الإجازة على الأساسي، والإنذار والأيام غير المدفوعة على الشامل.", "ok");
  return html;
});
