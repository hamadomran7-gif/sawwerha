import { ksaRecruitCost, ksaRecruitRefund } from "../calc.js";
import { bind, money, num, table, big, note, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const NAT = { PH: "الفلبين", LK: "سريلانكا", BD: "بنغلاديش", TH: "تايلاند", KE: "كينيا", UG: "أوغندا", SL: "سيراليون", BI: "بوروندي", ET: "إثيوبيا", TZ: "تنزانيا" };

const show = () => {
  const refund = form.mode.value === "refund";
  form.querySelectorAll("[data-cost]").forEach((el) => (el.hidden = refund));
  form.querySelectorAll("[data-refund]").forEach((el) => (el.hidden = !refund));
  if (refund) form.querySelectorAll("[data-month]").forEach((el) => (el.hidden = form.reason.value !== "refusal"));
};
["mode", "reason"].forEach((n) => form[n].addEventListener("change", show));

bind(form, result, (v) => {
  show();
  if (v.mode === "refund") {
    const r = ksaRecruitRefund({ cost: v.cost, contractMonths: v.contractMonths, month: v.month, reason: v.reason });
    if (!(Number(v.cost) > 0)) return null;
    if (v.reason !== "refusal") {
      const pct = v.reason === "late" ? 20 : 15;
      return (
        big("يرده المكتب", money(r.refund, cur), `المبلغ المدفوع ${money(Number(v.cost), cur)} + ${pct}% من قيمة العقد`) +
        table([
          ["المبلغ المدفوع", money(Number(v.cost), cur)],
          [v.reason === "late" ? "غرامة التأخير 20%" : "تعويض الإلغاء خلال التمديد 15%", money(r.extra, cur)],
          ["المسترد", money(r.refund, cur), { strong: true }],
        ]) +
        note("مدة الاستقدام القصوى 90 يوماً من دفع التكاليف، ثم تمديد 30 يوماً. ولم يُنص هل تُحسب النسبة على قيمة العقد قبل الضريبة أم بعدها، والحاسبة تحسبها على المبلغ المدخل.", "info")
      );
    }
    let html = big(r.payer === "office" ? "يرده المكتب" : "يغطيه تأمين العقد", money(r.refund, cur), `${money(r.perMonth, cur)} × ${monthsAr(r.remaining)} متبقية من ${monthsAr(r.contractMonths)}`);
    html += table([
      ["تكلفة الاستقدام", money(Number(v.cost), cur)],
      [`÷ ${num(r.contractMonths, 0)} شهراً = نصيب الشهر`, money(r.perMonth, cur)],
      [`× الأشهر المتبقية بعد الشهر ${num(r.month, 0)}`, num(r.remaining, 0)],
      r.capped ? ["الحد الأعلى لتعويض التأمين", money(r.cap, cur)] : null,
      ["المسترد", money(r.refund, cur), { strong: true }],
    ]);
    html +=
      r.payer === "office"
        ? note("خلال 90 يوماً من الوصول: إذا رفضت العاملة العمل يرحّلها المكتب على حسابه ويرد التكلفة بهذه المعادلة. ويمكنك طلب تأشيرة بديلة دون رسوم حكومية إذا غادرت نهائياً خلال 90 يوماً من دخولها.", "info")
        : note("بعد 90 يوماً تنتقل المسؤولية إلى صاحب العمل، ويعوّض تأمين عقد العمالة المنزلية الغياب والهروب ورفض العمل بالمعادلة نفسها، بحد أقصى هو الأقل من تكلفة الاستقدام و20,000 ريال. والتأمين إلزامي لأول سنتين من العقود الجديدة منذ 1 فبراير 2024.", "info");
    if (r.remaining === 0) html += note("انتهت مدة العقد، فلا مبلغ متبقياً للاسترداد.", "warn");
    return html;
  }

  const r = ksaRecruitCost({ nationality: v.nationality, price: v.price, employer: v.employer, existingCount: v.existingCount, salary: v.salary, insurance: v.insurance });
  if (r.needPrice) return note("لا سقف منشوراً لهذه الجنسية. أدخل سعر عقد المكتب شاملاً الضريبة كما يظهر في مساند.", "warn");
  const name = NAT[v.nationality] || "";
  let html = big("تدفعه عند التعاقد", money(r.upfront, cur), r.usedCap ? `بسقف ${name} ${r.capVatIncluded ? "الشامل للضريبة" : "مع الضريبة"}` : "بسعر المكتب الذي أدخلته");
  html += table(
    [
      [r.usedCap ? `سقف الاستقدام ${num(r.cap, 0)}${r.capVatIncluded ? " (شامل الضريبة)" : ` + ضريبة 15% (${num(r.contractVat)})`}` : `سعر عقد المكتب (منه ضريبة ${num(r.contractVat)})`, money(r.contract, cur)],
      ["رسم التأشيرة", money(r.visa, cur)],
      ["الخدمة الإلكترونية في مساند 150 + الضريبة", money(r.service, cur)],
      ["المجموع عند التعاقد", money(r.upfront, cur), { strong: true }],
    ],
    "عند التعاقد"
  );
  html += table(
    [
      ["عند التعاقد", money(r.upfront, cur)],
      ["إصدار الإقامة", money(r.iqama, cur)],
      r.levy ? [`المقابل المالي: العاملة رقم ${num(r.workerNo, 0)} والإعفاء حتى ${num(r.free, 0)}`, money(r.levy, cur)] : null,
      r.insurance ? ["قسط تأمين العقد", money(r.insurance, cur)] : null,
      r.wage ? [`الراتب: ${num(r.wage, 0)} × 12`, money(r.wages, cur)] : null,
      ["كلفة السنة الأولى", money(r.firstYear, cur), { strong: true }],
      [`على عقد سنتين (إقامتان${r.levy ? " ومقابلان" : ""} و24 راتباً)`, money(r.twoYears, cur)],
      ["المتوسط الشهري على سنتين", money(r.perMonth, cur), { strong: true }],
    ],
    "السنة الأولى ومدة العقد"
  );
  if (r.overCap) html += note(`السعر الذي أدخلته أعلى من سقف ${name} مع الضريبة (${money(r.capGross, cur)}). لا يجوز للمكتب تجاوز السقف، ويمكنك الشكوى عبر مساند.`, "warn");
  if (r.avg) html += note(`متوسط ما دُفع لاستقدام عاملة من ${name} في مساند في يوليو 2026: ${money(r.avg, cur)} شاملاً الضريبة${r.arrivalDays ? `، ومتوسط مدة الوصول ${num(r.arrivalDays, 0)} يوماً` : ""}.`, "info");
  if (!r.insurance) html += note("لم يُحسب قسط تأمين عقد العمالة المنزلية لأنه غير منشور، ويظهر في فاتورة العقد في مساند.", "info");
  if (v.nationality === "ET") html += note("سقف إثيوبيا 5,900 من أربعة مصادر صحفية متطابقة، وصفحة الوزارة تذكرها ضمن المخفَّضة دون رقم.", "info");
  html += note("رسم التأشيرة 2,000 منقول صحفياً عن مساند (2022)، وصفحة الوزارة تصف طلب التأشيرة بأنه مجاني. تحقق من المبالغ الظاهرة عند السداد.", "info");
  return html;
});
