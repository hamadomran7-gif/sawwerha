import { gccMaternityPlan, rules } from "../calc.js";
import { bind, money, table, big, note, arDate, daysAr, daysGen, hoursAr, monthsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cc = form.dataset.country;
const M = rules[cc].maternity;
const CUR = { qa: "ريال", kw: "دينار", om: "ريال", bh: "دينار" }[cc];
const m = (x) => money(x, CUR);
const EXTRA = {
  medical: "إجازة بلا أجر لمرض بعد الوضع (بشهادة طبية)",
  approval: "إجازة رعاية بلا أجر (بموافقة صاحب العمل)",
  childcare: "إجازة رعاية طفل بلا أجر (المادة 133 من قانون الحماية)",
  right: "أيام بلا أجر حق لك",
};

bind(form, result, (v) => {
  if (!v.due) return null;
  const p = gccMaternityPlan({ country: cc, due: v.due, start: v.start || v.due, wage: v.wage || 0, serviceMonths: v.service ?? 12, extra: v.extra === "yes" });
  if (!p) return null;
  let html = p.eligible
    ? big("آخر يوم في إجازة الوضع المدفوعة", arDate(p.lastDay), `${daysAr(p.days)} بأجر كامل · العودة ${arDate(p.returnDate)}`)
    : big("لا تستحقين إجازة وضع مدفوعة بعد", m(0), "يُشترط أن تكملي سنة في خدمة صاحب العمل");
  const rows = [
    [`أبكر بداية ممكنة (${daysGen(M.prenatalMax)} قبل الموعد)`, arDate(p.earliest)],
    ["بداية الإجازة", arDate(p.start), { strong: true }],
    ["الموعد المرجح للوضع", arDate(v.due)],
    ["الأيام قبل الموعد ← بعده", `${daysAr(p.preDays)} ← ${daysAr(p.postDays)}`],
    [p.eligible ? "آخر يوم بأجر كامل" : "آخر يوم في المدة (بلا أجر)", arDate(p.lastDay), { strong: true }],
    ["العودة إلى العمل", arDate(p.returnDate)],
  ];
  if (p.banUntil) rows.push(["آخر يوم يُحظر فيه تشغيلك (40 يوماً بعد الوضع)", arDate(p.banUntil)]);
  if (p.banUnpaidDays) rows.push(["أيام حظر بعد انتهاء الأيام المدفوعة (بلا أجر)", daysAr(p.banUnpaidDays)]);
  if (v.wage) rows.push([p.eligible ? `أجرك عن ${daysGen(p.days)} (${m(p.daily)} يومياً)` : "أجرك عن المدة", m(p.pay), { strong: p.eligible }]);
  html += table(rows, "التواريخ إذا تم الوضع في موعده المرجح");
  if (p.extra) {
    const len = p.extra.months ? monthsAr(p.extra.months) : daysAr(p.extra.days);
    html += table([[`${EXTRA[p.extra.type]}: ${len}`, `${arDate(p.extra.from)} – ${arDate(p.extra.to)}`], ["العودة بعدها", arDate(p.extra.back), { strong: true }]], "التمديد بلا أجر");
  }
  const nrows = p.nursing.map((n) => [`${hoursAr(n.hours)} رضاعة يومياً`, n.to ? `${arDate(n.from)} – ${arDate(n.to)}` : `من ${arDate(n.from)} (المدة لا يحددها القانون)`]);
  if (p.paternity) nrows.push([`إجازة الأب: ${daysAr(p.paternity.days)} بأجر`, p.paternity.until ? `حتى ${arDate(p.paternity.until)}` : "عند الولادة"]);
  html += table(nrows, "الرضاعة وإجازة الأب");
  if (p.tooEarly) html += note(`لا تبدأ الإجازة قبل الموعد المرجح بأكثر من ${daysGen(M.prenatalMax)}، فاعتمدنا أبكر تاريخ مسموح.`, "warn");
  if (p.late) html += note("بدأنا الإجازة من الموعد المرجح نفسه.", "warn");
  if (cc === "qa") html += note(p.eligible ? "إن تأخر الوضع حتى قلّ الباقي من الإجازة بعده عن 30 يوماً، يُكمَّل من إجازتك السنوية وإلا كان بلا أجر، على ألا يقل ما بعد الوضع عن 35 يوماً." : "النص لا يمنح من خدمتها أقل من سنة أجراً عن إجازة الوضع؛ ويمكن الاتفاق مع صاحب العمل على إجازة بلا أجر. وساعة الرضاعة حق لكِ دون شرط مدة.", "info");
  if (cc === "kw") html += note("يُشترط أن يتم الوضع خلال الأيام السبعين، ولا يقسمها القانون بين ما قبل الوضع وما بعده.", "info");
  if (cc === "om") html += note("يدفع صاحب العمل الأجر ثم يعوّضه صندوق الحماية الاجتماعية من فرع تأمين الأمومة (منذ 19 يوليو 2024، باشتراك 1% على صاحب العمل)، ويشمل غير العُمانيات.", "info");
  if (cc === "bh" && p.preDays > M.prenatalAdvised) html += note("يُحظر تشغيلك 40 يوماً بعد الوضع، فإن بدأتِ قبل الموعد بأكثر من 20 يوماً وقع جزء من الحظر بعد انتهاء الأيام المدفوعة.", "warn");
  html += note("الأجر الكامل على الأرجح الأجر الشامل. والحساب على افتراض أن الوضع في موعده المرجح.", "info");
  return html;
});
