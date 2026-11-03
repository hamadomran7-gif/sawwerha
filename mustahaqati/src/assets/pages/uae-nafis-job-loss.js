import { uaeNafisJobLoss } from "../calc.js";
import { bind, money, table, big, note, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => money(x, "درهم");
const CHILD = ["الابن الأول", "الابن الثاني", "الابن الثالث"];

bind(form, result, (v) => {
  if (v.age === null || v.age === undefined) return null;
  const r = uaeNafisJobLoss({ reason: v.reason, age: v.age, spouse: v.spouse === "yes", children: v.children, otherIncome: v.otherIncome });
  if (!r.eligible) {
    const WHY = {
      resignation: "الدعم لمن فقد عمله لأسباب خارجة عن إرادته، والاستقالة الاختيارية لا تدخل فيها.",
      misconduct: "يُستبعد من فُصل لأسباب أخلاقية أو مخالفة قانونية.",
      age: "الدعم للمواطن من 18 إلى 60 سنة.",
    };
    return big("لا يبدو أنك مستحق", m(0), "السبب أدناه") + note(WHY[r.why] || "", "warn");
  }
  let html = big("الدعم الشهري", m(r.monthly), `حتى ${monthsAr(r.consecutive)} متتالية و${monthsAr(r.maxMonths)} إجمالاً`);
  const rows = r.rows.map((x) => [x.k === "self" ? "أنت" : x.k === "spouse" ? "الزوج أو الزوجة (لا يعمل)" : CHILD[x.n - 1], m(x.amount)]);
  rows.push(["المجموع قبل الخصم", m(r.gross)]);
  if (r.deduction) rows.push(["يُخصم دخلك الآخر", "− " + m(r.deduction)]);
  rows.push(["الدعم الشهري", m(r.monthly), { strong: true }]);
  rows.push([`مجموع ${monthsAr(r.consecutive)} متتالية`, m(r.totalConsecutive)]);
  rows.push([`أقصى مجموع (${monthsAr(r.maxMonths)})`, m(r.totalMax)]);
  html += table(rows, "التفصيل");
  if (r.kidsExtra) html += note("يُحتسب ثلاثة أبناء كحد أقصى.", "info");
  if (r.deduction && r.monthly === 0) html += note("دخلك الآخر يساوي الدعم أو يزيد عليه، فلا يُصرف شيء.", "warn");
  html += note("يُشترط ألا يكون لك مصدر دخل، وأن تكون قادراً على العمل، وتُستبعد إن رفضت عرض عمل. والقرار لنافس بعد التحقق.", "info");
  return html;
});
