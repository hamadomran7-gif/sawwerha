import { ksaReefSupport, ksaReefWindow, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const R = rules.sa.reef;
const m = (n) => moneyEn(n, "SAR");
const sync = () => form.querySelectorAll("[data-sector]").forEach((el) => (el.hidden = el.dataset.sector !== form.sector.value));
form.sector.addEventListener("change", sync);

bind(form, result, (v) => {
  sync();
  const w = ksaReefWindow({ today: new Date() });
  let html = w.inWindow
    ? big("The payment window is open now", `Until ${dateEn(w.end)}`, `1st to 10th · ${plural(w.daysToEnd, "day")} until the window closes`)
    : big("Days until the Reef payment window", plural(w.days, "day"), `From ${dateEn(w.start)} to ${dateEn(w.end)}`);
  const s = ksaReefSupport({ sector: v.sector, capital: v.capital, grains: v.grains, sesame: v.sesame, watermelon: v.watermelon, lemonKg: v.lemonKg, lemonTrees: v.lemonTrees, sheep: v.sheep, camels: v.camels, cows: v.cows });
  if (s && s.sector === "productive") {
    html += table(
      [
        ["Monthly support (10% of capital)", m(s.monthly), { strong: true }],
        s.capped ? ["After the monthly cap", m(R.productive.monthlyCap)] : null,
        ["Months until the total reaches the capital", plural(s.months, "month")],
        ["Total support", m(s.total)],
        ["In the first year", m(s.yearly)],
      ],
      "Productive family estimate"
    );
  } else if (s && (s.sector === "rainfed" || s.sector === "lemon")) {
    html += table([["Estimated support", m(s.amount), { strong: true }]], s.sector === "rainfed" ? "Rain-fed crop estimate" : "Lemon estimate");
    if (s.capped) html += note(`The calculated ${m(s.raw)} exceeds the SAR ${numEn(R.annualCap)} yearly cap.`, "warn");
    html += note("At rates the program announced in 2022 (rain-fed) and 2023 (lemons), which may have changed.", "warn");
  } else if (s && s.sector === "livestock") {
    html += table([["Head of livestock", numEn(s.heads)], ["Support at per-head rates before the eligibility percentage", m(s.amount), { strong: true }]], "Livestock estimate");
    if (!s.inRange) html += note(`Livestock support is for herds of ${numEn(R.livestock.minHerd)} to ${numEn(R.livestock.maxHerd)} head.`, "warn");
    html += note("2022 per-head rates, multiplied by an unpublished eligibility percentage based on income and wealth bracket, so the figure is an approximate upper bound.", "warn");
  } else if (s && s.sector === "fisherman") {
    html += table([["Total support per fisherman", `up to ${m(s.amount)}`, { strong: true }]], "Small-scale fishermen");
    html += note("For fishermen with a 'Saudi craftsman' or 'Saudi seaman' licence and trips of 6 hours or more, including fishing bans, boat damage and injury.", "info");
  }
  html += note("Payment frequency differs by sector, so your sector may not be paid monthly, and no rule has been published for holidays inside the window.", "info");
  return html;
});
