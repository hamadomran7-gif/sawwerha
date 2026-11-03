import { bahrainPension, rules } from "../calc.js";
import { bind, money, num, table, big, note, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "دينار";
const pc = (x) => `${num(x * 100, 1)}%`;

bind(form, result, (v) => {
  if (v.age === null || v.years === null || !v.avgWage) return null;
  const P = rules.bh.pension;
  const months = Math.floor(v.years || 0) * 12 + Math.floor(v.extraMonths || 0);
  const r = bahrainPension({ age: v.age, months, avgWage: v.avgWage });
  const dur = monthsAr(r.months);
  const basis = [
    ["متوسط الأجر المعتمد", money(r.wage, cur)],
    ["مدة الاشتراك", `${dur} (${num(r.years, 2)} سنة)`],
    [`النسبة: ${num(r.years, 2)} ÷ ${P.divisor}`, `${pc(r.pctRaw)}${r.capped ? ` ← ${pc(r.pct)} (السقف)` : ""}`],
  ];
  let html;

  if (r.status === "oldAge" || r.status === "early") {
    html = big(r.status === "early" ? "معاشك المبكر الشهري (تقديري)" : "معاشك التقاعدي الشهري", money(r.pension, cur), `${pc(r.pension / r.wage)} من متوسط أجرك · ${dur}`);
    html += table(
      [
        ...basis,
        ["المعاش قبل التخفيض", money(r.gross, cur)],
        r.status === "early" ? [`تخفيض التقاعد المبكر بعمر ${num(v.age, 0)}`, `${pc(r.reduction)} (−${money(r.gross - r.pension, cur)})`] : null,
        ["المعاش الشهري", money(r.pension, cur), { strong: true }],
      ],
      "طريقة الحساب"
    );
    if (r.status === "early") html += note("نسب تخفيض المبكر (20% دون 45، و15% من 45 إلى 49، و10% من 50 إلى ما دون 60) كما نشرتها مكاتب المحاماة عن الجدول رقم 1 المرافق للقانون، والجدول الرسمي غير منشور على الإنترنت. فالنتيجة تقديرية.", "warn");
    if (r.capped) html += note(`المعاش مقيد بسقف ${pc(P.maxPct)} من متوسط الأجر بحسب المصادر المتخصصة. ويجوز أن يصل المعاش مع المعاش الإضافي إلى 90%.`, "info");
    if (r.belowMin) html += note(`المعاش أقل من ${num(P.minPension, 0)} دينار. وبحسب القواعد المنشورة قبل تعديلات 2022 يُرفع إلى ${num(P.minPension, 0)} دينار أو متوسط أجرك إن كان أقل؛ تحقق من الهيئة.`, "info");
  } else if (r.status === "lump") {
    html = big(r.refundOnly ? "رد اشتراكاتك" : "الدفعة الواحدة (لا معاش)", r.refundOnly ? "اشتراكاتك فقط" : money(r.lump, cur), `مدة اشتراكك ${dur}، وأقل من ${monthsAr(P.minMonths)} اللازمة للمعاش`);
    html += table(
      r.refundOnly
        ? [["مدة الاشتراك", dur], ["المستحق", "اشتراكاتك المسددة فقط، لأن المدة أقل من سنة"]]
        : [
            ["متوسط الأجر المعتمد", money(r.wage, cur)],
            ["عدد أشهر الاشتراك", num(r.months, 0)],
            [`${num(P.lumpPct * 100, 0)}% × ${num(r.wage, 0)} × ${num(r.months, 0)}`, money(r.lump, cur), { strong: true }],
            ["كان يلزمك للمعاش", `${monthsAr(r.monthsToMin)} إضافية`],
          ],
      "الدفعة الواحدة (المادة 43)"
    );
  } else {
    html = big("لا يُستحق معاش الآن", r.atSixty ? money(r.atSixty, cur) : money(r.lumpAtSixty, cur), r.atSixty ? "المعاش المتوقع عند 60 بالمدة والأجر الحاليين" : "الدفعة الواحدة المتوقعة عند 60 بالمدة والأجر الحاليين");
    html += table(
      [
        ...basis,
        ["للتقاعد المبكر قبل 60 يلزمك", r.monthsToEarly ? `${monthsAr(r.monthsToEarly)} إضافية (240 شهراً)` : "مستوفى"],
        ["لمعاش الشيخوخة عند 60 يلزمك", r.monthsToMin ? `${monthsAr(r.monthsToMin)} إضافية (180 شهراً)` : "مستوفى"],
        r.atSixty ? ["المعاش المتوقع عند 60", money(r.atSixty, cur), { strong: true }] : ["الدفعة الواحدة المتوقعة عند 60", money(r.lumpAtSixty, cur), { strong: true }],
      ],
      "وضعك الحالي"
    );
    html += note("انتهاء الخدمة قبل 60 دون 240 شهر اشتراك لا يمنح معاشاً مبكراً، وتبقى مدة اشتراكك محسوبة لك إن عدت إلى عمل مشمول بالتأمين.", "info");
  }

  html += table(
    [
      [`حصتك (${pc(P.employeeRate)})`, money(r.employee, cur)],
      [`حصة صاحب العمل (${pc(r.employerRate)})`, money(r.employer, cur)],
    ],
    "اشتراك فرع المعاشات الشهري على هذا الأجر"
  );
  if (r.wageCapped) html += note(`الأجر الخاضع للاشتراك بحد ${num(P.wageCap, 0)} دينار شهرياً بحسب المصادر المتخصصة، فاعتمدناه بدلاً مما أدخلت.`, "info");
  html += note("الزيادة السنوية التلقائية متوقفة منذ تعديلات 2022، وأي زيادة بقرار من الوزير. والمعاش الرسمي تحدده الهيئة العامة للتأمين الاجتماعي.", "info");
  return html;
});
