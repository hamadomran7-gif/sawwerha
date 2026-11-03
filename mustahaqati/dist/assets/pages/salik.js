import { uaeSalikCost } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  const r = uaeSalikCost({ peakPerDay: v.peakPerDay || 0, lowPerDay: v.lowPerDay || 0, workdays: v.workdays ?? 5, sundayPerWeek: v.sundayPerWeek || 0, asOf: new Date() });
  let html = big("كلفة سالك الشهرية", money(r.monthly, cur), `نحو ${num(r.crossingsMonthly, 0)} عبوراً في الشهر${r.vat ? ` · منها ضريبة ${money(r.vatMonthly, cur)}` : ""}`);
  html += table(
    [
      ["العبور في الذروة", `${money(r.peak, cur)}`],
      ["العبور خارج الذروة ويوم الأحد", `${money(r.low, cur)}`],
      ["كلفة يوم العمل", money(r.daily, cur)],
      ["الكلفة الأسبوعية", money(r.weekly, cur)],
      ["الكلفة الشهرية (4.33 أسبوع)", money(r.monthly, cur), { strong: true }],
      ["الكلفة السنوية", money(r.yearly, cur)],
    ],
    r.vat ? "الأسعار شاملة ضريبة 5%" : "قبل الضريبة"
  );
  html += note("العبور من 1 إلى 6 فجراً مجاني، وفي رمضان من 2 إلى 7 فجراً. وأسعار الأحد لا تنطبق في العطل الرسمية والفعاليات العامة.", "info");
  return html;
});
