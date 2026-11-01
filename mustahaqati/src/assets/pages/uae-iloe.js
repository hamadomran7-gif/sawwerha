import { iloe, rules } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";
const I = rules.ae.iloe;

bind(form, result, (v) => {
  if (v.basic === null || v.basic === undefined) return null;
  const r = iloe({ basicSalary: v.basic });
  let html = big("التعويض الشهري عند فقدان الوظيفة", money(r.monthly, cur), `الفئة ${r.category === "A" ? "الأولى" : "الثانية"} · لمدة ${r.months} أشهر كحد أقصى`);
  html += table(
    [
      ["الفئة", r.category === "A" ? `الأولى (الأساسي حتى ${num(I.categoryAMaxBasic, 0)} درهم)` : `الثانية (الأساسي فوق ${num(I.categoryAMaxBasic, 0)} درهم)`],
      ["الاشتراك الشهري", money(r.premium, cur)],
      ["الاشتراك السنوي", money(r.annualPremium, cur), { muted: true }],
      [`${num(I.compensationRate * 100, 0)}% من الراتب الأساسي`, money((v.basic || 0) * I.compensationRate, cur)],
      ["سقف الفئة الشهري", money(r.cap, cur), { muted: !r.capped }],
      ["التعويض الشهري المستحق", money(r.monthly, cur), { strong: true }],
      [`إجمالي ${r.months} أشهر`, money(r.total, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  if (r.capped) html += note("تجاوز 60% من راتبك سقف الفئة، فالتعويض محدود بالسقف.", "warn");
  html += note(`الشروط: اشتراك متصل ${I.minSubscriptionMonths} شهراً على الأقل، وفقدان الوظيفة غير طوعي، وتقديم المطالبة خلال ${I.claimWithinDays} يوماً.`, "info");
  return html;
});
