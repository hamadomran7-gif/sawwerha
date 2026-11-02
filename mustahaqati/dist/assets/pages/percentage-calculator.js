import { bind, money, num, table, big, note } from "../app.js";

const $ = (id) => document.getElementById(id);
const n = (x) => num(x, 4);
const p = (x) => `${num(x, 2)}%`;
const ok = (...xs) => xs.every((x) => x !== null && x !== undefined && !isNaN(x));

bind($("f1"), $("r1"), (v) => {
  if (!ok(v.p, v.a)) return null;
  const r = (v.a * v.p) / 100;
  return big(`${p(v.p)} من ${n(v.a)}`, n(r), `${n(v.a)} × ${n(v.p)} ÷ 100`) + table([
    ["المبلغ بعد إضافة النسبة", n(v.a + r)],
    ["المبلغ بعد طرح النسبة", n(v.a - r)],
  ]);
});

bind($("f2"), $("r2"), (v) => {
  if (!ok(v.x, v.y)) return null;
  if (v.y === 0) return note("لا يمكن القسمة على صفر: أدخل قيمة الكل.", "warn");
  return big(`${n(v.x)} من ${n(v.y)}`, p((v.x / v.y) * 100), `${n(v.x)} ÷ ${n(v.y)} × 100`);
});

bind($("f3"), $("r3"), (v) => {
  if (!ok(v.o, v.n)) return null;
  if (v.o === 0) return note("القيمة القديمة صفر، فلا تُحسب نسبة التغير منها.", "warn");
  const ch = ((v.n - v.o) / Math.abs(v.o)) * 100;
  const label = ch > 0 ? "نسبة الزيادة" : ch < 0 ? "نسبة النقص" : "لا تغير";
  return big(label, p(Math.abs(ch)), `الفرق ${n(v.n - v.o)}`) + table([
    ["من", n(v.o)],
    ["إلى", n(v.n)],
    ["الفرق", n(v.n - v.o)],
    ["النسبة", `${ch > 0 ? "+" : ""}${p(ch)}`, { strong: true }],
  ]);
});

bind($("f4"), $("r4"), (v) => {
  if (!ok(v.a, v.p)) return null;
  const add = v.k === "add";
  let price = v.a * (1 + ((add ? 1 : -1) * v.p) / 100);
  const second = !add && ok(v.q) && v.q ? v.q : 0;
  if (second) price *= 1 - second / 100;
  const diff = v.a - price;
  let html = big(add ? "السعر بعد الإضافة" : "السعر بعد الخصم", money(price), add ? `زيادة ${money(-diff)}` : `توفير ${money(diff)}`);
  const rows = [["السعر الأصلي", money(v.a)], [add ? `الإضافة ${p(v.p)}` : `الخصم ${p(v.p)}`, money((v.a * v.p) / 100)]];
  if (second) rows.push([`خصم إضافي ${p(second)} على ${money(v.a * (1 - v.p / 100))}`, money(v.a * (1 - v.p / 100) * (second / 100))], ["الخصم الإجمالي الفعلي", p((diff / v.a) * 100)]);
  rows.push([add ? "السعر النهائي" : "السعر بعد الخصم", money(price), { strong: true }]);
  html += table(rows);
  if (add) html += note(`لمعرفة السعر قبل الإضافة من سعر نهائي: اقسمه على ${n(1 + v.p / 100)}.`, "info");
  return html;
});
