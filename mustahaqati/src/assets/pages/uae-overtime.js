import { uaeOvertime, UAE_OT_TYPES } from "../calc.js";
import { bind, money, num, pct, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  if (!v.basic || v.hours === null || v.hours === undefined) return null;
  const o = uaeOvertime({ basicSalary: v.basic, hours: v.hours, type: v.type });
  let html = big("أجر الساعات الإضافية المستحق", money(o.pay, cur), `${num(v.hours, 1)} ساعة · ${UAE_OT_TYPES[v.type] || ""}`);
  html += table(
    [
      ["أجر اليوم (الأساسي ÷ 30)", money(o.dailyWage, cur)],
      ["أجر الساعة العادية (أجر اليوم ÷ 8)", money(o.hourlyWage, cur)],
      [`أجر الساعة الإضافية (× ${num(o.multiplier, 2)})`, money(o.hourlyWage * o.multiplier, cur)],
      [`الزيادة وحدها (${pct((o.multiplier - 1) * 100, 0)})`, money(o.premiumOnly, cur), { muted: true }],
      ["المستحق عن الساعات", money(o.pay, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  if (v.hours > 60) html += note("الحد القانوني ساعتان يومياً، أي نحو 52 ساعة شهرياً. ما زاد قد يحتاج إلى مبرر ضرورة.", "warn");
  if (v.type === "restday" || v.type === "holiday") html += note("يجوز لصاحب العمل منحك يوم راحة بديلاً بدل الأجر النقدي.", "info");
  return html;
});
