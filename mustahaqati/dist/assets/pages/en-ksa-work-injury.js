import { ksaWorkInjury } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "SAR");

bind(form, result, (v) => {
  const t = v.type;
  form.querySelectorAll("[data-temp]").forEach((el) => (el.hidden = t !== "temporary"));
  form.querySelectorAll("[data-perm]").forEach((el) => (el.hidden = t !== "permanent"));
  form.querySelectorAll("[data-death]").forEach((el) => (el.hidden = t !== "death"));
  if (!v.wage) return null;
  const saudi = v.saudi !== "no";
  const r = ksaWorkInjury({ type: t, saudi, system: v.system, wage: v.wage, days: v.days, gosiDays: v.gosiDays, degree: (v.degree || 0) / 100, age: v.age, attendance: v.attendance === "yes", survivors: v.survivors });
  if (!r) return null;
  let html = "";
  if (t === "temporary") {
    html = big("Temporary disability allowance", m(r.total), `${plural(r.days, "day")} · daily wage ${m(r.daily)}`);
    html += table(
      [
        [`${plural(r.days - r.gosiDays, "day")} × 100%`, m(r.fullPay)],
        r.gosiDays ? [`${plural(r.gosiDays, "day")} treated at GOSI's expense × 75%`, m(r.gosiPay)] : null,
        ["Total from GOSI", m(r.total), { strong: true }],
      ],
      "How it is calculated"
    );
    return html + note("It starts the day after the injury, includes holidays, and runs until recovery, established disability or death, with no maximum period; it cannot be combined with wages.", "info");
  }
  if (t === "death") {
    if (!saudi) return big("Lump sum for a non-Saudi's survivors", m(r.lump), `${numEn(r.months)} times the monthly pension`) + note("How the amount is shared among survivors (equally or by 50% and 75% shares), and whether the SAR 330,000 cap still applies to old-system members, is not settled in the text.", "warn");
    html = big("Survivors' monthly pension", m(r.monthly), `${numEn(r.share * 100)}% of the total-disability pension`);
    html += table([["Monthly pension for the family", m(r.monthly), { strong: true }], r.grant ? ["Death grant (3 months, up to 10,000)", m(r.grant)] : null], "Details");
    return html + note("Eligible survivors are the spouse, children under 21 (24 for students) and dependent parents, sharing equally. GOSI also pays for preparing and transporting the body.", "info");
  }
  if (r.kind === "total") {
    if (!saudi) return big("Lump sum for total disability", m(r.lump), `${numEn(r.months)} times the monthly pension of ${m(r.monthly)}`) + note("The payment ends a non-Saudi's relationship with GOSI.", "info");
    html = big("Total disability monthly pension", m(r.monthly), r.attendance ? `including ${m(r.attendance)} for constant help` : "100% of the average wage");
    if (r.minApplied) html += note("Raised to the minimum pension.", "info");
    return html + note("Paid provisionally for 5 years, then finally; it can be combined with wages from new work.", "info");
  }
  if (r.kind === "partial-high") {
    if (!saudi) return big("Lump sum for partial disability", m(r.lump), `${numEn(r.months)} times ${m(r.monthly)}`);
    return big("Partial disability monthly pension", m(r.monthly), `${numEn(v.degree)}% × average wage`) + note("Disability of 50% or more gives a Saudi a monthly pension in proportion to the total-disability pension.", "info");
  }
  html = big("Lump sum for partial disability", m(r.lump), `${numEn(r.months)} times the notional pension of ${m(r.monthly)}`);
  html += table(
    [
      [`Notional pension: ${numEn(v.degree)}% × ${m(Math.min(v.wage, 45000))}`, m(r.monthly)],
      ["Multiple", `${numEn(r.months)}${r.months < 60 ? " (one less for each year over 45, minimum 36)" : ""}`],
      ["Lump sum", m(r.lump), { strong: true }],
    ],
    "How it is calculated"
  );
  return html + note("Royal Decree M/273 removed the SAR 165,000 cap and set the reduction age at 45 for old and new members alike.", "info");
});
