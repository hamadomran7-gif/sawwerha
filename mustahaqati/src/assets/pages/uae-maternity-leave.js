import { uaeMaternity, shiftDate, rules } from "../calc.js";
import { bind, money, table, big, note, arDate, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  if (!v.basic) return null;
  const total = (v.basic || 0) + (v.allowances || 0);
  const wage = v.basis === "basic" ? v.basic : total;
  const M = rules.ae.maternity;
  const m = uaeMaternity({ wage, extraUnpaidDays: v.extra || 0, sickChild: !!v.child, sickChildUnpaid: !!v.childUnpaid });
  let html = big("أجر إجازة الوضع المستحق", money(m.paid, cur), `${daysAr(m.totalDays)} إجمالاً · ${v.basis === "basic" ? "على الأساسي" : "على الأجر الشامل"}`);
  html += table(
    [
      ["أجر اليوم (÷ 30)", money(m.daily, cur)],
      [`${daysAr(M.fullPayDays)} بأجر كامل`, money(m.full, cur)],
      [`${daysAr(M.halfPayDays)} بنصف الأجر`, money(m.half, cur)],
      m.extraUnpaidDays ? [`${daysAr(m.extraUnpaidDays)} بلا أجر لمرض الحمل أو الوضع`, money(0, cur)] : null,
      v.child ? [`${daysAr(M.sickChildFullPayDays)} بأجر كامل لرعاية الطفل`, money(m.child, cur)] : null,
      m.childUnpaidDays ? [`${daysAr(m.childUnpaidDays)} إضافية بلا أجر لرعاية الطفل`, money(0, cur)] : null,
      ["مجموع المدفوع", money(m.paid, cur), { strong: true }],
      ["أجر المدة نفسها لو عملتِ", money(m.normal, cur), { muted: true }],
      ["الفرق عن راتبك المعتاد", money(m.deduction, cur)],
    ],
    "تفصيل الحساب"
  );
  if (v.start) {
    const end60 = shiftDate(v.start, M.fullPayDays + M.halfPayDays - 1);
    const back = shiftDate(v.start, m.totalDays);
    html += table(
      [
        ["بداية الإجازة", arDate(v.start)],
        ["آخر يوم بأجر كامل", arDate(shiftDate(v.start, M.fullPayDays - 1))],
        ["آخر يوم من الستين", arDate(end60)],
        ["العودة إلى العمل", arDate(back), { strong: true }],
      ],
      "التواريخ (بالترتيب المتصل)"
    );
  }
  if (m.extraUnpaidDays) html += note("أيام مرض الحمل أو الوضع الإضافية لا تُحسب من مدة الخدمة عند حساب مكافأة نهاية الخدمة.", "warn");
  html += note(`للأب أو الأم إجازة والدية مدفوعة ${M.parentalWorkingDays} أيام عمل خلال ${M.parentalWithinMonths} أشهر من الولادة، ولكِ استراحة رضاعة حتى ساعة يومياً مدة ${M.nursingMonths} أشهر.`, "ok");
  return html;
});
