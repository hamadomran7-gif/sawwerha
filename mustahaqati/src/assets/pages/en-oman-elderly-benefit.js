import { omanElderlyBenefit, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const E = rules.om.socialProtection.elderly;
const f2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const omr = (n) => `OMR ${f2.format(n)}`;
const mf = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const monthOf = (iso) => mf.format(new Date(`${iso}T00:00:00Z`));

bind(form, result, (v) => {
  if (!v.birth) return null;
  const s = omanElderlyBenefit({ birth: v.birth, income: v.income, disabled: v.disabled });
  if (!s) return null;
  const status = s.eligibleNow ? `Due since ${monthOf(s.start)}` : `Starts in ${monthOf(s.start)} (in ${plural(s.monthsToStart, "month")})`;
  const bandText = { full: "full (income 1,020 or less)", taper: "gradually reduced (straight-line estimate)", none: "not paid (income 1,250 or more)" }[s.band];
  let html = big(s.eligibleNow ? "Your monthly benefit" : "Your expected benefit", omr(s.paid), status);
  html += table(
    [
      ["Entitlement starts (month you turn 60)", monthOf(s.start)],
      [`Elderly benefit: ${bandText}`, omr(s.elderly)],
      s.disability ? ["Disability benefit", omr(s.disability)] : null,
      [s.paidAs === "disability" ? "Paid: disability benefit (the higher)" : "Paid monthly", omr(s.paid), { strong: true }],
      ["Yearly", omr(s.annual)],
    ],
    "Benefit breakdown"
  );
  if (s.band === "taper") html += note(`Between ${numEn(E.fullMax)} and ${numEn(E.zeroFrom)} the benefit is reduced gradually by an unpublished formula. We estimate it on a straight line: 115 minus half of the income above 1,020. The real amount may differ.`, "warn");
  if (s.band === "none" && !s.disability) html += note("Since April 2026 the elderly benefit is not paid when monthly income is OMR 1,250 or more. The official definition of income has not been published.", "warn");
  if (s.ageRaiseRisk) html += note("You turn 60 after 2030, and the entitlement age may have risen to 61 by then (one year every 7 years from 2024). Check with the Fund closer to the date.", "info");
  if (!s.eligibleNow) html += note("The income test applies to your income when you become entitled, so recalculate if your income changes.", "info");
  html += note("The elderly benefit can be combined with pensions, the higher is paid with the disability benefit, and it replaces the widow benefit. It is paid before the end of the month it is due for, with no fixed day announced.", "info");
  return html;
});
