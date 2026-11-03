import { ksaTransferCost, ksaTransferConsent } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const ORD = ["", "1st", "2nd", "3rd", "4th", "5th"];
const NAT = { PH: "Philippines", ID: "Indonesia", LK: "Sri Lanka", BD: "Bangladesh", KE: "Kenya", UG: "Uganda", SL: "Sierra Leone", BI: "Burundi", ET: "Ethiopia" };

const show = () => {
  const dom = form.sector.value === "domestic";
  const valid = form.permit.value === "valid";
  const arrears = form.status.value !== "onjob";
  const musaned = form.route.value === "musaned";
  form.querySelectorAll("[data-est]").forEach((el) => (el.hidden = dom));
  form.querySelectorAll("[data-dom]").forEach((el) => (el.hidden = !dom));
  if (!dom) {
    form.querySelectorAll("[data-valid]").forEach((el) => (el.hidden = !valid));
    form.querySelectorAll("[data-expired]").forEach((el) => (el.hidden = valid));
    form.querySelectorAll("[data-arrears]").forEach((el) => (el.hidden = valid || !arrears));
  } else {
    form.querySelectorAll("[data-musaned]").forEach((el) => (el.hidden = !musaned));
  }
};
["sector", "permit", "status", "route"].forEach((n) => form[n].addEventListener("change", show));

const FEE_NOTE = "The transfer fee comes from ministry and Passports statements to the press (2015 to 2024); the ministry's service pages say the e-service request is free. We found no announcement cancelling the fee, so check the amount shown in Absher Business or Muqeem before paying.";

