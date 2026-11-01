import { ksaNetSalary, rules } from "../calc.js";
import { bind, money, num, pct, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";

bind(form, result, (v) => {
  if (v.basic === null || v.basic === undefined) return null;
  const isSaudi = v.status !== "expat";
  const newSubscriber = v.status === "saudi_new";
  const housing = v.inkind ? (v.basic || 0) / 6 : v.housing || 0;
  const r = ksaNetSalary({ basic: v.basic || 0, housing, transport: v.transport || 0, other: v.other || 0, isSaudi, newSubscriber });
  const g = r.gosi;

  let html = big("الراتب الصافي الشهري", money(r.net, cur), `الإجمالي ${money(r.gross, cur)} − خصم التأمينات ${money(g.employeeAmount, cur)}`);
  html += table(
    [
      ["الأجر الخاضع للاشتراك (الأساسي + السكن)", money(g.base, cur) + (g.capped ? " (بعد السقف)" : "")],
      isSaudi ? [`فرع المعاشات ${pct(g.pensionRate * 100, 1)}`, money(g.pensionEmployee, cur)] : null,
      isSaudi ? [`ساند ${pct(rules.sa.gosi.sanedRate * 100, 2)}`, money(g.sanedEmployee, cur)] : null,
      [`إجمالي خصم الموظف (${pct(g.employeeRate * 100, 2)})`, money(g.employeeAmount, cur), { strong: true }],
      [`حصة صاحب العمل (${pct(g.employerRate * 100, 2)}) — لا تُخصم منك`, money(g.employerAmount, cur), { muted: true }],
      ["الصافي السنوي", money(r.annualNet, cur), { muted: true }],
    ],
    "تفصيل الخصم"
  );
  if (!isSaudi) html += note("غير السعودي: لا يُخصم أي اشتراك من الراتب. صاحب العمل يدفع 2% عن الأخطار المهنية.", "ok");
  if (newSubscriber) html += note(`نسبة المعاشات المطبّقة اليوم للمشترك الجديد ${pct(g.pensionRate * 100, 1)}، وترتفع 0.5% في 3 يوليو من كل سنة حتى 11%.`, "info");
  if (g.capped) html += note(`تجاوز الأساسي وبدل السكن سقف الاشتراك (${num(rules.sa.gosi.wageCeiling, 0)} ريال)، فحُسب الاشتراك على السقف فقط.`, "info");
  return html;
});
