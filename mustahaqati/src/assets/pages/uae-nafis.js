import { uaeNafis, rules } from "../calc.js";
import { bind, money, table, big, note, arDate, monthsAr, countAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const N = rules.ae.nafis;
const m = (x) => money(x, "درهم");
const kidsAr = (n) => countAr(n, "ابن واحد", "ابنان", "أبناء", "ابناً", "ابن");
const EDU = { bachelor: "البكالوريوس", diploma: "الدبلوم", highSchool: "الثانوية", below: "دون الثانوية" };
const show = (sel, on) => form.querySelectorAll(sel).forEach((el) => (el.hidden = !on));
const monthLabel = (iso) => arDate(iso).replace(/^\d+ /, "");

bind(form, result, (v) => {
  const emirati = v.category === "emirati";
  show("[data-emirati]", emirati);
  show("[data-wife]", v.category === "wife");
  show("[data-existing]", emirati && v.status === "existing");
  show("[data-below]", emirati && v.education === "below");
  form.querySelector('label[for="children"]').textContent = v.category === "wife" ? "عدد أبنائك" : "عدد الأبناء المستحقين";
  if (v.salary === "" || v.salary === null || v.salary === undefined) return null;
  const r = uaeNafis({
    category: v.category, status: v.status, education: v.education, family: v.family === "yes", salary: v.salary, current: v.current,
    mohre: v.mohre !== "no", children: v.children, claimant: v.claimant, spouseGov: v.spouseGov === "yes", pensionShare: v.pensionShare,
    marriageYears: v.marriageYears, exempt: v.exempt === "yes", today: new Date(),
  });
  const S = r.support;

  if (!emirati) {
    const WHY = {
      degree: "يُشترط بكالوريوس معتمد من وزارة التعليم العالي.",
      belowMin: "الحد الأدنى للراتب الإجمالي 6,000 درهم.",
      aboveMax: `حد الراتب لهذه الفئة ${m(S.maxSalary)}.`,
      family: "يُشترط طفلان على الأقل أو 5 سنوات زواج.",
      exemptYears: "للكوادر الطبية والتعليمية وحاملات الدكتوراه يكفي مرور سنتين على الزواج، ولم تبلغيهما.",
    };
    let html = S.reason ? big("لا يبدو أنك مستحق", m(0), "السبب أدناه") : big("دعم الراتب", `حتى ${m(S.amount)}`, "شهرياً من سبتمبر 2026");
    if (S.reason) html += note(WHY[S.reason], "warn");
    html += note("الفئتان الجديدتان (أبناء المواطنات وزوجات المواطنين) أُعلنتا في أبريل 2026 بدعم «حتى 3,000 درهم» في القطاع الخاص، ولم يُعلن هل المبلغ ثابت أم حد أقصى. وعلاوة الأبناء و«اشتراك» للمواطنين.", "info");
    return html;
  }

  const rows = [];
  let html = "";
  if (v.status === "existing") {
    html += big("مجموع دعم نافس هذا الشهر", m(r.total), "دعم الراتب + علاوة الأبناء");
    rows.push(["دعم الراتب الآن", m(S.amount)]);
  } else {
    html += big("مجموع دعم نافس الشهري", m(r.total), "دعم الراتب + علاوة الأبناء");
    rows.push([`دعم الراتب (${EDU[v.education]})`, m(S.amount)]);
  }
  rows.push([r.child.kids ? `علاوة الأبناء (${kidsAr(r.child.kids)} × ${m(N.child.perChild)})` : "علاوة الأبناء", m(r.child.amount)]);
  rows.push(["المجموع الشهري", m(r.total), { strong: true }]);
  rows.push([`«اشتراك»: حصتك من التقاعد (${Math.round(r.pension.pct * 100)}%) تدفعها نافس عنك`, r.pension.eligible ? m(r.pension.amount) : "لا تنطبق", { muted: !r.pension.eligible }]);
  html += table(rows, "التفصيل");

  if (v.status === "existing" && S.rows.length) {
    const sched = S.rows.map((x) => [x.to ? `${monthLabel(x.from)} – ${monthLabel(x.to)}` : `من ${monthLabel(x.from)}`, m(x.amount)]);
    if (S.remaining !== null && S.remaining > 0) sched.push(["مجموع دعم الراتب من سبتمبر 2026 حتى توقفه", m(S.remaining), { strong: true }]);
    html += table(sched, `جدول دعم الراتب (بدأ من ${m(S.start)})`);
  }

  const notes = [];
  if (v.status === "new") {
    if (S.reason === "belowMin") notes.push(["الحد الأدنى لكل برامج نافس 6,000 درهم إجمالي شهرياً منذ سبتمبر 2026.", "warn"]);
    if (S.reason === "aboveMax") notes.push(["دعم الراتب و«اشتراك» لمن لا يتجاوز راتبه الإجمالي 20,000 درهم، وتبقى علاوة الأبناء حتى 50,000.", "warn"]);
  } else {
    if (S.reason === "suspended") notes.push(["توقف دعم راتبك من 1 سبتمبر 2026 لأن راتبك الإجمالي دون 6,000 في منشأة مشمولة بقرار الحد الأدنى لأجور المواطنين، ويعود عند تصحيح الراتب، وصاحب العمل معرض للمخالفة.", "warn"]);
    if (S.reason === "outside") notes.push(["خارج مظلة الوزارة والمصرف المركزي يُصرف دعمك الحالي كاملاً ستة أشهر ثم 70% ستة أشهر ثم 30% ثلاثة أشهر ثم يتوقف، ما لم يُرفع راتبك إلى 6,000 أو أكثر. وصيغ الإعلانات في هذه الحالة غير متطابقة.", "warn"]);
    if (S.reason === "noCut") notes.push(["دعمك الحالي لا يزيد على المبلغ الجديد لمؤهلك، فلا ينطبق عليه التخفيض.", "info"]);
    if (S.reason === "aboveOld") notes.push(["قواعد 2022 كانت لمن لا يتجاوز راتبه 30,000 درهم، فلا دعم رواتب لك. وإن كنت تتقاضى دعماً فأدخل مبلغه.", "warn"]);
    if (S.assumed === "low" || S.assumed === "high") notes.push([`قدّرنا دعمك الحالي بقواعد نوفمبر 2022 (${m(S.start)})؛ أدخل مبلغك الفعلي إن اختلف.`, "info"]);
    if (S.assumed === "noLegacy") notes.push(["لم نجد مبلغاً قديماً لمن هم دون الثانوية، فافترضنا المبلغ الجديد؛ أدخل مبلغك الفعلي.", "info"]);
    if (S.target > 0 && !S.reason) notes.push([`يستقر دعمك عند المبلغ الجديد لمؤهلك (${m(S.target)}) ما دام راتبك 20,000 أو أقل.`, "info"]);
  }
  const CW = {
    claimant: "تستحق الأم علاوة الأبناء إذا توفي الزوج، أو كانت العائل بحكم محكمة مع عجز الزوج عن الكسب أو تعطله.",
    spouseGov: "لا تُصرف علاوة الأبناء إذا كان الزوج أو الزوجة يعمل في جهة حكومية اتحادية أو محلية.",
    belowMin: "علاوة الأبناء لمن راتبه 6,000 درهم فأكثر.",
    aboveMax: "علاوة الأبناء لمن لا يتجاوز راتبه 50,000 درهم.",
  };
  if (CW[r.child.reason]) notes.push([CW[r.child.reason], "warn"]);
  notes.push(["الحساب استرشادي بقواعد 1 سبتمبر 2026 المعلنة، والقرار لنافس بعد التحقق من بياناتك.", "info"]);
  return html + notes.map(([t, k]) => note(t, k)).join("");
});
