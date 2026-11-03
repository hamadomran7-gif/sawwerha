import { uaeResidencyCheck, rules } from "../calc.js";
import { bind, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const F = rules.ae.residency.fees;
const aed = (x) => `${num(x, 0)} درهم`;
const NAME = {
  "g-skilled": "الذهبية — مهني ماهر",
  "g-property": "الذهبية — مستثمر عقاري",
  "g-investment": "الذهبية — مستثمر (وديعة أو رأس مال أو ضرائب)",
  "g-entrepreneur": "الذهبية — رائد أعمال",
  "g-student": "الذهبية — طالب أو خريج متفوق (لمرة واحدة)",
  "gr-skilled": "الخضراء — موظف ماهر",
  "gr-freelance": "الخضراء — عمل حر",
  "gr-investor": "الخضراء — مستثمر أو شريك",
  retirement: "إقامة المتقاعدين (5 سنوات)",
};
const MAYBE = {
  "g-skilled": "إجماليك يبلغ 30,000 لكن أساسيك أقل؛ النص لا يحدد، ودبي تأخذ الأساسي بحسب مكاتب استشارية.",
  "g-property": "القيمة مليونان فأكثر لكن المسدد أقل؛ صفحة دائرة الأراضي في دبي تطلب مليونين مسددين، ومصادر صحفية تقول إن الشرط أُلغي.",
  "gr-skilled": "إجماليك يبلغ 15,000 لكن أساسيك أقل؛ لا نص يحدد أيهما يُعتمد.",
  "gr-freelance": "مجموع السنتين 360,000 فأكثر، والقراءة الحرفية للنص 360,000 في كل سنة.",
  "gr-investor": "الترشيح لهذه الفئة غير متاح حالياً عبر مكتب أبوظبي للمقيمين.",
  retirement: "اللائحة تكتفي بالسن أو الخدمة، وصفحة إقامة دبي تشترطهما معاً، وبرنامج «تقاعد في دبي» يقبل دخلاً 180,000 أو وديعة 500,000 مع عقار 500,000.",
};
const GAP = {
  "g-skilled": (g) => `ينقصك ${aed(g)} من الراتب الشهري`,
  "g-property": (g) => `ينقصك ${aed(g)} من قيمة العقار أو المسدد منه`,
  "g-investment": (g) => `ينقصك ${aed(g)} من الاستثمار`,
  "g-entrepreneur": (g) => `ينقصك ${aed(g)} من الإيرادات السنوية`,
  "gr-skilled": (g) => `ينقصك ${aed(g)} من الراتب الشهري`,
  "gr-freelance": (g) => `ينقصك ${aed(g)} من الدخل`,
  "gr-investor": (g) => `ينقصك ${aed(g)} من الاستثمار`,
};

bind(form, result, (v) => {
  form.querySelectorAll("[data-student]").forEach((el) => (el.hidden = v.student === "none"));
  const r = uaeResidencyCheck({
    emirate: v.emirate, employed: v.employed === "yes", skill: v.skill, degree: v.degree, basic: v.basic, total: v.total,
    propertyValue: v.propertyValue, mortgage: v.mortgage, investment: v.investment, revenue: v.revenue, annualTax: v.annualTax,
    freelance: v.freelance === "yes", freelanceIncome1: v.freelanceIncome1, freelanceIncome2: v.freelanceIncome2,
    age: v.age, serviceYears: v.serviceYears, deposit: v.deposit, annualIncome: v.annualIncome,
    student: v.student, score: v.score, yearsSinceGrad: v.yearsSinceGrad,
  });
  const yes = r.eligible, maybe = r.possible;
  const golden = yes.some((x) => x.visa === "golden");
  const headline = golden ? "يرجح أنك تستحق الإقامة الذهبية" : yes.some((x) => x.visa === "green") ? "يرجح أنك تستحق الإقامة الخضراء" : yes.length ? "يرجح أنك تستحق إقامة المتقاعدين" : maybe.length ? "أهليتك محتملة وتحتاج تحققاً" : "لا تستوفي العتبات المنشورة حالياً";
  const sub = yes.length ? yes.map((x) => NAME[x.id]).join(" · ") : maybe.length ? maybe.map((x) => NAME[x.id]).join(" · ") : "راجع ما ينقصك أدناه";
  let html = big("النتيجة", headline, sub);
  if (yes.length) html += table(yes.map((x) => [NAME[x.id], "مؤهل", { strong: true }]), "تستوفي الشروط");
  if (maybe.length) html += table(maybe.map((x) => [NAME[x.id], MAYBE[x.id] || "تحقق من الجهة المختصة"]), "محتمل — تحقق");
  const close = r.results.filter((x) => x.status === "no" && x.gap > 0).sort((a, b) => a.gap - b.gap).slice(0, 3);
  if (close.length) html += table(close.map((x) => [NAME[x.id], GAP[x.id] ? GAP[x.id](x.gap) : "غير مستوفٍ"]), "الأقرب إليك");
  if (golden || yes.some((x) => x.visa !== "golden")) {
    html += table(
      [
        golden ? ["الذهبية: رسوم الهيئة الاتحادية مع الهوية لعشر سنوات (داخل الدولة)", `نحو ${aed(F.goldenIcpEstimate)}`] : null,
        golden && v.emirate === "dubai" ? ["الذهبية في دبي: إقامة الإدارة العامة مع الرسوم الإضافية", `نحو ${aed(F.gdrfaGolden)} + الهوية`] : null,
        golden && yes.some((x) => x.id === "g-property") && v.emirate === "dubai" ? ["باقة دائرة الأراضي لذهبية العقار (شاملة)", aed(F.dldGoldenPackage)] : null,
        yes.some((x) => x.visa === "green") ? ["الخضراء: رسوم الهيئة الاتحادية مع الهوية لخمس سنوات", `نحو ${aed(F.greenIcpEstimate)}`] : null,
      ],
      "الرسوم التقريبية (دون الفحص الطبي والتأمين)"
    );
  }
  html += note("المسارات بالترشيح (العلماء، والمواهب، والمخترعون، والعمل الإنساني، وخط الدفاع الأول، والمعلمون والممرضون في برامج محلية) لا تحسبها الأداة؛ تقدّم عبر الجهة المرشِّحة.", "info");
  html += note("الأداة تقديرية والقرار للهيئة الاتحادية للهوية والجنسية أو إقامة دبي عند التقديم، ويُشترط تأمين صحي ساري في كل الفئات.", "warn");
  return html;
});
