import { bahrainEwaBill } from "../calc.js";
import { bind, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const bd = (n) => `${f3.format(n)} د.ب`;
const fils = (p) => `${num(p * 1000, 0)} فلس`;
const slabRows = (rows, unit) =>
  rows.map((x) => [`${x.to === null ? (x.from === 0 ? `${num(x.qty, 0)} ${unit}` : `فوق ${num(x.from, 0)}: ${num(x.qty, 0)} ${unit}`) : `${num(x.from, 0)}–${num(x.to, 0)} ${unit}`} × ${fils(x.price)}`, bd(x.cost), { muted: true }]);

bind(form, result, (v) => {
  const b = bahrainEwaBill({ category: v.category, kwh: v.kwh || 0, m3: v.m3 || 0, municipal: v.municipal || 0 });
  let html = big("فاتورة الكهرباء والماء الشهرية المقدّرة", bd(b.total), `للهيئة ${bd(b.ewa)} شاملة الضريبة${b.sewer ? ` · الصرف الصحي ${bd(b.sewer)}` : ""}${b.municipal ? ` · البلدية ${bd(b.municipal)}` : ""}`);
  html += table(
    [
      ["الكهرباء", bd(b.electricity)],
      ...slabRows(b.elecRows, "ك.و.س"),
      ["الماء", bd(b.water)],
      ...slabRows(b.waterRows, "م³"),
      ["الرسم الإداري (دينار لكل حساب)", bd(b.fixedElec + b.fixedWater)],
      ["مجموع فاتورة الهيئة", bd(b.ewa), { strong: true }],
      b.sewagePct ? [`رسم الصرف الصحي (${num(b.sewagePct * 100, 0)}% من قيمة الماء)`, bd(b.sewer)] : null,
      b.municipal ? ["رسوم البلدية", bd(b.municipal)] : null,
      ["الإجمالي", bd(b.total), { strong: true }],
    ],
    "تفصيل الفاتورة"
  );
  if (b.category === "citizen" && b.support > 0) html += note(`الدعم في سكنك الأول: لو حُسب استهلاكك بالسعر غير المدعوم (32 فلساً للكهرباء و775 فلساً للماء) لبلغ ${bd(b.unsubsidised)}، أي أنك توفّر ${bd(b.support)} شهرياً.`, "info");
  if (b.perKwh) html += note(`متوسط سعر الكيلوواط ساعة عليك: ${num(b.perKwh * 1000, 1)} فلس، والأسعار شاملة ضريبة القيمة المضافة فلا تُضاف فوقها.`, "info");
  if (b.category === "citizen") html += note("رسم الصرف الصحي لا يُفرض على السكن الأول للمواطن. وفي أكتوبر 2026 وافق مجلس النواب على اقتراح بإعادة تعرفة الدعم السابقة، ولم يُقرّ بعد.", "info");
  return html;
});
