import { omanFamilyIncomeSupport, rules } from "../calc.js";
import { bind, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const S = rules.om.socialProtection;
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const omr = (n) => `${f3.format(n)} ر.ع`;

bind(form, result, (v) => {
  if (!v.members) return null;
  const s = omanFamilyIncomeSupport({ members: v.members, caregivers: v.caregivers, income: v.income, idleMen: v.idleMen, children: v.children, students: v.students });
  let html = big("ما تتلقاه أسرتك شهرياً", omr(s.totalSchool), s.eligible ? `دعم الدخل ${f3.format(s.fis)} + الطفولة ${num(s.childSchool, 0)}` : "لا دعم دخل: دخلكم يبلغ القيمة المستهدفة");
  html += table(
    [
      [`القيمة المستهدفة: 115 × √${num(s.n, 0)}${s.caregivers ? ` (منهم ${num(s.caregivers, 0)} يُحسب فردين)` : ""}`, omr(s.target)],
      ["دخل الأسرة الفعلي", omr(s.actual)],
      s.imputed ? [`دخل مكافئ: ${num(s.imputed / S.fis.imputedMale, 0)} × 115`, omr(s.imputed)] : null,
      ["الدخل المحتسب", omr(s.counted)],
      [s.raisedToMin ? `منفعة دعم الدخل (الفرق ${f3.format(s.gap)} رُفع إلى الحد الأدنى)` : "منفعة دعم دخل الأسر", omr(s.fis), { strong: true }],
      s.children ? [`منفعة الطفولة في العام الدراسي: ${num(s.students, 0)} × ${num(s.studentRate, 0)} + ${num(s.children - s.students, 0)} × 10`, omr(s.childSchool)] : null,
      s.children && s.childSchool !== s.childSummer ? ["منفعة الطفولة خارج العام الدراسي", omr(s.childSummer)] : null,
      ["المجموع الشهري", omr(s.totalSchool), { strong: true }],
      s.totalSchool !== s.totalSummer ? ["المجموع خارج العام الدراسي", omr(s.totalSummer)] : null,
    ],
    "تفصيل المنافع"
  );
  if (s.raisedToMin) html += note(`الفرق أقل من الحد الأدنى (${num(s.min, 0)})، والمادة 45 تشترط ألا تقل المنفعة بعد ثبوت الاستحقاق عنه، فرفعناه إليه.`, "info");
  if (!s.eligible) html += note("دخل الأسرة المحتسب يساوي القيمة المستهدفة أو يزيد عليها، فلا تستحق دعم الدخل. وتبقى منفعة الطفولة 10 ريالات لكل طفل.", "warn");
  if (s.students && s.studentRate === S.child.student) html += note("منفعة الطفولة 20 ريالاً لطلاب المدارس من أسر دعم الدخل من فبراير 2026 خلال العام الدراسي، بلا طلب. ولم يُعلن هل تعود إلى 10 في الإجازة الصيفية، فعرضنا الحالتين.", "info");
  html += note("لا تُحتسب منفعتا الطفولة والإعاقة، ولا منفعة كبار السن لفرد واحد في أسرة من شخصين فأكثر. وقد يحتسب الصندوق دخلاً مكافئاً لبعض النساء القادرات على العمل، ويطبق موانع الأصول والعمالة المنزلية. الحساب تقديري حتى يبتّ الصندوق في طلبك.", "info");
  return html;
});
