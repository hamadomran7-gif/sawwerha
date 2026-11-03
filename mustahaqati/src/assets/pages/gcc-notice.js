import { gccNotice } from "../calc.js";
import { bind, num, table, big, note, countAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const C = form.dataset.country;
const CUR = { qa: "ريال", kw: "دينار", om: "ريال", bh: "دينار" }[C];
const DIG = C === "qa" ? 2 : 3;
const m = (x) => `${num(x, DIG)} ${CUR}`;
const daysAr = (n) => countAr(n, "يوم واحد", "يومان", "أيام", "يوماً", "يوم");
const BASIS = { basic: "الأجر الأساسي", total: "الأجر الشامل", basicSocial: "الأساسي مع العلاوة الاجتماعية" };

bind(form, result, (v) => {
  form.querySelectorAll("[data-years]").forEach((el) => (el.hidden = C !== "qa"));
  form.querySelectorAll("[data-paybasis]").forEach((el) => (el.hidden = !(C === "kw" || C === "om")));
  if (!v.wage) return null;
  const r = gccNotice({ country: C, wage: v.wage, years: v.years || 0, monthlyPaid: v.payBasis !== "other", servedDays: v.served || 0 });
  if (!r) return null;
  const byEmployer = v.who !== "employee";
  const label = r.unserved ? (byEmployer ? "بدل الإخطار المستحق لك" : "ما تدفعه لصاحب العمل إن تركت دون إخطار") : "لا بدل: المهلة رُوعيت كاملة";
  let html = big(label, m(r.unserved ? r.inLieu : 0), `مهلة الإخطار ${daysAr(r.days)}${r.served ? ` · رُوعي منها ${daysAr(r.served)}` : ""}`);
  html += table(
    [
      ["مهلة الإخطار", `${daysAr(r.days)}${r.days % 30 === 0 ? ` (${r.days === 30 ? "شهر" : r.days === 60 ? "شهران" : `${num(r.days / 30, 0)} أشهر`})` : ""}`],
      ["أساس البدل", BASIS[r.basis]],
      ["الأجر اليومي (÷ 30)", m(r.daily)],
      ["الأيام غير المراعاة", daysAr(r.unserved)],
      [byEmployer ? "البدل المستحق للعامل" : "البدل المستحق لصاحب العمل", m(r.inLieu), { strong: true }],
    ],
    "طريقة الحساب"
  );
  const tips = {
    qa: "منذ القانون 18 لسنة 2020: شهر في أول سنتين من الخدمة وشهران بعدهما، للطرفين ولكل طرق دفع الأجر، والبدل على الأجر الأساسي. والوافد الذي يترك دون مراعاة الشروط قد يُحرم من تصريح عمل سنة.",
    kw: "المهلة 3 أشهر لصاحب الأجر الشهري وشهر لغيره، للطرفين. وإن أخطرك صاحب العمل فلك يوم أو 8 ساعات أسبوعياً للبحث عن عمل بأجر، وله أن يعفيك من العمل في المهلة بأجر كامل وتُحسب في خدمتك.",
    om: "الإنهاء بإخطار كتابي ولسبب مشروع: 30 يوماً لصاحب الأجر الشهري و15 لغيره، والبدل على آخر أجر شامل. ولك خلال المهلة 10 ساعات مدفوعة أسبوعياً للبحث عن عمل.",
    bh: "المهلة 30 يوماً للطرفين، ويجوز الاتفاق على أطول إن كان الإنهاء من صاحب العمل. وإن أنهى صاحب العمل دون مراعاتها حُسبت في مدة خدمتك، ولك يوم أو 8 ساعات أسبوعياً للبحث عن عمل.",
  };
  html += note(tips[C], "info");
  html += note("بدل الإخطار منفصل عن مكافأة نهاية الخدمة وبدل الإجازات، ولا يجوز الإخطار أثناء الإجازة. والمبلغ تقديري وقد يمنحك عقدك مهلة أطول.", "info");
  return html;
});
