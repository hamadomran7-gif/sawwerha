import { ksaCitizenAccountMax, ksaNextPayDates } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const show = () => form.querySelectorAll("[data-family]").forEach((el) => (el.hidden = form.type.value === "independent"));
form.type.addEventListener("change", show);
const todayIso = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);

bind(form, result, (v) => {
  show();
  const r = ksaCitizenAccountMax({ type: v.type, adults: v.adults, children: v.children, income: v.income, assets: v.assets });
  const next = ksaNextPayDates({ item: "citizen", today: todayIso(), count: 2 });
  let html;
  if (r.overIncome) html = big("No support at this income", m(0), `Household income of ${m(r.income)} exceeds the SAR 20,000 maximum cutoff`);
  else if (r.assetsOver) html = big("Not eligible", m(0), "Assets exceed the financial-capacity limit");
  else html = big("Your maximum monthly support", m(r.upper), r.type === "independent" ? "Independent" : `Household of ${numEn(r.members)}`);
  html += table(
    [
      [r.type === "independent" ? "Independent" : "Head of household", m(r.head)],
      r.adults ? [`Dependents 18 or over: ${numEn(r.adults)} × 360`, m(r.perAdult * r.adults)] : null,
      r.children ? [`Dependents under 18: ${numEn(r.children)} × 216`, m(r.perChild * r.children)] : null,
      r.capped ? ["Before the household cap", m(r.uncapped)] : null,
      r.capped ? ["After the reference-family cap (2,088)", m(r.upper), { strong: true }] : ["Full support", m(r.upper), { strong: true }],
      next[0] ? ["Next payment", dateEn(next[0].date)] : null,
      next[1] ? ["The one after", dateEn(next[1].date)] : null,
    ],
    "Maximum using the announced weights"
  );
  if (!r.overIncome && !r.assetsOver) {
    html += note(`Support is paid in full (${m(r.upper)}) if household income does not exceed your household's exemption threshold, and falls gradually above it to zero at the cutoff (SAR 20,000 at most, lower for smaller households). The program does not publish these thresholds; the exact amount is in its official estimator.`, "warn");
    html += note(`For comparison: the average paid per family in the October 2026 payment was about ${m(r.avgFamily)}, and 72% of eligible people received support.`, "info");
  }
  if (r.capped) html += note("Since the October 2023 payment no household gets more than the full support of a family of 6 (head, two dependents 18 or over and three under 18).", "info");
  if (v.assets === "unknown") html += note("The financial-capacity limit is SAR 4 million for a family of 6 and SAR 1,371,200 for an independent, covering property, vehicles, cash and investments. Limits for other sizes are not published.", "info");
  if (r.type === "independent") html += note("An independent must be 18 or over, unmarried, with documented independent housing matching the national address and a verification visit.", "info");
  html += note("The additional support (which raised an independent's entitlement from 417 to 720) runs to the end of 2026; no decision for 2027 had been issued by 3 November 2026. The weights and the 720 come from program statements and a 2017 circular, not a recent official document.", "info");
  return html;
});
