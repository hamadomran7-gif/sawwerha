import { ksaCivilPension, ksaMilitaryPension, rules } from "../calc.js";
import { bind, money, num, table, big, note, duration, monthsAr, yearsGen, monthsGen } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const ym = (m) => (m ? duration({ years: Math.floor(m / 12), months: m % 12 }) : "0 شهر");
const ymGen = (m) => [Math.floor(m / 12) ? yearsGen(Math.floor(m / 12)) : "", m % 12 ? monthsGen(m % 12) : ""].filter(Boolean).join(" و");
const pct = (p) => `${num(p * 100, 2)}%`;

const toggle = () => {
  const s = form.system.value;
  form.querySelectorAll("[data-calc]").forEach((el) => (el.hidden = s === "new"));
  form.querySelectorAll("[data-civil]").forEach((el) => (el.hidden = s !== "civil"));
  form.querySelectorAll("[data-mil]").forEach((el) => (el.hidden = s !== "military"));
  form.querySelectorAll("[data-trans]").forEach((el) => (el.hidden = s !== "civil" || form.transitional.value !== "yes"));
};

const STATUS = {
  pension: "معاش يُصرف من اليوم التالي لانتهاء الخدمة",
  pension_conditional: "معاش بشرط موافقة الجهة على طلب التقاعد",
  deferred: "معاش مؤجل يُصرف عند بلوغ الستين",
  notional: "شراء مدة عند الستين أو مكافأة",
  lump: "مكافأة تُصرف عند الستين أو الوفاة",
};

