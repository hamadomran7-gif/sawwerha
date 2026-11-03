import { omanPension, omanOldAge, ageCalc, rules } from "../calc.js";
import { bind, money, num, table, big, note, arDate, yearsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const pc = (x, d = 1) => `${num(x * 100, d)}%`;
const yrs = (x) => yearsAr(Math.round(x * 100) / 100);
const addYears = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + n);
  return d.toISOString().slice(0, 10);
};
/** أول عمر يبلغ فيه سن عدم الخصم مع احتساب رفع سن كبار السن في تاريخه. */
const fullAgeDate = (birth, gender) => {
  const gap = gender === "f" ? rules.om.pension.womanGap : 0;
  for (let a = 45; a <= 70; a++) {
    const d = addYears(birth, a);
    if (a >= omanOldAge(d) - gap) return { a, d };
  }
  return null;
};

bind(form, result, (v) => {
  if (!v.birth || !v.retire || v.avgWage === null) return null;
  if (!ageCalc({ birth: v.birth, asOf: v.retire })) return null;
  const O = rules.om.pension;
  const args = {
    gender: v.gender, birth: v.birth, retire: v.retire, priorYears: v.priorYears || 0, finalSalary: v.finalSalary || 0,
    postYears: v.postYears, avgWage: v.avgWage, growth: v.growth === null ? null : v.growth / 100, guarantee: v.guarantee || 0,
  };
  const r = omanPension(args);
  if (!r) return null;
  let html;
  const parts = [
    r.post ? [`عن الخدمة منذ 2024: 2% × ${num(r.avgFV, 2)} × ${num(r.post, 2)}`, money(r.partA, cur)] : null,
    r.post ? ["متوسط القيمة المستقبلية لأجرك", `${money(r.avgFV, cur)} (معامل ${num(r.avgFactor, 4)})`, { muted: true }] : null,
    r.prior ? [`عن الخدمة السابقة: 2% × ${num(r.revalued, 2)} × ${num(r.prior, 2)}`, money(r.partB, cur)] : null,
    r.prior ? ["الراتب الأخير المعاد تقييمه", `${money(r.revalued, cur)} (معامل ${num(r.priorFactor, 4)})`, { muted: true }] : null,
    ["المعاش قبل الخصم", money(r.gross, cur)],
  ];

  if (r.status === "deferred") {
    const f = fullAgeDate(v.birth, v.gender);
    const later = f ? omanPension({ ...args, retire: f.d, postYears: r.post }) : null;
    html = big("لا يُستحق معاش عند هذا التاريخ", later ? money(later.pension, cur) : "—", f ? `معاشك التقديري عند بلوغ ${num(f.a, 0)} (${arDate(f.d)}) دون عمل إضافي` : "");
    html += table(
      [
        ["عمرك عند انتهاء الخدمة", yrs(r.ageExact)],
        ["سن التقاعد بلا خصم", `${num(r.noReductionAge, 0)} عاماً`],
        ["خدمتك الفعلية", yrs(r.service)],
        ["للتقاعد المبكر يلزمك", `${yrs(O.earlyMinServiceYears)} خدمة مع بلوغ ${num(r.noReductionAge - O.earlyMaxYears, 0)}، أو ${yrs(r.anyAgeYears)} في أي سن`],
      ],
      "وضعك عند تاريخ التقاعد"
    );
    html += note("لا دفعة واحدة ولا رد للاشتراكات لمن لا يتقاضى معاشاً (المادة 84)، لكن حقوقك لا تسقط بانقطاع الخدمة، ويُصرف المعاش عند بلوغ السن.", "info");
  } else {
    const title = r.status === "early" ? "معاشك المبكر التقديري الشهري" : "معاشك التقاعدي التقديري الشهري";
    html = big(title, money(r.pension, cur), `عمرك ${yrs(r.ageExact)} · خدمتك ${yrs(r.service)}${r.wage ? ` · ${pc(r.pension / r.wage)} من أجرك` : ""}`);
    html += table(
      [
        ...parts,
        r.status === "early" ? [`خصم التبكير: ${yrs(r.yearsEarly)} قبل ${num(r.noReductionAge, 0)}`, `${pc(r.reduction, 2)} (−${money(r.gross * r.reduction, cur)})`] : null,
        r.guaranteeApplied ? ["الضمان النقدي (أعلى من المحسوب)", money(r.pension, cur)] : null,
        ["المعاش الشهري", money(r.pension, cur), { strong: true }],
      ],
      "طريقة الحساب (المادة 73)"
    );
    if (r.status === "early") html += note("نسب الخصم (5% لكل سنة من الخمس الأولى ثم 1%) من نص المادة 78 كما في الترجمة المنشورة، والحاسبة توزعها بالتناسب الشهري لكسر السنة تقديراً.", "info");
  }
  if (r.transitional) html += note(`لك ${num(r.prior, 1)} سنة خدمة سابقة؛ من له 20 سنة خدمة فعلية قبل صدور القانون يجوز له التقاعد المبكر بشروط نظامه السابق (المادة 77)، وقد يكون له ضمان نقدي أعلى من المحسوب (المادة 74). راجع كشفك في الصندوق.`, "warn");
  if (r.oldAge > O.oldAge) html += note(`سن كبار السن عند تاريخ تقاعدك ${num(r.oldAge, 0)} عاماً بافتراض رفعه سنة كل 7 سنوات من 2024 (المادة 6)، وأول رفع في 2031 استنتاجاً.`, "warn");
  if (r.wageCapped) html += note(`الأجر يُحسب بحد ${num(O.wageCap, 0)} ريال شهرياً (المادة 52).`, "info");
  html += table(
    [
      [`حصتك ${pc(O.employeeRate)}`, money(r.employee, cur)],
      [`حصة جهة العمل ${pc(O.employerRate, 0)}`, money(r.employer, cur)],
    ],
    "اشتراك فرع كبار السن الشهري على متوسط أجرك"
  );
  html += note("المعاش يُستحق مع انتهاء الخدمة (القرار ر/12/2026). والنتيجة تقديرية لأن طريقة إعادة التقييم التفصيلية ونمو الأجور بعد 2025 غير منشورين.", "info");
  return html;
});
