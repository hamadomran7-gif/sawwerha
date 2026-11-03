import { kuwaitPension, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "KD");
const p = (x) => `${numEn(Math.round(x * 10000) / 100)}%`;
const yrs = (n) => `${numEn(Math.round(n * 100) / 100)} years`;

bind(form, result, (v) => {
  if (!v.base || v.age === null || v.serviceYears === null) return null;
  const K = rules.kw.pension;
  const r = kuwaitPension({
    gender: v.gender, age: v.age, serviceYears: v.serviceYears, serviceMonths: v.serviceMonths, base: v.base,
    supplementary: v.supplementary, married: v.married === "yes", children: v.children, contribSince2015: !!v.contribSince2015,
  });
  const lumpTable = (lump, caption) =>
    table(
      [...lump.parts.map((x) => [`${plural(x.years, "year")} × 12 × ${p(x.rate)}`, m(x.amount)]), ["Total", m(lump.total), { strong: true }]],
      caption
    );

  if (r.status === "none") {
    return big("Retirement lump sum (no pension)", m(r.lump.total), `${yrs(r.decimalYears)} of service; a pension needs 15 years`) + lumpTable(r.lump, `On a pension salary of ${m(r.base)}`) + note("Anyone whose service ends without a pension right receives the retirement lump sum. It must be repaid if they return to work within a year.", "info");
  }
  if (r.status === "too_young") {
    return big("Not yet entitled to a pension", "—", `The earliest early-retirement age is ${numEn(r.earlyMin)}`) + note(`With ${yrs(r.decimalYears)} of service, the pension is due at ${numEn(r.normalAge)}, or early from ${numEn(r.earlyMin)} with a reduction. For reference, the lump sum for your service if it ended without a pension: ${m(r.lump.total)}.`, "warn");
  }

  let html = big("Your monthly pension", m(r.final), r.toppedUp ? "after raising it to the minimum" : `${p(r.pct)} of the pension salary`);
  html += table(
    [
      ["Pension salary (capped at 1,500)", m(r.base)],
      [`Pension rate for ${yrs(r.decimalYears)}`, p(r.pct)],
      ["Basic pension before reduction", m(r.gross)],
      r.reduction ? [`Early retirement reduction (${r.reductionType === "temporary" ? `temporary until ${numEn(r.reductionEndsAge)}` : "permanent"})`, `${p(r.reduction)} = ${m(r.gross - r.basic)}`] : null,
      ["Basic pension", m(r.basic)],
      r.supplementary ? ["Supplementary pension", m(r.supplementary)] : null,
      ["Total", m(r.total), { strong: !r.toppedUp }],
      ["Minimum for your situation", m(r.minimum), { muted: !r.toppedUp }],
      r.toppedUp ? ["Pension after raising to the minimum", m(r.final), { strong: true }] : null,
    ],
    "Pension breakdown"
  );
  if (r.toppedUp && r.reduction) html += note(`It is not settled whether a pension reduced for early retirement is raised to the minimum; if not, it stays at ${m(r.total)}.`, "warn");
  if (r.reductionType === "temporary") html += note(`The temporary reduction stops at ${numEn(r.reductionEndsAge)}, when the pension returns to ${m(r.gross + r.supplementary)} plus increases.`, "info");

  const one = [];
  if (r.remuneration) one.push([`Remuneration: ${numEn(Math.round(Math.min(r.decimalYears, r.capYears) * 100) / 100)} × pension salary (cap ${plural(r.capYears, "year")})`, m(r.remuneration)]);
  if (r.excessLump) one.push([`Lump sum for service beyond 30 years (${plural(r.excessYears, "year")})`, m(r.excessLump.total)]);
  if (one.length) html += table(one, "One-off payments");
  if (!r.remunerationOk) html += note("The remuneration requires 24 months of contributions after 1 January 2015, unless you reached the normal age or have 30 years of service.", "info");
  if (v.base > K.basicWageCap && !r.supplementary) html += note("Your salary is above KD 1,500, so you have a supplementary pension on the extra band (up to KD 1,250), calculated from your account balance; enter it from your PIFSS statement to add it.", "info");
  html += note(`The pension rises by KD ${numEn(K.annualIncrease)} a month every 1 August.`, "ok");
  return html;
});
