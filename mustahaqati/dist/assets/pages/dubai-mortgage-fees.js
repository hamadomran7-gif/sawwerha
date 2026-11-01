import { dubaiPurchaseCosts } from "../calc.js";
import { bind, money, num, pct, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  if (!v.price) return null;
  const c = dubaiPurchaseCosts({
    price: v.price,
    buyerType: v.buyer,
    purpose: v.purpose === "offplan" ? "first" : v.purpose,
    offplan: v.purpose === "offplan",
    useMortgage: !!v.mortgage,
    annualRatePct: v.rate || 0,
    years: v.years || 25,
    includeAgent: !!v.agent,
    bankFeePct: v.bankfee || 0,
  });
  let html = big("النقد المطلوب يوم الشراء", money(c.cashNeeded, cur), v.mortgage ? `الدفعة الأولى ${money(c.downPayment, cur)} + رسوم ${money(c.fees, cur)}` : `كامل السعر ${money(v.price, cur)} + رسوم ${money(c.fees, cur)}`);
  html += table(
    [
      v.mortgage ? [`نسبة التمويل القصوى`, pct(c.ltv * 100, 0)] : null,
      v.mortgage ? ["مبلغ القرض", money(c.loan, cur)] : null,
      v.mortgage ? ["الدفعة الأولى", money(c.downPayment, cur), { strong: true }] : null,
      ["رسم نقل الملكية 4%", money(c.transferFee, cur)],
      ["سند الملكية والرسوم الإدارية", money(c.titleFee, cur)],
      ["أمين التسجيل (شامل الضريبة)", money(c.trusteeFee, cur)],
      v.mortgage ? ["تسجيل الرهن 0.25% + 290", money(c.mortgageReg, cur)] : null,
      v.mortgage ? ["تقييم العقار (تقديري)", money(c.valuation, cur)] : null,
      v.mortgage && c.bankFee ? ["رسوم ترتيب البنك", money(c.bankFee, cur)] : null,
      v.agent ? ["عمولة الوسيط 2% + ضريبة", money(c.agent, cur)] : null,
      ["إجمالي الرسوم", money(c.fees, cur), { strong: true }],
      v.mortgage ? ["القسط الشهري المتوقع", money(c.installment, cur), { strong: true }] : null,
      v.mortgage ? ["إجمالي الفوائد على مدة القرض", money(c.totalInterest, cur), { muted: true }] : null,
    ],
    "تفصيل التكاليف"
  );
  html += note("لا تشمل الحاسبة شهادة عدم ممانعة المطوّر (500–5,000 درهم) ورسوم الخدمات السنوية وتوصيل الخدمات. والبنوك قد تموّل نسبة أقل من الحد الأقصى.", "info");
  if (v.purpose === "offplan") html += note("العقار على الخارطة: المصرف المركزي لا يضع نسبة خاصة، والبنوك تموّل عادة 50% من قيمة الإنجاز. وتُسجَّل الوحدة في نظام أوقود برسوم إضافية.", "warn");
  return html;
});
