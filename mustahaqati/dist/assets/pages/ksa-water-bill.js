import { ksaWaterBill, rules } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const range = (t) => (t.to ? `${num(t.from, 0)}–${num(t.to, 0)} م³` : t.from ? `فوق ${num(t.from, 0)} م³` : "كل الاستهلاك");

bind(form, result, (v) => {
  const res = v.sector === "residential";
  form.querySelectorAll("[data-res]").forEach((el) => (el.hidden = !res));
  form.querySelectorAll("[data-meter]").forEach((el) => (el.hidden = v.sector === "government"));
  if (v.m3 === null || v.m3 === undefined) return null;
  const W = rules.sa.waterBill;
  const sewer = v.sewer !== "no";
  const withVat = v.vat !== "no";
  const n = ksaWaterBill({ m3: v.m3, sector: v.sector, meter: v.meter, units: v.units, sewer, vat: withVat });
  if (!n) return null;
  const label = withVat ? "شاملة الضريبة" : "قبل الضريبة";
  let html = big(`فاتورة المياه الشهرية بتعرفة 2027 (${label})`, money(n.total, cur), `${num(Number(v.m3) || 0, 0)} م³${n.perM3 ? ` · ${money(n.perM3, cur)} للمتر في المتوسط` : ""}`);
  const rows = n.tiers.map((t) => [`${range(t)}: ${num(t.qty, 2)} م³ × ${num(t.price, 2)}${sewer ? ` + صرف ${num(t.price * W.sewerShare, 2)}` : ""}`, money(t.water + t.sewer, cur)]);
  rows.push(["المياه", money(n.water, cur)]);
  if (sewer) rows.push(["الصرف الصحي (نصف قيمة المياه)", money(n.sewer, cur)]);
  rows.push([sewer ? `الرسوم الثابتة (${num(n.fixedWater, 0)} مياه + ${num(n.fixedSewer, 0)} صرف)` : "الرسوم الثابتة للمياه", money(n.fixed, cur)]);
  rows.push(["قبل الضريبة", money(n.subtotal, cur)]);
  if (withVat) rows.push([`ضريبة القيمة المضافة ${num(W.vat * 100, 0)}%`, money(n.vat, cur)]);
  rows.push(["الإجمالي", money(n.total, cur), { strong: true }]);
  html += table(rows, "تفصيل الفاتورة الجديدة");

  if (res) {
    const o = ksaWaterBill({ m3: v.m3, sector: "residential", sewer, tariff: "current", vat: withVat });
    const diff = n.total - o.total;
    html += table(
      [
        ["الفاتورة بالتعرفة الحالية (دون رسم العداد)", money(o.total, cur)],
        ["الفاتورة بالتعرفة الجديدة", money(n.total, cur)],
        ["الفرق الشهري", `${diff >= 0 ? "+" : "−"}${money(Math.abs(diff), cur)}`, { strong: true }],
        ["الفرق في السنة", `${diff >= 0 ? "+" : "−"}${money(Math.abs(diff) * 12, cur)}`],
      ],
      "المقارنة بالتعرفة الحالية"
    );
    html += note("التعرفة الحالية (2016): 10 هللات للمتر حتى 15، وريال حتى 30، و3 حتى 45، و4 حتى 60، و6 فوقها، والصرف 50%. والمقارنة لا تشمل رسم العداد الحالي إن وُجد في فاتورتك.", "info");
    if (Number(v.units) > 1) html += note("لم يُنشر هل تتضاعف حدود الشرائح بعدد الوحدات على العداد الواحد؛ الحاسبة تطبق الشرائح على الاستهلاك كله وتضيف رسم الوحدات الإضافية فقط.", "warn");
  } else {
    html += note(v.sector === "government" ? "الحكومي: 10 ريالات للمتر للمياه و5 للصرف، ورسم ثابت 1,000 ريال للمياه و500 للصرف." : "غير السكني: شريحة واحدة 8 ريالات للمتر للمياه و4 للصرف، ورسم ثابت بحسب قطر العداد. ولا يشمل التعديل الاستخدام الصناعي والزراعي.", "info");
  }
  if (!sewer) html += note("لم يُنشر نص صريح عن احتساب الصرف لغير المتصلين بالشبكة في التعرفة الجديدة؛ الحاسبة تستبعده كما في التعرفة الحالية.", "info");
  html += note(`يُصرف دعم ${num(W.supportMonthly, 0)} ريال شهرياً للمستحقين: موظفو الدولة المدنيون والعسكريون والمتقاعدون وأفراد عائلات المتوفين من المشتركين والمتقاعدين وأسر الضمان الاجتماعي.`, "ok");
  html += note("الأرقام الجديدة منقولة عن إعلان شركة المياه الوطنية كما نشرته الصحف، وتسري على الاستهلاك من 1 يناير 2027. فاتورتك الرسمية هي المرجع.", "info");
  return html;
});
