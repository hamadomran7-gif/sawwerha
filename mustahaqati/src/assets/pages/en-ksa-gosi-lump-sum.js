import { ksaLumpSum } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "SAR");

bind(form, result, (v) => {
  const isNew = v.system === "new";
  form.querySelectorAll("[data-legacy]").forEach((el) => (el.hidden = isNew));
  form.querySelectorAll("[data-new]").forEach((el) => (el.hidden = !isNew));
  if (isNew) {
    const r = ksaLumpSum({ system: "new", monthlyWage: v.monthlyWage, start: v.start, end: v.end });
    if (!r || !v.monthlyWage) return null;
    let html = big("Lump sum at its minimum", m(r.nominal), `${plural(r.months, "month")} of contributions · revalued by the consumer price index`);
    html += table(
      [
        ...r.rows.map((x) => [`${plural(x.months, "month")} × ${numEn(x.rate * 100)}% of wage`, m(x.months * x.rate * Math.min(v.monthlyWage, 45000))]),
        ["Total pension contributions (both parties)", m(r.nominal), { strong: true }],
        ["How it is paid", r.lumpOnly ? "One payment (under 60 months)" : "One payment or monthly instalments"],
      ],
      "How it is calculated"
    );
    html += note("Under the new system the lump sum is paid at 65 with under 180 months, on non-occupational disability or death without pension rights, or on loss of nationality; leaving work alone does not trigger it.", "info");
    if (r.months >= 180) html += note("You have 180 months or more, so you will get a pension at 65, not a lump sum.", "warn");
    return html;
  }
  if (v.months === null || !v.avgWage) return null;
  const r = ksaLumpSum({ months: v.months, pre1422Months: v.pre1422Months || 0, avgWage: Math.min(v.avgWage, 45000) });
  let html = big("Lump-sum compensation", m(r.lump), `${plural(r.months, "month")} × average ${m(Math.min(v.avgWage, 45000))} · factor ${numEn(r.factor)} months`);
  html += table(
    [
      ["Months up to 60", `${plural(Math.min(r.months, 60), "month")} × 10%${v.pre1422Months ? " (pre-1422 months × 6%)" : ""}`],
      r.months > 60 ? ["Months beyond 60", `${plural(r.months - 60, "month")} × 12%${v.pre1422Months > 60 ? " (pre-1422 months × 7%)" : ""}`] : null,
      ["Lump sum", m(r.lump), { strong: true }],
    ],
    "How it is calculated"
  );
  if (r.pensionEligible) html += note(`You have ${plural(r.months, "month")}, so you qualify for a pension at the statutory age (about ${m(r.pensionNow)} a month by the formula) rather than a lump sum, unless an early-payment case applies.`, "warn");
  else if (r.buyMonths) html += table(
    [
      [`Buy ${plural(r.buyMonths, "month")} at 60 (18% per month)`, m(r.buyCost)],
      ["Monthly pension after buying", m(r.pensionAfterBuy), { strong: true }],
      ["The pension recovers the lump sum plus the cost in about", `${numEn(Math.round((r.lump + r.buyCost) / r.pensionAfterBuy))} months`],
    ],
    "Alternative: buy service for a pension"
  );
  html += note("Paid at 60 Hijri years after leaving work, or earlier for a woman who leaves work without a pension right, on death (to the family equally), non-occupational disability, loss of nationality, imprisonment of 5 years or more, and moving to the civil pension with under a year. Returning workers can restore the period by repaying the full amount within a year.", "info");
  return html;
});
