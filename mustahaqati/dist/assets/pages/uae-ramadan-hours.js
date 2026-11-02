import { uaeRamadanOvertime } from "../calc.js";
import { bind, money, num, table, big, note, daysAr, hoursAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  if (!v.basic || !v.normal || v.worked === null || v.worked === undefined) return null;
  const div = v.divisor === "reduced" ? Math.max(1, v.normal - 2) : 8;
  const r = uaeRamadanOvertime({ basic: v.basic, normalHours: v.normal, workedHours: v.worked, days: v.days || 0, night: !!v.night, divisor: div });
  if (!r.extraPerDay) {
    return big("الأجر الإضافي في رمضان", money(0, cur), `دوامك في رمضان ${hoursAr(r.reducedHours)}`) + note("لا تعمل أكثر من الساعات المخفضة، فلا أجر إضافياً. ولا يُخصم من راتبك بسبب تخفيض الساعات.", "ok");
  }
  let html = big("الأجر الإضافي المتوقع عن رمضان", money(r.total, cur), `${hoursAr(r.extraPerDay)} زائدة يومياً × ${daysAr(v.days || 0)}`);
  html += table(
    [
      ["الدوام العادي ← في رمضان", `${hoursAr(v.normal)} ← ${hoursAr(r.reducedHours)}`],
      ["الساعات الزائدة يومياً", hoursAr(r.extraPerDay)],
      [`أجر الساعة (الأساسي ÷ 30 ÷ ${div})`, money(r.hourly, cur)],
      [`النسبة (${v.night ? "ليلاً +50%" : "+25%"})`, `× ${num(r.multiplier, 2)}`],
      ["الأجر الإضافي اليومي", money(r.perDay, cur)],
      ["المجموع عن أيام العمل", money(r.total, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  if (r.overLimit) html += note("الحد القانوني للعمل الإضافي ساعتان يومياً إلا للضرورة.", "warn");
  html += note("اعتبار الساعات الزائدة على دوام رمضان المخفض عملاً إضافياً استنتاج من المادة 19 تؤيده آراء قانونية منشورة، ولم نجد تعميماً رسمياً يصرّح به. وقاسم أجر الساعة (8 أو الساعات المخفضة) غير محسوم.", "info");
  return html;
});
