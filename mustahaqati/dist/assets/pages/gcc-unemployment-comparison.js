import { gccUnemployment } from "../calc.js";
import { bind, money, table, big, note, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const CUR = { ae: "درهم", sa: "ريال", om: "ريال عماني", bh: "دينار", qa: "ريال قطري", kw: "دينار كويتي" };
const NAME = {
  "ae-iloe": "التأمين ضد التعطل (الإمارات)",
  "ae-nafis": "دعم نافس لمن فقد عمله (للمواطن، دون إضافات الأسرة)",
  "sa-saned": "ساند",
  "sa-hafiz": "حافز",
  "om-job-security": "بدل الأمان الوظيفي",
  "bh-unemployment": "التأمين ضد التعطل (البحرين)",
  "sa-none": "ساند وحافز",
  "om-none": "بدل الأمان الوظيفي",
};
const WHY = {
  resignation: "لا يُصرف للمستقيل",
  disciplinary: "لا يُصرف للمفصول تأديبياً",
  hafizLater: "للباحث عن عمل من 20 إلى 40، ولمن سبق له العمل بعد 24 شهراً من تركه",
  saudiOnly: "ساند وحافز للسعوديين فقط",
  omaniOnly: "بدل الأمان الوظيفي للعُمانيين فقط",
};

bind(form, result, (v) => {
  if (v.wage === null || v.wage === undefined) return null;
  const r = gccUnemployment({ country: v.country, national: v.national !== "no", wage: v.wage, reason: v.reason });
  const m = (x) => money(x, CUR[v.country]);
  if (r.rows[0].why === "notCovered") return big("لم نُدرج هذه الدولة بعد", "—", "") + note("لم نتحقق بعد من أنظمة التعطل في قطر والكويت، فلا نعرض رقماً.", "info");
  const varying = (x) => x.id === "sa-saned" || x.id === "om-job-security";
  const desc = (x) => (varying(x) ? `${m(x.total)} خلال ${monthsAr(x.months)} (يبدأ بـ${m(x.monthly)} شهرياً)` : `${m(x.monthly)} × ${monthsAr(x.months)} = ${m(x.total)}`);
  let html = r.best
    ? big("أكبر ما تستحقه", m(r.best.total), `${NAME[r.best.id]} خلال ${monthsAr(r.best.months)}`)
    : big("لا تعويض متاحاً لحالتك", m(0), "الأسباب أدناه");
  html += table(
    r.rows.map((x) => [NAME[x.id] || "—", x.eligible ? desc(x) : WHY[x.why] || "لا يُستحق", x === r.best ? { strong: true } : { muted: !x.eligible }]),
    "الأنظمة في هذه الدولة"
  );
  const s = r.rows.find((x) => x.id === "sa-saned");
  if (s && s.eligible) html += note(`ساند: ${m(s.monthly)} للأشهر الثلاثة الأولى ثم ${m(s.after)} لتسعة أشهر.`, "info");
  if (r.rows.some((x) => x.id === "om-job-security" && x.eligible)) html += note("عُمان: 60% ستة أشهر ثم 50% ثلاثة ثم 40% ثلاثة؛ والمبلغ الشهري المعروض للأشهر الأولى.", "info");
  if (r.rows.some((x) => x.id === "ae-nafis" && x.eligible)) html += note("نافس: 6 أشهر متتالية و12 شهراً إجمالاً، مع 4,500 للزوج غير العامل و2,400 و2,400 و1,600 للأبناء.", "info");
  html += note("مقارنة تقريبية تفترض استيفاء شرط مدة الاشتراك. احسب حالتك بدقة في حاسبة النظام.", "info");
  return html;
});
