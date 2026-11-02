import { gccLeaveBalance, gccLeaveEncash, gccSickPay, rules } from "../calc.js";
import { bind, money, num, table, big, note, daysAr, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const CUR = { qa: "ريال قطري", kw: "د.ك", om: "ر.ع", bh: "د.ب" };
const annualOnly = form.querySelectorAll("[data-annual]");
const sickOnly = form.querySelectorAll("[data-sick]");
const fracLabel = (f) => (f === 1 ? "بأجر كامل" : f === 0 ? "بدون أجر" : f === 0.75 ? "بثلاثة أرباع الأجر" : f === 0.5 ? "بنصف الأجر" : f === 0.25 ? "بربع الأجر" : `بنسبة ${num(f * 100, 0)}%`);

bind(form, result, (v) => {
  const c = v.country;
  const cur = CUR[c];
  const sick = v.mode === "sick";
  annualOnly.forEach((el) => (el.hidden = sick));
  sickOnly.forEach((el) => (el.hidden = !sick));
  if (!v.basic) return null;
  const w = { basic: v.basic, allowances: v.allowances || 0, social: v.social || 0, divisor: v.divisor, timing: v.timing };

  if (sick) {
    if (v.sickDays === null || v.sickDays === undefined) return null;
    const s = gccSickPay({ country: c, days: v.sickDays, eligible: v.eligible !== false, ...w, divisor: undefined });
    const R = rules[c].sickLeave;
    if (!s.eligible) return big("أجر الإجازة المرضية", money(0, cur), "قبل إكمال 3 أشهر في الخدمة") + note(`لا تُستحق إجازة مرضية بأجر قبل مضي ${R.minServiceMonths} أشهر من الالتحاق بالعمل.`, "warn");
    const rows = s.rows.filter((r) => r.days > 0).map((r) => [`${daysAr(r.days)} ${fracLabel(r.frac)}`, money(r.amount, cur)]);
    let html = big("أجر الإجازة المرضية المستحق", money(s.paid, cur), `${daysAr(Math.min(v.sickDays, R.maxDays))} · على ${s.basis}`);
    html += table(
      [
        [`أجر اليوم (÷ ${s.divisor})`, money(s.daily, cur)],
        ...rows,
        ["المدفوع عن أيام الإجازة", money(s.paid, cur), { strong: true }],
        ["أجر الأيام نفسها لو عملت", money(s.normal, cur), { muted: true }],
        ["الخصم بسبب الإجازة", money(s.deduction, cur)],
        s.employerShare !== null ? ["يتحمله صاحب العمل (الأيام 1–7)", money(s.employerShare, cur)] : null,
        s.fundShare !== null ? ["يعوّضه صندوق الحماية الاجتماعية (من اليوم 8)", money(s.fundShare, cur)] : null,
      ],
      "تفصيل الحساب"
    );
    if (s.exceeded) html += note(`الحد الأقصى ${daysAr(R.maxDays)} في السنة.`, "warn");
    if (c === "qa") html += note("بعد الأسبوعين المدفوعين والأسابيع الأربعة بنصف الأجر تستمر الإجازة بلا أجر، ويجوز لصاحب العمل إنهاء الخدمة في نهاية الأسبوع الثاني عشر إذا أثبت تقرير طبي عجزك عن العودة.", "info");
    if (c === "kw") html += note("حسبنا أجر اليوم على 30 يوماً لأن أيام المرض تقويمية على الأرجح، والنص صامت عن القاسم. الأمراض المستعصية مستثناة بقرار وزاري.", "info");
    if (c === "om") html += note("منذ 19 يوليو 2026 يدفع صاحب العمل الأيام السبعة الأولى، ويعوّضه صندوق الحماية الاجتماعية عما بعدها بالنسب نفسها، للعمانيين وغيرهم. حقك أنت لم يتغير.", "info");
    if (c === "bh") html += note(`رصيد الأيام المدفوعة وبنصف الأجر غير المستخدم يُجمَّع حتى ${daysAr(R.accumulationMaxDays)}، فإن كان لك رصيد متراكم تمتد الأيام المدفوعة بقدره. ويجوز إضافة رصيد إجازتك السنوية إلى المرضية.`, "info");
    return html;
  }

  if (!v.start || !v.end) return null;
  const b = gccLeaveBalance({ country: c, start: v.start, end: v.end, taken: v.taken || 0 });
  if (!b) return note("تاريخ النهاية يجب أن يكون بعد تاريخ المباشرة.", "bad");
  const e = gccLeaveEncash({ country: c, days: b.balance, ...w });
  const dd = (n) => (c === "kw" ? `${num(n, 1)} يوم عمل` : Number.isInteger(Number(n)) ? daysAr(Number(n)) : `${num(n, 1)} يوم`);
  let html = big("بدل رصيد الإجازة السنوية", money(e.amount, cur), `الرصيد ${dd(b.balance)} · على ${e.basis}`);
  html += table(
    [
      ["مدة الخدمة", `${monthsAr(Math.floor(b.months))}${b.months % 1 ? " وكسر" : ""}`],
      ["الإجازة المستحقة عن المدة", dd(b.accrued)],
      ["المستخدم", dd(b.taken)],
      ["الرصيد", dd(b.balance), { strong: true }],
      [`أجر اليوم (${num(e.monthly, 2)} ÷ ${e.divisor})`, money(e.daily, cur)],
      ["البدل", money(e.amount, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  if (c === "qa") {
    if (b.alt !== null) html += note("خدمتك أقل من سنة. المادة 79 تربط الإجازة بإكمال سنة كاملة مستمرة، وتمنح كسور السنة بنسبتها، فالمسألة تحتمل قراءتين: لا بدل وفق القراءة الحرفية، أو البدل المعروض أعلاه بالنسبة.", "warn");
    html += note("الإجازة 21 يوماً لمن خدمته أقل من 5 سنوات و28 يوماً بعدها، والبدل على الأجر الأساسي. ويجوز ترحيل نصف الإجازة فقط إلى السنة التالية بطلب كتابي.", "info");
  }
  if (c === "kw") {
    if (b.belowEligibility) html += note("لا تُستحق الإجازة عن السنة الأولى قبل إكمال 6 أشهر من الخدمة.", "warn");
    html += note("الإجازة 30 يوم عمل لا تُحسب منها أيام الراحة والعطل الرسمية والمرض. القسمة على 26 هي الممارسة الشائعة ولا نص صريح عليها، ويمكنك اختيار القسمة على 30. والتجميع حتى سنتين، وأكثر باتفاق الطرفين.", "info");
  }
  if (c === "om") {
    if (b.belowEligibility) html += note("لا يجوز القيام بالإجازة قبل 6 أشهر من الخدمة، ولا نص يحسم البدل عن رصيد من تنتهي خدمته قبلها.", "warn");
    html += note("القانون لا ينص على احتساب كسور السنة ولا على القاسم، فحسبناها بالنسبة (2.5 يوم عن كل شهر) وبالقسمة على 30 كما في الممارسة. البدل عند انتهاء الخدمة بالأجر الشامل، وأثناء الخدمة بالأساسي وبموافقتك الكتابية.", "info");
  }
  if (c === "bh") html += note("30 يوماً بمعدل 2.5 يوم عن كل شهر، وأيامها تقويمية. على صاحب العمل تسوية رصيدك وأجره كل سنتين على الأكثر، ويسقط بدل الأيام التي حددها صاحب العمل ورفضت القيام بها كتابةً.", "info");
  return html;
});