bind(form, result, (v) => {
  toggle();
  if (v.system === "new") {
    return note(`من التحق بوظيفة حكومية لأول مرة من 3 يوليو 2024 يخضع لنظام التأمينات الاجتماعية الجديد: 2.25% من متوسط الأجر عن كل سنة، وسن 65، والمبكر بـ360 شهراً من عمر 55 بخصم 3% لكل سنة. احسب معاشك في <a href="../ksa-retirement-pension/">حاسبة معاش التأمينات</a> باختيار «النظام الجديد».`, "info");
  }
  const basic = Number(v.basic) || 0;
  const months = Math.max(0, Math.floor(Number(v.years) || 0)) * 12 + Math.min(11, Math.max(0, Math.floor(Number(v.months) || 0)));
  if (!basic || !months) return null;

  if (v.system === "military") {
    const M = rules.sa.militaryPension;
    const r = ksaMilitaryPension({ lastSalary: basic, months, civilMonths: v.civilMonths || 0, age: v.age || 0 });
    let html = r.eligible
      ? big("معاشك العسكري التقديري", money(r.pension, cur), `${pct(r.pct)} من آخر راتب`)
      : big("لا تستوفي شروط المعاش العسكري", money(0, cur), "تُصرف مكافأة بدلاً منه");
    html += table(
      [
        ["الخدمة العسكرية", ym(months)],
        v.civilMonths ? ["الخدمة المدنية المضمومة", ym(Number(v.civilMonths))] : null,
        ["المدة المحسوبة", `${ym(r.counted)}${r.counted >= M.maxMonthsInferred ? " (الحد الأقصى)" : ""}`],
        ["المعادلة", `${money(basic, cur)} × ${num(r.counted, 0)} ÷ ${M.divisorMonths}`],
        [r.eligible ? "المعاش الشهري" : "المعاش لو استوفيت الشروط", money(r.pension, cur), r.eligible ? { strong: true } : { muted: true }],
      ],
      "تفصيل الحساب"
    );
    if (!r.eligible) html += note(`شروط المعاش العسكري: خدمة عسكرية فعلية ${num(M.minActualMonths / 12, 0)} سنة، أو ${num(M.minCombinedMonths / 12, 0)} سنة مدنية وعسكرية منها ${num(M.minMilitaryWithinCombined / 12, 0)} عسكرية، أو بلوغ ${M.pensionAtAge} سنة. ومن لا يستوفيها تُصرف له مكافأة وفق المادتين 9 و10 من نظام التقاعد العسكري، ولم نتحقق من نسبها.`, "warn");
    html += note("الحد الأقصى 100% عند 35 سنة استنتاجاً من القاسم. وسن الإحالة تختلف بحسب الرتبة، ولم نتحقق من الحد الأدنى للمعاش العسكري.", "info");
    return html;
  }

  const C = rules.sa.civilPension;
  const transitional = v.transitional === "yes";
  const r = ksaCivilPension({ lastBasic: basic, months, reason: v.reason, transitional, monthsAt2024: v.at2024 || 0 });
  const paysPension = r.status === "pension" || r.status === "pension_conditional" || r.status === "deferred";
  let html;
  if (paysPension) html = big(r.status === "deferred" ? "معاشك المؤجل التقديري" : "معاشك الشهري التقديري", money(r.pension, cur), `${STATUS[r.status]} · ${pct(r.pct)} من آخر راتب`);
  else if (r.status === "notional") html = big("خياران عند بلوغ الستين", `${money(r.pensionAfterBuy, cur)} شهرياً`, `بعد شراء ${ymGen(r.buyMonths)}، أو مكافأة ${money(r.lump, cur)}`);
  else html = big("مكافأة نهاية الخدمة التقديرية", money(r.lump, cur), STATUS.lump);

  const rows = [
    ["مدة الخدمة", `${ym(months)} (${monthsAr(months)})`],
    ["المدة المحسوبة في المعاش", `${monthsAr(r.counted)}${months > C.maxMonths ? " (الحد الأقصى)" : ""}`],
    ["المعادلة", `${money(basic, cur)} × ${num(r.counted, 0)} ÷ ${C.divisorMonths}`],
    [paysPension ? "المعاش بالمعادلة" : "المعاش بالمعادلة لو استوفيت شروطه", money(r.pension, cur), paysPension ? { strong: true } : { muted: true }],
    ["المدة اللازمة للمعاش عند الاستقالة", `${monthsAr(r.anyExitRequired)}${transitional ? " (الفئة المشمولة)" : ""}`],
    ["النتيجة", STATUS[r.status]],
  ];
  if (r.status === "notional" || r.status === "lump") {
    rows.push([`المكافأة (${num(r.lumpRate * 100, 0)}% × الراتب السنوي × السنوات)`, money(r.lump, cur), { strong: r.status === "lump" }]);
  }
  if (r.status === "notional") {
    rows.push([`كلفة شراء ${ymGen(r.buyMonths)} (18% من آخر راتب للشهر)`, money(r.buyCost, cur)]);
    rows.push(["المعاش بعد الشراء (10 سنوات ÷ 40)", money(r.pensionAfterBuy, cur), { strong: true }]);
  }
  html += table(rows, "تفصيل الحساب");

  if (r.status === "pension_conditional") html += note("التقاعد بخدمة 20 سنة يحتاج موافقة جهة التعيين، وهي مقيدة منذ 2021، ومنذ فبراير 2026 تبت لجنة وزارية في طلبات من صُنفوا فائض قوى عاملة. إن رُفض الطلب واستقلت فمعاشك مؤجل إلى الستين.", "warn");
  if (r.status === "deferred") html += note(`انتهت خدمتك قبل شروط المعاش الفوري، وخدمتك ${num(C.deferredMinMonths / 12, 0)} سنوات فأكثر، فيُصرف معاشك عند بلوغ الستين بدلاً من المكافأة (المادة 23 مكرر).`, "info");
  if (r.status === "notional") html += note("يجوز لمن خدم 5 سنوات إلى أقل من 10 أن يضم عند الستين مدة اعتبارية تكمل 10 سنوات بأداء كامل الحصص عنها محسوبة على آخر راتب، دفعة أو أقساطاً. نسبة 18% (9% + 9%) قراءتنا للنص، والكلفة النهائية تحددها التأمينات.", "info");
  if (r.status === "notional" || r.status === "lump") html += note("المكافأة 14% من الراتب السنوي (آخر راتب × 12) عن كل سنة، و10% للاستقالة أو الفصل التأديبي، وكسر السنة بالتناسب. تُصرف عند بلوغ الستين أو الوفاة أيهما أسبق، لا عند ترك العمل.", "info");
  if (paysPension && r.belowMin) html += note(`المعاش بالمعادلة أقل من ${money(C.minPensionUnverified, cur)}، وهو الحد الأدنى المعمول به في التأمينات. لم نجد نصاً رسمياً يؤكد تطبيقه على التقاعد المدني، فإن طُبق رُفع معاشك إليه.`, "warn");
  if (transitional) html += note("أنت من الفئة المشمولة بتعديلات 2024: تتغير سنك النظامية والمدة اللازمة للمعاش قبل السن، والمعادلة كما هي. ولم يُحسم بعد هل يبقى لك خيار 20 سنة بالموافقة، ولا أثر الإحالة الحتمية عند الستين الهجرية قبل سنك الجديدة. احسب سنك الجديدة في حاسبة معاش التأمينات.", "warn");
  html += note("الحساب تقديري ويفترض أن المدة كلها خدمة فعلية محسوبة. ومن ضم مدداً من التأمينات بتبادل المنافع يُحسب معاشه على آخر راتب مدني عن مجموع المدد، لكن المدد المضمومة لا تكمل شرط المعاش قبل الستين منذ 2022 إلا في حالات محددة.", "info");
  return html;
});
