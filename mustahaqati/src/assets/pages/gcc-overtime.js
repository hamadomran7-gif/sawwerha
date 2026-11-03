import { gccOvertime, rules } from "../calc.js";
import { bind, num, table, big, note, hoursAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const C = form.dataset.country;
const CUR = { qa: "ريال", kw: "دينار", om: "ريال", bh: "دينار" }[C];
const DIG = C === "qa" ? 2 : 3;
const m = (x) => `${num(x, DIG)} ${CUR}`;
const pct = (mult) => `+${num((mult - 1) * 100, 0)}%`;
const hours = (h) => hoursAr(h);
const O = rules[C].overtime;
const LABEL = {
  day: "ساعات إضافية نهارية",
  night: `ساعات إضافية ليلية (${O.nightFrom}:00–${String(O.nightTo).padStart(2, "0")}:00)`,
  rest: "العمل في يوم الراحة",
  holiday: "العمل في العطلة الرسمية",
};

bind(form, result, (v) => {
  form.querySelectorAll("[data-om]").forEach((el) => (el.hidden = C !== "om"));
  if (!v.wage) return null;
  const r = gccOvertime({ country: C, wage: v.wage, day: v.day, night: v.night, rest: v.rest, holiday: v.holiday, restCash: v.restMode !== "day", consent: v.consent !== "no", altDivisor: v.divisor === "alt" });
  if (!r || !r.rows.length) return big("أجر الساعة", m(r ? r.hourly : 0), "أدخل عدد الساعات الإضافية لترى المستحق");
  let html = big("المستحق عن العمل الإضافي", m(r.total), `أجر الساعة ${m(r.hourly)} · فوق راتبك الشهري`);
  html += table(
    [
      [`أجر الساعة: ${r.basis === "basic" ? "الأساسي" : "الأجر الشامل"} ÷ ${num(r.divisor, 2)}`, m(r.hourly)],
      ...r.rows.map((x) => [`${LABEL[x.type]}: ${hours(x.hours)} × ${num(x.mult, 2)} (${pct(x.mult)})`, x.cash ? m(x.amount) : C === "om" ? "إجازة تعويضية بدل المبلغ" : "يوم راحة بديل بدل المبلغ"]),
      ["المجموع", m(r.total), { strong: true }],
    ],
    "طريقة الحساب"
  );
  if (r.substituteDays) html += note(`ومع المبلغ تستحق ${r.substituteDays === 1 ? "يوم راحة بديلاً" : "يومي راحة بديلين"} (المادتان 67 و68).`, "info");
  const tips = {
    qa: `الحد الأقصى 10 ساعات عمل فعلية في اليوم مع الإضافي. ويوم الراحة (الجمعة أصلاً): يوم بديل أو الأساسي + 150%. وفي رمضان 6 ساعات يومياً و36 أسبوعياً للجميع.`,
    kw: `الإضافي بأمر كتابي وبحد ساعتين يومياً، و3 أيام أسبوعياً، و90 يوماً و180 ساعة سنوياً. ولا علاوة ليلية في القانون. وفي رمضان 36 ساعة أسبوعياً للجميع.`,
    om: `الإضافي بموافقتك إلا في الجرد وإقفال الحسابات (حتى 15 يوماً في العام) والطوارئ، والحد 12 ساعة في اليوم مع الإضافي. وساعات العمل 8 يومياً و40 أسبوعياً، وفي رمضان 6 يومياً أو 30 أسبوعياً للمسلمين.`,
    bh: `الحد 10 ساعات عمل فعلية في اليوم مع الإضافي، ولا تُمنح إجازة بدل أجر الإضافي. ويوم الراحة والعطلة: الأجر + 150% أو يوم بديل باختيارك. وفي رمضان 6 ساعات يومياً للمسلم.`,
  };
  html += note(tips[C], "info");
  html += note(`القانون لا يحدد قاسم أجر الساعة صراحة؛ افترضنا ${r.basis === "basic" ? "الأساسي" : "الأجر الشامل"} ÷ ${num(O.divisor, 2)}، والبديل ÷ ${num(O.divisorAlt, 2)} من القائمة أعلاه. وقد يمنحك عقدك أكثر.`, "warn");
  return html;
});
