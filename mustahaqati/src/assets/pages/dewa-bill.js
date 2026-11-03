import { uaeDewaBill, rules } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";
const D = rules.ae.dewa;
const sync = () => {
  const c = form.category.value;
  form.querySelectorAll("[data-housing]").forEach((el) => (el.hidden = c !== "residential"));
};
form.category.addEventListener("change", sync);

const slabRows = (rows, unit) =>
  rows.map((x) => [`${x.to === null ? `فوق ${num(x.from, 2)}` : `${num(x.from, 2)}–${num(x.to, 2)}`} ${unit} × ${num(x.price, 3)}`, money(x.cost, cur), { muted: true }]);

bind(form, result, (v) => {
  sync();
  const b = uaeDewaBill({ category: v.category, kwh: v.kwh || 0, m3: v.m3 || 0, annualRent: v.annualRent || 0, elecMeter: v.elecMeter, waterMeter: v.waterMeter, fuelElec: v.fuelElec, fuelWater: v.fuelWater, asOf: new Date() });
  const municipal = b.sewer + b.housing;
  let html = big("فاتورة ديوا الشهرية المقدّرة", money(b.total, cur), `لهيئة الكهرباء والمياه ${money(b.dewa + b.vat, cur)} شاملة الضريبة · لبلدية دبي ${money(municipal, cur)}`);
  html += table(
    [
      ["الكهرباء بالشرائح", money(b.electricity, cur)],
      ...slabRows(b.elecRows, "ك.و.س"),
      b.fuelElec ? [`رسم الوقود للكهرباء (${num(b.fuelRates.electricity, 3)} درهم)`, money(b.fuelElec, cur)] : null,
      ["المياه بالشرائح", money(b.water, cur)],
      ...slabRows(b.waterRows, "م³"),
      b.fuelWater ? [`رسم الوقود للمياه (${num(b.fuelRates.water, 3)} درهم)`, money(b.fuelWater, cur)] : null,
      ["رسوم العدادات", money(b.meterElec + b.meterWater, cur)],
      ["مجموع بنود الهيئة", money(b.dewa, cur), { strong: true }],
      ["ضريبة القيمة المضافة 5%", money(b.vat, cur)],
      [`الصرف الصحي (${num(b.sewerFils, 1)} فلس للغالون = ${num(b.sewerPerM3, 2)} درهم/م³)`, money(b.sewer, cur)],
      v.category === "residential" ? ["رسم السكن (5% من الإيجار ÷ 12)", money(b.housing, cur)] : null,
      ["الإجمالي", money(b.total, cur), { strong: true }],
    ],
    "تفصيل الفاتورة"
  );
  if (b.perKwh) html += note(`متوسط كلفة الكيلوواط ساعة عليك مع رسم الوقود: ${num(b.perKwh * 100, 2)} فلس قبل الضريبة.`, "info");
  const now = new Date();
  if (now < new Date("2027-01-01T00:00:00")) {
    const next = uaeDewaBill({ category: v.category, kwh: v.kwh || 0, m3: v.m3 || 0, annualRent: v.annualRent || 0, elecMeter: v.elecMeter, waterMeter: v.waterMeter, fuelElec: v.fuelElec, fuelWater: v.fuelWater, asOf: new Date("2027-01-15T08:00:00") });
    if (next.sewer > b.sewer) html += note(`من يناير 2027 يرتفع الصرف الصحي إلى 2.8 فلس للغالون، فيصير هذا البند ${money(next.sewer, cur)} بدل ${money(b.sewer, cur)} لاستهلاكك نفسه.`, "warn");
  }
  if (v.category === "national") html += note("تعرفة مساكن المواطنين من القرار التنفيذي 16 لسنة 2011 مع تحويل المياه إلى المتر المكعب (10,000 غالون ≈ 45.46 م³)، ولا يُفرض عليها رسم الوقود ولا رسم السكن.", "info");
  html += note(`رسم الوقود يتغير شهرياً (المُدخل: ${num(D.fuel.electricity, 3)} و${num(D.fuel.water, 3)} لشهر نوفمبر 2026). والفاتورة الفعلية تتبع قراءة العداد وأيام دورة الفوترة.`, "info");
  return html;
});
