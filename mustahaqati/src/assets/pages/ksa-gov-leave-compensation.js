import { ksaGovLeaveComp, rules } from "../calc.js";
import { bind, money, table, big, note, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const L = rules.sa.govLeave;

bind(form, result, (v) => {
  if (!v.basic) return null;
  const r = ksaGovLeaveComp({ basic: v.basic, newDays: v.newDays, oldDays: v.oldDays, reason: v.reason });
  if (!r.balance) return big("لا رصيد للتعويض", money(0, cur), "أدخل رصيد إجازاتك");
  let html = big("تعويض رصيد الإجازات", money(r.amount, cur), `${daysAr(r.days)} × ${money(r.daily, cur)}`);
  html += table(
    [
      [`الأجر اليومي: الأساسي ÷ ${L.divisor}`, money(r.daily, cur)],
      ["رصيدك", daysAr(r.balance)],
      r.full ? ["الأيام المعوَّضة (كامل الرصيد)", daysAr(r.days)] : null,
      !r.full && v.oldDays ? ["من الرصيد القديم", daysAr(r.oldCounted)] : null,
      !r.full ? [`من الرصيد الجديد (بحد ${L.newCap})`, daysAr(r.newCounted)] : null,
      r.lostDays ? ["أيام لا تُعوَّض", daysAr(r.lostDays), { muted: true }] : null,
      ["التعويض", money(r.amount, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  if (r.lostDays && !r.full) html += note(`يسقط ${daysAr(r.lostDays)} قيمتها ${money(r.lostDays * r.daily, cur)}. إن كان التقاعد مخططاً فتمتع بالزيادة قبله: يجوز حتى ${daysAr(L.maxTakenPerYear)} في السنة، و${daysAr(L.maxTakenSenior)} لمن له 25 سنة خدمة أو بلغ 50.`, "warn");
  if (v.reason === "death") html += note("يُصرف التعويض عن الوفاة للورثة بحسب رأي نظامي للوزارة؛ والنص الحالي لا يسمي المستفيد.", "info");
  if (v.reason === "dismissal") html += note("النص لا يستثني الفصل التأديبي من التعويض، ولم نجد رأياً رسمياً حديثاً يؤكد صرفه فيه.", "info");
  html += note("الحساب على آخر راتب أساسي دون البدلات، والقسمة على 30 قراءتنا لتعريف الشهر في المادة 1. تحقق من رصيدك في نظام جهتك.", "info");
  return html;
});
