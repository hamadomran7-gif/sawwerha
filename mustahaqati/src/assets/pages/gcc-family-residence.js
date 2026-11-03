import { familyResidenceCost } from "../calc.js";
import { bind, money, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cc = form.dataset.country;
const CUR = { ae: "درهم", qa: "ريال", kw: "دينار", bh: "دينار", om: "ريال" }[cc];
const m = (x) => money(x, CUR);
const L = {
  inside: "تعديل الوضع داخل الدولة", entry: cc === "kw" ? "سمة الدخول وضمانها الصحي" : "إذن الدخول", residence: cc === "kw" ? "رسم الإقامة" : "الإقامة (الطلب والإصدار والخدمات)", eid: "الهوية الإماراتية", medical: "الفحص الطبي (البالغون)",
  parentDeposit: "ضمان مسترد للوالد مع رسم الإيداع", permit: cc === "bh" ? "تصريح إقامة التابع والرسم الإداري" : "رخصة الإقامة", idCard: "البطاقة الشخصية", parentResidence: "إقامة الوالدين", health: "رسم الضمان الصحي",
  civilId: "البطاقة المدنية", smartCard: "البطاقة الذكية", visa: "تأشيرة الالتحاق بعائل", renewal: "تجديد التأشيرة", card: "بطاقة المقيم",
};

bind(form, result, (v) => {
  const country = cc === "ae" ? v.emirate || "ae-dubai" : cc;
  let insurance = v.insurance;
  if (cc === "ae") {
    const ins = form.querySelector("#insurance");
    if (ins && !ins.dataset.touched) { insurance = country === "ae-dubai" ? 600 : 0; ins.value = String(insurance); }
  }
  const r = familyResidenceCost({ country, spouse: v.spouse, children: v.children, childrenOver10: v.over10, parents: v.parents, years: v.years, insurance, inside: v.inside === "yes", sponsor: v.sponsor, salary: v.salary, housing: v.housing === "yes" });
  if (!r || !r.persons) return null;
  const cycle = r.years === 1 ? "سنة" : r.years === 2 ? "سنتين" : `${r.years} سنوات`;
  let html = big("ما تدفعه عند الإصدار", m(r.firstYear), `لإقامة ${cycle}${r.insurance ? " مع تأمين سنة" : ""}، ثم نحو ${m(r.annualAfter)} سنوياً`);
  const rows = r.items.filter((i) => i.stage !== "renewal" && i.stage !== "deposit").map((i) => [`${L[i.id]} (${m(i.unit)} × ${i.n})`, m(i.total)]);
  if (r.insurance) rows.push([`التأمين الصحي لسنة (${m(r.insurancePerPerson)} × ${cc === "bh" ? r.persons - Number(v.parents || 0) : r.persons})`, m(r.insurance)]);
  rows.push(["المجموع عند الإصدار", m(r.firstYear), { strong: true }]);
  if (r.deposit) rows.push(["ضمان مسترد للوالدين (لا يُحسب في المجموع)", m(r.deposit), { muted: true }]);
  html += table(rows, "الرسوم عند الإصدار");
  html += table([[`رسوم التجديد كل ${cycle}`, m(r.renewalCycle)], ["الكلفة السنوية بعد ذلك (مع التأمين)", m(r.annualAfter), { strong: true }]], "بعد السنة الأولى");
  if (r.eligible === false) html += note(`راتبك أقل من الحد المطلوب لكفالة الأسرة (${m(r.need)}).`, "warn");
  if (r.eligible === true) html += note(`راتبك يستوفي الحد المطلوب لكفالة الأسرة (${m(r.need)}).`, "info");
  html += note("الرسوم الحكومية الرسمية؛ ومراكز الخدمة والطباعة تضيف رسوماً، والأسعار المتداولة قد تكون أعلى.", "info");
  return html;
});
form.querySelector("#insurance")?.addEventListener("input", (e) => (e.target.dataset.touched = "1"));
