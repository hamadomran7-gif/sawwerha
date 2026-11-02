import { ksaSpecialLeave, shiftDate, hijriParts, HIJRI_MONTHS, WEEKDAYS_AR, rules } from "../calc.js";
import { bind, table, big, note, arDate, daysAr, dateInputToday } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
if (!form.date.value) dateInputToday(form.date);

const LABELS = {
  marriage: "إجازة الزواج",
  death: "إجازة الوفاة",
  sibling: "إجازة وفاة الأخ أو الأخت",
  paternity: "إجازة المولود",
  hajj: "إجازة الحج",
  iddah: "إجازة العدة",
  iddahNonMuslim: "إجازة العدة",
};
const DATE_LABEL = { hajj: "بداية إجازة الحج", iddah: "تاريخ الوفاة", iddahNonMuslim: "تاريخ الوفاة", paternity: "تاريخ الولادة", marriage: "تاريخ الزواج" };

const wd = (iso) => WEEKDAYS_AR[new Date(`${iso}T00:00:00Z`).getUTCDay()];
const hText = (iso) => {
  const h = hijriParts(iso);
  return h ? `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} هـ` : "";
};
const full = (iso) => `${wd(iso)} ${arDate(iso)} · ${hText(iso)}`;

const toggle = () => {
  const t = form.type.value;
  form.querySelectorAll("[data-for]").forEach((el) => (el.hidden = !el.dataset.for.split(" ").includes(t)));
  form.querySelector("[data-label]").textContent = DATE_LABEL[t] || "تاريخ الواقعة";
};
form.type.addEventListener("change", toggle);

bind(form, result, (v) => {
  toggle();
  const L = rules.sa.specialLeave;

  if (v.type === "exam") {
    const days = Math.max(1, Math.floor(v.examDays || 1));
    const approved = v.approved !== "no";
    const paid = approved && v.repeated !== "yes";
    const status = paid ? "بأجر كامل" : approved ? "بلا أجر (سنة معادة)" : "من رصيد إجازتك السنوية، وإلا فبلا أجر";
    let html = big("إجازة الامتحانات", daysAr(days), status);
    html += table([
      ["المدة", `${daysAr(days)}، بعدد أيام الامتحان الفعلية`],
      ["الأجر", status],
      v.examStart ? ["آخر موعد لتقديم الطلب", full(shiftDate(v.examStart, -L.examNoticeDays)), { strong: true }] : null,
    ]);
    html += note(`قدّم الطلب قبل موعد الإجازة بـ${L.examNoticeDays} يوماً على الأقل، ولصاحب العمل طلب ما يثبت أداءك للامتحان. ويسقط أجر الإجازة إن ثبت أنك لم تؤدِّ الامتحان (المادة 115).`, "info");
    return html;
  }

  if (v.type === "unpaid") {
    const days = Math.max(1, Math.floor(v.unpaidDays || 1));
    const suspended = Math.max(0, days - L.unpaidSuspendAfterDays);
    let html = big("إجازة بدون أجر", daysAr(days), "بموافقة صاحب العمل");
    html += table([
      ["أيام لا يتوقف فيها العقد", daysAr(Math.min(days, L.unpaidSuspendAfterDays))],
      ["أيام يُعد فيها العقد موقوفاً", daysAr(suspended), { strong: !!suspended }],
    ]);
    html += note(suspended ? `يُعد عقد العمل موقوفاً فيما زاد على ${L.unpaidSuspendAfterDays} يوماً من الإجازة ما لم تتفقا على غير ذلك (المادة 116)، فلا تُحتسب هذه المدة عادة في الخدمة.` : `لا يتوقف العقد في إجازة لا تتجاوز ${L.unpaidSuspendAfterDays} يوماً (المادة 116).`, "info");
    return html;
  }

  const r = ksaSpecialLeave({ type: v.type, date: v.date, start: v.start || null, hajjDays: v.hajjDays, years: v.years });
  if (!r) return null;

  if (r.type === "iddah") {
    let html = big("إجازة العدة بأجر كامل", r.back ? daysAr(r.days) : "—", "4 أشهر قمرية و10 أيام من تاريخ الوفاة");
    html += table(
      [
        ["تبدأ", full(r.start)],
        r.end ? ["آخر يوم (بالأشهر القمرية)", full(r.end), { strong: true }] : null,
        r.back ? ["العودة للعمل", full(r.back)] : null,
        ["آخر يوم إن حُسبت بالأشهر الميلادية", `${full(r.gEnd)} (${daysAr(r.gDays)})`],
      ],
      "إجازة العدة"
    );
    html += note("تُمدد الإجازة بلا أجر إن كانت الموظفة حاملاً حتى تضع، ولا يجوز لها مزاولة عمل لدى غيره خلالها. والنص لا يحدد التقويم، فاعتمد ما تقره جهة عملك.", "info");
    return html;
  }

  let html = big(LABELS[r.type], daysAr(r.days), "بأجر كامل");
  html += table([
    ["أول يوم", full(r.start)],
    ["آخر يوم", full(r.end), { strong: true }],
    ["العودة للعمل", full(r.back)],
  ]);
  if (r.type === "paternity") {
    if (r.lateStart) html += note(`بداية الإجازة خارج مهلة الأيام السبعة من الولادة (${arDate(v.date)} – ${arDate(shiftDate(v.date, L.paternityWithinDays - 1))}).`, "warn");
    else if (!r.withinWindow) html += note(`تتجاوز الإجازة آخر يوم في مهلة الأيام السبعة (${arDate(shiftDate(v.date, L.paternityWithinDays - 1))})، فقد لا تُحتسب أيامها بعده. ابدأها مبكراً.`, "warn");
  }
  if (r.type === "hajj") {
    if (!r.eligible) html += note(`تُستحق إجازة الحج بعد سنتين متصلتين على الأقل لدى صاحب العمل، ومدة خدمتك أقل من ذلك.`, "warn");
    html += note("تُمنح مرة واحدة طوال الخدمة لمن لم يؤدِّ الفريضة من قبل، وتشمل إجازة عيد الأضحى، ولصاحب العمل تحديد عدد من يمنحهم إياها كل سنة وفق حاجة العمل (المادة 114).", "info");
  } else {
    html += note("تُحتسب من تاريخ الواقعة بالأيام التقويمية، ولصاحب العمل طلب الوثائق المؤيدة (المادة 113).", "info");
  }
  return html;
});
