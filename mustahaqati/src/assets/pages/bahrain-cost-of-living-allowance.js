import { bahrainCostOfLiving, bahrainColPayDates, rules } from "../calc.js";
import { bind, num, table, big, note, arDate } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const C = rules.bh.costOfLiving;
const bhd = (n) => `${num(n, 0)} د.ب`;

bind(form, result, (v) => {
  if (v.income === null) return null;
  const s = bahrainCostOfLiving({ income: v.income, category: v.category });
  let html;
  if (s.reason === "category") {
    html = big("علاوة الغلاء الشهرية", bhd(0), "الأعزب غير المسن ليس في الفئات المستحقة");
    html += note("الفئات المستحقة: الزوجان، والأرمل مع أبنائه، والمطلق الحاضن، وكبار السن في حالات محددة، ومستفيدو الضمان الاجتماعي. فالأعزب غير المسن لا يستحق على الأرجح.", "warn");
    return html;
  }
  if (s.reason === "income") {
    html = big("علاوة الغلاء الشهرية", bhd(0), `دخل رب الأسرة فوق ${num(C.ceiling, 0)} دينار`);
    html += note(`لا تُصرف العلاوة إذا زاد دخل رب الأسرة على ${num(C.ceiling, 0)} دينار شهرياً.`, "warn");
    return html;
  }
  const dates = bahrainColPayDates({ from: new Date(), count: 6 });
  html = big("علاوة الغلاء الشهرية", bhd(s.amount), `الشريحة ${num(s.bracket, 0)} · من يناير 2026`);
  html += table(
    [
      ["دخل رب الأسرة", `${num(s.income, 0)} د.ب`],
      ["العلاوة الشهرية", bhd(s.amount), { strong: true }],
      ["العلاوة السنوية", bhd(s.annual)],
      [`قبل يناير 2026 (+${num(s.amount - s.prev, 0)})`, bhd(s.prev)],
      ["الدفعات القادمة (يوم 15)", dates.map((d) => arDate(d)).join("، ")],
    ],
    "تفصيل العلاوة"
  );
  if (s.boundary) html += note(`دخلك على حد الشريحة تماماً (${num(s.income, 0)}). النص الرسمي والوزارة يختلفان في صياغة الحد، فقد تُصنَّف في الشريحة الأخرى.`, "warn");
  if (v.category === "socialSecurity") html += note("مستفيدو الضمان الاجتماعي يحصلون على العلاوة تلقائياً بلا طلب، وأغلبهم في الشريحة العليا (130).", "info");
  if (v.category === "elderly") html += note("كبار السن يستحقون في حالات اجتماعية محددة لم تحدد البوابة الوطنية سنها. تحقق في المركز الاجتماعي.", "info");
  html += note("يوم 15 من كل شهر بحسب إعلان الوزارة في 2020، ولم نجد قاعدة رسمية إن وافق عطلة. المبلغ لا يتغير بعدد أفراد الأسرة.", "info");
  return html;
});
