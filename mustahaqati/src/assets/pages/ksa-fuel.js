import { ksaFuelCost } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const NAME = { g91: "بنزين 91", g95: "بنزين 95", diesel: "ديزل" };

bind(form, result, (v) => {
  const r = ksaFuelCost({ fuel: v.fuel, tank: v.tank || 0, km: v.km || 0, per100: v.per100 || 0 });
  if (!r) return null;
  let html = big(`تعبئة الخزان ${NAME[v.fuel]}`, money(r.tankCost, cur), `${num(r.price, 2)} ريال للتر شاملاً الضريبة`);
  html += table(
    [
      ["اللترات الشهرية", `${num(r.litres, 1)} لتر`],
      ["كلفة الوقود الشهرية", money(r.monthly, cur), { strong: true }],
      ["الكلفة السنوية", money(r.yearly, cur)],
    ],
    "كلفتك"
  );
  html += table(Object.entries(r.all).map(([k, x]) => [`${NAME[k]}: ${num(x.price, 2)} ريال`, money(x.tank, cur), k === v.fuel ? { strong: true } : {}]), `تعبئة خزان ${num(v.tank || 0, 0)} لتراً بكل نوع`);
  html += note("أسعار بنزين 91 و95 والديزل ثابتة حتى المراجعة السنوية لأرامكو، أما بنزين 98 فيتغير شهرياً.", "info");
  return html;
});