bind(form, result, (v) => {
  show();
  const nth = Number(v.nth) || 1;
  if (v.sector === "domestic") {
    const r = ksaTransferCost({ sector: "domestic", nth, route: v.route, transferCost: v.transferCost, nationality: v.nationality, employer: v.employer, domesticCount: v.domesticCount });
    if (!r.allowed) return big("Transfer not allowed", `Maximum ${r.max} transfers`, "A domestic worker's services cannot be transferred more than 4 times") + note(FEE_NOTE, "info");
    let html = big(`Paid by the new employer for the ${ORD[nth]} transfer`, m(r.now), v.route === "musaned" ? "Government fee, operating fee and transfer cost" : "Government fee");
    html += table(
      [
        [`Transfer fee (${ORD[nth]} transfer)${r.feeAssumed ? " — assumed" : ""}`, m(r.fee)],
        v.route === "musaned" ? ["Musaned operating fee", m(r.operating)] : null,
        v.route === "musaned" ? ["Transfer cost to the current employer", m(r.agreed)] : null,
        ["Total at transfer", m(r.now), { strong: true }],
        r.extraLevy ? [`Levy on the extra worker (worker no. ${numEn(r.workersAfter)}, exemption up to ${numEn(r.free)})`, m(r.extraLevy)] : null,
        r.extraLevy ? ["First-year cost", m(r.firstYear), { strong: true }] : null,
      ],
      "Paid by the new employer"
    );
    if (r.feeAssumed) html += note("The fee for a domestic worker's 4th transfer has not been published; the calculator assumes SAR 6,000, the same as the 3rd.", "warn");
    if (v.route === "musaned") {
      if (r.cap) {
        html += note(
          r.overCap
            ? `The transfer cost is above the cap announced at launch for ${NAT[v.nationality]} (${m(r.cap)} in August 2023). Musaned does not accept amounts above the approved cap, so check the current cap there.`
            : `Cap announced at launch for ${NAT[v.nationality]}: ${m(r.cap)} (August 2023); it may have changed. Check the cap shown in Musaned.`,
          r.overCap ? "warn" : "info"
        );
      } else html += note("No cap was published for this nationality in the 2023 announcement; check the cap shown in Musaned.", "info");
      html += note("Musaned deducts a 2.4% e-payment charge from the contract value; it is not clear who bears it.", "info");
    }
    if (v.route === "noconsent") html += note("A transfer without consent has no transfer cost for the current employer; the new employer pays the fee and any shelter costs.", "info");
    if (v.route === "abshir") html += note("An Absher waiver needs at least 15 days left on the iqama, approval by the worker and the new employer within 7 days, no absence report, and no traffic violations on either.", "info");
    html += note(FEE_NOTE, "info");
    return html;
  }

  const permitValid = v.permit === "valid";
  const r = ksaTransferCost({ nth, permitValid, monthsLeft: v.monthsLeft, renewMonths: v.renewMonths, expatsExceed: v.ratio !== "low", iqamaFee: v.iqamaFee, status: v.status, arrearsMonths: v.arrearsMonths });
  const c = ksaTransferConsent({ monthsInKsa: v.monthsInKsa, contract: v.contract, iqamaExpired: !permitValid });
  const o = ORD[Math.min(nth, 5)];
  let html = big(`Paid by the new employer for the ${o} transfer`, m(r.now), permitValid ? "Transfer fee only; the permit and iqama are valid" : "Transfer fee plus permit and iqama renewal from the transfer date");
  const rows = [[`Transfer fee (${o} transfer)${nth > 3 ? " — maximum" : ""}`, m(r.fee)]];
  if (r.renewalNow) {
    const R = r.renewalNow;
    rows.push([`Expat levy: ${numEn(r.levyMonth)} × ${plural(R.months, "month")}`, m(R.levy)]);
    rows.push([`Work permit for ${plural(R.months, "month")}`, m(R.permit)]);
    rows.push([`Iqama for ${plural(R.months, "month")}${v.iqamaFee === "reported" ? " (commonly charged)" : ""}`, m(R.iqama)]);
  }
  if (r.arrears) {
    rows.push([`Levy arrears: ${numEn(r.levyMonth)} × ${plural(r.arrears.months, "month")}`, m(r.arrears.levy)]);
    rows.push(["Work permit arrears (approximate)", m(r.arrears.permit)]);
  }
  rows.push(["Total at transfer", m(r.now), { strong: true }]);
  html += table(rows, "Paid by the new employer (Article 40)");

  if (permitValid && r.coverRenewal) {
    const R = r.coverRenewal;
    html += table(
      [
        ["Transfer fee now", m(r.fee)],
        [`${plural(R.months, "month")} renewal after ${plural(r.monthsLeft, "month")}: ${numEn(R.levy)} + ${numEn(R.permit)} + ${R.iqama}`, m(R.total)],
        ["First-year cost from transfer", m(r.firstYear), { strong: true }],
      ],
      "Within 12 months of the transfer"
    );
  }
  if (permitValid && r.monthsLeft >= 12) html += note("The permit and iqama cover the whole first year, so there is no renewal in it.", "info");
  if (!permitValid && v.status === "onjob") html += note("Worker on the job: levy and work permit arrears and late iqama fines from before the transfer stay with the previous employer (since 9 June 2022).", "info");
  if (r.arrears) html += note("Absent worker, or previous establishment non-existent or under procedure: the arrears move to the new employer. The late iqama fine in this case is unsettled, so it is not included.", "warn");

  const consent =
    c.route === "contract-ended"
      ? "The documented contract has ended: the worker can transfer without the current employer's consent and with no minimum period."
      : c.route === "unpaid"
        ? "Wages unpaid for 3 months: the worker can transfer without the current employer's consent, even with a valid work permit."
        : c.route === "after12"
          ? `12 months or more in the Kingdom: the worker can transfer without consent, with a notice period equal to the contract's notice, or ${numEn(c.noticeDays)} days if it sets none. Whoever ends a fixed-term contract early pays Article 77 compensation.`
          : c.route === "expired"
            ? "The iqama has expired: Qiwa's 2026 clarification drops the 12-month condition but keeps the notice period, while the 2023 guide treated this as a direct transfer. Check in Qiwa."
            : `Less than 12 months in the Kingdom: the current employer must consent. This condition falls away after ${plural(c.monthsToGo, "month")}, or earlier if the documented contract ends or wages go unpaid for 3 months.`;
  html += note(consent, c.consent ? "warn" : "info");
  html += note("The transfer fee, levy, permit and iqama are paid by the new employer and may not be deducted from the worker's wage. Health insurance is required for renewal and is not included.", "info");
  html += note(FEE_NOTE, "info");
  return html;
});
