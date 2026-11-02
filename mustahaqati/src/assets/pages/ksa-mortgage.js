import { ksaMortgage, rules } from "../calc.js";
import { bind, money, num, table, big, note, yearsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const BIND = { dbr: "راتبك ونسبة الاستقطاع", ltv: "نسبة التمويل إلى قيمة العقار", need: "سعر العقار بعد الدعم" };
const p0 = (x) => `${num(x * 100, 2)}%`;

bind(form, result, (v) => {
  if (!v.salary || !v.price) return null;
  const H = rules.sa.homeFinance;
  const maxAge = v.maxAge || H.ageAtMaturityDefault;
  const supportOk = v.citizen !== "no" && v.firstHome !== "no";
  const supportNote = v.support !== "none" && !supportOk ? note("الدعم السكني للمواطن في مسكنه الأول، فلم يُحتسب.", "warn") : "";
  const m = ksaMortgage({
    salary: v.salary,
    otherIncome: v.otherIncome,
    personal: v.personal,
    otherDebts: v.otherDebts,
    retiree: v.retiree === "yes",
    price: v.price,
    apr: v.apr ?? H.aprIndicativeDefault,
    years: v.years || H.tenorMaxYearsDefault,
    age: v.age || 35,
    maxAge,
    tenorCap: Number(v.tenorCap) || H.tenorMaxYearsDefault,
    citizen: v.citizen !== "no",
    firstHome: v.firstHome !== "no",
    lender: v.lender,
    support: supportOk ? v.support : "none",
    redfReduced: v.redfReduced,
    capMode: v.capMode,
  });

  if (!m.years) return big("أقصى تمويل عقاري", money(0, cur), "لا تتسع المدة") + note(`عمرك بلغ أقصى عمر يقبله البنك عند آخر قسط (${maxAge} سنة). بعض البنوك تقبل حتى 77 سنة، فعدّل الحد من الخيارات المتقدمة.`, "warn");
  if (m.maxInstallment <= 0) return big("أقصى تمويل عقاري", money(0, cur), "التزاماتك تستنفد نسبة الاستقطاع") + note(`سقف الاستقطاع الكلي ${p0(m.cap)} من دخلك (${money(m.cap * m.income, cur)})، والتزاماتك الحالية تبلغه أو تتجاوزه. سدّد بعضها أولاً.`, "warn") + (m.salaryCapOk ? "" : note(`أقساط تمويلك الشخصي تتجاوز ${p0(m.salaryCapPct)} من راتبك، وهو الحد النظامي ${v.retiree === "yes" ? "للمتقاعد" : "للموظف"}.`, "warn"));

  let html = big("أقصى تمويل عقاري لك", money(m.loan, cur), `القسط ${money(m.installment, cur)} شهرياً لمدة ${yearsAr(m.years)}`);
  html += table(
    [
      [`حسب راتبك: قسط أقصى ${num(m.maxInstallment, 0)} ريال (${p0(m.cap)} من الدخل ناقص التزاماتك)`, money(m.loanDbr, cur)],
      [`حسب قيمة العقار: ${p0(m.ltv)} من السعر`, money(m.loanLtv, cur)],
      m.dpSupport ? ["المطلوب بعد دعم الدفعة المقدمة", money(m.need, cur)] : null,
      ["التمويل الممكن (الأقل بينها)", money(m.loan, cur), { strong: true }],
      ["ما يحد تمويلك", BIND[m.binding]],
      [`أقصى سعر عقار يناسب راتبك (بدفعة ${p0(1 - m.ltvBasic)})`, money(m.maxPrice, cur)],
    ],
    "حدود التمويل"
  );
  html += table(
    [
      ["القسط الشهري", money(m.installment, cur)],
      ["الاستقطاع الكلي بعد التمويل", p0(m.dbrAfter)],
      ["إجمالي السداد", money(m.totalPaid, cur)],
      ["منه أرباح", money(m.profit, cur)],
    ],
    "القسط والتكلفة"
  );
  html += table(
    [
      ["الدفعة المقدمة من مالك", money(m.downPayment, cur)],
      m.dpSupport ? ["دعم الدفعة المقدمة (غير مسترد)", money(m.dpSupport, cur)] : null,
      ["الرسوم الإدارية", money(m.adminFee, cur)],
      ["ضريبة القيمة المضافة على الرسوم", money(m.adminFeeVat, cur)],
      ["المطلوب منك عند التوقيع", money(m.cashAtSigning, cur), { strong: true }],
      m.rett
        ? ["ضريبة التصرفات العقارية 5% إن اتُّفق على تحميلها لك", money(m.rett, cur)]
        : ["ضريبة التصرفات العقارية", `0 (تتحمل الدولة ${num(m.rettExempt, 0)} ريال عن المسكن الأول)`],
    ],
    "عند الشراء"
  );

  if (!m.salaryCapOk) html += note(`أقساط تمويلك الشخصي تتجاوز ${p0(m.salaryCapPct)} من راتبك، وهو الحد النظامي ${v.retiree === "yes" ? "للمتقاعد" : "للموظف"}، وقد يشترط البنك سداد جزء منها.`, "warn");
  if (!m.nonMortgageOk) html += note("التزاماتك غير العقارية تتجاوز 45% من دخلك، وهو حد نظامي لمن دخله أقل من 25,000 ريال، وقد يرفض البنك الطلب حتى تخفضها.", "warn");
  if (m.limitedBy === "age") html += note(`قُصرت المدة إلى ${yearsAr(m.years)} حتى لا يتجاوز عمرك ${maxAge} سنة عند آخر قسط. بعض البنوك تقبل حتى 75 أو 77 سنة.`, "info");
  if (m.limitedBy === "tenor") html += note(`قُصرت المدة إلى ${yearsAr(m.years)}، وهي أقصى مدة اخترتها. بعض البنوك تمنح 30 سنة.`, "info");
  if (m.binding === "dbr" && m.downPayment > (1 - m.ltv) * v.price + 1) html += note("راتبك هو ما يحد التمويل، فتحتاج دفعة أكبر من الحد الأدنى. يرفع التمويل: مدة أطول، أو سداد التزامات قائمة، أو عقار أقل سعراً.", "info");
  if (m.band === "low") html += note(`دخلك في شريحة 15,000 ريال فأقل، فالسقف الكلي ${p0(m.cap)}. النص النظامي يسمح بـ65% لمستفيد الدعم السكني، والبنوك تطبق 55% منذ سبتمبر 2025 بحسب ما نقلته الصحافة.`, "info");
  if (m.band === "high") html += note(v.capMode === "high70" ? "لدخل 25,000 ريال فأكثر لا سقف نظامياً كلياً، والقرار لسياسة البنك. اخترت 70%، وهو أعلى ما يعلنه بعض البنوك." : "لدخل 25,000 ريال فأكثر لا سقف نظامياً كلياً، والقرار لسياسة البنك. الحاسبة تفترض 65%، ويرفعه بعض البنوك إلى 70%.", "info");
  html += supportNote;
  if (v.support === "profit" && supportOk) {
    html += note(
      m.profitSubsidyFirstMonth !== null
        ? `دعم الأرباح: يتحمل الصندوق أرباح أول 500,000 من التمويل لمدة 20 سنة. يبلغ في الشهر الأول نحو ${money(m.profitSubsidyFirstMonth, cur)} ويتناقص مع السداد، فيقل ما تدفعه فعلاً عن القسط أعلاه.`
        : "دعم الأرباح لدخل فوق 14,000 ريال بنسبة أقل من 100% حسب مصفوفة الصندوق؛ تحقق من نسبتك في سكني.",
      "info"
    );
  }
  if (v.citizen === "no") html += note("غير السعودي: تمويل حتى 70% في البنوك، وتطلب بعض البنوك دفعة 30% فأكثر، ولا يجوز تمويل العقار لغير السعوديين في مكة المكرمة والمدينة المنورة.", "info");
  if (v.redfReduced && v.price > H.redfDpReductionMaxPrice) html += note("برنامج تخفيض الدفعة المقدمة لا ينطبق لأن سعر العقار فوق 800,000 ريال.", "info");
  html += note("الأرقام تقديرية: معدل الربح وأقصى مدة وعمر يحددها البنك، ويعتمد عادة الأقل بين سعر العقار وتقييمه.", "info");
  return html;
});
