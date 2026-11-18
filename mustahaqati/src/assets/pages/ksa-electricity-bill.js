import { ksaElectricityBill, rules } from "../calc.js";
import { bind, money, num, table, big, note, countAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const hal = (p) => `${num(p * 100, 0)} هللة`;
const riyalAr = (x) => countAr(x, "ريال واحد", "ريالان", "ريالات", "ريالاً", "ريال");
const ampsEl = form.querySelector("#amps");
const ampsText = ampsEl ? [...ampsEl.options].map((o) => o.textContent.replace(/\s*\(.*\)$/, "")) : [];

bind(form, result, (v) => {
  const res = v.sector === "residential";
  form.querySelectorAll("[data-res]").forEach((el) => (el.hidden = !res));
  form.querySelectorAll("[data-other]").forEach((el) => (el.hidden = res));
  const E = rules.sa.electricity;
  // تسميات سعة القاطع بمبالغ القطاع المختار من جدول الشركة السعودية للطاقة
  const fees = res ? E.residentialFixed.map((b) => b[2]) : E.sectorFixed[v.sector] || [];
  if (ampsEl) [...ampsEl.options].forEach((o, i) => (o.textContent = fees[i] !== undefined ? `${ampsText[i]} (${riyalAr(fees[i])})` : ampsText[i]));
  if (v.kwh === null || v.kwh === undefined) return null;
  const manual = !res && v.fixedOther !== null && v.fixedOther !== undefined && v.fixedOther !== "";
  const n = ksaElectricityBill({ kwh: v.kwh, sector: v.sector, amps: v.amps, days: v.days || 30, tariff: "new", fixedOverride: res ? null : v.fixedOther });
  let html = big("فاتورتك الشهرية بتعرفة 2027 (شاملة الضريبة)", money(n.total, cur), `قبل الضريبة ${money(n.subtotal, cur)} · ${num(Number(v.kwh) || 0, 0)} ك.و.س`);
  const rows = [
    [`أول ${num(Math.min(Number(v.kwh) || 0, E.tierKwh), 0)} ك.و.س × ${hal(n.p1)}`, money(n.t1 * n.p1, cur)],
    n.t2 > 0 ? [`ما زاد: ${num(n.t2, 0)} ك.و.س × ${hal(n.p2)}`, money(n.t2 * n.p2, cur)] : null,
    ["الاستهلاك", money(n.consumption, cur)],
    [`الرسوم الثابتة (${money(n.fixedMonthly, cur)} شهرياً${manual ? " كما أدخلتها" : ""} × ${num(v.days || 30, 0)} يوماً ÷ 30)`, money(n.fixed, cur)],
    ["قبل الضريبة", money(n.subtotal, cur)],
    [`ضريبة القيمة المضافة ${num(E.vat * 100, 0)}%`, money(n.vat, cur)],
    ["الإجمالي", money(n.total, cur), { strong: true }],
  ];
  html += table(rows, "تفصيل الفاتورة الجديدة");
  if (res) {
    const hasOld = v.oldFee !== null && v.oldFee !== undefined && v.oldFee !== "";
    const o = ksaElectricityBill({ kwh: v.kwh, sector: "residential", days: v.days || 30, tariff: "old", fixedOverride: hasOld ? v.oldFee : 0 });
    const diff = n.total - o.total;
    html += table(
      [
        [`الاستهلاك بالتعرفة الحالية (${hal(o.p1)} و${hal(o.p2)})`, money(o.consumption, cur)],
        hasOld ? ["رسوم العداد الحالية", money(o.fixed, cur)] : null,
        ["الفاتورة الحالية شاملة الضريبة", money(o.total, cur)],
        ["الفاتورة الجديدة شاملة الضريبة", money(n.total, cur)],
        ["الفرق الشهري", `${diff >= 0 ? "+" : "−"}${money(Math.abs(diff), cur)}${o.total ? ` (${num((diff / o.total) * 100, 1)}%)` : ""}`, { strong: true }],
      ],
      "المقارنة بالتعرفة الحالية"
    );
    if (!hasOld) html += note("المقارنة لا تشمل رسوم العداد في فاتورتك الحالية لأنها غير منشورة بتفصيلها؛ أدخلها من فاتورتك لمقارنة دقيقة.", "info");
  } else {
    html += note(manual ? "حلّت الرسوم الثابتة التي أدخلتها محل جدول الشركة السعودية للطاقة لهذا القطاع." : `الرسوم الثابتة ${riyalAr(n.fixedMonthly)} شهرياً قبل الضريبة، من جدول الشركة السعودية للطاقة لنوع الاشتراك وسعة القاطع (جدول «الرسوم الثابتة لغير السكني» أدناه)؛ وإن اختلفت في فاتورتك فأدخلها في خانة «الرسوم الثابتة الشهرية» لتحل محلها.`, "info");
  }
  html += note(`يُصرف دعم ${num(E.supportMonthly, 0)} ريال شهرياً للمستحقين وفق الضوابط: موظفو الدولة المدنيون والعسكريون والمتقاعدون وأسر المتوفين من المشتركين والمتقاعدين وأسر الضمان الاجتماعي.`, "ok");
  html += note("التعرفة الجديدة تسري على الاستهلاك من 1 يناير 2027، وما قبله بالتعرفة الحالية. الفاتورة الرسمية هي المرجع.", "info");
  return html;
});
