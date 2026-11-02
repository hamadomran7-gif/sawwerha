import { serviceDuration, ksaEndOfService } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural, durationEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");

function ruleEn(reason, years, fraction) {
  if (reason === "article_80") return "No award is due when the employer terminates for one of the Article 80 cases.";
  if (reason === "probation") return "No award is due when the contract ends during probation (Article 54).";
  if (reason === "article_81") return "Leaving under one of the Article 81 cases keeps all your rights: full award (Article 84).";
  if (reason === "mutual") return "Mutual written agreement: full award (Article 84).";
  if (reason === "resignation" || reason === "worker_notice") {
    if (years < 2) return "Resignation before two years of service: no award (Article 85).";
    if (years <= 5) return "Resignation after two and up to five years: one third of the award (Article 85).";
    if (years < 10) return "Resignation after more than five and under ten years: two thirds of the award (Article 85).";
    return "Resignation after ten years or more: full award (Article 85).";
  }
  if (reason === "resignation_marriage" || reason === "resignation_childbirth" || reason === "force_majeure") return "Article 87 exception: full award despite resignation.";
  return "Full award (Article 84).";
}

bind(form, result, (v) => {
  if (!v.wage || !v.start || !v.end) return null;
  const d = serviceDuration(v.start, v.end, 0);
  if (!d) return note("The last working day must be after the start date.", "bad");
  const e = ksaEndOfService({ wage: v.wage, years: d.decimalYears, reason: v.reason });
  const frac = e.fraction === 1 ? "Full" : e.fraction === 0 ? "None" : e.fraction > 0.5 ? "Two thirds" : "One third";
  let html = big("Your end-of-service award", m(e.total), `Service: ${durationEn(d)}${d.months || d.days ? ` (${numEn(d.decimalYears)} years)` : ""}`);
  html += table(
    [
      [`First five years: ${plural(e.firstYears, "year")} × half a month`, m(e.firstAmount)],
      e.secondYears > 0 ? [`After year five: ${plural(e.secondYears, "year")} × a full month`, m(e.secondAmount)] : null,
      ["Full award (Article 84)", m(e.gross), { muted: e.fraction !== 1 }],
      ["Share due for this reason", frac + (e.fraction > 0 && e.fraction < 1 ? ` (${numEn(e.fraction * 100)}%)` : "")],
      ["Award due", m(e.total), { strong: true }],
    ],
    "Breakdown"
  );
  html += note(ruleEn(v.reason, d.decimalYears, e.fraction), e.fraction === 0 ? "warn" : "ok");
  if (e.disputed) html += note(`Since the amendments of 19 February 2025, "resignation" in the law applies to fixed-term contracts. Several practitioners argue that an employee who ends an open-ended contract with notice under Article 75 is owed the full award: <strong>${m(e.gross)}</strong>. There is no published ministry position or court principle yet, so we show the cautious Article 85 figure.`, "info");
  if (v.reason === "article_80") html += note(`Losing the award requires the case to be proven and the employer to give you a chance to object. Otherwise the termination may be unlawful and the full award (${m(e.gross)}) plus compensation may be due.`, "info");
  if ((v.reason === "resignation" || v.reason === "worker_notice") && d.decimalYears >= 2 && d.decimalYears < 10) {
    html += note(d.decimalYears <= 5 ? "If you stay past five years the share rises to two thirds, and after ten years the full award is paid." : `${numEn(10 - d.decimalYears)} more years until the full award is paid on resignation.`, "info");
  }
  return html;
});
