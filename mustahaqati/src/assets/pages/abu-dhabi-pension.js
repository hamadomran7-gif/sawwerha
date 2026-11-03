import { abuDhabiPension, rules } from "../calc.js";
import { bind, money, num, table, big, note, arDate, yearsAr, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";
const pc = (x) => `${num(x * 100, 2)}%`;
const yr = (x) => {
  const y = Math.floor(x + 1e-9);
  const mo = Math.floor((x - y) * 12 + 1e-6);
  return mo ? `${yearsAr(y)} و${monthsAr(mo)}` : yearsAr(y);
};
const TRACK = (e) =>
  ({
    age60: "بلوغ 60 مع 15 سنة اشتراك على الأقل",
    early: "25 سنة اشتراك مع بلوغ 55 (بلا خصم)",
    mother: `شروط الأم: ${num(e.needYears, 1)} سنة اشتراك مع سن ${num(e.needAge, 0)}`,
    acquired: "حق مكتسب: استوفيت شرطاً من القانون السابق قبل 1 ديسمبر 2023",
    route25: `25 سنة خدمة مع الحد الأدنى للسن (${num(e.needAge, 1)})`,
    route60: `بلوغ 60 مع ${num(e.needYears, 1)} سنة خدمة`,
    routeWomen: `المرأة: سن ${num(e.needAge, 1)} مع ${num(e.needYears, 1)} سنة خدمة`,
    routeMotherAge: `الأم: سن ${num(e.needAge, 1)} مع ${num(e.needYears, 1)} سنة خدمة`,
    routeMotherService: `الأم: ${num(e.needYears, 1)} سنة خدمة بأي سن`,
  })[e.track];

bind(form, result, (v) => {
  form.querySelectorAll("[data-female]").forEach((el) => (el.hidden = v.gender !== "f"));
  if (!v.birth || !v.exit || v.years === null || !v.avgSalary) return null;
  const A = rules.ae.abuDhabiPension;
  const r = abuDhabiPension({ category: v.category, gender: v.gender, children: v.gender === "f" ? v.children || 0 : 0, birth: v.birth, exit: v.exit, years: v.years, months: v.months || 0, avgSalary: v.avgSalary });
  if (!r) return null;
  const C = v.category === "new" ? A.new : A.existing;
  let html;
  if (r.eligible) {
    html = big("معاشك التقاعدي الشهري", money(r.pension, cur), `${pc(r.pension / r.S)} من متوسط راتبك · ${TRACK(r.need)}`);
    const credited = r.credited > r.years;
    html += table(
      [
        ["عمرك عند ترك العمل", yr(r.age)],
        ["مدة الاشتراك", `${yr(r.years)}${credited ? ` (يُحسب المعاش على ${num(r.credited, 0)} سنة)` : ""}`],
        ["مسار الاستحقاق", TRACK(r.need)],
        r.counted < r.years ? ["السنوات المحسوبة للنسبة", `25 + ${num(r.counted - 25, 2)} بعد التعديل`] : null,
        [`النسبة: 3.2% × ${num(Math.min(Math.max(r.counted, r.credited), 25), 2)}${r.counted > 25 ? ` + 2% × ${num(Math.min(r.counted, 35) - 25, 2)}` : ""}`, pc(r.pct)],
        ["متوسط الراتب المعتمد", `${money(r.S, cur)}${r.capped ? " (السقف)" : ""}`],
        ["المعاش المحسوب", money(r.gross, cur)],
        r.minApplied ? ["رُفع إلى الحد الأدنى", money(A.minPension, cur)] : null,
        ["المعاش الشهري", money(r.pension, cur), { strong: true }],
        r.excess ? [`مبلغ مقطوع: 3 رواتب عن كل سنة بعد 35`, money(r.excess, cur)] : null,
        r.preExcess ? [`منفعة السنوات الزائدة على 25 قبل ديسمبر 2023 (تقديرية)`, money(r.preExcess, cur)] : null,
      ],
      "طريقة الحساب"
    );
    if (v.category !== "new" && r.track !== "acquired") html += note("شروط المشترك الحالي ترتفع نصف سنة كل 1 ديسمبر، فإن تركت العمل بعد ذلك التاريخ فأعد الحساب بالتاريخ الجديد.", "info");
    if (r.preExcess) html += note(`خدمتك تجاوزت 25 سنة قبل 1 ديسمبر 2023 بنحو ${num(r.yearsAtCut - 25, 2)} سنة: لا تُحسب لها نسبة، وتُصرف عنها منفعة مستقلة بالأحكام السابقة عند انتهاء الخدمة. قدّرناها بـ3 رواتب عن كل سنة على متوسطك الحالي، والصندوق يحسبها على راتبك في تاريخ التعديل.`, "warn");
  } else {
    html = big("لا يُستحق معاش عند هذا التاريخ", r.gratuity ? money(r.gratuity, cur) : "—", r.gratuity ? "مكافأة نهاية الخدمة (المادة 45)" : "أقل من سنة اشتراك");
    html += table(
      [
        ["عمرك عند ترك العمل", yr(r.age)],
        ["مدة الاشتراك", yr(r.years)],
        r.gratuity ? ["المكافأة: 1.5 / 2 / 3 رواتب عن كل سنة", money(r.gratuity, cur), { strong: true }] : null,
        r.next ? ["تستحق المعاش إن واصلت العمل حتى", arDate(r.next.date), { strong: true }] : null,
        r.next ? ["المسار عندها", TRACK(r.next.need)] : null,
      ],
      "وضعك"
    );
    html += note("يجوز شراء المدة أو السن الناقصة بشروط وتكلفة يحددها الصندوق (26% من الراتب عن كل شهر يُشترى في حالات)، أو تأجيل صرف المكافأة لضم المدة لاحقاً.", "info");
  }
  html += table(
    [
      [`حصتك (${pc(C.employee)})`, money(r.employee, cur)],
      [`حصة صاحب العمل (${pc(C.employer)})`, money(r.employer, cur)],
      C.government ? [`مساهمة حكومة أبوظبي (${pc(C.government)})`, money(r.government, cur)] : null,
    ],
    "الاشتراك الشهري على هذا المتوسط"
  );
  if (v.sector === "gov" && v.category !== "new") html += note("في القطاع الحكومي تُقيَّم أشهر ما قبل ديسمبر 2023 داخل نافذة السنوات الست بالراتب السابق للتعديل (متوسط الأساسي لثلاث سنوات مع آخر العلاوات)، فقد يختلف المتوسط الرسمي قليلاً.", "info");
  if (v.sector === "private" && Number(v.avgSalary) < A.privateFloor) html += note(`الحد الأدنى لراتب الاشتراك في القطاع الخاص ${num(A.privateFloor, 0)} درهم.`, "warn");
  html += note("الحاسبة تقديرية، والمعاش الرسمي يحدده صندوق أبوظبي للمعاشات.", "info");
  return html;
});
