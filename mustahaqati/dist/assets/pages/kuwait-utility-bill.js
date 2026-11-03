import { kuwaitUtilityBill } from "../calc.js";
import { bind, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const kd = (n) => `${f3.format(n)} د.ك`;
const NAME = { private: "السكن الخاص", investment: "السكن الاستثماري", commercial: "التجاري", government: "الحكومي", industrial: "الصناعي والزراعي", other: "القطاعات الأخرى" };

bind(form, result, (v) => {
  const b = kuwaitUtilityBill({ category: v.category, kwh: v.kwh || 0, water: v.water || 0, waterUnit: v.waterUnit });
  let html = big("فاتورة الكهرباء والماء الشهرية المقدّرة", kd(b.total), `الكهرباء ${kd(b.electricity)} · الماء ${kd(b.water)}`);
  html += table(
    [
      ["التعرفة المطبقة", NAME[b.category] + (v.category === "kuwaitiInvestment" ? " (مواطن في سكن استثماري)" : "")],
      [`الكهرباء: ${num(v.kwh || 0, 0)} ك.و.س × ${num(b.priceKwh * 1000, 0)} فلس`, kd(b.electricity)],
      [`الماء: ${num(b.gallons, 0)} غالون (${num(b.m3, 2)} م³) × ${num(b.pricePer1000, 3)} د.ك لكل 1,000 غالون`, kd(b.water)],
      ["الإجمالي", kd(b.total), { strong: true }],
    ],
    "تفصيل الفاتورة"
  );
  if (b.elecSupport > 0) html += note(`الكلفة الفعلية للكهرباء نحو 48 فلساً للكيلوواط ساعة، فلو دفعت كلفتها كاملة لبلغت ${kd(b.realElec)}، أي أن الدولة تدعم كهرباءك بنحو ${kd(b.elecSupport)} شهرياً.`, "info");
  if (v.category === "kuwaitiInvestment") html += note("يعامَل المواطن الساكن في سكن استثماري بتعرفة السكن الخاص لوحدة واحدة، بشرط ألا يكون له دعم سكني آخر وأن يقدّم المستندات للوزارة.", "info");
  html += note("لا توجد شرائح في التعرفة المطبقة: سعر واحد للكيلوواط ساعة حسب نوع العقار. وبرنامج «حافز» قد يخصم حتى 90% سنوياً لمن يخفض استهلاكه، ولا تشمله الحاسبة.", "info");
  return html;
});
