import { bahrainGratuity, serviceDuration } from "../calc.js";
import { bind, money, num, table, big, note, duration } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "د.ب";

bind(form, result, (v) => {
  if (!v.wage || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, 0);
  if (!d) return note("تاريخ آخر يوم عمل يجب أن يكون بعد تاريخ المباشرة.", "bad");
  const b = bahrainGratuity({ wage: v.wage, start: v.start, end: v.end });
  let html = big("مكافأة نهاية الخدمة المستحقة", money(b.total, cur), `مدة الخدمة: ${duration(d)} (${num(b.years, 2)} سنة) = ${num(b.months, 2)} شهر من الأجر`);
  html += table(
    [
      [`يدفعها صاحب العمل: المدة قبل 1 مارس 2024 (${num(b.employerYears, 2)} سنة)`, money(b.employerAmount, cur)],
      [`تصرفها هيئة التأمين الاجتماعي: المدة منذ 1 مارس 2024 (${num(b.sioYears, 2)} سنة)`, money(b.sioAmount, cur)],
      ["المجموع", money(b.total, cur), { strong: true }],
    ],
    "من يدفع؟"
  );
  html += note("نصف شهر عن كل سنة من أول 3 سنوات ثم شهر، على الأجر الأخير (الأساسي مع العلاوة الاجتماعية)، ولا تنقص عند الاستقالة. جزء الهيئة يُطلب عبر موقعها بعد انتهاء الخدمة، ولا يتجاوز الاشتراكات المسددة عنك.", "ok");
  return html;
});
