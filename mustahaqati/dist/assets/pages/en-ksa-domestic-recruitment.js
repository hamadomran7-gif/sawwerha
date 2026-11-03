import { ksaRecruitCost, ksaRecruitRefund } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const NAT = { PH: "the Philippines", LK: "Sri Lanka", BD: "Bangladesh", TH: "Thailand", KE: "Kenya", UG: "Uganda", SL: "Sierra Leone", BI: "Burundi", ET: "Ethiopia", TZ: "Tanzania" };

const show = () => {
  const refund = form.mode.value === "refund";
  form.querySelectorAll("[data-cost]").forEach((el) => (el.hidden = refund));
  form.querySelectorAll("[data-refund]").forEach((el) => (el.hidden = !refund));
  if (refund) form.querySelectorAll("[data-month]").forEach((el) => (el.hidden = form.reason.value !== "refusal"));
};
["mode", "reason"].forEach((n) => form[n].addEventListener("change", show));

bind(form, result, (v) => {
  show();
  if (v.mode === "refund") {
    if (!(Number(v.cost) > 0)) return null;
    const r = ksaRecruitRefund({ cost: v.cost, contractMonths: v.contractMonths, month: v.month, reason: v.reason });
    if (v.reason !== "refusal") {
      const pct = v.reason === "late" ? 20 : 15;
      return (
        big("Refunded by the office", m(r.refund), `${m(Number(v.cost))} paid + ${pct}% of the contract value`) +
        table([
          ["Amount paid", m(Number(v.cost))],
          [v.reason === "late" ? "Late-arrival penalty 20%" : "Compensation for cancelling during the extension 15%", m(r.extra)],
          ["Refund", m(r.refund), { strong: true }],
        ]) +
        note("The maximum recruitment period is 90 days from payment, followed by a 30-day extension. It is not stated whether the percentage applies before or after VAT; the calculator applies it to the amount entered.", "info")
      );
    }
    let html = big(r.payer === "office" ? "Refunded by the office" : "Covered by the contract insurance", m(r.refund), `${m(r.perMonth)} × ${plural(r.remaining, "month")} left of ${plural(r.contractMonths, "month")}`);
    html += table([
      ["Recruitment cost", m(Number(v.cost))],
      [`÷ ${plural(r.contractMonths, "month")} = cost per month`, m(r.perMonth)],
      [`× months remaining after month ${numEn(r.month)}`, numEn(r.remaining)],
      r.capped ? ["Insurance compensation limit", m(r.cap)] : null,
      ["Refund", m(r.refund), { strong: true }],
    ]);
    html +=
      r.payer === "office"
        ? note("Within 90 days of arrival: if the worker refuses to work, the office deports her at its own cost and refunds by this formula. You can also request a replacement visa without government fees if she leaves for good within 90 days of entry.", "info")
        : note("After 90 days responsibility moves to the employer, and the domestic worker contract insurance compensates absence, running away and refusal to work with the same formula, up to the lower of the recruitment cost and SAR 20,000. The insurance is mandatory for the first two years of new contracts since 1 February 2024.", "info");
    if (r.remaining === 0) html += note("The contract period has ended, so there is nothing left to refund.", "warn");
    return html;
  }

  const r = ksaRecruitCost({ nationality: v.nationality, price: v.price, employer: v.employer, existingCount: v.existingCount, salary: v.salary, insurance: v.insurance });
  if (r.needPrice) return note("No cap is published for this nationality. Enter the office's contract price including VAT as shown on Musaned.", "warn");
  const name = NAT[v.nationality] || "";
  let html = big("Paid at contract", m(r.upfront), r.usedCap ? `At the cap for ${name}${r.capVatIncluded ? " (VAT included)" : " plus VAT"}` : "At the office price you entered");
  html += table(
    [
      [r.usedCap ? `Recruitment cap ${numEn(r.cap)}${r.capVatIncluded ? " (incl. VAT)" : ` + 15% VAT (${r.contractVat})`}` : `Office contract price (incl. VAT ${r.contractVat})`, m(r.contract)],
      ["Visa fee", m(r.visa)],
      ["Musaned e-service fee 150 + VAT", m(r.service)],
      ["Total at contract", m(r.upfront), { strong: true }],
    ],
    "At contract"
  );
  html += table(
    [
      ["At contract", m(r.upfront)],
      ["Iqama issue", m(r.iqama)],
      r.levy ? [`Expat levy: worker no. ${numEn(r.workerNo)}, exemption up to ${numEn(r.free)}`, m(r.levy)] : null,
      r.insurance ? ["Contract insurance premium", m(r.insurance)] : null,
      r.wage ? [`Salary: ${numEn(r.wage)} × 12`, m(r.wages)] : null,
      ["First-year cost", m(r.firstYear), { strong: true }],
      [`Over a two-year contract (2 iqamas${r.levy ? ", 2 levies" : ""} and 24 salaries)`, m(r.twoYears)],
      ["Monthly average over two years", m(r.perMonth), { strong: true }],
    ],
    "First year and contract period"
  );
  if (r.overCap) html += note(`The price you entered is above the cap for ${name} with VAT (${m(r.capGross)}). Offices may not exceed the cap, and you can complain through Musaned.`, "warn");
  if (r.avg) html += note(`Average paid to recruit a worker from ${name} on Musaned in July 2026: ${m(r.avg)} including VAT${r.arrivalDays ? `, with an average arrival time of ${numEn(r.arrivalDays)} days` : ""}.`, "info");
  if (!r.insurance) html += note("The domestic worker contract insurance premium is not included because it is not published; it appears on the contract invoice in Musaned.", "info");
  if (v.nationality === "ET") html += note("Ethiopia's SAR 5,900 cap comes from four matching press reports; the ministry page lists Ethiopia among the reduced caps without the figure.", "info");
  html += note("The SAR 2,000 visa fee is reported by the press citing Musaned (2022); the ministry's page calls the visa request free. Check the amounts shown when you pay.", "info");
  return html;
});
