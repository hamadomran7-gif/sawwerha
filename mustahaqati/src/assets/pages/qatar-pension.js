import { qatarPension, rules } from "../calc.js";
import { bind, money, num, table, big, note, yearsAr, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const pc = (x, d = 1) => `${num(x * 100, d)}%`;
const REASON = { age: "بلوغ سن التقاعد", resign: "الاستقالة", other: "انتهاء الخدمة لأسباب أخرى", disciplinary: "الفصل التأديبي أو بحكم" };

bind(form, result, (v) => {
  const priv = v.sector === "private";
  form.querySelectorAll("[data-private]").forEach((el) => (el.hidden = !priv));
  form.querySelectorAll("[data-early]").forEach((el) => (el.hidden = v.reason === "age" || v.legacy === "no"));
  form.querySelector("[data-salary]").textContent = priv ? "متوسط راتب حساب الاشتراك في آخر 3 سنوات (ريال)" : "آخر راتب حساب اشتراك (ريال)";
  if (v.ageYears === null || v.years === null || !v.salary) return null;
  const Q = rules.qa.pension;
  const r = qatarPension({
    sector: v.sector, gender: v.gender, reason: v.reason, ageYears: v.ageYears, ageMonths: v.ageMonths || 0, years: v.years, months: v.months || 0,
    actualYears: v.actualYears, salary: v.salary, firstYearSalary: v.firstYearSalary, legacy: v.legacy !== "no", birthYear: v.birthYear,
  });
  const ref = v.gender === "f" ? Q.refAgeFemale : Q.refAgeMale;
  let html;
  if (r.eligible) {
    html = big(r.payAge ? `معاشك الشهري (يُصرف عند بلوغ ${r.payAge})` : "معاشك التقاعدي الشهري", money(r.pension, cur), `${pc(r.pension / r.S)} من راتب حساب المعاش · ${REASON[v.reason]}`);
    html += table(
      [
        [priv ? "راتب حساب المعاش (متوسط 3 سنوات)" : "راتب حساب المعاش (آخر راتب اشتراك)", `${money(r.S, cur)}${r.avgCapped ? " (حد 130%)" : ""}`],
        ["مدة الاشتراك المعتمدة", `${yearsAr(r.Y)}${r.legacyApplied ? ` ← تُسوى على ${yearsAr(r.settleYears)} (المادة 82)` : ""}`],
        [`النسبة: ${num(r.settleYears, 0)} ÷ ${Q.divisor}`, `${pc(r.pctRaw)}${r.pctRaw > 1 ? " ← 100% (الحد)" : ""}`],
        ["المعاش قبل التخفيض", money(r.gross, cur)],
        r.reduction ? [`التخفيض: ${yearsAr(ref - r.age)} دون ${ref} × ${pc(v.reason === "disciplinary" ? Q.reductionDisciplinary : Q.reductionResign)}`, `${pc(r.reduction)} (−${money(r.gross * r.reduction, cur)})`] : null,
        r.minApplied ? ["رُفع إلى الحد الأدنى للحكومي", money(Q.minPensionGov, cur)] : null,
        ["المعاش الشهري", money(r.pension, cur), { strong: true }],
      ],
      "طريقة الحساب"
    );
    if (r.transitional) html += note(`طُبق جدول القرار 11/2024 لمواليد ${Math.floor(v.birthYear)}: سن ${r.th.age} وخدمة فعلية ${r.th.actual} سنة واشتراك ${r.th.contrib} سنة على الأقل.`, "info");
    if (r.payAge) html += note(`عمرك عند انتهاء الخدمة أقل من ${r.payAge}، فلا يُصرف المعاش إلا بعد بلوغها وتقديم الطلب للهيئة (المادة 24). والتخفيض يُحسب على عمرك عند انتهاء الخدمة.`, "warn");
    if (v.reason !== "age" && v.sector === "gov") html += note(`الحد الأدنى ${num(Q.minPensionGov, 0)} ريال لا يسري على الاستقالة والفصل وانتهاء الخدمة لأسباب أخرى (المادة 30).`, "info");
    if (priv && v.reason === "age" && r.pension < Q.minPensionGov) html += note(`الحد الأدنى ${num(Q.minPensionGov, 0)} ريال مقرر للحكومي، ويجوز مده إلى الخاص بقرار من مجلس الوزراء (المادة 30).`, "info");
  } else {
    const need = v.reason === "age" ? `${Q.minYears} سنة اشتراك منها ${Q.minActualYears} فعلية` : `${r.th.contrib} سنة اشتراك منها ${r.th.actual} فعلية`;
    html = big(r.refundOnly ? "رد اشتراكاتك" : "تعويض الدفعة الواحدة (لا معاش)", r.refundOnly ? money(r.refund, cur) : money(r.lump, cur), `لا تتوافر شروط المعاش: يلزم ${need}`);
    html += table(
      r.refundOnly
        ? [["مدة الاشتراك", monthsAr(r.totalMonths)], ["المستحق", "اشتراكاتك المسددة (7%) فقط، لأن المدة لا تتجاوز سنة"], ["تقديرها", money(r.refund, cur), { strong: true }]]
        : [
            ["راتب حساب المعاش", money(r.S, cur)],
            ["مدة الاشتراك المعتمدة", yearsAr(r.Y)],
            [`${num(r.S, 0)} × ${num(r.Y, 0)}`, money(r.lump, cur), { strong: true }],
          ],
      "المادة 42 واللائحة التنفيذية"
    );
    if (!r.refundOnly) html += note(`يُصرف التعويض في حالات منها بلوغ 50 سنة أو العجز، بحد 150% من حصتك المسددة (نحو ${money(Q.lumpCapOfEmployeeShare * r.refund, cur)} بافتراض ثبات الراتب). وتؤول اشتراكات جهة العمل إلى الصندوق.`, "info");
  }
  if (r.salaryCapped) html += note(`راتب حساب الاشتراك بحد ${num(Q.salaryCap, 0)} ريال (المادة 11).`, "info");
  html += table(
    [
      [`حصتك ${pc(Q.employeeRate, 0)}`, money(r.employee, cur)],
      [`حصة جهة العمل ${pc(Q.employerRate, 0)}`, money(r.employer, cur)],
    ],
    "الاشتراك الشهري على هذا الراتب"
  );
  html += note("بدل السكن يدخل في المعاش بعد 15 سنة اشتراك عنه، ومكافأة المدة الزائدة على 30 سنة تحددها اللائحة. والمعاش الرسمي تحدده الهيئة العامة للتقاعد والتأمينات الاجتماعية.", "info");
  return html;
});
