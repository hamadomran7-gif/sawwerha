import { ksaHealthSalary, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const nextJanYear = () => new Date().getUTCFullYear() + 1;
const PHYS = ["consultantPhysician", "deputyPhysician", "residentPhysician", "consultantPharmacist", "seniorPharmacist", "pharmacist"];

bind(form, result, (v) => {
  const s = ksaHealthSalary({ cat: v.cat, level: v.level, step: v.step, system: v.system, transport: v.transport, infection: v.infection, danger: v.danger, supervision: v.supervision });
  if (!s) return null;
  const C = rules.sa.healthScale.cats[v.cat];
  const pct = Math.round(s.rate * 10000) / 100;
  const ftName = PHYS.includes(v.cat) ? "Full-time allowance" : "Working-hours allowance";
  let html = big("Your monthly net salary", m(s.net), `${C.nameEn} · level ${s.level} · step ${s.step}`);
  html += table(
    [
      ["Basic salary", m(s.basic)],
      [`${ftName} ${Math.round(s.ftPct * 100)}% of the level's first step (${numEn(s.first)})`, m(s.fullTime)],
      s.infection ? ["Infection allowance", m(s.infection)] : null,
      s.danger ? ["Danger allowance", m(s.danger)] : null,
      s.overCap ? [`After the 90% cap of the first step (${s.cap})`, m(s.capped)] : null,
      ["Transport allowance", m(s.transport)],
      s.supervision ? ["Supervision allowance", m(s.supervision)] : null,
      ["Gross", m(s.gross)],
      [`Pension deduction ${pct}% of basic`, `− ${m(s.deduction)}`],
      ["Net", m(s.net), { strong: true }],
      [`Net from January 2027 with the SAR ${numEn(s.allowance2027)} allowance`, m(s.net + s.allowance2027)],
      s.nextBasic
        ? [`Your basic on 1 January ${nextJanYear()} (+${m(s.increment)})`, m(s.nextBasic)]
        : s.nextLevelFirst
          ? [`Last step of the level; on promotion to level ${s.level + 1}`, m(s.nextLevelFirst)]
          : ["Next increment", "Last step of the scale"],
    ],
    "Salary breakdown"
  );
  if (s.overCap) html += note(`The capped allowances (${m(s.capItems)}) exceed 90% of the level's first step, so they were reduced to ${m(s.capped)}. Transport and supervision are outside the cap.`, "warn");
  if (s.lastStep && s.nextLevelFirst) html += note("Moving to the next level requires at least a year at the top of the level and two latest ratings of very good or above (Article 5 of the health jobs regulation).", "info");
  if (s.topOfScale && v.cat === "consultantPhysician") html += note("A consultant at the end of level 7 receives an amount equal to the level's increment (1,110) each year as a bonus that does not change the basic.", "info");
  if (v.system === "gosiNew") html += note(`Staff first hired from 3 July 2024 are under the new social insurance law: the deduction is ${pct}% today and rises half a point each July up to 11%.`, "info");
  html += note("The monthly SAR 500 allowance under the royal order of 25 October 2026 applies to employees on civil service scales, reportedly from January 2027, and is not part of basic salary, so no pension is deducted from it. It does not apply to staff moved to the Health Holding Company.", "info");
  html += note("Scarcity, excellence, remote-area, training, psychiatric and forensic allowances are not included because they are granted by individual decisions. Figures are from the 1432H scale in force; check your payslip.", "info");
  return html;
});
