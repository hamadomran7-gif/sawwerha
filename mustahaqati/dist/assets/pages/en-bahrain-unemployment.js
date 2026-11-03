import { bahrainUnemployment } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "BHD");
const mo = (n) => plural(n, "month");

bind(form, result, (v) => {
  const first = v.reason === "firstJob";
  form.querySelectorAll("[data-comp]").forEach((el) => (el.hidden = first || v.reason === "resignation" || v.reason === "disciplinary"));
  const r = bahrainUnemployment({ avgWage: v.avgWage, contribMonths: first ? 0 : v.contribMonths, reason: v.reason, bahraini: v.bahraini !== "no", graduate: v.graduate !== "no" });
  if (r.kind === "none") {
    if (r.reason === "foreignAllowance") return big("No compensation or allowance", m(0), "The allowance is for Bahrainis only") + note("Expatriates qualify for compensation after 12 consecutive months of contributions; the allowance for those short of that period or looking for a first job is for Bahrainis only.", "warn");
    return big("No compensation due", m(0), v.reason === "resignation" ? "Leaving the job voluntarily" : "Disciplinary dismissal") + note("Compensation requires that the worker did not leave voluntarily and was not dismissed for disciplinary reasons (Article 10).", "warn");
  }
  if (r.kind === "allowance") {
    let html = big("Unemployment allowance", m(r.total), `${m(r.monthly)} × ${mo(r.months)}`);
    html += table([["Monthly allowance", m(r.monthly)], ["Maximum duration", mo(r.months)], ["Total", m(r.total), { strong: true }]], "Details");
    if (r.short) html += note("Your contributions are under 12 consecutive months, so the allowance is paid instead of compensation (Article 17(b)).", "info");
    return html + note("For Bahrainis aged 18 or over with no commercial or professional business. Parliament approved raising it to 300 and 250 in 2025, but the amendment has not been issued.", "info");
  }
  let html = big("Unemployment compensation", m(r.total), `${m(r.monthly)} × ${mo(r.months)}`);
  html += table(
    [
      ["60% of average wage", m(r.raw)],
      r.capped ? ["After the BHD 1,000 cap", m(r.monthly)] : null,
      r.raisedToMin ? ["After the minimum (200 or the wage)", m(r.monthly)] : null,
      ["Monthly compensation", m(r.monthly), { strong: true }],
      ["Total for 9 months", m(r.total), { strong: true }],
      ["Your monthly contribution (1%)", m(r.contribEmployee), { muted: true }],
    ],
    "Compensation breakdown"
  );
  if (v.bahraini === "no") html += note("Expatriates qualify while legally resident; because residence is tied to the employer, payment may in practice be shorter.", "warn");
  return html + note("Payment starts on the eighth day after employment ends if you register within 30 days; the right lapses if you do not register within 3 months.", "info");
});
