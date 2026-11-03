import { dubaiRentIncrease, shiftDate, rules } from "../calc.js";
import { bind, money, num, table, big, note, arDate } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  const r = dubaiRentIncrease({ rent: v.rent, average: v.average });
  if (!r) return null;
  const R = rules.ae.dubaiRent;
  const below = r.gapPct > 0;
  let html = r.pct
    ? big("أقصى إيجار سنوي عند التجديد", money(r.maxRent, cur), `زيادة ${num(r.pct * 100, 0)}% = ${money(r.increase, cur)} في السنة`)
    : big("لا تجوز زيادة الإيجار عند التجديد", money(Number(v.rent), cur), below ? `إيجارك أقل من المتوسط بـ${num(r.gapPct, 1)}% فقط` : "إيجارك يساوي المتوسط أو أعلى منه");
  html += table(
    [
      ["إيجارك الحالي", money(Number(v.rent), cur)],
      ["متوسط المؤشر لوحدة مماثلة", money(Number(v.average), cur)],
      [below ? "إيجارك أقل من المتوسط بـ" : "إيجارك أعلى من المتوسط بـ", `${num(Math.abs(r.gapPct), 2)}%`],
      ["أقصى نسبة زيادة (المرسوم 43)", `${num(r.pct * 100, 0)}%`],
      ["مبلغ الزيادة السنوي", money(r.increase, cur)],
      ["الزيادة شهرياً", money(r.monthlyIncrease, cur), { muted: true }],
      ["أقصى إيجار جديد", money(r.maxRent, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  if (v.expiry) {
    const deadline = shiftDate(v.expiry, -R.noticeDays);
    const today = new Date().toISOString().slice(0, 10);
    html += note(`آخر موعد لإخطارك بأي زيادة: ${arDate(deadline)} (قبل ${R.noticeDays} يوماً من انتهاء العقد في ${arDate(v.expiry)}).${today > deadline ? " مضى الموعد، فإن لم تُخطَر قبله فالزيادة لا تسري على هذا التجديد بحسب شرح المحامين." : ""}`, today > deadline ? "warn" : "info");
  }
  if (r.gapPct > 10 && r.gapPct < 11) html += note("الفارق بين 10% و11%؛ المرسوم يذكر «حتى 10%» ثم «11% إلى 20%»، وحسبنا ما فوق 10% ضمن الشريحة الثانية. تحقق من رقم المؤشر.", "info");
  html += note("الرقم الملزم هو ما يظهره مؤشر دبي الذكي للإيجارات لوحدتك، فأدخل متوسطه بدقة. وعند الخلاف يُرجع إلى مركز فض المنازعات الإيجارية.", "info");
  return html;
});
