import { bahrainCivilSalary, rules } from "../calc.js";
import { bind, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const S = rules.bh.civilScale;
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const bhd = (n) => (n === null || n === undefined || isNaN(n) ? "—" : `${f3.format(n)} د.ب`);
const NAMES = { generalRegular: "الوظائف العمومية", generalShift: "العمومية بنظام النوبات", executive: "الوظائف التنفيذية", educational: "الوظائف التعليمية" };
const sync = () => {
  const T = S.scales[form.scale.value] || S.scales.generalRegular;
  const ids = Object.keys(T.grades);
  [...form.grade.options].forEach((o) => (o.disabled = !ids.includes(o.value)));
  if (!ids.includes(form.grade.value)) form.grade.value = ids.includes("6") ? "6" : ids[0];
  const G = T.grades[form.grade.value];
  const n = G.values.length;
  [...form.index.options].forEach((o) => {
    const i = Number(o.value);
    o.disabled = i >= n;
    const label = G.ranked ? (i === 0 ? "الحد الأدنى (الرتبة 0)" : `الرتبة ${i}`) : `القيمة ${i + 1}`;
    o.textContent = i < n ? `${label} — ${num(G.values[i], 0)}` : G.ranked ? label : `القيمة ${i + 1}`;
  });
  if (Number(form.index.value) >= n) form.index.value = String(n - 1);
};
form.scale.addEventListener("change", sync);
form.grade.addEventListener("change", sync);

bind(form, result, (v) => {
  sync();
  const s = bahrainCivilSalary({ scale: form.scale.value, grade: form.grade.value, index: form.index.value, living: Number(v.living) || 0, transport: v.transport, social: v.social });
  if (!s) return null;
  const pos = s.ranked ? (s.index === 0 ? "الحد الأدنى" : `الرتبة ${s.index}`) : `القيمة ${s.index + 1} من ${S.scales[s.scale].grades[s.grade].values.length}`;
  let html = big("راتبك الصافي الشهري", bhd(s.net), `${NAMES[s.scale]} · الدرجة ${s.grade} · ${pos}`);
  html += table(
    [
      ["الراتب الأساسي", bhd(s.basic)],
      s.living ? ["علاوة تحسين المستوى المعيشي", bhd(s.living)] : null,
      s.social ? ["العلاوة الاجتماعية", bhd(s.social)] : null,
      s.transport ? ["علاوة الانتقال", bhd(s.transport)] : null,
      ["الإجمالي", bhd(s.gross), { strong: true }],
      [`التقاعد 7% من الأساسي (${num(s.basic, 0)})`, `− ${bhd(s.pension)}`],
      ["التأمين ضد التعطل 1%", `− ${bhd(s.unemployment)}`],
      ["الصافي", bhd(s.net), { strong: true }],
      s.nextBasic ? [`أساسيك بعد العلاوة السنوية في 1 يناير (+${num(s.nextBasic - s.basic, 0)})`, bhd(s.nextBasic)] : ["العلاوة السنوية", "بلغت نهاية المربوط: لا علاوة حتى الترقية"],
    ],
    "تفصيل الراتب"
  );
  if (!s.social) html += note("لم تُدخل العلاوة الاجتماعية: مبالغها في ملحق اللائحة ولم نجد نصه، فالصافي أعلاه للجزء المعلوم. أضف ما في كشفك.", "warn");
  if (!s.living) html += note("علاوة تحسين المستوى المعيشي 85 أو 100 دينار منذ يونيو 2023 لبعض الموظفين حسب ملحق اللائحة، ولا تُصرف لشاغلي الوظائف العليا. اخترها إن كانت في كشفك.", "info");
  if (!s.ranked) html += note("الدرجتان 2 و3 منشورتان بقيم أقل من 16، والأرجح أنها الرتب العليا بعد حذف ما دون 322 ديناراً. القيم صحيحة ورقم الرتبة غير محسوم.", "info");
  html += note("العلاوة السنوية رتبة واحدة في أول يناير بعد سنة من التعيين أو آخر علاوة، بأداء مرضٍ وستة أشهر خدمة فعلية. والتقاعد 7% من الأساسي وحده (القانون 13/2022)، والتعطل 1%.", "info");
  html += note("الجداول من البيانات المفتوحة لجهاز الخدمة المدنية بلا تاريخ نفاذ. قد تُصرف لك بدلات أخرى كعلاوة السيارة بدل الانتقال؛ راجع كشف راتبك.", "info");
  return html;
});
