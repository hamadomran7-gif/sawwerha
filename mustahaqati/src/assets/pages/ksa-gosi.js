import { gosiContribution, rules } from "../calc.js";
import { bind, money, num, pct, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const G = rules.sa.gosi;

bind(form, result, (v) => {
  if (v.basic === null || v.basic === undefined) return null;
  const isSaudi = v.status !== "expat";
  const newSubscriber = v.status === "saudi_new";
  const g = gosiContribution({ basic: v.basic || 0, housing: v.housing || 0, isSaudi, newSubscriber });

  let html = big("إجمالي الاشتراك الشهري (الموظف + صاحب العمل)", money(g.employeeAmount + g.employerAmount, cur), `على وعاء ${money(g.base, cur)}${g.capped ? " بعد تطبيق السقف" : ""}`);
  html += table(
    [
      isSaudi ? [`المعاشات — حصة الموظف ${pct(g.pensionRate * 100, 1)}`, money(g.pensionEmployee, cur)] : null,
      isSaudi ? [`ساند — حصة الموظف ${pct(G.sanedRate * 100, 2)}`, money(g.sanedEmployee, cur)] : null,
      [`إجمالي حصة الموظف (${pct(g.employeeRate * 100, 2)})`, money(g.employeeAmount, cur), { strong: true }],
      isSaudi ? [`المعاشات — حصة صاحب العمل ${pct(g.pensionRate * 100, 1)}`, money(g.base * g.pensionRate, cur)] : null,
      [`الأخطار المهنية — صاحب العمل ${pct(G.hazardsRate * 100, 0)}`, money(g.hazardsEmployer, cur)],
      isSaudi ? [`ساند — حصة صاحب العمل ${pct(G.sanedRate * 100, 2)}`, money(g.base * G.sanedRate, cur)] : null,
      [`إجمالي حصة صاحب العمل (${pct(g.employerRate * 100, 2)})`, money(g.employerAmount, cur), { strong: true }],
      ["حصة الموظف سنوياً", money(g.employeeAmount * 12, cur), { muted: true }],
      ["حصة صاحب العمل سنوياً", money(g.employerAmount * 12, cur), { muted: true }],
    ],
    "تفصيل الاشتراك"
  );
  if (!isSaudi) html += note("غير السعودي: اشتراك الأخطار المهنية فقط (2%) على صاحب العمل، ولا خصم من الموظف.", "ok");
  if (g.capped) html += note(`حُسب الاشتراك على سقف الأجر الخاضع (${num(G.wageCeiling, 0)} ريال).`, "info");
  return html;
});
