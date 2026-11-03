import { gccMaternityPlan, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cc = form.dataset.country;
const M = rules[cc].maternity;
const CUR = { qa: "QAR", kw: "KWD", om: "OMR", bh: "BHD" }[cc];
const m = (x) => moneyEn(x, CUR);
const hrs = (n) => `${n} ${n === 1 ? "hour" : "hours"}`;
const EXTRA = {
  medical: "Unpaid leave for illness after the birth (medical certificate)",
  approval: "Unpaid childcare leave (with the employer's approval)",
  childcare: "Unpaid childcare leave (Social Protection Law, Art. 133)",
  right: "Unpaid days you are entitled to",
};

bind(form, result, (v) => {
  if (!v.due) return null;
  const p = gccMaternityPlan({ country: cc, due: v.due, start: v.start || v.due, wage: v.wage || 0, serviceMonths: v.service ?? 12, extra: v.extra === "yes" });
  if (!p) return null;
  let html = p.eligible
    ? big("Last day of paid maternity leave", dateEn(p.lastDay), `${plural(p.days, "day")} on full pay · back on ${dateEn(p.returnDate)}`)
    : big("No paid maternity leave yet", m(0), "requires one full year with the employer");
  const rows = [
    [`Earliest possible start (${plural(M.prenatalMax, "day")} before the expected date)`, dateEn(p.earliest)],
    ["Leave starts", dateEn(p.start), { strong: true }],
    ["Expected delivery date", dateEn(v.due)],
    ["Days before → after the expected date", `${plural(p.preDays, "day")} → ${plural(p.postDays, "day")}`],
    [p.eligible ? "Last day on full pay" : "Last day of the period (unpaid)", dateEn(p.lastDay), { strong: true }],
    ["Back to work", dateEn(p.returnDate)],
  ];
  if (p.banUntil) rows.push(["Last day you may not be employed (40 days after the birth)", dateEn(p.banUntil)]);
  if (p.banUnpaidDays) rows.push(["Ban days after the paid days end (unpaid)", plural(p.banUnpaidDays, "day")]);
  if (v.wage) rows.push([p.eligible ? `Pay for ${plural(p.days, "day")} (${m(p.daily)} a day)` : "Pay for the period", m(p.pay), { strong: p.eligible }]);
  html += table(rows, "Dates if the baby arrives on the expected date");
  if (p.extra) {
    const len = p.extra.months ? plural(p.extra.months, "month") : plural(p.extra.days, "day");
    html += table([[`${EXTRA[p.extra.type]}: ${len}`, `${dateEn(p.extra.from)} – ${dateEn(p.extra.to)}`], ["Back after it", dateEn(p.extra.back), { strong: true }]], "Unpaid extension");
  }
  const nrows = p.nursing.map((n) => [`${hrs(n.hours)} a day for nursing`, n.to ? `${dateEn(n.from)} – ${dateEn(n.to)}` : `From ${dateEn(n.from)} (the law sets no end date)`]);
  if (p.paternity) nrows.push([`Paternity leave: ${plural(p.paternity.days, "paid day")}`, p.paternity.until ? `by ${dateEn(p.paternity.until)}` : "at the birth"]);
  html += table(nrows, "Nursing and paternity");
  if (p.tooEarly) html += note(`Leave may not start more than ${plural(M.prenatalMax, "day")} before the expected date, so we used the earliest allowed date.`, "warn");
  if (p.late) html += note("We started the leave on the expected date itself.", "warn");
  if (cc === "qa") html += note(p.eligible ? "If the birth is late and fewer than 30 days of leave remain after it, the shortfall comes from annual leave or is unpaid, so that at least 35 days follow the birth." : "The law gives no maternity pay to women with less than a year of service; unpaid leave can be agreed with the employer. The nursing hour is yours with no service condition.", "info");
  if (cc === "kw") html += note("The birth must take place within the 70 days; the law does not split them between before and after the birth.", "info");
  if (cc === "om") html += note("The employer pays and is reimbursed by the Social Protection Fund's maternity branch (since 19 July 2024, with a 1% employer contribution), which also covers non-Omani women.", "info");
  if (cc === "bh" && p.preDays > M.prenatalAdvised) html += note("You may not be employed for 40 days after the birth, so starting more than 20 days early pushes part of that ban past the paid days.", "warn");
  html += note("Full pay most likely means the total wage. The dates assume the birth on the expected date.", "info");
  return html;
});
