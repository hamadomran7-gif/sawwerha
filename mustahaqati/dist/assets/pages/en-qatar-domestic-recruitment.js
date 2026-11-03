import { qaRecruitCost, qaRecruitRefund } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "QAR");
const NAT = { ID: "Indonesia", LK: "Sri Lanka", PH: "the Philippines", BD: "Bangladesh", IN: "India", KE: "Kenya", ET: "Ethiopia" };

const show = () => {
  const refund = form.mode.value === "refund";
  form.querySelectorAll("[data-cost]").forEach((el) => (el.hidden = refund));
  form.querySelectorAll("[data-refund]").forEach((el) => (el.hidden = !refund));
};
form.mode.addEventListener("change", show);

bind(form, result, (v) => {
  show();
  if (v.mode === "refund") {
    if (!(Number(v.cost) > 0)) return null;
    const r = qaRecruitRefund({ cost: v.cost, month: v.month, govFees: v.govFees });
    if (r.expired) return big("No refund", m(0), `The office guarantee ended after month ${numEn(r.last)}`) + note("The guarantee is 9 months: 3 preliminary and 6 additional. After that the office does not have to refund anything.", "warn");
    let html = big("Refunded by the office", m(r.refund), r.stage === "preliminary" ? "Preliminary test period: full amount minus government fees" : `Additional period: ${numEn(r.pct)}% of the amount`);
    html += table([
      ["Amount paid", m(Number(v.cost))],
      r.stage === "preliminary" ? ["Government fees deducted", m(r.govFees)] : [`15% × ${plural(r.month - 3, "month")} deducted`, `${numEn(100 - r.pct)}%`],
      ["Refund", m(r.refund), { strong: true }],
    ]);
    html +=
      r.stage === "preliminary"
        ? note("In the first three months the full amount is refunded minus government fees if the worker is unfit, breaches the contract, refuses to work or runs away, or if the employer ends the contract.", "info")
        : note("In months 4 to 9, 15% of the total amount is deducted for each month, for refusal, running away or chronic illness, and the office bears the government fees.", "info");
    html += note("The right to a refund is lost if the employer or the family assaults the worker, breaches the contract, or does not pay the wage (Decision 61/2026 as reported by Al Raya).", "info");
    return html;
  }

  const r = qaRecruitCost({ nationality: v.nationality, price: v.price, salary: v.salary, housing: v.housing === "cash", food: v.food === "cash" });
  if (r.needPrice) return note("No maximum price is published for this nationality. Enter the office's price.", "warn");
  const name = NAT[v.nationality] || "";
  const atCap = r.cap !== null && !Number(v.price);
  let html = big("First-year cost", m(r.firstYear), atCap ? `At the maximum for ${name}` : "At the office price you entered");
  html += table([
    [atCap ? `Maximum recruitment price (${name})` : "Office price", m(r.contract)],
    ["Due at contract (50%)", m(r.deposit)],
    [`Monthly wage${v.housing === "cash" || v.food === "cash" ? " with housing and food allowances" : ""}: ${numEn(r.wage)} × 12`, m(r.wages)],
    ["First-year cost", m(r.firstYear), { strong: true }],
  ]);
  if (r.overCap) html += note(`The price you entered is above the maximum for ${name} (${m(r.cap)}). The maximum covers all recruitment costs and fees except quarantine.`, "warn");
  if (r.belowMinWage) html += note("The basic wage is below the QAR 1,000 minimum.", "warn");
  html += note("The maximum price covers all recruitment costs and fees except quarantine, under Ministry of Commerce and Industry Decision 1/2022; we found no later change. Residence and insurance fees are not included.", "info");
  return html;
});
