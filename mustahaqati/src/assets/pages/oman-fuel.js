import { gccFuelCost } from "../calc.js";
import { bind, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const NAME = { m91: "بنزين M91", m95: "بنزين M95", diesel: "ديزل" };
const omr = (n) => `${num(n, 3)} ريال عُماني`;
const baisa = (p) => `${Math.round(p * 1000)} بيسة`;

bind(form, result, (v) => {
  const r = gccFuelCost({ country: "om", fuel: v.fuel, tank: v.tank || 0, km: v.km || 0, per100: v.per100 || 0 });
  if (!r) return null;
  let html = big(`تعبئة الخزان ${NAME[r.fuel]}`, omr(r.tankCost), `${baisa(r.price)} للتر شاملة الضريبة 5%`);
  html += table(
    [
      ["سعر اللتر", `${baisa(r.price)} (${num(r.price, 3)} ر.ع.)`],
      ["اللترات الشهرية", `${num(r.litres, 1)} لتر`],
      ["كلفة الوقود الشهرية", omr(r.monthly), { strong: true }],
      ["الكلفة السنوية", omr(r.yearly)],
    ],
    "كلفتك"
  );
  html += table(Object.entries(r.all).map(([k, x]) => [`${NAME[k]}: ${baisa(x.price)}`, omr(x.tank), k === r.fuel ? { strong: true } : {}]), `تعبئة خزان ${num(v.tank || 0, 0)} لتراً بكل نوع`);
  html += note("الأسعار ثابتة عند سقف أكتوبر 2021 بالتوجيهات السامية، وتتحمل الحكومة فرق الأسعار العالمية.", "info");
  return html;
});
