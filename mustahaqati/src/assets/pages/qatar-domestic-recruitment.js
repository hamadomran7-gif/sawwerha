import { qaRecruitCost, qaRecruitRefund } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال قطري";
const NAT = { ID: "إندونيسيا", LK: "سريلانكا", PH: "الفلبين", BD: "بنغلاديش", IN: "الهند", KE: "كينيا", ET: "إثيوبيا" };

const show = () => {
  const refund = form.mode.value === "refund";
  form.querySelectorAll("[data-cost]").forEach((el) => (el.hidden = refund));
  form.querySelectorAll("[data-refund]").forEach((el) => (el.hidden = !refund));
};
form.mode.addEventListener("change", show);

bind(form, result, (v) => {
  show();
  if (v.mode === "refund") {
    if (!(Number(v.cost) > 0)) return null;
    const r = qaRecruitRefund({ cost: v.cost, month: v.month, govFees: v.govFees });
    if (r.expired) return big("لا استرداد", money(0, cur), `انتهى ضمان المكتب بعد الشهر ${num(r.last, 0)}`) + note("الضمان 9 أشهر: 3 أشهر تمهيدية و6 إضافية. بعدها لا يلزم المكتب برد شيء.", "warn");
    let html = big("يرده المكتب", money(r.refund, cur), r.stage === "preliminary" ? "فترة الاختبار التمهيدية: كامل المبلغ ناقص الرسوم الحكومية" : `الفترة الإضافية: ${num(r.pct, 0)}% من المبلغ`);
    html += table([
      ["المبلغ المدفوع", money(Number(v.cost), cur)],
      r.stage === "preliminary" ? ["الرسوم الحكومية المخصومة", money(r.govFees, cur)] : [`خصم 15% × ${num(r.month - 3, 0)} ${r.month - 3 === 1 ? "شهر" : r.month - 3 === 2 ? "شهرين" : "أشهر"}`, `${num(100 - r.pct, 0)}%`],
      ["المسترد", money(r.refund, cur), { strong: true }],
    ]);
    html +=
      r.stage === "preliminary"
        ? note("في الأشهر الثلاثة الأولى يُرد كامل المدفوع بعد خصم الرسوم الحكومية، إذا ثبت عدم لياقة العامل، أو خالف العقد، أو رفض العمل، أو هرب، أو أنهى صاحب العمل العقد.", "info")
        : note("في الأشهر 4 إلى 9 يُخصم 15% من إجمالي المبلغ عن كل شهر، في حالات الرفض والهروب والمرض المزمن، والرسوم الحكومية على المكتب.", "info");
    html += note("يسقط الحق في الاسترداد إذا اعتدى صاحب العمل أو أسرته على العامل، أو أخل بالعقد، أو لم يدفع الأجر (القرار 61/2026 كما نقلته الراية).", "info");
    return html;
  }

  const r = qaRecruitCost({ nationality: v.nationality, price: v.price, salary: v.salary, housing: v.housing === "cash", food: v.food === "cash" });
  if (r.needPrice) return note("لا سعر أقصى منشوراً لهذه الجنسية. أدخل سعر المكتب.", "warn");
  const name = NAT[v.nationality] || "";
  let html = big("كلفة السنة الأولى", money(r.firstYear, cur), r.cap !== null && !Number(v.price) ? `بالحد الأعلى لـ${name}` : "بسعر المكتب الذي أدخلته");
  html += table([
    [r.cap !== null && !Number(v.price) ? `الحد الأعلى لسعر الاستقدام (${name})` : "سعر المكتب", money(r.contract, cur)],
    ["منه عند التعاقد 50%", money(r.deposit, cur)],
    [`الأجر الشهري${v.housing === "cash" || v.food === "cash" ? " مع بدلات السكن والطعام" : ""}: ${num(r.wage, 0)} × 12`, money(r.wages, cur)],
    ["كلفة السنة الأولى", money(r.firstYear, cur), { strong: true }],
  ]);
  if (r.overCap) html += note(`السعر الذي أدخلته أعلى من الحد الأعلى لـ${name} (${money(r.cap, cur)}). السعر الأقصى يشمل كل تكاليف الاستقدام ورسومه عدا الحجر الصحي.`, "warn");
  if (r.belowMinWage) html += note("الأجر الأساسي أقل من الحد الأدنى 1,000 ريال.", "warn");
  html += note("السعر الأقصى يشمل كل تكاليف الاستقدام ورسومه عدا الحجر الصحي، بقرار وزارة التجارة والصناعة 1/2022، ولم نجد تعديلاً له بعده. ولم تُحسب رسوم الإقامة والتأمين.", "info");
  return html;
});
