import { omanIncomeTax, rules } from "../calc.js";
import { bind, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const m3 = (x) => `${num(x, 3)} ${cur}`;
const pc = (x) => `${num(x * 100, 2)}%`;

bind(form, result, (v) => {
  if (v.monthlySalary === null) return null;
  const T = rules.om.incomeTax;
  const r = omanIncomeTax({
    omani: v.omani === "yes", monthlySalary: v.monthlySalary, months: v.months ?? 12, gratuity: v.gratuity, pension: v.pension,
    rent: v.rent, rentActualCost: v.rentActualCost, selfEmp: v.selfEmp, other: v.other, exemptIncome: v.exemptIncome,
    pensionContrib: v.pensionContrib, education: v.education, health: v.health, donations: v.donations, loanInterest: v.loanInterest,
  });
  let html = big("ضريبة الدخل السنوية", m3(r.tax), r.tax ? `${pc(r.effective)} من دخلك الإجمالي · ${m3(r.tax / 12)} شهرياً في المتوسط` : r.filingRequired ? "دخلك تجاوز الحد، لكن الخصومات أزالت الخاضع" : "دخلك الإجمالي لا يتجاوز 42,000 ريال");
  html += table(
    [
      ["الدخل الإجمالي", m3(r.G)],
      [`ما زاد على الحد (${num(T.threshold, 0)})`, m3(r.over)],
      r.rentCost ? ["تكلفة الإيجار", m3(r.rentCost)] : null,
      r.selfCost ? ["تكلفة العمل الحر", m3(r.selfCost)] : null,
      r.contrib ? [`اشتراكات التقاعد${r.contrib === r.autoContrib && r.autoContrib ? " (7.5% بسقف 3,000 شهرياً)" : ""}`, m3(r.contrib)] : null,
      r.exemptions - r.contrib ? ["إعفاءات أخرى (تعليم، صحة، تبرعات، فوائد قرض، دخل معفى)", m3(r.exemptions - r.contrib)] : null,
      ["الدخل الخاضع", m3(r.taxable), { strong: true }],
      ["الضريبة (5%)", m3(r.tax), { strong: true }],
    ],
    "طريقة الحساب"
  );
  if (r.donationsCapped) html += note(`الزكاة والتبرعات تُعفى بحد 5% من الدخل الإجمالي، أي ${m3(r.donationsAllowed)} هنا.`, "info");
  if (r.filingRequired) {
    html += table(
      [
        ["الإقرار", "مطلوب: خلال 6 أشهر من نهاية السنة (أول موعد 30 يونيو 2029)"],
        r.withholding ? ["تقدير ما تستقطعه جهة العمل في السنة", `${m3(r.withholding)} (نحو ${m3(r.monthlyWithholding)} شهرياً)`] : null,
        r.withholding && Math.abs(r.balance) > 0.0005 ? [r.balance > 0 ? "الباقي تسدده مع الإقرار" : "تسترده بإقرارك", m3(Math.abs(r.balance))] : null,
      ],
      "الإقرار والسداد"
    );
  }
  if (v.resident === "no") html += note("غير المقيم تخضع دخوله المحققة في عُمان فقط، فأدخل هذه وحدها. وما تدفعه له جهات عُمانية من دخل غير الراتب قد يُستقطع منه 5% كاملة.", "warn");
  else html += note("المقيم يخضع دخله العالمي، فأدخل دخلك من خارج عُمان أيضاً (والقادم الجديد يُعفى دخله الخارجي 18 شهراً لمرة واحدة).", "info");
  html += note("الحاسبة تقديرية؛ اللائحة التنفيذية التي تفصّل الإعفاءات والاستقطاع الشهري لم تُنشر بعد. الضريبة تبدأ من دخل سنة 2028.", "info");
  return html;
});
