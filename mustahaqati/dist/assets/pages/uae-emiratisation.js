import { uaeEmiratisation, rules } from "../calc.js";
import { bind, money, num, table, big, note, arDate, countAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";
const citAr = (n) => countAr(n, "مواطن واحد", "مواطنان", "مواطنين", "مواطناً", "مواطن");
const LABEL = { "2025-12-31": "موعد 31 ديسمبر 2025 (8%)", "2026-06-30": "موعد 30 يونيو 2026 (9%)", "2026-12-31": "موعد 31 ديسمبر 2026 (10%)" };

bind(form, result, (v) => {
  const W = Math.floor(Number(v.total) || 0);
  const E = rules.ae.emiratisation;
  form.querySelectorAll("[data-large]").forEach((el) => (el.hidden = W > 0 && W < E.largeMin));
  form.querySelectorAll("[data-small]").forEach((el) => (el.hidden = !(W >= E.smallMin && W < E.largeMin)));
  if (!W || v.emiratis === null) return null;
  const r = uaeEmiratisation({ total: W, skilled: v.skilled ?? 0, emiratis: v.emiratis, baseline: v.baseline || 0, sector14: v.sector14 === "yes" });
  if (!r) return null;
  let html = "";
  if (r.scope === "none") {
    html = big("لا مستهدف توطين إلزامياً على منشأتك", "—", r.small ? "منشآت 20–49 خارج الأنشطة الأربعة عشر" : "أقل من 20 عاملاً");
    html += note("المستهدفات الإلزامية على منشآت 50 عاملاً فأكثر، وعلى منشآت 20–49 في 14 نشاطاً اقتصادياً. ويمكنك مع ذلك الاستفادة من دعم برنامج نافس عند توظيف المواطنين.", "info");
    return html;
  }
  if (r.scope === "small") {
    const y25 = r.years.find((y) => y.year === 2025);
    html = big("المطلوب بنهاية 2025", citAr(y25.required), y25.short ? `لديك ${num(r.have, 0)}، والنقص ${citAr(y25.short)}` : `لديك ${num(r.have, 0)}: المستهدف متحقق`);
    html += table(
      r.years.flatMap((y) => [
        [`المطلوب بنهاية ${y.year}`, citAr(y.required)],
        [`النقص`, y.short ? citAr(y.short) : "لا نقص"],
        [`المساهمة عن ${y.year} (${money(y.per, cur)} عن كل ناقص)`, money(y.contrib, cur), { strong: y.year === 2025 }],
      ]),
      "منشآت 20–49 في الأنشطة المستهدفة"
    );
    html += note("لم تُعلن الوزارة مستهدفاً جديداً لهذه الفئة عن 2026 حتى نوفمبر 2026، فالمطلوب الإبقاء على المواطنين المعيّنين. ومساهمة 2025 تُسدّد من يناير 2026 ويجوز سدادها شهرياً، وإن غادر مواطن فلك شهران لتعيين بديل.", "info");
  } else {
    const end = r.deadlines.find((d) => d.date === "2026-12-31");
    const same = end.a === end.b;
    const shortTxt = (n) => (n ? citAr(n) : "لا نقص");
    const sub = same
      ? `لديك ${num(r.have, 0)} · ${end.shortA ? `النقص ${citAr(end.shortA)} والمساهمة ${money(end.contribA, cur)}` : "المستهدف متحقق"}`
      : `${citAr(end.b)} بنسبة 10%، و${citAr(end.a)} بجدول القرار 279 · لديك ${num(r.have, 0)}`;
    const hi = Math.max(end.a, end.b);
    html = big("المطلوب بنهاية 2026", same ? citAr(end.a) : `${num(Math.min(end.a, end.b), 0)}–${num(hi, 0)} ${hi % 100 >= 3 && hi % 100 <= 10 ? "مواطنين" : "مواطناً"}`, sub);
    html += table(
      [
        ["العمالة الماهرة", num(r.S, 0)],
        ["الزيادة السنوية بجدول القرار 279", citAr(r.inc)],
        r.base ? ["مواطنو خط الأساس (يُضافون في قراءة الجدول)", num(r.base, 0)] : null,
        ["نسبة المواطنين من إجمالي العمال", `${num(r.share * 100, 1)}%`],
      ],
      "منشأة 50 عاملاً فأكثر"
    );
    for (const d of r.deadlines) {
      const past = d.date < new Date().toISOString().slice(0, 10);
      const eq = d.a === d.b;
      const c = (x) => (r.exempt ? "معفاة (70% فأكثر)" : money(x, cur));
      const rows = eq
        ? [
            ["المطلوب (الجدول والنسبة سواء)", citAr(d.a)],
            ["النقص", shortTxt(d.shortA)],
            [`المساهمة (${money(d.per, cur)} عن كل ناقص)`, c(d.contribA), { strong: true }],
          ]
        : !d.shortA && !d.shortB
        ? [
            ["المطلوب بجدول القرار 279", citAr(d.a)],
            [`المطلوب بنسبة ${num(d.pct * 100, 0)}% من العمالة الماهرة`, citAr(d.b)],
            ["النقص", "لا نقص بالقراءتين", { strong: true }],
          ]
        : [
            ["المطلوب بجدول القرار 279", citAr(d.a)],
            [`المطلوب بنسبة ${num(d.pct * 100, 0)}% من العمالة الماهرة`, citAr(d.b)],
            ["النقص بالجدول", shortTxt(d.shortA)],
            ["النقص بالنسبة", shortTxt(d.shortB)],
            [`المساهمة بالجدول (${money(d.per, cur)} عن كل ناقص)`, c(d.contribA), { strong: true }],
            ["المساهمة بالنسبة", c(d.contribB), { strong: true }],
          ];
      if (d.shortA || d.shortB) rows.push(["تُحصّل من", `${arDate(d.collect)}${d.date === "2026-12-31" ? " (متوقع)" : ""}`, { muted: true }]);
      html += table(rows, `${LABEL[d.date] || arDate(d.date)}${past ? " — انقضى" : ""}`);
    }
    if (r.exempt) html += note("مواطنوك 70% فأكثر من إجمالي العمال، والمنشآت التي تبلغ هذه النسبة أُعفيت من المساهمات بتعديل يناير 2023 (مصدر ثانوي).", "info");
    html += note("المقارنة بالموعد الماضي تفترض أن عدد مواطنيك اليوم هو عددهم يومها. والرقم الملزم هو ما يظهر لمنشأتك في نظام الوزارة، وتقريب خطوة النصف الأول افتراض منا.", "warn");
  }
  html += note(`يُحتسب المواطن إن كان له تصريح عمل ساري، ومسجلاً في صندوق معاشات، وأجره عبر نظام حماية الأجور، في وظيفة مهارية، وراتبه ${num(E.minSalary, 0)} درهم فأكثر (من 1 يوليو 2026 لا يُحتسب من يقل راتبه). والتوطين الصوري غرامته ${num(E.fakeMin, 0)} إلى ${num(E.fakeMax, 0)} درهم عن كل مواطن، وتصل بقانون العمل إلى مليون درهم.`, "info");
  return html;
});
