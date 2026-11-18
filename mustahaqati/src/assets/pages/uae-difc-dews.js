import { difcDews, rules } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  if (!v.basic || v.years == null) return null;
  const R = rules.ae.difcDews;
  if ((v.prior || 0) > v.years) return note("المدة قبل 1 فبراير 2020 لا تزيد على مدة الخدمة كلها.", "bad");
  const d = difcDews({ monthlyBasic: v.basic, monthlyWage: v.wage || 0, years: v.years, priorYears: v.prior || 0 });
  const nowMonthly = d.rateNow === R.rateFirstFiveYears ? d.monthlyFirst : d.monthlyAfter;
  let html = big("مساهمة صاحب العمل الشهرية الآن", money(nowMonthly, cur), `${num(d.rateNow, 2)}% من الراتب الأساسي الشهري ${money(d.basic, cur)}`);
  html += table(
    [
      [`أول ${R.firstPeriodYears} سنوات: ${num(R.rateFirstFiveYears, 2)}% شهرياً`, money(d.monthlyFirst, cur)],
      [`بعدها: ${num(R.rateAfterFiveYears, 2)}% شهرياً`, money(d.monthlyAfter, cur)],
      [`سنوياً في أول ${R.firstPeriodYears} سنوات / بعدها`, `${money(d.annualFirst, cur)} / ${money(d.annualAfter, cur)}`],
      [`${num(d.monthsFirst, 0)} شهراً بنسبة ${num(R.rateFirstFiveYears, 2)}%`, money(d.totalFirst, cur)],
      d.monthsAfter > 0 ? [`${num(d.monthsAfter, 0)} شهراً بنسبة ${num(R.rateAfterFiveYears, 2)}%`, money(d.totalAfter, cur)] : null,
      ["مجموع المساهمات عن المدة (حد أدنى)", money(d.total, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  if (d.floorApplied) html += note("رُفع الراتب الأساسي في الحساب إلى نصف الأجر الشهري، لأن القانون لا يقبل أقل منه (المادة 66(8)(b)).", "warn");
  if ((v.prior || 0) > 0) html += note("لا مساهمات عن الخدمة قبل 1 فبراير 2020، وعنها مكافأة نهاية الخدمة بالمادة 66(2) عند انتهاء الخدمة ما لم تُنقل إلى الخطة بموافقتك.", "info");
  html += note(`المبالغ حدود دنيا قبل عوائد الاستثمار ورسوم الخطة. وتُدفع مساهمة كل شهر بحلول اليوم ${R.paymentDueDayNextMonth} من الشهر التالي.`, "info");
  return html;
});
