import { ksaLumpSum } from "../calc.js";
import { bind, money, num, table, big, note, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";

bind(form, result, (v) => {
  const isNew = v.system === "new";
  form.querySelectorAll("[data-legacy]").forEach((el) => (el.hidden = isNew));
  form.querySelectorAll("[data-new]").forEach((el) => (el.hidden = !isNew));
  if (isNew) {
    const r = ksaLumpSum({ system: "new", monthlyWage: v.monthlyWage, start: v.start, end: v.end });
    if (!r || !v.monthlyWage) return null;
    let html = big("التعويض بحده الأدنى", money(r.nominal, cur), `${monthsAr(r.months)} اشتراك · يُقيَّم بمؤشر أسعار المستهلك`);
    html += table(
      [
        ...r.rows.map((x) => [`${monthsAr(x.months)} × ${num(x.rate * 100, 0)}% من الأجر`, money(x.months * x.rate * Math.min(v.monthlyWage, 45000), cur)]),
        ["مجموع اشتراكات المعاشات (الطرفان)", money(r.nominal, cur), { strong: true }],
        ["طريقة الصرف", r.lumpOnly ? "دفعة واحدة (أقل من 60 شهراً)" : "دفعة واحدة أو أقساط شهرية"],
      ],
      "طريقة الحساب"
    );
    html += note("في النظام الجديد يُصرف التعويض عند بلوغ 65 دون 180 شهراً، أو العجز غير المهني أو الوفاة دون شروط المعاش، أو فقد الجنسية، ولا يُصرف بمجرد ترك العمل.", "info");
    if (r.months >= 180) html += note("مدتك 180 شهراً فأكثر، فتستحق معاشاً عند 65 لا تعويضاً.", "warn");
    return html;
  }
  if (v.months === null || !v.avgWage) return null;
  const r = ksaLumpSum({ months: v.months, pre1422Months: v.pre1422Months || 0, avgWage: Math.min(v.avgWage, 45000) });
  let html = big("تعويض الدفعة الواحدة", money(r.lump, cur), `${monthsAr(r.months)} × متوسط ${money(Math.min(v.avgWage, 45000), cur)} · المعامل ${num(r.factor, 2)} شهر`);
  html += table(
    [
      ["الأشهر حتى 60", `${monthsAr(Math.min(r.months, 60))} × 10%${v.pre1422Months ? " (وما قبل 1422 × 6%)" : ""}`],
      r.months > 60 ? ["ما زاد على 60 شهراً", `${monthsAr(r.months - 60)} × 12%${v.pre1422Months > 60 ? " (وما قبل 1422 × 7%)" : ""}`] : null,
      ["التعويض", money(r.lump, cur), { strong: true }],
    ],
    "طريقة الحساب"
  );
  if (r.pensionEligible) html += note(`مدتك ${monthsAr(r.months)}، فتستحق معاشاً عند السن النظامية (نحو ${money(r.pensionNow, cur)} شهرياً بالمعادلة) لا تعويضاً، ما لم تكن من حالات الصرف المبكر.`, "warn");
  else if (r.buyMonths) html += table(
    [
      [`شراء ${monthsAr(r.buyMonths)} عند الستين (18% لكل شهر)`, money(r.buyCost, cur)],
      ["المعاش الشهري بعد الشراء", money(r.pensionAfterBuy, cur), { strong: true }],
      ["يعوّض المعاشُ التعويضَ وكلفة الشراء معاً خلال نحو", monthsAr(Math.round((r.lump + r.buyCost) / r.pensionAfterBuy))],
    ],
    "البديل: شراء المدة للحصول على معاش"
  );
  html += note("يُصرف عند بلوغ 60 سنة هجرية بعد ترك العمل، أو قبلها للمرأة التي تترك العمل دون استحقاق معاش، وعند الوفاة (لعائلته بالتساوي) والعجز غير المهني وفقد الجنسية والسجن 5 سنوات فأكثر والانتقال إلى التقاعد المدني بأقل من سنة. ومن عاد للعمل يستعيد المدة إن ردّ المبلغ كاملاً خلال سنة.", "info");
  return html;
});
