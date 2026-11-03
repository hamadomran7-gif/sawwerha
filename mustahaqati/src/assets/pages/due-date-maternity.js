import { pregnancyDueDate, maternityLeaveFromDue, MATERNITY_COUNTRIES, hijriParts, HIJRI_MONTHS } from "../calc.js";
import { bind, table, big, note, arDate, daysAr, weeksAr, dateInputToday } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const LABEL = { lmp: "أول يوم من آخر دورة", conception: "تاريخ الإخصاب (التبويض)", ivf5: "تاريخ نقل الأجنة", ivf3: "تاريخ نقل الأجنة", due: "موعد الولادة الذي حدده الطبيب" };
const NAME = { sa: "السعودية", ae: "الإمارات", qa: "قطر", kw: "الكويت", bh: "البحرين", om: "عُمان" };
const PAGE = { sa: "/ksa-maternity-leave/", ae: "/uae-maternity-leave/", qa: "/qatar-maternity-leave/", kw: "/kuwait-maternity-leave/", bh: "/bahrain-maternity-leave/", om: "/oman-maternity-leave/" };
const EARLIEST = {
  sa: "أبكر بداية (4 أسابيع قبل الموعد)",
  ae: "أبكر بداية (آخر يوم في الشهر السابق لشهر الوضع)",
  qa: "أبكر بداية (15 يوماً قبل الموعد)",
  kw: "أبكر بداية يقع بعدها الوضع داخل الإجازة",
  bh: "أبكر بداية يقع بعدها الوضع داخل الإجازة",
  om: "أبكر بداية (14 يوماً قبل الموعد)",
};
const TRI = ["", "الأول", "الثاني", "الثالث"];
const wdf = new Intl.DateTimeFormat("ar-u-nu-latn", { weekday: "long", timeZone: "UTC" });
const full = (iso) => `${wdf.format(new Date(`${iso}T00:00:00Z`))} ${arDate(iso)}`;
const hijri = (iso) => {
  const h = hijriParts(new Date(`${iso}T00:00:00Z`));
  return h ? `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year}هـ` : "";
};
const ga = (w, d) => (w <= 0 ? daysAr(d) : d ? `${weeksAr(w)} و${daysAr(d)}` : weeksAr(w));
const length = (c, days) => (c === "sa" ? `${weeksAr(days / 7)} (${daysAr(days)})` : daysAr(days));

const sync = () => {
  form.querySelectorAll("[data-method]").forEach((el) => (el.hidden = el.dataset.method !== form.method.value));
  document.getElementById("date-label").textContent = LABEL[form.method.value] || LABEL.lmp;
};
form.method.addEventListener("change", sync);
if (!form.date.value) dateInputToday(form.date, -70);

bind(form, result, (v) => {
  sync();
  if (!v.date) return null;
  const p = pregnancyDueDate({ method: v.method, date: v.date, cycle: v.cycle || 28, today: new Date() });
  if (!p) return null;
  let html = big("موعد الولادة المتوقع", full(p.edd), hijri(p.edd));

  const rows = [];
  if (p.stage === "during") {
    rows.push(["عمر الحمل اليوم", ga(p.weeks, p.days), { strong: true }]);
    rows.push(["الثلث", TRI[p.trimester]]);
    if (p.daysLeft > 0) rows.push(["الباقي على الموعد", `${daysAr(p.daysLeft)} (${ga(Math.floor(p.daysLeft / 7), p.daysLeft % 7)})`]);
    else if (p.daysLeft === 0) rows.push(["الباقي على الموعد", "اليوم هو الموعد المتوقع"]);
    else rows.push(["بعد الموعد المتوقع بـ", daysAr(-p.daysLeft)]);
  }
  rows.push(["أول يوم من آخر دورة (المكافئ للحساب)", arDate(p.lmp), { muted: true }]);
  html += table(rows, "حملك اليوم");
  if (p.stage === "before") html += note("التاريخ المُدخل لم يحن بعد، فلم يبدأ الحمل بحسب الحساب. تحققي من التاريخ.", "warn");
  if (p.stage === "after") html += note("تجاوز الحساب 42 أسبوعاً من آخر دورة؛ تحققي من التاريخ المُدخل.", "warn");

  const M = p.milestones;
  html += table(
    [
      ["نهاية الثلث الأول (13 أسبوعاً و6 أيام)", arDate(M.t1End)],
      ["نهاية الثلث الثاني (27 أسبوعاً و6 أيام)", arDate(M.t2End)],
      ["بداية الحمل المكتمل (37 أسبوعاً)", arDate(M.earlyTerm)],
      ["الحمل المكتمل التام (39 أسبوعاً)", arDate(M.fullTerm)],
      ["الموعد المتوقع (40 أسبوعاً)", arDate(p.edd), { strong: true }],
      ["بداية الحمل الممتد (42 أسبوعاً)", arDate(M.postTerm)],
    ],
    "محطات الحمل"
  );

  const c = NAME[v.country] ? v.country : "sa";
  const L = maternityLeaveFromDue({ country: c, due: p.edd });
  html += table(
    [
      ["مدة الإجازة", length(c, L.days)],
      [EARLIEST[c], arDate(L.earliest)],
      ["العودة للعمل إن بدأتِ الإجازة يوم الموعد", arDate(L.backOnDue), { strong: true }],
      ["العودة إن بدأتِها في أبكر موعد", arDate(L.backEarliest)],
      c === "sa" ? ["نهاية الأسابيع الستة الإلزامية بعد الوضع", arDate(L.mandatoryUntil)] : null,
      c === "bh" && L.banUntil ? ["نهاية حظر التشغيل (40 يوماً بعد الوضع)", arDate(L.banUntil)] : null,
    ],
    `إجازة الوضع في ${NAME[c]}`
  );
  if (c === "qa") html += note("تستحقها في قطر من أكملت سنة خدمة لدى صاحب العمل.", "info");
  if (c === "bh") html += note("إن بدأتِ الإجازة قبل الوضع بأكثر من 20 يوماً وقع جزء من حظر الأيام الأربعين بعد نهاية الأجر.", "info");
  html += note(`للأجر والتمديد وساعات الرضاعة: <a href="${PAGE[c]}">حاسبة إجازة الوضع في ${NAME[c]}</a>.`, "info");

  const cmp = MATERNITY_COUNTRIES.map((k) => {
    const x = maternityLeaveFromDue({ country: k, due: p.edd });
    return `<tr${k === c ? ' class="sel"' : ""}><th scope="row"><a href="${PAGE[k]}">${NAME[k]}</a></th><td>${daysAr(x.days)}</td><td>${arDate(x.earliest)}</td><td>${arDate(x.backOnDue)}</td></tr>`;
  });
  html += `<div class="table-scroll"><table class="shares"><caption>إجازة الوضع لموعدك في الدول الست</caption><thead><tr><th scope="col">الدولة</th><th scope="col">المدة</th><th scope="col">أبكر بداية</th><th scope="col">العودة إن بدأتِ يوم الموعد</th></tr></thead><tbody>${cmp.join("")}</tbody></table></div>`;
  html += note("الموعد تقديري، وقياس السونار في الثلث الأول أدق؛ فإن اختلف فاعتمدي موعد طبيبتك. وتواريخ الإجازة تفترض الوضع في الموعد المتوقع.", "info");
  return html;
});
