import { loanInstallment, ksaFinanceCheck } from "../calc.js";
import { bind, money, num, pct, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";

bind(form, result, (v) => {
  if (!v.principal || v.rate === null || !v.months) return null;
  const l = loanInstallment({ principal: v.principal, annualRatePct: v.rate, months: v.months, method: "reducing" });
  let html = big("القسط الشهري", money(l.installment, cur), `${num(v.months, 0)} شهراً · معدل ${num(v.rate, 2)}%`);
  html += table(
    [
      ["إجمالي ما ستدفعه", money(l.totalPayment, cur)],
      ["إجمالي كلفة التمويل (الربح والرسوم)", money(l.totalInterest, cur), { strong: true }],
    ],
    "تكلفة التمويل"
  );
  if (v.salary) {
    const c = ksaFinanceCheck({ installment: l.installment, salary: v.salary, otherObligations: v.other || 0, retiree: v.status === "retiree" });
    html += table(
      [
        [`الحد الأقصى للأقساط (${pct(c.limitPct, 0)} من الراتب)`, money(c.maxInstallment, cur)],
        ["نسبة الاستقطاع الفعلية", `${pct(c.ratio, 1)} — ${c.ok ? '<span class="status-ok">مطابق</span>' : '<span class="status-bad">يتجاوز الحد</span>'}`],
      ],
      "التحقق من حد الاستقطاع"
    );
    html += c.ok
      ? note("القسط ضمن حد الاستقطاع. البنوك قد تطبق شروطاً إضافية (مدة الخدمة، تحويل الراتب، الحد الأدنى للراتب).", "ok")
      : note(`يتجاوز القسط الحد. لتوافق القواعد لا يزيد القسط مع التزاماتك على ${money(c.maxInstallment, cur)} شهرياً.`, "warn");
  }
  return html;
});
