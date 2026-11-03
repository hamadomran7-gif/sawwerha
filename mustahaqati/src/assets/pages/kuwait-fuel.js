import { gccFuelCost } from "../calc.js";
import { bind, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const NAME = { g91: "ممتاز 91", g95: "خصوصي 95", ultra98: "ألترا 98", diesel: "ديزل" };
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const kd = (n) => `${f3.format(n)} د.ك`;
const fils = (p) => `${Math.round(p * 1000)} فلساً`;

bind(form, result, (v) => {
  const r = gccFuelCost({ country: "kw", fuel: v.fuel, tank: v.tank || 0, km: v.km || 0, per100: v.per100 || 0 });
  if (!r) return null;
  let html = big(`تعبئة الخزان ${NAME[r.fuel]}`, kd(r.tankCost), `${fils(r.price)} للتر`);
  html += table(
    [
      ["سعر اللتر", `${fils(r.price)} (${f3.format(r.price)} د.ك)`],
      ["اللترات الشهرية", `${num(r.litres, 1)} لتر`],
      ["كلفة الوقود الشهرية", kd(r.monthly), { strong: true }],
      ["الكلفة السنوية", kd(r.yearly)],
    ],
    "كلفتك"
  );
  html += table(Object.entries(r.all).map(([k, x]) => [`${NAME[k]}: ${fils(x.price)}`, kd(x.tank), k === r.fuel ? { strong: true } : {}]), `تعبئة خزان ${num(v.tank || 0, 0)} لتراً بكل نوع`);
  if (r.fuel === "ultra98") html += note("سعر ألترا 98 يُراجَع كل ربع سنة؛ المعروض قرار الربع الثالث 2026 (275 فلساً)، ولم نجد قرار الربع الرابع منشوراً.", "warn");
  else html += note("سعر ممتاز 91 وخصوصي 95 والديزل ثابت منذ إصلاح سبتمبر 2016، ولا ضريبة قيمة مضافة في الكويت.", "info");
  return html;
});
