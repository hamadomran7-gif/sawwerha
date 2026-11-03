import { ksaRetirementAge, ageCalc } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const ym = (m) => {
  const y = Math.floor(m / 12);
  const r = m % 12;
  return r ? `${plural(y, "year")} ${plural(r, "month")}` : plural(y, "year");
};
const ageAt = (birth, iso) => {
  const a = ageCalc({ birth, asOf: iso });
  return a ? (a.months ? `${plural(a.years, "year")} ${plural(a.months, "month")}` : plural(a.years, "year")) : "—";
};
const CAT = { new: "New member (from 3 July 2024)", transitional: "Existing member affected by the changes", legacy: "Existing member not affected by the changes" };

bind(form, result, (v) => {
  const legacyFields = form.querySelectorAll("[data-legacy]");
  const today = new Date().toISOString().slice(0, 10);
  if (!v.birth || !v.start) return null;
  const sys = v.system === "auto" ? null : v.system === "new";
  const r = ksaRetirementAge({ birth: v.birth, start: v.start, newMember: sys, monthsAtEff: v.monthsAtEff, gapMonths: v.gapMonths || 0 });
  legacyFields.forEach((el) => (el.hidden = !!(r && r.isNew)));
  if (!r) return null;
  const normalSub = r.category === "legacy" ? `At 60 Hijri years (aged ${ageAt(v.birth, r.normalDate)})` : `At ${ym(r.normalAgeMonths)}`;
  let html = big("Your statutory retirement date", dateEn(r.normalDate), `${normalSub} · ${CAT[r.category]}`);
  const rows = [["Your group", CAT[r.category]]];
  if (!r.isNew) {
    rows.push(["Your age on 3 July 2024", `${numEn(r.ageOnEff)} years`]);
    rows.push(["Your months of contribution on 3 July 2024", plural(r.monthsOnEff, "month")]);
  }
  rows.push(["Statutory age", r.category === "legacy" ? "60 Hijri years" : ym(r.normalAgeMonths), { strong: true }]);
  rows.push(["Minimum service for a pension at that age", `${plural(r.minMonths, "month")} (${plural(r.minMonths / 12, "year")})`]);
  rows.push(["Early-retirement period", `${plural(r.earlyMonthsNeeded, "month")} (${ym(r.earlyMonthsNeeded)})${r.earlyMinAgeMonths ? ` and age ${ym(r.earlyMinAgeMonths)}` : " at any age"}`]);
  if (r.earlyDate) rows.push([r.earlyDate <= today ? "You met the early-retirement conditions on" : "You meet the early-retirement conditions on", `${dateEn(r.earlyDate)} (aged ${ageAt(v.birth, r.earlyDate)})`, { strong: true }]);
  else rows.push(["Early retirement", "You will not complete the period before the statutory age if you keep contributing as now"]);
  html += table(rows, "Details");
  if (r.category === "new") html += note(`Early pension for new members is reduced by ${numEn(r.earlyReductionPerYear * 100)}% for each year before 65, and deferring past 65 adds 3% a year.`, "info");
  if (r.category === "transitional") html += note("The pension formula has not changed for affected members; only the age and the early-retirement period changed. For civil-pension employees, mandatory retirement at 60 Hijri years has not been amended, and how it interacts with the new age has not been officially settled.", "warn");
  if (r.category === "legacy" && r.monthsOnEff >= 240) html += note("You had 240 months or more on 3 July 2024, so the changes do not apply to you whatever your age.", "info");
  html += note("The early-retirement date assumes continuous contributions after 3 July 2024. Your exact age is confirmed by your GOSI statement.", "info");
  return html;
});
