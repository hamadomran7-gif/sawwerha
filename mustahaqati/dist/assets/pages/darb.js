import { abuDhabiDarbCost } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  const r = abuDhabiDarbCost({ crossingsPerDay: v.crossingsPerDay || 0, days: v.days ?? 5 });
  let html = big("كلفة درب الشهرية", money(r.monthly, cur), `نحو ${num(r.crossingsMonthly, 0)} عبوراً في الذروة شهرياً، 4 دراهم لكل عبور`);
  html += table(
    [
      ["كلفة يوم العبور", money(r.daily, cur)],
      ["الكلفة الأسبوعية", money(r.weekly, cur)],
      ["الكلفة الشهرية (4.33 أسبوع)", money(r.monthly, cur), { strong: true }],
      ["الكلفة السنوية", money(r.yearly, cur)],
    ],
    "كلفتك"
  );
  html += note("لا حد يومي ولا شهري منذ 1 سبتمبر 2025. والعبور خارج الذروة ويوم الأحد والعطل الرسمية مجاني، وتُعفى الفئات المؤهلة بالتسجيل.", "info");
  return html;
});
