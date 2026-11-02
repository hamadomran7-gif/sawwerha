import { uaeDomesticSettlement, uaeDomesticLeaveAccrued, uaeRecruitmentRefund, rules } from "../calc.js";
import { bind, money, num, table, big, note, duration, daysAr, monthsAr } from "../app.js";

const $ = (id) => document.getElementById(id);
const form = $("calc");
const cur = "درهم";
const hint = form.querySelector("[data-leave-hint]");

bind(form, $("result"), (v) => {
  if (!v.basic || !v.start || !v.end) return null;
  const D = rules.ae.domestic;
  const s = uaeDomesticSettlement({ basic: v.basic, start: v.start, end: v.end, unpaid: v.unpaid, leaveDays: v.leaveDays, absence: v.absence === "yes", rate: v.rate });
  if (!s) return note("تاريخ آخر يوم عمل يجب أن يكون بعد تاريخ البداية.", "bad");
  const months = s.duration.years * 12 + s.duration.months;
  const accrued = uaeDomesticLeaveAccrued(months);
  if (hint) hint.textContent = `الرصيد المتراكم لمدة ${monthsAr(months)}: ${daysAr(accrued)}، اطرح منه ما استُخدم.`;

  let html = big("مستحقات العامل", money(s.total, cur), `مدة الخدمة: ${duration(s.duration)}`);
  html += table(
    [
      ["الأجر اليومي (الأساسي ÷ 30)", money(s.daily, cur)],
      [
        s.eligible ? `المكافأة: ${num(s.duration.decimalYears, 2)} سنة × ${s.perYear} يوماً` : v.absence === "yes" ? "المكافأة (تسقط بالانقطاع غير المشروع)" : "المكافأة (لم تكتمل سنة)",
        money(s.gratuity, cur),
      ],
      s.leave ? [`بدل الإجازة: ${daysAr(Number(v.leaveDays))}`, money(s.leave, cur)] : null,
      ["الإجمالي", money(s.total, cur), { strong: true }],
    ],
    "تفصيل المستحقات"
  );
  if (Number(v.rate) === D.eosDaysPerYear || !v.rate) html += note("معدل 14 يوماً هو ما أعلنته الوزارة؛ المرسوم أحال المكافأة إلى قرار من مجلس الوزراء، فتحقق من حاسبة الوزارة عند التسوية.", "info");
  html += note(`تُصرف المستحقات خلال ${D.finalDuesDeadlineDays} أيام من انتهاء العقد، ومعها تذكرة العودة إن أنهى صاحب العمل العقد لسبب لا يعود للعامل. وتُسمع الدعوى خلال ${monthsAr(D.claimTimeLimitMonths)} من انتهاء العلاقة.`, "ok");
  return html;
});

bind($("refund"), $("refund-result"), (v) => {
  if (!v.cost) return null;
  const r = uaeRecruitmentRefund({ cost: v.cost, contractMonths: v.contractMonths, monthsWorked: v.monthsWorked, medicallyUnfit: v.medicallyUnfit });
  let html = big("المبلغ الذي يرده المكتب", money(r.refund, cur), r.full ? "استرداد كامل" : `الأشهر المتبقية من العقد: ${r.remaining}`);
  if (!r.full) html += table([["الكلفة ÷ أشهر العقد", money(Number(v.cost) / (Number(v.contractMonths) || 24), cur)], ["× الأشهر المتبقية", String(r.remaining)], ["المبلغ المسترد", money(r.refund, cur), { strong: true }]]);
  html += note(`يُرد المبلغ خلال ${rules.ae.domestic.refundDeadlineDays} يوماً من إعادة العامل أو بلاغ انقطاعه، ولا يسري الاسترداد على الاستقدام المباشر.${r.full && v.medicallyUnfit ? " وعند عدم اللياقة الطبية تُرد الرسوم الحكومية أيضاً." : ""}`, "info");
  return html;
});
