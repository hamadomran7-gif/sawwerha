import { zakatCalc, rules } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const BASIS = {
  lower: "الأقل من نصابي الذهب والفضة",
  gold24: "85 جراماً من الذهب الخالص (عيار 24)",
  gold21: "85 جراماً من الذهب عيار 21",
  silver: "595 جراماً من الفضة",
};

bind(form, result, (v) => {
  const cur = v.cur || "";
  if (!v.price24 && !v.priceSilver) return note("أدخل سعر جرام الذهب عيار 24 اليوم (وسعر جرام الفضة إن أردت نصاب الفضة) لحساب النصاب.", "info");
  const z = zakatCalc({
    cash: v.cash, g24: v.g24, g22: v.g22, g21: v.g21, g18: v.g18, silverGrams: v.silver, trade: v.trade, receivables: v.receivables,
    debts: v.debts, deductDebts: !!v.deductDebts, price24: v.price24, priceSilver: v.priceSilver, basis: v.basis,
  });
  if (!z.nisab) return note("أدخل سعر الجرام المناسب لطريقة النصاب التي اخترتها.", "warn");
  let html = z.due
    ? big("الزكاة الواجبة", money(z.zakat, cur), `ربع العشر (2.5%) من ${money(z.total, cur)}`)
    : big("لا زكاة على هذا المبلغ", money(0, cur), `مالك الزكوي ${money(z.total, cur)} دون النصاب ${money(z.nisab, cur)}`);
  html += table(
    [
      ["النقد والأرصدة والمدخرات", money(Number(v.cash) || 0, cur)],
      z.goldPure ? [`الذهب (${num(z.goldPure, 2)} جرام خالص)`, money(z.goldValue, cur)] : null,
      z.silverValue ? ["الفضة", money(z.silverValue, cur)] : null,
      v.trade ? ["عروض التجارة والأسهم للمتاجرة", money(Number(v.trade) || 0, cur)] : null,
      v.receivables ? ["الديون المرجو تحصيلها", money(Number(v.receivables) || 0, cur)] : null,
      v.deductDebts && v.debts ? ["يُطرح: ديون حالّة عليك", `− ${money(Number(v.debts) || 0, cur)}`] : null,
      ["المال الزكوي", money(z.total, cur), { strong: true }],
      [`النصاب (${BASIS[v.basis] || ""})`, money(z.nisab, cur)],
      z.due ? ["الزكاة (المال ÷ 40)", money(z.zakat, cur), { strong: true }] : null,
    ],
    "تفصيل الحساب"
  );
  const parts = [];
  if (z.nisabGold24) parts.push(`ذهب عيار 24: ${money(z.nisabGold24, cur)}`);
  if (z.nisabGold21) parts.push(`ذهب عيار 21: ${money(z.nisabGold21, cur)}`);
  if (z.nisabSilver) parts.push(`فضة: ${money(z.nisabSilver, cur)}`);
  html += note(`النصاب بالأسعار التي أدخلتها — ${parts.join(" · ")}.`, "info");
  html += note("تجب الزكاة إذا بلغ المال النصاب وحال عليه حول قمري كامل وهو في ملكك. للحالات الخاصة كالحلي المعدّ للبس والديون والأسهم الاستثمارية اسأل جهة فتوى موثوقة في بلدك.", "info");
  return html;
});
