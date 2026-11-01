import { loanInstallment, uaePersonalLoanCheck, rules } from "../calc.js";
import { bind, money, num, pct, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";
const P = rules.ae.personalLoan;

bind(form, result, (v) => {
  if (!v.principal || v.rate === null || !v.months) return null;
  const l = loanInstallment({ principal: v.principal, annualRatePct: v.rate, months: v.months, method: v.method });
  let html = big("القسط الشهري", money(l.installment, cur), `${num(v.months, 0)} شهراً · فائدة ${v.method === "flat" ? "ثابتة" : "متناقصة"} ${num(v.rate, 2)}%`);
  html += table(
    [
      ["إجمالي ما ستدفعه", money(l.totalPayment, cur)],
      ["إجمالي الفوائد", money(l.totalInterest, cur), { strong: true }],
      v.method === "flat" && l.equivalentReducingPct ? ["المعدل المتناقص المكافئ تقريباً", pct(l.equivalentReducingPct, 2)] : null,
    ],
    "تكلفة القرض"
  );

  if (v.salary) {
    const c = uaePersonalLoanCheck({ principal: v.principal, months: v.months, salary: v.salary, installment: l.installment, otherObligations: v.other || 0 });
    const ok = (b) => (b ? `<span class="status-ok">مطابق</span>` : `<span class="status-bad">يتجاوز الحد</span>`);
    html += table(
      [
        [`الحد الأقصى للمبلغ (${P.maxSalaryMultiple} × الراتب)`, `${money(c.maxAmount, cur)} — ${ok(c.amountOk)}`],
        [`الحد الأقصى للمدة`, `${P.maxMonths} شهراً — ${ok(c.monthsOk)}`],
        [`نسبة الاستقطاع (القسط + الالتزامات ÷ الراتب)`, `${pct(c.dbr, 1)} من حد ${pct(P.maxDeductionRatio * 100, 0)} — ${ok(c.dbrOk)}`],
      ],
      "التحقق من قواعد المصرف المركزي"
    );
    if (c.amountOk && c.monthsOk && c.dbrOk) html += note("القرض ضمن الحدود التنظيمية. قد تطبّق البنوك معايير أضيق.", "ok");
    else html += note("أحد الشروط غير متحقق؛ خفّض المبلغ أو المدة أو القسط ليوافق القواعد.", "warn");
  }
  return html;
});
