import { ksaExpatFees, rules } from "../calc.js";
import { bind, money, num, table, big, note, monthsAr, countAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const personsAr = (n) => countAr(n, "فرد واحد", "فردان", "أفراد", "فرداً", "فرد");

const workerFields = form.querySelectorAll("[data-worker]");
const toggleWorker = () => workerFields.forEach((el) => (el.hidden = !form.includeWorker.checked));
form.includeWorker.addEventListener("change", toggleWorker);

bind(form, result, (v) => {
  toggleWorker();
  const F = rules.sa.expatFees;
  const deps = Math.max(0, Math.floor(v.dependents || 0));
  const own = Math.min(deps, Math.max(0, Math.floor(v.adultIqamas || 0)));
  const months = Number(v.months) || 12;
  const late = Number(v.late) || 0;
  const r = ksaExpatFees({
    dependents: deps,
    months,
    adultIqamas: own,
    includeWorker: v.includeWorker,
    expatsExceed: v.ratio !== "low",
    iqamaFee: v.iqamaFee,
  });
  if (!deps && !v.includeWorker) return null;

  const fine = late === 1 ? F.lateFines[0] : late === 2 ? F.lateFines[1] : 0;
  const familyFine = fine * own;
  const family = r.family + familyFine;

  let worker = null;
  if (r.worker) {
    const levy = v.ratio === "exempt" ? 0 : r.worker.levy;
    worker = { levy, permit: r.worker.permit, iqama: r.worker.iqama, fine, total: levy + r.worker.permit + r.worker.iqama + fine };
  }
  const grand = family + (worker ? worker.total : 0);

  let html = deps
    ? big(`رسوم المرافقين لـ${monthsAr(months)}`, money(r.dependentsFee, cur), `${personsAr(deps)} × ${F.dependentMonthly} ريال × ${monthsAr(months)}`)
    : big(`رسوم إقامة العامل لـ${monthsAr(months)}`, money(worker.total, cur), "على صاحب العمل");

  if (deps) {
    html += table(
      [
        [`المقابل المالي: ${personsAr(deps)} × ${num(F.dependentMonthly * months)}`, money(r.dependentsFee, cur)],
        own ? [`رسم الإقامة المستقلة: ${personsAr(own)} × ${num((F.iqamaAnnualBase * months) / 12)}`, money(r.adultIqama, cur)] : null,
        familyFine ? [`غرامة التأخير: ${personsAr(own)} × ${num(fine)}`, money(familyFine, cur)] : null,
        ["المجموع على رب الأسرة", money(family, cur), { strong: true }],
      ],
      "على رب الأسرة"
    );
  }
  if (worker) {
    html += table(
      [
        [v.ratio === "exempt" ? "المقابل المالي (معفى)" : `المقابل المالي: ${num(v.ratio === "low" ? F.levyLow : F.levyHigh)} ريال × ${monthsAr(months)}`, money(worker.levy, cur)],
        ["رسم رخصة العمل", money(worker.permit, cur)],
        [`رسم الإقامة${v.iqamaFee === "reported" ? " (المتداول)" : ""}`, money(worker.iqama, cur)],
        fine ? ["غرامة التأخير", money(fine, cur)] : null,
        ["المجموع على صاحب العمل", money(worker.total, cur), { strong: true }],
      ],
      "على صاحب العمل (المادة 40)"
    );
  }
  if (deps && worker) html += table([["إجمالي تجديد الأسرة والعامل", money(grand, cur), { strong: true }]]);

  if (late === 3) html += note("المخالفة الثالثة للتأخر في تجديد الإقامة عقوبتها الإبعاد، لا غرامة مالية.", "warn");
  if (deps && months < 12) html += note(`للمقارنة: رسوم المرافقين لسنة كاملة ${money(r.annualDependents, cur)}.`, "info");
  html += note("الرسوم تُدفع مقدماً ولا تُسترد. رسوم المرافقين على رب الأسرة، ورسوم إقامة العامل ورخصة عمله والمقابل المالي وغرامات تأخيرها على صاحب العمل ولا يجوز تحميلها للعامل.", "info");
  if (worker && v.iqamaFee === "reported") html += note("650 ريالاً للسنة هو المبلغ المتداول عند السداد (500 رسم الإقامة و150 رسوماً أخرى)، والرسم المنشور رسمياً 500. تحقق من المبلغ في أبشر أو مقيم.", "info");
  return html;
});
