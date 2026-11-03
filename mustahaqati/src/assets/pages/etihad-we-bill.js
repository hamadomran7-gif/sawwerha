import { etihadWeBill } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";
const slab = (rows, unit, fils) =>
  rows.map((x) => [`${x.to === null ? (x.from === 0 ? `${num(x.qty, 2)} ${unit}` : `فوق ${num(x.from, 0)}: ${num(x.qty, 2)} ${unit}`) : `${num(x.from, 0)}–${num(x.to, 0)} ${unit}`} × ${fils ? `${num(x.price * 100, 1)} فلس` : `${num(x.price, 2)} درهم`}`, money(x.cost, cur), { muted: true }]);

bind(form, result, (v) => {
  const b = etihadWeBill({ category: v.category, kwh: v.kwh || 0, m3: v.m3 || 0, other: v.other || 0 });
  let html = big("فاتورة الكهرباء والمياه الشهرية المقدّرة", money(b.total, cur), `قبل الضريبة ${money(b.base, cur)} · الضريبة ${money(b.vat, cur)}`);
  html += table(
    [
      ["الكهرباء (التعرفة)", money(b.electricity, cur)],
      ...slab(b.elecRows, "ك.و.س", true),
      b.surcharge ? [`الرسم الإضافي (${num(b.surchargeRate * 100, 0)} فلوس لكل ك.و.س)`, money(b.surcharge, cur)] : null,
      ["المياه", money(b.water, cur)],
      ...slab(b.waterRows, "م³", false),
      ["ضريبة القيمة المضافة 5%", money(b.vat, cur)],
      b.other ? ["رسوم أخرى في فاتورتك", money(b.other, cur)] : null,
      ["الإجمالي", money(b.total, cur), { strong: true }],
    ],
    "تفصيل الفاتورة"
  );
  if (b.perKwh) html += note(`متوسط سعر الكيلوواط ساعة عليك مع الرسم الإضافي: ${num(b.perKwh * 100, 2)} فلس قبل الضريبة.`, "info");
  if (b.category === "national") html += note("تعرفة المواطن في مسكنه: 7.5 فلس للكيلوواط ساعة و3.3 درهم للمتر المكعب، شريحة واحدة وبلا رسم إضافي.", "info");
  return html;
});
