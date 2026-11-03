import { ksaReefSupport, ksaReefWindow, rules } from "../calc.js";
import { bind, money, num, table, big, note, arDate, daysAr, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const R = rules.sa.reef;
const cur = "ريال";
const wdf = new Intl.DateTimeFormat("ar-u-nu-latn", { weekday: "long", timeZone: "UTC" });
const full = (iso) => `${wdf.format(new Date(`${iso}T00:00:00Z`))} ${arDate(iso)}`;
const sync = () => form.querySelectorAll("[data-sector]").forEach((el) => (el.hidden = el.dataset.sector !== form.sector.value));
form.sector.addEventListener("change", sync);

bind(form, result, (v) => {
  sync();
  const w = ksaReefWindow({ today: new Date() });
  let html = w.inWindow
    ? big("نافذة الصرف مفتوحة الآن", `حتى ${arDate(w.end)}`, `من 1 إلى 10 · باقي ${daysAr(w.daysToEnd)} على نهاية النافذة`)
    : big("باقي على نافذة صرف ريف", daysAr(w.days), `من ${full(w.start)} إلى ${arDate(w.end)}`);
  const s = ksaReefSupport({ sector: v.sector, capital: v.capital, grains: v.grains, sesame: v.sesame, watermelon: v.watermelon, lemonKg: v.lemonKg, lemonTrees: v.lemonTrees, sheep: v.sheep, camels: v.camels, cows: v.cows });
  if (s && s.sector === "productive") {
    html += table(
      [
        ["الدعم الشهري (10% من رأس المال)", money(s.monthly, cur), { strong: true }],
        s.capped ? ["بعد الحد الأعلى الشهري", money(R.productive.monthlyCap, cur)] : null,
        ["المدة حتى يبلغ المجموع رأس المال", monthsAr(s.months)],
        ["مجموع الدعم", money(s.total, cur)],
        ["في السنة الأولى", money(s.yearly, cur)],
      ],
      "تقدير دعم الأسرة المنتجة"
    );
  } else if (s && (s.sector === "rainfed" || s.sector === "lemon")) {
    html += table([["الدعم المقدّر", money(s.amount, cur), { strong: true }]], s.sector === "rainfed" ? "تقدير دعم المحاصيل البعلية" : "تقدير دعم الليمون");
    if (s.capped) html += note(`المبلغ المحسوب ${money(s.raw, cur)} يتجاوز سقف ${num(R.annualCap, 0)} ريال سنوياً.`, "warn");
    html += note("بأسعار أعلنها البرنامج في 2022 (البعلي) و2023 (الليمون)، وقد تكون تغيرت.", "warn");
  } else if (s && s.sector === "livestock") {
    html += table([["عدد الرؤوس", num(s.heads, 0)], ["الدعم بأسعار الرأس قبل نسبة الاستحقاق", money(s.amount, cur), { strong: true }]], "تقدير دعم الماشية");
    if (!s.inRange) html += note(`دعم الماشية لقطيع من ${num(R.livestock.minHerd, 0)} إلى ${num(R.livestock.maxHerd, 0)} رأس.`, "warn");
    html += note("أسعار 2022 للرأس، ويُضرب المبلغ في نسبة استحقاق بحسب شريحة الدخل والثروة لم تُنشر، فالرقم حد أعلى تقريبي.", "warn");
  } else if (s && s.sector === "fisherman") {
    html += table([["إجمالي الدعم للصياد", `حتى ${money(s.amount, cur)}`, { strong: true }]], "دعم صغار الصيادين");
    html += note("للصياد برخصة «حرفي سعودي» أو «بحار سعودي» برحلة 6 ساعات فأكثر، ويشمل حالات حظر الإبحار وتلف القارب والإصابة.", "info");
  }
  html += note("تكرار الصرف يختلف بحسب القطاع، فقد لا يكون قطاعك شهرياً، ولا قاعدة منشورة إن وافق يوم في النافذة عطلة.", "info");
  return html;
});
