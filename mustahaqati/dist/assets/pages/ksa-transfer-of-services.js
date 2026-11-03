import { ksaTransferCost, ksaTransferConsent, rules } from "../calc.js";
import { bind, money, num, table, big, note, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const ORD = ["", "الأول", "الثاني", "الثالث", "الرابع", "الخامس"];
const NAT = { PH: "الفلبين", ID: "إندونيسيا", LK: "سريلانكا", BD: "بنغلاديش", KE: "كينيا", UG: "أوغندا", SL: "سيراليون", BI: "بوروندي", ET: "إثيوبيا" };

const show = () => {
  const dom = form.sector.value === "domestic";
  const valid = form.permit.value === "valid";
  const arrears = form.status.value !== "onjob";
  const musaned = form.route.value === "musaned";
  form.querySelectorAll("[data-est]").forEach((el) => (el.hidden = dom));
  form.querySelectorAll("[data-dom]").forEach((el) => (el.hidden = !dom));
  if (!dom) {
    form.querySelectorAll("[data-valid]").forEach((el) => (el.hidden = !valid));
    form.querySelectorAll("[data-expired]").forEach((el) => (el.hidden = valid));
    form.querySelectorAll("[data-arrears]").forEach((el) => (el.hidden = valid || !arrears));
  } else {
    form.querySelectorAll("[data-musaned]").forEach((el) => (el.hidden = !musaned));
  }
};
["sector", "permit", "status", "route"].forEach((n) => form[n].addEventListener("change", show));

const FEE_NOTE = "رسم النقل من تصريحات الوزارة والجوازات للصحافة (2015 إلى 2024)، وصفحات خدمة الوزارة تكتب «مجانية» للطلب الإلكتروني. لم نجد إعلاناً بإلغاء الرسم، فتحقق من المبلغ الظاهر في أبشر أعمال أو مقيم قبل السداد.";

bind(form, result, (v) => {
  show();
  const nth = Number(v.nth) || 1;
  if (v.sector === "domestic") {
    const r = ksaTransferCost({ sector: "domestic", nth, route: v.route, transferCost: v.transferCost, nationality: v.nationality, employer: v.employer, domesticCount: v.domesticCount });
    if (!r.allowed) {
      return big("النقل غير متاح", `${r.max} نقلات حداً أقصى`, "لا يجوز نقل خدمات العامل المنزلي أكثر من 4 مرات") + note(FEE_NOTE, "info");
    }
    let html = big(`يدفعه صاحب العمل الجديد عند النقل ${ORD[nth]}`, money(r.now, cur), v.route === "musaned" ? "الرسم الحكومي والتكلفة التشغيلية وتكلفة النقل" : "الرسم الحكومي");
    html += table(
      [
        [`رسم نقل الخدمات (النقل ${ORD[nth]})${r.feeAssumed ? " — مفترض" : ""}`, money(r.fee, cur)],
        v.route === "musaned" ? ["التكلفة التشغيلية في مساند", money(r.operating, cur)] : null,
        v.route === "musaned" ? ["تكلفة النقل لصاحب العمل الحالي", money(r.agreed, cur)] : null,
        ["المجموع عند النقل", money(r.now, cur), { strong: true }],
        r.extraLevy ? [`المقابل المالي للعامل الزائد (العامل رقم ${num(r.workersAfter, 0)} والإعفاء حتى ${num(r.free, 0)})`, money(r.extraLevy, cur)] : null,
        r.extraLevy ? ["كلفة السنة الأولى", money(r.firstYear, cur), { strong: true }] : null,
      ],
      "على صاحب العمل الجديد"
    );
    if (r.feeAssumed) html += note("مبلغ النقل الرابع للعامل المنزلي لم يُنشر، والحاسبة تفترض 6,000 مثل الثالث.", "warn");
    if (v.route === "musaned") {
      if (r.cap) {
        html += note(
          r.overCap
            ? `تكلفة النقل أعلى من السقف المعلن عند إطلاق الخدمة لجنسية ${NAT[v.nationality]} (${money(r.cap, cur)} في أغسطس 2023). المنصة لا تقبل ما يتجاوز السقف المعتمد، فتحقق من السقف الحالي في مساند.`
            : `السقف المعلن عند إطلاق الخدمة لجنسية ${NAT[v.nationality]}: ${money(r.cap, cur)} (أغسطس 2023)، وقد يكون عُدّل. تحقق من السقف الظاهر في مساند.`,
          r.overCap ? "warn" : "info"
        );
      } else html += note("لم يُنشر سقف لهذه الجنسية في إعلان 2023، فتحقق من السقف الظاهر في مساند.", "info");
      html += note("في مساند يُخصم 2.4% رسوم دفع إلكتروني من قيمة العقد، ولم يتضح من يتحملها.", "info");
    }
    if (v.route === "noconsent") html += note("في النقل دون موافقة لا تكلفة نقل لصاحب العمل الحالي، ويتحمل الجديد الرسم وتكاليف إيواء العاملة إن وُجدت.", "info");
    if (v.route === "abshir") html += note("التنازل عبر أبشر يشترط بقاء 15 يوماً أو أكثر في الإقامة، وموافقة العامل والجديد خلال 7 أيام، وألا يكون العامل متغيباً، ولا مخالفات مرورية عليه ولا على الجديد.", "info");
    html += note(FEE_NOTE, "info");
    return html;
  }

  const permitValid = v.permit === "valid";
  const r = ksaTransferCost({ nth, permitValid, monthsLeft: v.monthsLeft, renewMonths: v.renewMonths, expatsExceed: v.ratio !== "low", iqamaFee: v.iqamaFee, status: v.status, arrearsMonths: v.arrearsMonths });
  const c = ksaTransferConsent({ monthsInKsa: v.monthsInKsa, contract: v.contract, iqamaExpired: !permitValid });
  let html = big(`يدفعه صاحب العمل الجديد عند النقل ${ORD[Math.min(nth, 5)]}`, money(r.now, cur), permitValid ? "رسم النقل وحده، والرخصة والإقامة ساريتان" : "رسم النقل وتجديد الرخصة والإقامة من تاريخ النقل");
  const rows = [[`رسم نقل الخدمات (النقل ${ORD[Math.min(nth, 5)]})${nth > 3 ? " — الحد الأعلى" : ""}`, money(r.fee, cur)]];
  if (r.renewalNow) {
    const R = r.renewalNow;
    rows.push([`المقابل المالي: ${num(r.levyMonth, 0)} × ${monthsAr(R.months)}`, money(R.levy, cur)]);
    rows.push([`رخصة العمل لـ${monthsAr(R.months)}`, money(R.permit, cur)]);
    rows.push([`الإقامة لـ${monthsAr(R.months)}${v.iqamaFee === "reported" ? " (المتداول)" : ""}`, money(R.iqama, cur)]);
  }
  if (r.arrears) {
    rows.push([`متأخرات المقابل: ${num(r.levyMonth, 0)} × ${monthsAr(r.arrears.months)}`, money(r.arrears.levy, cur)]);
    rows.push(["متأخرات رخصة العمل (تقريبي)", money(r.arrears.permit, cur)]);
  }
  rows.push(["المجموع عند النقل", money(r.now, cur), { strong: true }]);
  html += table(rows, "على صاحب العمل الجديد (المادة 40)");

  if (permitValid && r.coverRenewal) {
    const R = r.coverRenewal;
    html += table(
      [
        ["رسم النقل الآن", money(r.fee, cur)],
        [`تجديد ${monthsAr(R.months)} بعد ${monthsAr(r.monthsLeft)}: ${num(R.levy, 0)} + ${num(R.permit)} + ${num(R.iqama)}`, money(R.total, cur)],
        ["كلفة السنة الأولى من النقل", money(r.firstYear, cur), { strong: true }],
      ],
      "خلال 12 شهراً من النقل"
    );
  }

  if (permitValid && r.monthsLeft >= 12) html += note("الرخصة والإقامة تغطيان السنة الأولى كلها، فلا تجديد فيها.", "info");
  if (!permitValid && v.status === "onjob") html += note("العامل على رأس العمل: متأخرات المقابل المالي ورخصة العمل وغرامة تأخر الإقامة قبل النقل تبقى على صاحب العمل السابق (منذ 9 يونيو 2022).", "info");
  if (r.arrears) html += note("العامل متغيب أو المنشأة السابقة غير قائمة أو تحت الإجراء: تنتقل المتأخرات إلى صاحب العمل الجديد. وغرامة تأخر الإقامة في هذه الحالة غير محسومة فلم تُحسب.", "warn");

  const consent =
    c.route === "contract-ended"
      ? "انتهى العقد الموثق: يجوز النقل دون موافقة صاحب العمل الحالي ودون شرط مدة."
      : c.route === "unpaid"
        ? "تأخر الأجر 3 أشهر: يجوز النقل دون موافقة صاحب العمل الحالي، حتى لو كانت رخصة العمل سارية."
        : c.route === "after12"
          ? `أمضى العامل 12 شهراً أو أكثر في المملكة: يجوز النقل دون موافقة، مع فترة إشعار هي مدة الإشعار في العقد أو ${num(c.noticeDays, 0)} يوماً إن لم يحددها. ومن ينهي العقد المحدد المدة يتحمل تعويض المادة 77.`
          : c.route === "expired"
            ? "الإقامة منتهية: في توضيح «قوى» 2026 يسقط شرط 12 شهراً وتبقى فترة الإشعار، بينما جعلها دليل 2023 نقلاً مباشراً. تحقق في «قوى»."
            : `أقل من 12 شهراً في المملكة: تلزم موافقة صاحب العمل الحالي، ويسقط هذا الشرط بعد ${monthsAr(c.monthsToGo)}، أو عند انتهاء العقد الموثق أو تأخر الأجر 3 أشهر.`;
  html += note(consent, c.consent ? "warn" : "info");
  html += note("رسم النقل والمقابل والرخصة والإقامة على صاحب العمل الجديد ولا يجوز خصمها من أجر العامل. والتأمين الصحي شرط للتجديد ولم يُحسب.", "info");
  html += note(FEE_NOTE, "info");
  if (rules.sa.transferFees && v.iqamaFee === "reported") html += note("650 ريالاً للسنة هو المبلغ المتداول عند السداد، والرسم الأساسي المنشور 500.", "info");
  return html;
});
