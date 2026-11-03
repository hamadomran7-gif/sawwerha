import { gccFinalSettlement } from "../calc.js";
import { bind, money, num, table, big, note, duration, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cc = form.dataset.country;
const CUR = { qa: "ريال", kw: "دينار", om: "ريال", bh: "دينار" }[cc];
const DP = cc === "qa" ? 2 : 3;
const m = (x) => money(Math.round(Number(x) * 10 ** DP) / 10 ** DP, CUR);
const toggle = () => form.querySelectorAll("[data-notice]").forEach((el) => (el.hidden = form.noticeCase.value === "none"));
form.noticeCase.addEventListener("change", toggle);
const EOS_NOTE = {
  qa: "مكافأة قطر: أجر 21 يوماً من الأجر الأساسي الأخير عن كل سنة بعد إتمام سنة، بلا تخفيض عند الاستقالة، وتسقط عند الفصل وفق المادة 61.",
  kw: "مكافأة الكويت: 15 يوماً عن كل سنة من أول 5 سنوات ثم شهر عن كل سنة، على آخر أجر شامل بسقف 18 شهراً؛ وعند الاستقالة لا شيء دون 3 سنوات، والنصف حتى 5، والثلثان حتى 10.",
  om: "مكافأة عُمان: أجر شهر أساسي عن كل سنة منذ 31 يوليو 2023، وقبله 15 يوماً عن كل سنة من أول 3 سنوات ثم شهر، على الأجر الأساسي الأخير.",
  bh: "مكافأة البحرين: نصف شهر عن كل سنة من أول 3 سنوات ثم شهر، على الأساسي مع العلاوة الاجتماعية؛ والجزء عن الخدمة منذ 1 مارس 2024 تصرفه هيئة التأمين الاجتماعي.",
};

bind(form, result, (v) => {
  toggle();
  if (!v.basic || !v.start || !v.end) return null;
  const s = gccFinalSettlement({
    country: cc, basic: v.basic, allowances: v.allowances, social: v.social, start: v.start, end: v.end,
    endedBy: v.endedBy === "worker" ? "worker" : "employer", forfeited: v.endedBy === "art61",
    leaveDays: v.leaveDays, noticeCase: v.noticeCase, servedDays: v.servedDays, salaryDays: v.salaryDays, other: v.other, deductions: v.deductions,
  });
  if (!s) return note("تاريخ آخر يوم عمل يجب أن يكون بعد تاريخ المباشرة.", "bad");
  const n = s.noticeInfo;
  let html = big(s.total >= 0 ? "مستحقاتك النهائية" : "صافي المخالصة عليك", m(Math.abs(s.total)), `مدة الخدمة: ${duration(s.duration)}${s.sio ? ` · منها ${m(s.fromEmployer)} من صاحب العمل و${m(s.sio)} من هيئة التأمين الاجتماعي` : ""}`);
  let eosLabel = "مكافأة نهاية الخدمة";
  if (cc === "kw" && s.eos.fraction !== undefined && s.eos.fraction < 1) eosLabel += s.eos.fraction === 0 ? " (لا شيء للاستقالة قبل 3 سنوات)" : s.eos.fraction === 0.5 ? " (النصف للاستقالة)" : " (الثلثان للاستقالة)";
  if (cc === "qa" && s.eos.forfeited) eosLabel += " (تسقط وفق المادة 61)";
  if (cc === "qa" && s.eos.eligible === false) eosLabel += " (لا تُستحق قبل إتمام سنة)";
  const rows = [
    [eosLabel, m(s.eosTotal)],
    s.sio ? ["  منها ما تصرفه هيئة التأمين الاجتماعي", m(s.sio), { muted: true }] : null,
    [`بدل الإجازة: ${daysAr(Number(v.leaveDays) || 0)} × ${num(s.leave.daily, DP)}`, m(s.leave.amount)],
    s.salary ? [`أجر ${daysAr(Number(v.salaryDays))} لم يُصرف`, m(s.salary)] : null,
    s.notice ? [v.noticeCase === "employer" ? `بدل ${daysAr(n.unserved)} من مهلة الإخطار (${daysAr(n.days)})` : `خصم ${daysAr(n.unserved)} من مهلة الإخطار لم تُراعَ`, m(s.notice)] : null,
    s.other ? ["مستحقات أخرى", m(s.other)] : null,
    s.deductions ? ["خصومات", m(-s.deductions)] : null,
    ["الإجمالي", m(s.total), { strong: true }],
  ];
  html += table(rows, "تفصيل المخالصة");
  html += note(EOS_NOTE[cc], "info");
  html += note(`بدل الإجازة على ${s.leave.basis} ÷ ${s.leave.divisor}، ومهلة الإخطار ${daysAr(n.days)} على ${cc === "qa" ? "الأجر الأساسي" : cc === "bh" ? "الأساسي مع العلاوة الاجتماعية" : "الأجر الشامل"}.`, "info");
  if (cc === "om" && s.eos.literalTotal && Math.abs(s.eos.literalTotal - s.eos.total) > 0.01) html += note(`قراءة حرفية للقانون الجديد على كامل المدة تعطي مكافأة ${m(s.eos.literalTotal)}؛ عرضنا تطبيق وزارة العمل للقانون السابق على المدة قبل 31 يوليو 2023.`, "info");
  return html;
});
