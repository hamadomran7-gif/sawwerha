import { uaeCorporateTax, rules } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  const C = rules.ae.corporateTax;
  if (v.person === "qfzp") {
    return note("الشخص المؤهل في المنطقة الحرة يخضع لنسبة 0% على الدخل المؤهل و9% على الدخل غير المؤهل، ولا يستفيد من إعفاء الأعمال الصغيرة، وله شروط خاصة (منها الحد الأدنى للدخل غير المؤهل) لا تحسبها هذه الحاسبة. استشر مستشاراً ضريبياً.", "warn");
  }
  if (v.revenue === null || v.income === null) return null;
  const r = uaeCorporateTax({ taxableIncome: v.income, revenue: v.revenue, losses: v.losses || 0, person: v.person, mne: !!v.mne, periodEndYear: Number(v.year), electSbr: !!v.sbr });
  if (r.status === "outOfScope") {
    return big("لا تخضع لضريبة الشركات", money(0, cur), `إيرادات نشاطك لا تتجاوز ${money(C.naturalPersonTurnover, cur)} في السنة`) +
      note("الشخص الطبيعي يخضع للضريبة إذا تجاوزت إيرادات نشاطه التجاري مليون درهم في السنة. ودخل الوظيفة والاستثمار الشخصي خارج النطاق أصلاً.", "ok");
  }
  let html = r.status === "sbr"
    ? big("الضريبة المستحقة مع إعفاء الأعمال الصغيرة", money(0, cur), `بدلاً من ${money(r.taxWithoutSbr, cur)} دون الإعفاء`)
    : big("ضريبة الشركات المستحقة", money(r.tax, cur), `معدل فعلي ${num(r.effective * 100, 2)}% من الدخل الخاضع`);
  html += table(
    [
      ["الدخل الخاضع للضريبة", money(Number(v.income) || 0, cur)],
      r.lossUsed ? [`الخسائر المخصومة (بحد ${num(C.lossOffsetCap * 100, 0)}% من الدخل)`, money(r.lossUsed, cur)] : null,
      r.lossUsed ? ["الدخل بعد خصم الخسائر", money(r.taxableAfterLoss, cur)] : null,
      [`الشريحة المعفاة (0%)`, money(Math.min(r.taxableAfterLoss, C.zeroBand), cur)],
      [`الخاضع لنسبة ${num(C.rate * 100, 0)}%`, money(Math.max(0, r.taxableAfterLoss - C.zeroBand), cur)],
      ["الضريبة دون إعفاء الأعمال الصغيرة", money(r.taxWithoutSbr, cur), { muted: r.status === "sbr" }],
      ["الضريبة المستحقة", money(r.tax, cur), { strong: true }],
      (Number(v.losses) || 0) > 0 ? ["الخسائر المتبقية للترحيل", money(r.lossLeft, cur), { muted: true }] : null,
    ],
    "تفصيل الحساب"
  );
  if (r.status === "sbr") html += note("اخترت إعفاء الأعمال الصغيرة: تُعامل كأن لا دخل خاضع لك في هذه الفترة. لا تُرحَّل خسائر هذه الفترة، ويبقى التسجيل وتقديم الإقرار واجبين.", "ok");
  else if (r.sbrEligible && !v.sbr) html += note("أنت مؤهل لإعفاء الأعمال الصغيرة لكنك لم تختره. اختياره يجعل الضريبة صفراً، مقابل عدم ترحيل خسائر الفترة.", "info");
  else if (!r.sbrEligible) {
    const why = (Number(v.revenue) || 0) > C.sbrRevenueMax ? `الإيرادات تتجاوز ${money(C.sbrRevenueMax, cur)}` : v.mne ? "عضو مجموعة متعددة الجنسيات كبيرة" : Number(v.year) > C.sbrLastPeriodEndYear ? `الإعفاء للفترات المنتهية حتى 31 ديسمبر ${C.sbrLastPeriodEndYear}` : "";
    if (why) html += note(`لا يشملك إعفاء الأعمال الصغيرة: ${why}.`, "info");
  }
  if ((Number(v.income) || 0) < 0) html += note("الدخل سالب: لا ضريبة، وتُرحَّل الخسارة إلى الفترات اللاحقة بشروطها.", "info");
  html += note("الحاسبة إرشادية: لا تشمل تعديلات صافي الربح ولا الإعفاءات الأخرى ولا قواعد المجموعات الضريبية.", "info");
  return html;
});
