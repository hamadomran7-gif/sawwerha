import { bahrainPension, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "BD");
const pc = (x) => `${numEn(Math.round(x * 1000) / 10)}%`;
const mo = (n) => plural(n, "month");

bind(form, result, (v) => {
  if (v.age === null || v.years === null || !v.avgWage) return null;
  const P = rules.bh.pension;
  const months = Math.floor(v.years || 0) * 12 + Math.floor(v.extraMonths || 0);
  const r = bahrainPension({ age: v.age, months, avgWage: v.avgWage });
  const dur = mo(r.months);
  const basis = [
    ["Average wage used", m(r.wage)],
    ["Contribution period", `${dur} (${numEn(Math.round(r.years * 100) / 100)} years)`],
    [`Rate: ${numEn(Math.round(r.years * 100) / 100)} ÷ ${P.divisor}`, `${pc(r.pctRaw)}${r.capped ? ` → ${pc(r.pct)} (cap)` : ""}`],
  ];
  let html;

  if (r.status === "oldAge" || r.status === "early") {
    html = big(r.status === "early" ? "Your monthly early pension (estimate)" : "Your monthly pension", m(r.pension), `${pc(r.pension / r.wage)} of your average wage · ${dur}`);
    html += table(
      [
        ...basis,
        ["Pension before reduction", m(r.gross)],
        r.status === "early" ? [`Early retirement reduction at ${numEn(v.age)}`, `${pc(r.reduction)} (−${m(r.gross - r.pension)})`] : null,
        ["Monthly pension", m(r.pension), { strong: true }],
      ],
      "How it is calculated"
    );
    if (r.status === "early") html += note("The early retirement reductions (20% under 45, 15% from 45 to 49, 10% from 50 to under 60) are as published by law firms for Table 1 attached to the law; the official table is not available online, so the result is an estimate.", "warn");
    if (r.capped) html += note(`The pension is capped at ${pc(P.maxPct)} of the average wage according to specialist sources. Together with a supplementary pension it can reach 90%.`, "info");
    if (r.belowMin) html += note(`The pension is below BD ${numEn(P.minPension)}. Under the rules published before the 2022 reform it is raised to BD ${numEn(P.minPension)}, or to your average wage if lower; check with the SIO.`, "info");
  } else if (r.status === "lump") {
    html = big(r.refundOnly ? "Refund of your contributions" : "Lump sum (no pension)", r.refundOnly ? "Your contributions only" : m(r.lump), `Contribution period ${dur}, under the ${mo(P.minMonths)} needed for a pension`);
    html += table(
      r.refundOnly
        ? [["Contribution period", dur], ["Entitlement", "Only the contributions you paid, as the period is under one year"]]
        : [
            ["Average wage used", m(r.wage)],
            ["Months of contribution", numEn(r.months)],
            [`${numEn(P.lumpPct * 100)}% × ${numEn(r.wage)} × ${numEn(r.months)}`, m(r.lump), { strong: true }],
            ["Needed for a pension", `${mo(r.monthsToMin)} more`],
          ],
      "Lump sum (Article 43)"
    );
  } else {
    html = big("No pension is due yet", r.atSixty ? m(r.atSixty) : m(r.lumpAtSixty), r.atSixty ? "Expected pension at 60 on your current period and wage" : "Expected lump sum at 60 on your current period and wage");
    html += table(
      [
        ...basis,
        ["Needed for early retirement before 60", r.monthsToEarly ? `${mo(r.monthsToEarly)} more (240 months)` : "Met"],
        ["Needed for an old-age pension at 60", r.monthsToMin ? `${mo(r.monthsToMin)} more (180 months)` : "Met"],
        r.atSixty ? ["Expected pension at 60", m(r.atSixty), { strong: true }] : ["Expected lump sum at 60", m(r.lumpAtSixty), { strong: true }],
      ],
      "Your current position"
    );
    html += note("Leaving service before 60 with fewer than 240 months does not give an early pension; your contribution period stays on record if you return to insured work.", "info");
  }

  html += table(
    [
      [`Your share (${pc(P.employeeRate)})`, m(r.employee)],
      [`Employer's share (${pc(r.employerRate)})`, m(r.employer)],
    ],
    "Monthly pension-branch contributions on this wage"
  );
  if (r.wageCapped) html += note(`Contributory wages are capped at BD ${numEn(P.wageCap)} a month according to specialist sources, so the cap was used instead of the wage you entered.`, "info");
  html += note("The automatic annual increase has stopped since the 2022 reform, and any increase is by ministerial decision. The SIO sets the official pension.", "info");
  return html;
});
