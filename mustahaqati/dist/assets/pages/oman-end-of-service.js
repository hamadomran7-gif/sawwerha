import { omanGratuity, serviceDuration } from "../calc.js";
import { bind, money, num, table, big, note, duration, yearsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ر.ع";

bind(form, result, (v) => {
  if (!v.basic || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, 0);
  if (!d) return note("تاريخ آخر يوم عمل يجب أن يكون بعد تاريخ المباشرة.", "bad");
  if (v.reason === "art40") return big("مكافأة نهاية الخدمة", money(0, cur), `مدة الخدمة: ${duration(d)}`) + note("لا تُستحق المكافأة عند الفصل لإحدى حالات المادة 40، ويحق للعامل التظلم إن نازع في سبب الفصل.", "warn");
  const o = omanGratuity({ basicSalary: v.basic, start: v.start, end: v.end });
  let html = big("مكافأة نهاية الخدمة المستحقة", money(o.total, cur), `مدة الخدمة: ${duration(d)} (${num(d.decimalYears, 2)} سنة)`);
  html += table(
    [
      o.preYears > 0 ? [`قبل 31 يوليو 2023: ${num(o.preYears, 2)} سنة (15 يوماً لأول 3 سنوات ثم شهر) = ${num(o.preMonths, 2)} شهر`, money(o.preAmount, cur)] : null,
      o.postYears > 0 ? [`منذ 31 يوليو 2023: ${yearsAr(o.postYears)} × أجر شهر`, money(o.postAmount, cur)] : null,
      ["المكافأة المستحقة", money(o.total, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  if (o.preYears > 0) html += note(`حُسبت المدة السابقة لقانون العمل الجديد بأحكام القانون السابق كما توضح وزارة العمل. لو حُسبت كل المدة بأجر شهر عن كل سنة لكانت ${money(o.literalTotal, cur)}.`, "info");
  html += note("لا تنقص المكافأة عند الاستقالة. وعند بدء نظام الادخار لغير العمانيين (بحد أقصى 19 يوليو 2027) تتوقف المكافأة عن المدة اللاحقة ويحل محلها اشتراك 9% من الأجر الأساسي.", "ok");
  return html;
});
