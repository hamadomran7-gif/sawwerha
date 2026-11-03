import { abuDhabiUtilityBill } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";
const sync = () => {
  const c = form.category.value;
  form.querySelectorAll("[data-home]").forEach((el) => (el.hidden = c === "commercial"));
  form.querySelectorAll("[data-rent]").forEach((el) => (el.hidden = c !== "expat"));
};
form.category.addEventListener("change", sync);
const band = (rows, unit, scale = 1) =>
  rows.map((x, i) => [`${i === 0 && x.to !== null ? "الحزمة الخضراء" : x.from > 0 ? "الحزمة الحمراء (الزائد)" : "سعر موحد"}: ${num(x.qty, 2)} ${unit} × ${num(x.price * scale, 2)}${scale === 100 ? " فلس" : " درهم"}`, money(x.cost, cur), { muted: true }]);

bind(form, result, (v) => {
  sync();
  const b = abuDhabiUtilityBill({ category: v.category, home: v.home, kwh: v.kwh || 0, m3: v.m3 || 0, days: v.days || 30, annualRent: v.annualRent || 0 });
  let html = big("فاتورة المرافق الشهرية المقدّرة", money(b.total, cur), `الكهرباء والمياه ${money(b.utilitiesTotal, cur)} شاملة الضريبة${b.municipality ? ` · رسوم البلدية ${money(b.municipality, cur)}` : ""}`);
  html += table(
    [
      ["الكهرباء", money(b.electricity, cur)],
      ...band(b.elecRows, "ك.و.س", 100),
      ["المياه", money(b.water, cur)],
      ...band(b.waterRows, "م³"),
      ["ضريبة القيمة المضافة 5%", money(b.vat, cur)],
      ["مجموع الكهرباء والمياه", money(b.utilitiesTotal, cur), { strong: true }],
      b.municipality ? ["رسوم البلدية (5% من الإيجار ÷ 12)", money(b.municipality, cur)] : null,
      ["الإجمالي", money(b.total, cur), { strong: true }],
    ],
    "تفصيل الفاتورة"
  );
  if (b.eCap !== null) {
    html += note(`حزمتك الخضراء في دورة ${num(b.days, 0)} يوماً: ${num(b.eCap, 0)} ك.و.س و${num(b.wCap, 2)} م³. ${b.over.kwh || b.over.m3 ? `تجاوزتها بـ${num(b.over.kwh, 0)} ك.و.س و${num(b.over.m3, 2)} م³، والسعر الأعلى على الزائد فقط.` : "استهلاكك كله داخلها."}`, b.over.kwh || b.over.m3 ? "warn" : "info");
  }
  if (v.category === "national") html += note("المواطن معفى من رسوم البلدية في عقود السكن لاستخدامه الخاص.", "info");
  html += note("الحزمة تُحسب بمتوسط الاستهلاك اليومي في دورة الفوترة، فاكتب عدد أيام الدورة من فاتورتك.", "info");
  return html;
});
