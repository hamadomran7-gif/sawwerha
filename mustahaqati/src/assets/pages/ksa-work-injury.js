import { ksaWorkInjury } from "../calc.js";
import { bind, money, num, table, big, note, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";

bind(form, result, (v) => {
  const t = v.type;
  form.querySelectorAll("[data-temp]").forEach((el) => (el.hidden = t !== "temporary"));
  form.querySelectorAll("[data-perm]").forEach((el) => (el.hidden = t !== "permanent"));
  form.querySelectorAll("[data-death]").forEach((el) => (el.hidden = t !== "death"));
  if (!v.wage) return null;
  const saudi = v.saudi !== "no";
  const r = ksaWorkInjury({ type: t, saudi, system: v.system, wage: v.wage, days: v.days, gosiDays: v.gosiDays, degree: (v.degree || 0) / 100, age: v.age, attendance: v.attendance === "yes", survivors: v.survivors });
  if (!r) return null;
  let html = "";
  if (t === "temporary") {
    html = big("البدل اليومي للعجز المؤقت", money(r.total, cur), `${daysAr(r.days)} · الأجر اليومي ${money(r.daily, cur)}`);
    html += table(
      [
        [`${daysAr(r.days - r.gosiDays)} × 100%`, money(r.fullPay, cur)],
        r.gosiDays ? [`${daysAr(r.gosiDays)} علاج على نفقة التأمينات × 75%`, money(r.gosiPay, cur)] : null,
        ["المجموع من التأمينات", money(r.total, cur), { strong: true }],
      ],
      "طريقة الحساب"
    );
    html += note("يبدأ من اليوم التالي للإصابة ويشمل العطل، حتى الشفاء أو ثبوت العجز أو الوفاة، بلا حد أقصى للمدة، ولا يُجمع مع الأجر.", "info");
    return html;
  }
  if (t === "death") {
    if (!saudi) {
      html = big("التعويض المقطوع لورثة غير السعودي", money(r.lump, cur), `${num(r.months, 0)} ضعفاً من المعاش الشهري`);
      html += note("توزيع المبلغ بين الورثة (بالتساوي أم بحصص 50% و75%) وبقاء سقف 330,000 للمشتركين القدامى غير محسومين نصاً.", "warn");
      return html;
    }
    html = big("معاش الورثة الشهري", money(r.monthly, cur), `${num(r.share * 100, 0)}% من معاش العجز الكلي`);
    html += table([["المعاش الشهري للعائلة", money(r.monthly, cur), { strong: true }], r.grant ? ["منحة الوفاة (3 أشهر بحد 10,000)", money(r.grant, cur)] : null], "التفاصيل");
    html += note("المستحقون: الزوج والأبناء دون 21 (24 للطالب) والوالدان المعالان، ويوزع المعاش بينهم بالتساوي. وتتحمل التأمينات تكاليف تجهيز الجثمان ونقله.", "info");
    return html;
  }
  if (r.kind === "total") {
    if (!saudi) {
      html = big("التعويض المقطوع للعجز الكلي", money(r.lump, cur), `${num(r.months, 0)} ضعفاً من المعاش الشهري ${money(r.monthly, cur)}`);
      return html + note("الدفعة تنهي علاقة المصاب غير السعودي بالمؤسسة.", "info");
    }
    html = big("معاش العجز الكلي الشهري", money(r.monthly, cur), r.attendance ? `منها ${money(r.attendance, cur)} للمساعدة الدائمة` : "100% من متوسط الأجر");
    if (r.minApplied) html += note("رُفع المعاش إلى الحد الأدنى.", "info");
    return html + note("يُصرف مؤقتاً 5 سنوات ثم نهائياً، ويجوز جمعه مع أجر عمل جديد.", "info");
  }
  if (r.kind === "partial-high") {
    if (!saudi) return big("التعويض المقطوع للعجز الجزئي", money(r.lump, cur), `${num(r.months, 0)} ضعفاً من ${money(r.monthly, cur)}`);
    return big("معاش العجز الجزئي الشهري", money(r.monthly, cur), `${num(v.degree, 0)}% × متوسط الأجر`) + note("العجز 50% فأكثر يعطي السعودي معاشاً شهرياً بنسبته من معاش العجز الكلي.", "info");
  }
  html = big("التعويض المقطوع للعجز الجزئي", money(r.lump, cur), `${num(r.months, 0)} ضعفاً × المعاش المفترض ${money(r.monthly, cur)}`);
  html += table(
    [
      [`المعاش المفترض: ${num(v.degree, 0)}% × ${money(Math.min(v.wage, 45000), cur)}`, money(r.monthly, cur)],
      ["عدد الأضعاف", `${num(r.months, 0)}${r.months < 60 ? " (ينقص شهراً عن كل سنة فوق 45، بحد أدنى 36)" : ""}`],
      ["التعويض", money(r.lump, cur), { strong: true }],
    ],
    "طريقة الحساب"
  );
  return html + note("ألغى المرسوم م/273 سقف 165,000 ريال ووحّد سن الإنقاص على 45 للمشتركين القدامى والجدد.", "info");
});
