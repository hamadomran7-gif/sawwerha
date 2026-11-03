import { ksaHafiz, rules } from "../calc.js";
import { bind, money, table, big, note, arDate, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const H = rules.sa.hafiz;
const WHY = {
  young: "عمرك أقل من 20 سنة.",
  old: "بلغت 40 سنة، والإعانة للفئة من 20 إلى 40.",
  family: "دخل أسرتك يتجاوز الحد المانع لعدد أفرادها.",
  graduateWindow: "مضى على تخرجك أكثر من 24 شهراً؛ يُقدّم الخريج قبل مضيها.",
  wait: "من سبق له العمل لا يتقدم إلا بعد 24 شهراً من انتهاء علاقته الوظيفية.",
};

bind(form, result, (v) => {
  form.querySelector('label[for="eventDate"]').textContent = v.status === "worked" ? "تاريخ انتهاء آخر عمل" : "تاريخ التخرج";
  if (!v.birth) return null;
  const r = ksaHafiz({ birth: v.birth, today: new Date(), status: v.status, eventDate: v.eventDate, income: v.income, priorPayments: v.priorPayments, familySize: v.familySize, familyIncome: v.familyIncome });
  const groups = [];
  for (const x of r.rows) {
    const g = groups[groups.length - 1];
    if (g && g.base === x.base && g.pay === x.pay) g.n++;
    else groups.push({ base: x.base, pay: x.pay, n: 1 });
  }
  let html = r.eligible
    ? big("إعانتك التقديرية", money(r.total, cur), `${monthsAr(r.payments)} من أصل 15`)
    : big("لا تبدو مؤهلاً الآن", money(0, cur), "الأسباب أدناه");
  if (!r.eligible) html += note(r.reasons.map((x) => WHY[x]).join(" ") + (r.waitUntil ? ` يمكنك التقديم من ${arDate(r.waitUntil)}.` : ""), "warn");
  html += table(
    [
      ...groups.map((g) => [`${monthsAr(g.n)} × ${money(g.pay, cur)}${g.pay !== g.base ? ` (من ${money(g.base, cur)})` : ""}`, money(g.pay * g.n, cur)]),
      [r.eligible ? "المجموع" : "المجموع لو كنت مؤهلاً", money(r.total, cur), { strong: r.eligible, muted: !r.eligible }],
      ["حد دخل أسرتك", money(r.familyCap, cur)],
    ],
    "جدول الدفعات"
  );
  if (r.stoppedBy === "income") html += note("يتوقف الصرف حين يبلغ دخلك الشخصي الإعانة المستحقة في الشريحة.", "info");
  if (r.stoppedBy === "age") html += note("يتوقف الصرف ببلوغك 40 سنة.", "info");
  if (Number(v.priorPayments) > 0) html += note("لمن تقاضى دفعات سابقة تُصرف الدفعات المتبقية حتى 15؛ وافترضنا أنها تكمل من الشريحة التي توقفت عندها.", "info");
  html += note(`دخلك الشخصي يُخصم من الإعانة وأدنى صرف ${money(H.minPayment, cur)}، ودخل الأسرة شرط أهلية لا يُخصم. الحساب استرشادي؛ والقرار للصندوق بعد التحقق من بياناتك.`, "info");
  return html;
});
