import { ksaExitReentryFee } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const LABEL = { single: "Single", multiple: "Multiple" };

bind(form, result, (v) => {
  if (!v.days) return null;
  const outside = v.where === "outside";
  const r = ksaExitReentryFee({ type: v.type, days: v.days, persons: v.persons || 1, extendMonths: v.extendMonths || 0, outside });
  const other = ksaExitReentryFee({ type: v.type === "single" ? "multiple" : "single", days: v.days });
  const ext = Math.max(0, Math.floor(v.extendMonths || 0));
  let html = big("Exit and re-entry visa fee", m(r.total), `${LABEL[v.type] || "Single"} · ${plural(r.months, "month")} · ${plural(r.persons, "person", "people")}`);
  html += table(
    [
      ["Length", `${plural(Math.floor(v.days), "day")} = ${plural(r.months, "month")}`],
      ["Issue fee per person", m(r.base)],
      ext ? [`Extension: ${plural(ext, "month")} × SAR ${numEn(r.perExtMonth)}${outside ? " (from abroad)" : ""}`, m(r.extension)] : null,
      ["Per person", m(r.perPerson)],
      [r.persons > 1 ? `× ${plural(r.persons, "person", "people")}` : "Total", m(r.total), { strong: true }],
      v.worker ? ["Paid by the employer (worker's visa)", m(r.perPerson)] : null,
      v.worker && r.persons > 1 ? ["Paid by the head of family", m(r.total - r.perPerson)] : null,
    ],
    "Breakdown"
  );
  html += note(`For comparison: a ${v.type === "single" ? "multiple" : "single"} visa for the same length costs ${m(other.perPerson)} per person${other.perPerson < r.base ? ", which is cheaper" : ""}.`, "info");
  html += note("Fees are not refunded on cancellation. The visa is issued only with a valid iqama and a passport valid for 90 days, and cannot be extended if less than 90 days remain on the iqama. Dependent fees must be paid before family visas are issued.", "info");
  return html;
});
