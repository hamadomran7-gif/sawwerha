import { ksaExpatFees, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const workerFields = form.querySelectorAll("[data-worker]");
const toggleWorker = () => workerFields.forEach((el) => (el.hidden = !form.includeWorker.checked));
form.includeWorker.addEventListener("change", toggleWorker);

bind(form, result, (v) => {
  toggleWorker();
  const F = rules.sa.expatFees;
  const deps = Math.max(0, Math.floor(v.dependents || 0));
  const own = Math.min(deps, Math.max(0, Math.floor(v.adultIqamas || 0)));
  const months = Number(v.months) || 12;
  const late = Number(v.late) || 0;
  if (!deps && !v.includeWorker) return null;
  const r = ksaExpatFees({ dependents: deps, months, adultIqamas: own, includeWorker: v.includeWorker, expatsExceed: v.ratio !== "low", iqamaFee: v.iqamaFee });
  const fine = late === 1 ? F.lateFines[0] : late === 2 ? F.lateFines[1] : 0;
  const familyFine = fine * own;
  const family = r.family + familyFine;
  let worker = null;
  if (r.worker) {
    const levy = v.ratio === "exempt" ? 0 : r.worker.levy;
    worker = { levy, permit: r.worker.permit, iqama: r.worker.iqama, total: levy + r.worker.permit + r.worker.iqama + fine };
  }

  let html = deps
    ? big(`Dependent fees for ${plural(months, "month")}`, m(r.dependentsFee), `${plural(deps, "dependent")} × SAR ${F.dependentMonthly} × ${plural(months, "month")}`)
    : big(`Worker iqama renewal for ${plural(months, "month")}`, m(worker.total), "Paid by the employer");
  if (deps) {
    html += table(
      [
        [`Dependent fee: ${plural(deps, "person", "people")} × ${numEn(F.dependentMonthly * months)}`, m(r.dependentsFee)],
        own ? [`Own iqama fee: ${plural(own, "person", "people")} × ${numEn((F.iqamaAnnualBase * months) / 12)}`, m(r.adultIqama)] : null,
        familyFine ? [`Late fine: ${plural(own, "person", "people")} × ${numEn(fine)}`, m(familyFine)] : null,
        ["Total for the head of family", m(family), { strong: true }],
      ],
      "Paid by the head of family"
    );
  }
  if (worker) {
    html += table(
      [
        [v.ratio === "exempt" ? "Expat levy (exempt)" : `Expat levy: SAR ${numEn(v.ratio === "low" ? F.levyLow : F.levyHigh)} × ${plural(months, "month")}`, m(worker.levy)],
        ["Work permit fee", m(worker.permit)],
        [`Iqama fee${v.iqamaFee === "reported" ? " (commonly charged)" : ""}`, m(worker.iqama)],
        fine ? ["Late fine", m(fine)] : null,
        ["Total for the employer", m(worker.total), { strong: true }],
      ],
      "Paid by the employer (Article 40)"
    );
  }
  if (deps && worker) html += table([["Total renewal for the family and worker", m(family + worker.total), { strong: true }]]);
  if (late === 3) html += note("The third late-renewal offence is punished by deportation, not a fine.", "warn");
  if (deps && months < 12) html += note(`For comparison: dependent fees for a full year are ${m(r.annualDependents)}.`, "info");
  html += note("Fees are paid in advance and are not refundable. The dependent fee is paid by the head of family; the worker's iqama, work permit, levy and their late fines are paid by the employer and may not be charged to the worker.", "info");
  return html;
});
