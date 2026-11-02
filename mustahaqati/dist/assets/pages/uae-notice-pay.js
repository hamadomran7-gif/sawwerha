import { uaeNoticePay, uaeProbationNotice, rules } from "../calc.js";
import { bind, money, table, big, note, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";
const probOnly = form.querySelectorAll("[data-prob]");
const afterOnly = form.querySelectorAll("[data-after]");

bind(form, result, (v) => {
  const inProb = v.stage === "probation";
  probOnly.forEach((el) => (el.hidden = !inProb));
  afterOnly.forEach((el) => (el.hidden = inProb));
  if (!v.basic) return null;
  const wage = (v.basic || 0) + (v.allowances || 0);
  const employer = v.who === "employer";
  const payer = employer ? "صاحب العمل يدفع لك" : "تدفع لصاحب العمل";
  if (inProb) {
    const kind = employer ? "employer" : v.dest === "leave" ? "leaving_uae" : "to_uae_employer";
    const p = uaeProbationNotice({ wage, who: kind, servedDays: v.served || 0 });
    const what = employer ? "إنهاء صاحب العمل خلال التجربة" : kind === "leaving_uae" ? "استقالة العامل لمغادرة الدولة" : "استقالة العامل للانتقال إلى صاحب عمل آخر في الدولة";
    let html = big(p.amount ? `التعويض عن الإخطار غير المراعى (${payer})` : "لا تعويض: الإخطار مراعى بالكامل", money(p.amount, cur), what);
    html += table(
      [
        ["مدة الإخطار المطلوبة", daysAr(p.noticeDays)],
        ["أيام الإخطار المراعاة", daysAr(p.noticeDays - p.remainingDays)],
        ["أجر اليوم (الأجر الشامل ÷ 30)", money(p.daily, cur)],
        ["التعويض عن الأيام غير المراعاة", money(p.amount, cur), { strong: true }],
      ],
      "تفصيل الحساب (المادة 9)"
    );
    if (kind === "to_uae_employer") html += note("صاحب العمل الجديد يعوّض صاحب العمل الأصلي عن تكاليف الاستقدام أو التعاقد، ما لم يُتفق على غير ذلك.", "info");
    if (kind === "leaving_uae") html += note("إن عدت بتصريح عمل جديد خلال 3 أشهر من المغادرة، يلتزم صاحب العمل الجديد بتعويض صاحب العمل الأصلي.", "info");
    return html;
  }
  const n = uaeNoticePay({ wage, noticeDays: v.notice || rules.ae.notice.minDays, servedDays: v.served || 0 });
  let html = big(n.amount ? `بدل الإنذار (${payer})` : "لا بدل إنذار: المهلة مراعاة بالكامل", money(n.amount, cur), `مهلة ${daysAr(n.noticeDays)} · على الأجر الشامل ${money(wage, cur)}`);
  html += table(
    [
      ["مهلة الإنذار في العقد", daysAr(n.noticeDays)],
      ["الأيام المراعاة (عملتها)", daysAr(n.servedDays)],
      ["الأيام غير المراعاة", daysAr(n.remainingDays)],
      ["أجر اليوم (الأجر الشامل ÷ 30)", money(n.daily, cur)],
      ["بدل الإنذار", money(n.amount, cur), { strong: true }],
    ],
    "تفصيل الحساب (المادة 43)"
  );
  if (n.adjusted) html += note("المهلة القانونية بين 30 و90 يوماً، فعدّلنا الرقم إلى أقرب حد.", "warn");
  if (employer && n.servedDays > 0) html += note(`لأن الإنهاء من صاحب العمل، يحق لك يوم واحد في الأسبوع بدون أجر للبحث عن عمل خلال المهلة، بإخطار قبل 3 أيام.`, "info");
  html += note("بدل الإنذار يُدفع إضافةً إلى مكافأة نهاية الخدمة وبدل الإجازة غير المستخدمة، وهو مستحق ولو لم يتضرر الطرف الآخر.", "ok");
  return html;
});
