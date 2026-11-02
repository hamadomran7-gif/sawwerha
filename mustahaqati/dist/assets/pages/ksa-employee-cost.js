import { gosiContribution, ksaExpatFees } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";

const toggle = () => form.querySelectorAll("[data-nat]").forEach((el) => (el.hidden = el.dataset.nat !== form.nat.value));
form.nat.addEventListener("change", toggle);

bind(form, result, (v) => {
  toggle();
  const basic = Number(v.basic) || 0;
  if (!basic) return null;
  const housing = Number(v.housing) || 0;
  const other = Number(v.other) || 0;
  const salary = basic + housing + other;
  const isSaudi = v.nat !== "expat";
  const g = gosiContribution({ basic, housing, isSaudi, newSubscriber: v.newSub === "yes" });

  const years = Math.max(0, Number(v.years) || 0);
  const eosMonthly = salary * (years >= 5 ? 1 : 0.5) / 12;
  const medical = (Number(v.medical) || 0) / 12;

  let levy = 0, permit = 0, iqama = 0, ticket = 0;
  if (!isSaudi) {
    const f = ksaExpatFees({ months: 12, includeWorker: true, expatsExceed: v.ratio !== "low", iqamaFee: v.iqamaFee });
    levy = v.ratio === "exempt" ? 0 : f.worker.levy / 12;
    permit = f.worker.permit / 12;
    iqama = f.worker.iqama / 12;
    ticket = (Number(v.ticket) || 0) / 12;
  }
  const total = salary + g.employerAmount + eosMonthly + medical + levy + permit + iqama + ticket;
  const over = salary ? ((total - salary) / salary) * 100 : 0;

  let html = big("التكلفة الشهرية على المنشأة", money(total, cur), `${money(total * 12, cur)} سنوياً، أي ${num(over, 1)}% فوق الراتب`);
  html += table(
    [
      ["الراتب الإجمالي", money(salary, cur)],
      [`التأمينات على صاحب العمل (${num(g.employerRate * 100, 2)}% من ${num(g.base, 0)})`, money(g.employerAmount, cur)],
      !isSaudi ? [v.ratio === "exempt" ? "المقابل المالي (معفى)" : "المقابل المالي", money(levy, cur)] : null,
      !isSaudi ? ["رخصة العمل والإقامة (شهرياً)", money(permit + iqama, cur)] : null,
      ["التأمين الطبي (شهرياً)", money(medical, cur)],
      !isSaudi && ticket ? ["تذكرة السفر (شهرياً)", money(ticket, cur)] : null,
      [`مخصص نهاية الخدمة (أجر ÷ ${years >= 5 ? 12 : 24})`, money(eosMonthly, cur)],
      ["التكلفة الشهرية", money(total, cur), { strong: true }],
      ["التكلفة السنوية", money(total * 12, cur), { strong: true }],
    ],
    "تفصيل التكلفة الشهرية"
  );
  html += table(
    [
      ["حصة الموظف في التأمينات", money(g.employeeAmount, cur)],
      ["صافي ما يستلمه الموظف", money(salary - g.employeeAmount, cur), { strong: true }],
    ],
    "للمقارنة: ما يصل إلى الموظف"
  );
  if (g.capped) html += note("وعاء التأمينات محسوب على الحد الأقصى 45,000 ريال.", "info");
  if (!isSaudi) html += note("المقابل المالي ورسوم الإقامة ورخصة العمل على صاحب العمل بحكم المادة 40، ولا يجوز تحميلها للعامل. رسوم مرافقيه على العامل نفسه.", "info");
  html += note("لا تشمل الحاسبة رسوم الاستقدام والتأشيرة لأول مرة، ولا تكلفة الإجازة السنوية وبديل الموظف أثناءها، ولا دعم التوظيف الذي قد يحصل عليه صاحب العمل عن الموظف السعودي.", "info");
  return html;
});
