import { omanCivilSalary } from "../calc.js";
import { bind, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const omr = (n) => (n === null || n === undefined || isNaN(n) ? "—" : `${f3.format(n)} ر.ع`);
const nextJan = () => new Date().getUTCFullYear() + 1;

bind(form, result, (v) => {
  const s = omanCivilSalary({ grade: v.grade, increments: v.increments });
  if (!s) return null;
  let html = big("راتبك الصافي الشهري", omr(s.net), `الدرجة ${s.grade} · ${s.increments ? `بعد ${num(s.increments, 0)} علاوة` : "بداية الدرجة"}`);
  html += table(
    [
      [s.increments ? `الأساسي: ${num(s.basicStart, 0)} + ${num(s.increments, 0)} × ${num(s.increment, 0)}` : "الأساسي (بداية الدرجة)", omr(s.basic)],
      ["بدل السكن", omr(s.housing)],
      ["بدل الكهرباء", omr(s.electricity)],
      ["بدل الماء", omr(s.water)],
      ["بدل الهاتف", omr(s.phone)],
      ["بدل الانتقال", omr(s.transport)],
      ["علاوة غلاء المعيشة", omr(s.costOfLiving)],
      ["الإجمالي", omr(s.total), { strong: true }],
      [`الحماية الاجتماعية 7.5%${s.total > s.pensionBase ? " على سقف 3,000" : ""}`, `− ${omr(s.pension)}`],
      ["الأمان الوظيفي 0.5%", `− ${omr(s.jobSecurity)}`],
      ["الصافي", omr(s.net), { strong: true }],
      [`أساسيك في 1 يناير ${nextJan()} (+${num(s.increment, 0)})`, omr(s.nextBasic)],
      s.promotion ? [`عند الترقية إلى الدرجة ${s.promotion.grade}: الأساسي / الإجمالي`, `${omr(s.promotion.basic)} / ${omr(s.promotion.total)}`] : ["الترقية", "الدرجة 1 أعلى الدرجات"],
    ],
    "تفصيل الراتب"
  );
  html += note("العلاوة الدورية في 1 يناير بعد ستة أشهر من التعيين، وتُحجب بتقرير «ضعيف». والبدلات ثابتة للدرجة فلا تزيد بالعلاوة، وتتغير بالترقية إلى بدلات الدرجة الجديدة.", "info");
  html += note("الأرقام من جدول المرسوم السلطاني 78/2013 النافذ منذ 2014، ولم نجد جدولاً بديلاً حتى نوفمبر 2026. وقد تُصرف للموظف بدلات وظيفية خارج الجدول لا تظهر هنا؛ راجع كشف راتبك.", "info");
  return html;
});
