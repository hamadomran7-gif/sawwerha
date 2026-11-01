import { serviceDuration, uaeGratuity, rules } from "../calc.js";
import { bind, money, num, table, big, note, duration } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  if (!v.basic || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, v.unpaid || 0);
  if (!d) return note("تاريخ آخر يوم عمل يجب أن يكون بعد تاريخ المباشرة.", "bad");
  const g = uaeGratuity({ basicSalary: v.basic, years: d.decimalYears });
  const R = rules.ae.gratuity;

  if (!g.eligible) {
    return (
      big("مكافأة نهاية الخدمة", money(0, cur), `مدة الخدمة: ${duration(d)}`) +
      note("لا تُستحق المكافأة قبل إكمال سنة واحدة من الخدمة المتصلة (المادة 51).", "warn")
    );
  }

  let html = big("مكافأة نهاية الخدمة المستحقة", money(g.total, cur), `مدة الخدمة: ${duration(d)} (${num(d.decimalYears, 2)} سنة)`);
  html += table(
    [
      ["الأجر اليومي (الأساسي ÷ 30)", money(g.dailyWage, cur)],
      [`السنوات الخمس الأولى: ${num(g.firstYears, 2)} سنة × ${R.daysFirstFiveYears} يوماً = ${num(g.firstDays, 1)} يوماً`, money(g.firstAmount, cur)],
      g.secondYears > 0
        ? [`ما بعد السنة الخامسة: ${num(g.secondYears, 2)} سنة × ${R.daysAfterFiveYears} يوماً = ${num(g.secondDays, 1)} يوماً`, money(g.secondAmount, cur)]
        : null,
      ["المجموع قبل السقف", money(g.gross, cur), { muted: !g.capped }],
      ["السقف القانوني (أجر سنتين = 24 × الأساسي)", money(g.cap, cur), { muted: true }],
      ["المكافأة المستحقة", money(g.total, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  if (g.capped) html += note("تجاوزت المكافأة السقف القانوني، فحُدّدت بأجر سنتين.", "warn");
  html += note(`يُصرف المبلغ خلال ${R.paymentDeadlineDays} يوماً من انتهاء العقد. الحساب على الأجر الأساسي فقط، ولا تنقص المكافأة عند الاستقالة.`, "ok");
  return html;
});
