import { ksaSpecialLeave, shiftDate, hijriParts, rules } from "../calc.js";
import { bind, table, big, note, dateInputToday } from "../app.js";
import { plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
if (!form.date.value) dateInputToday(form.date);

const MONTHS = ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Shaban", "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"];
const TITLE = {
  marriage: "Marriage leave",
  death: "Bereavement leave",
  sibling: "Bereavement leave for a brother or sister",
  paternity: "Paternity leave",
  hajj: "Hajj leave",
  iddahNonMuslim: "Iddah leave",
};
const DATE_LABEL = { hajj: "Hajj leave start", iddah: "Date of death", iddahNonMuslim: "Date of death", death: "Date of death", sibling: "Date of death", paternity: "Date of birth", marriage: "Date of marriage" };

const hText = (iso) => {
  const h = hijriParts(iso);
  return h ? `${h.day} ${MONTHS[h.month - 1]} ${h.year} AH` : "";
};
const full = (iso) => `${dateEn(iso)} · ${hText(iso)}`;
const days = (n) => plural(n, "day");

const toggle = () => {
  const t = form.type.value;
  form.querySelectorAll("[data-for]").forEach((el) => (el.hidden = !el.dataset.for.split(" ").includes(t)));
  form.querySelector("[data-label]").textContent = DATE_LABEL[t] || "Date of the event";
};
form.type.addEventListener("change", toggle);

bind(form, result, (v) => {
  toggle();
  const L = rules.sa.specialLeave;

  if (v.type === "exam") {
    const n = Math.max(1, Math.floor(v.examDays || 1));
    const approved = v.approved !== "no";
    const paid = approved && v.repeated !== "yes";
    const status = paid ? "On full pay" : approved ? "Unpaid (repeated year)" : "From your annual leave, otherwise unpaid";
    let html = big("Exam leave", days(n), status);
    html += table([
      ["Length", `${days(n)}, the actual exam days`],
      ["Pay", status],
      v.examStart ? ["Last day to apply", full(shiftDate(v.examStart, -L.examNoticeDays)), { strong: true }] : null,
    ]);
    html += note(`Apply at least ${L.examNoticeDays} days before the leave. The employer may ask for proof that you sat the exam, and the pay is forfeited if you did not (Article 115).`, "info");
    return html;
  }

  if (v.type === "unpaid") {
    const n = Math.max(1, Math.floor(v.unpaidDays || 1));
    const suspended = Math.max(0, n - L.unpaidSuspendAfterDays);
    let html = big("Unpaid leave", days(n), "With the employer's agreement");
    html += table([
      ["Days the contract keeps running", days(Math.min(n, L.unpaidSuspendAfterDays))],
      ["Days the contract is suspended", days(suspended), { strong: !!suspended }],
    ]);
    html += note(suspended ? `The contract is treated as suspended for any part of the leave beyond ${L.unpaidSuspendAfterDays} days unless you agree otherwise (Article 116), so that period usually does not count as service.` : `The contract is not suspended for leave of up to ${L.unpaidSuspendAfterDays} days (Article 116).`, "info");
    return html;
  }

  const r = ksaSpecialLeave({ type: v.type, date: v.date, start: v.start || null, hajjDays: v.hajjDays, years: v.years });
  if (!r) return null;

  if (r.type === "iddah") {
    let html = big("Iddah leave on full pay", r.back ? days(r.days) : "—", "4 lunar months and 10 days from the date of death");
    html += table(
      [
        ["Starts", full(r.start)],
        r.end ? ["Last day (lunar months)", full(r.end), { strong: true }] : null,
        r.back ? ["Back to work", full(r.back)] : null,
        ["Last day if counted in Gregorian months", `${full(r.gEnd)} (${days(r.gDays)})`],
      ],
      "Iddah leave"
    );
    html += note("The leave is extended without pay until delivery if the employee is pregnant, and she may not work for anyone else during it. The law does not name the calendar, so follow the one your employer applies.", "info");
    return html;
  }

  let html = big(TITLE[r.type], days(r.days), "On full pay");
  html += table([
    ["First day", full(r.start)],
    ["Last day", full(r.end), { strong: true }],
    ["Back to work", full(r.back)],
  ]);
  if (r.type === "paternity") {
    if (r.lateStart) html += note(`The leave starts outside the 7-day window after the birth (${dateEn(v.date)} – ${dateEn(shiftDate(v.date, L.paternityWithinDays - 1))}).`, "warn");
    else if (!r.withinWindow) html += note(`The leave runs past the last day of the 7-day window (${dateEn(shiftDate(v.date, L.paternityWithinDays - 1))}), so days after it may not count. Start it earlier.`, "warn");
  }
  if (r.type === "hajj") {
    if (!r.eligible) html += note("Hajj leave is due after at least two continuous years with the employer, and your service is shorter.", "warn");
    html += note("It is granted once during your service if you have not performed Hajj before, includes the Eid al-Adha holiday, and the employer may set how many employees take it each year according to the needs of the work (Article 114).", "info");
  } else {
    html += note("It runs from the date of the event in calendar days, and the employer may ask for supporting documents (Article 113).", "info");
  }
  return html;
});
