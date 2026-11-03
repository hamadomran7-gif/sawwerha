import { uaeNetSalary, kuwaitNetSalary, qatarNetSalary, bahrainNetSalary, omanNetSalary, rules } from "../calc.js";
import { bind, money, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cc = form.dataset.country;
const CUR = { ae: "درهم", kw: "دينار", qa: "ريال", bh: "دينار", om: "ريال" }[cc];
const m = (x) => money(x, CUR);
const show = (sel, on) => form.querySelectorAll(sel).forEach((el) => (el.hidden = !on));
const L = {
  pension: "اشتراك المعاش", basic: "التأمين الأساسي (حتى 1,500)", supplementary: "التأمين التكميلي (1,500–2,750)", increase: "زيادة المعاشات", reward: "المكافأة المالية",
  unemployment: cc === "bh" ? "التأمين ضد التعطل" : "التأمين ضد البطالة", injury: "إصابات العمل", eos: "مكافأة نهاية الخدمة (لدى الهيئة)", maternity: "تأمين الأمومة", sick: "تأمين الإجازات المرضية", jobSecurity: "الأمان الوظيفي",
};

function compute(v) {
  const national = v.national !== "no";
  show("[data-national]", national);
  show("[data-expat]", !national);
  if (cc === "ae") { show("[data-nafis]", national && v.sector === "private"); return uaeNetSalary({ national, fund: v.fund, sector: v.sector, basic: v.basic, housing: v.housing, other: v.other, nafis: v.nafis === "yes" }); }
  if (cc === "kw") return kuwaitNetSalary({ national, sector: v.sector, salary: v.salary });
  if (cc === "qa") return qatarNetSalary({ national, basic: v.basic, social: v.social, housing: v.housing, other: v.other });
  if (cc === "bh") { show("[data-private]", national && v.sector !== "government"); return bahrainNetSalary({ national, sector: v.sector, basic: v.basic, allowances: v.allowances, year: v.year, over3: v.over3 === "yes" }); }
  if (cc === "om") return omanNetSalary({ national, gross: v.gross, basic: v.basic, today: new Date() });
  return null;
}

function notes(r, v) {
  const out = [];
  if (cc === "ae") {
    if (!r.national) out.push([`لا يُقتطع من الوافد اشتراك تقاعدي، ومكافأة نهاية الخدمة يدفعها صاحب العمل عند انتهاء العقد. وعليه قسط التأمين ضد التعطل ${m(r.iloePremium)} شهرياً، يُدفع عادة خارج كشف الراتب.`, "info"]);
    else {
      if (r.nafis) out.push([`برنامج «اشتراك» من نافس يدفع عنك حصتك (${m(r.nafis)}) لأن راتبك بين 6,000 و20,000، فلا يُقتطع منك شيء.`, "info"]);
      if (r.raisedToMin) out.push(["راتب الاشتراك أقل من الحد الأدنى، فاحتُسب على الحد الأدنى.", "info"]);
      if (r.capped) out.push(["قُصّ راتب الاشتراك إلى الحد الأعلى للصندوق.", "info"]);
      if (v.fund === "gpssaNew" && v.sector === "private" && r.base >= 20000) out.push(["من 20,000 فأكثر لا تتحمل الحكومة 2.5% عن صاحب العمل، فيدفع 15% كاملة.", "info"]);
      if (v.fund === "adpfCurrent") out.push(["وتدفع حكومة أبوظبي 6% سنوياً من الميزانية العامة للمشترك الحالي.", "info"]);
      if (v.fund === "sharjah") out.push(["في صندوق الشارقة لا يدخل بدل السكن في راتب الاشتراك، فاستبعدناه.", "info"]);
      if (v.sector === "government") out.push(["في القطاع الحكومي راتب الاشتراك الأساسي مع علاوات محددة (غلاء المعيشة والاجتماعية والسكن)، فأدخل ما يدخل منها فقط.", "info"]);
    }
  }
  if (cc === "kw") {
    if (!r.national) out.push(["الوافد لا يُؤمَّن عليه لدى المؤسسة العامة للتأمينات الاجتماعية، فالصافي هو الإجمالي.", "info"]);
    else {
      if (r.raisedToMin) out.push(["الحد الأدنى للأجر الخاضع في القطاع الأهلي 230 ديناراً، فاحتُسب عليه.", "info"]);
      if (r.capped) out.push(["لا اشتراك على ما زاد على 2,750 ديناراً.", "info"]);
      out.push(["المكافأة المالية تتوقف بعد 18 سنة اشتراك من 2015، والتأمين ضد البطالة للقطاع الأهلي والنفطي فقط، وللخزانة العامة حصة لا تمس صافيك.", "info"]);
    }
  }
  if (cc === "qa") {
    if (!r.national) out.push(["الوافد خارج نظام التأمينات القطري، فلا يُقتطع منه شيء، والتأمين الصحي الإلزامي على صاحب العمل.", "info"]);
    else {
      if (r.housingCapped) out.push(["يدخل بدل السكن في راتب الاشتراك بحد أقصى 6,000 ريال.", "info"]);
      if (r.capped) out.push(["قُصّ راتب الاشتراك إلى 100,000 ريال.", "info"]);
      out.push(["السكن العيني يُحسب كأنه بدل نقدي؛ فأدخل قيمته في خانة السكن. والبدلات الأخرى لا تدخل في راتب الاشتراك.", "info"]);
    }
  }
  if (cc === "bh") {
    if (!r.national) out.push([`يدفع صاحب العمل للهيئة منذ مارس 2024 اشتراك مكافأة نهاية الخدمة بنسبة ${(r.eosPct * 100).toFixed(1)}% من أجرك (4.2% في أول 3 سنوات ثم 8.4%)، وإصابات العمل 3%، ويُقتطع منك 1% للتعطل.`, "info"]);
    else if (r.government) out.push(["في الحكومة على الراتب الأساسي: 7% عليك و20% على جهة العمل (منها 3% للإصابات)، و1% للتعطل.", "info"]);
    else {
      out.push([`حصة صاحب العمل في المعاش ${(r.employerPct * 100).toFixed(0)}% في ${v.year || 2026}، وترتفع 1% كل يناير حتى 17% في 2028. ويتحمل صندوق العمل حصة صاحب العمل في التعطل.`, "info"]);
      if (r.allowancesCapped) out.push(["البدلات الثابتة تدخل في الأجر الخاضع بحد أقصى 100% من الأساسي.", "info"]);
      if (r.capped) out.push(["الحد الأعلى للأجر الخاضع 4,000 دينار.", "info"]);
    }
  }
  if (cc === "om") {
    if (!r.national) out.push([`لا يُقتطع من الوافد شيء. وسيبدأ نظام ادخار 9% من الأساسي على صاحب العمل بحد أقصى 19 يوليو 2027${r.futureSavings ? ` (نحو ${m(r.futureSavings)} شهرياً)` : ""}، وإصابات العمل 1% بحد أقصى 19 يوليو 2028.`, "info"]);
    else {
      if (r.capped) out.push(["المعاش وإصابات العمل على 3,000 ريال كحد أقصى، والأمومة والمرضية والأمان الوظيفي على كامل الأجر.", "info"]);
      out.push(["الأجر الخاضع إجمالي الأجر بكل البدلات. والأمان الوظيفي للعُمانيين فقط.", "info"]);
    }
  }
  return out;
}

bind(form, result, (v) => {
  const r = compute(v);
  if (!r || !r.gross) return null;
  let html = big("راتبك الصافي", m(r.net), r.employee ? `بعد اقتطاع ${m(r.employee)} للتأمينات` : "لا يُقتطع من راتبك اشتراك");
  const ee = r.rows.filter((x) => x.employee);
  const er = r.rows.filter((x) => x.employer);
  if (ee.length) html += table([...ee.map((x) => [L[x.id], m(x.employee)]), ["مجموع ما يُقتطع منك", m(r.employee), { strong: true }]], "ما يُقتطع من راتبك");
  if (er.length) html += table([...er.map((x) => [L[x.id], m(x.employer)]), ["مجموع حصة صاحب العمل", m(r.employer), { strong: true }]], "ما يدفعه صاحب العمل فوق راتبك");
  html += table([["إجمالي الراتب", m(r.gross)], r.base ? ["راتب حساب الاشتراك", m(r.base)] : null, ["الصافي", m(r.net), { strong: true }], ["كلفتك على صاحب العمل", m(r.cost)], r.gov ? ["حصة الحكومة", m(r.gov)] : null], "الملخص");
  return html + notes(r, v).map(([t, k]) => note(t, k)).join("");
});
