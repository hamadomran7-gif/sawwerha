import { ksaAllowance500, ksaPayDate } from "../calc.js";
import { bind, money, num, table, big, note, arDate } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const survField = form.querySelector("[data-survivors]");
const NAMES = { civil: "موظف مدني", military: "عسكري", operating: "متعاقد على بنود التشغيل", retiree: "متقاعد", survivors: "مستحق عن متوفى", socialSecurity: "أسرة الضمان الاجتماعي", saned: "مستفيد ساند", private: "القطاع الخاص" };
const sync = () => { survField.hidden = form.category.value !== "survivors"; };
form.category.addEventListener("change", sync);

bind(form, result, (v) => {
  sync();
  const s = ksaAllowance500({ category: v.category, income: v.income, survivors: v.survivors, kwh: v.kwh, amps: v.amps, m3: v.m3 });
  let html;
  if (!s.eligible) {
    html = big("بدل 500 ريال", "لا يشملك", NAMES[s.category]);
    html += note(s.category === "saned" ? "أعلنت التأمينات أن البدل لا يشمل مستفيدي ساند." : "البدل لموظفي الدولة المدنيين والعسكريين والمتقاعدين وأسر الضمان. وفي القطاع الخاص رُفع حد احتساب السعودي في نطاقات إلى 5,000 ثم 6,000.", "warn");
  } else {
    const sub = s.category === "socialSecurity" ? "دعم شهري للأسرة · الموعد لم يُعلن" : "من يناير 2027";
    html = big("بدلك الشهري", money(s.amount, cur), `${NAMES[s.category]} · ${sub}`);
    const rows = [
      ["البدل الشهري", money(s.amount, cur), { strong: true }],
      ["سنوياً", money(s.annual, cur)],
      s.income ? ["دخلك الشهري الحالي", money(s.income, cur)] : null,
      s.income ? [`دخلك من يناير 2027 (+${num(s.pct, 1)}%)`, money(s.newIncome, cur), { strong: true }] : null,
    ];
    if (["civil", "military", "operating"].includes(s.category)) {
      const p = ksaPayDate({ item: "salary", year: 2027, month: 1 });
      if (p && p.date) rows.push(["أول راتب متوقع بالبدل", arDate(p.date)]);
    }
    html += table(rows, "تفصيل البدل");
  }
  if (s.hasBills) {
    html += table(
      [
        ["فاتورة الكهرباء الآن ← 2027", `${money(s.electricity.old, cur)} ← ${money(s.electricity.new, cur)}`],
        ["فاتورة المياه الآن ← 2027", `${money(s.water.old, cur)} ← ${money(s.water.new, cur)}`],
        ["زيادة الفاتورتين شهرياً", `+ ${money(s.billIncrease, cur)}`],
        [s.net >= 0 ? "يبقى من البدل بعد الزيادة" : "الزيادة تتجاوز البدل بـ", money(Math.abs(s.net), cur), { strong: true }],
      ],
      "البدل مقابل فواتير 2027"
    );
    html += note("الفواتير شاملة ضريبة 15%، بتعرفة 2027 للمسكن، ولا تشمل رسم العداد الحالي غير المنشور، فقد تكون الزيادة الفعلية أقل قليلاً.", "info");
  }
  if (s.category === "survivors") html += note("أعلنت التأمينات أن البدل يُقسم بالتساوي بين المستحقين عن المتوفى.", "info");
  if (s.category === "retiree") html += note("للمتقاعدين تلقائياً بلا طلب من 1 يناير 2027، وبدل واحد لمن له أكثر من معاش. والمعاشات تُصرف يوم 1 من كل شهر.", "info");
  if (s.category === "socialSecurity") html += note("الدعم لأسر الضمان «وفق الآليات والضوابط المنظمة»، ولم يُعلن موعده ولا هل هو لكل أسرة أم لكل فرد حتى 3 نوفمبر 2026.", "warn");
  if (s.eligible && s.category !== "socialSecurity") html += note("البدل لا يُضاف إلى الراتب الأساسي بحسب ما نُقل، فلا يُستقطع منه للتقاعد ولا يغيّر المعاش أو العلاوة.", "info");
  return html;
});
