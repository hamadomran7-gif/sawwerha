import { loanInstallment, kuwaitLoanCheck, rules } from "../calc.js";
import { bind, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const kd = (n) => `${f3.format(n)} د.ك`;
const L = rules.kw.loan;

bind(form, result, (v) => {
  if (!v.principal || v.rate === null || !v.months) return null;
  const l = loanInstallment({ principal: v.principal, annualRatePct: v.rate, months: v.months });
  let html = big("القسط الشهري", kd(l.installment), `${num(v.months, 0)} شهراً · فائدة متناقصة ${num(v.rate, 2)}%`);
  html += table(
    [
      ["إجمالي ما ستدفعه", kd(l.totalPayment)],
      ["إجمالي الفوائد", kd(l.totalInterest), { strong: true }],
    ],
    "تكلفة القرض"
  );
  if (v.salary) {
    const c = kuwaitLoanCheck({ type: v.type, principal: v.principal, months: v.months, netSalary: v.salary, installment: l.installment, otherObligations: v.other || 0, retiree: v.who === "retiree", ratePct: v.rate });
    const ok = (b) => (b ? `<span class="status-ok">مطابق</span>` : `<span class="status-bad">يتجاوز الحد</span>`);
    const housing = v.type === "housing";
    html += table(
      [
        [housing ? "الحد الأقصى للتمويل الإسكاني" : `الحد الأقصى للمبلغ (${L.consumerMultiple} × صافي الراتب وبسقف ${num(L.consumerMaxAmount, 0)} د.ك)`, `${kd(c.maxAmount)} — ${ok(c.amountOk)}`],
        ["الحد الأقصى للمدة", `${num(c.maxMonths, 0)} شهراً — ${ok(c.monthsOk)}`],
        ["نسبة الاستقطاع (الأقساط ÷ صافي الراتب)", `${num(c.ratio, 1)}% من حد ${num(c.limitPct, 0)}% — ${ok(c.dbrOk)}`],
        ["سقف الفائدة (سعر الخصم + 3%)", `${num(c.maxRatePct, 2)}% — ${ok(c.rateOk)}`],
      ],
      "التحقق من تعليمات بنك الكويت المركزي"
    );
    html += c.amountOk && c.monthsOk && c.dbrOk && c.rateOk ? note("القرض ضمن الحدود التنظيمية. قد تطبّق البنوك معايير أضيق.", "ok") : note("أحد الشروط غير متحقق؛ خفّض المبلغ أو المدة أو القسط.", "warn");
  }
  return html;
});
