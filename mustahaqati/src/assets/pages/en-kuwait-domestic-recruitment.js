import { kwRecruitCost } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "KWD");
const REG = { asia: "Asia", africa: "Africa", privatePassport: "private passport" };

bind(form, result, (v) => {
  const r = kwRecruitCost({ region: v.region, price: v.price, sponsor: v.sponsor, existingCount: v.existingCount, salary: v.salary });
  const atCap = !Number(v.price);
  const n = Math.max(0, Math.floor(Number(v.existingCount) || 0)) + 1;
  let html = big("First-year cost", m(r.firstYear), atCap ? `At the maximum for ${REG[v.region]}` : "At the office price you entered");
  html += table([
    [atCap ? `Maximum recruitment price (${REG[v.region]})${v.region === "privatePassport" ? "" : " including the ticket"}` : "Office price", m(r.contract)],
    [`Residence for worker no. ${numEn(n)} of a ${v.sponsor === "expat" ? "expat" : "Kuwaiti"} family, one year`, m(r.residence)],
    r.wage ? [`Salary: ${numEn(r.wage)} × 12`, m(r.wages)] : null,
    ["First-year cost", m(r.firstYear), { strong: true }],
    ["Two-year cost (2 residences and 24 salaries)", m(r.twoYears)],
    ["Monthly average over two years", m(Math.round((r.twoYears / 24) * 100) / 100), { strong: true }],
  ]);
  if (r.overCap) html += note(`The price you entered is above the maximum for ${REG[v.region]} (${m(r.cap)}) under Commerce Minister Decision 2/2024.`, "warn");
  if (r.residenceExtra) html += note(`Worker no. ${numEn(n)} is above ${v.sponsor === "expat" ? "2 workers for an expat family" : "3 workers for a Kuwaiti family"}, so the residence fee is ${m(r.residence)} a year instead of ${v.sponsor === "expat" ? "50" : "10"}.${r.residenceAssumed ? " The fee for this number of workers has not been published, so we assumed the previous worker's fee." : ""}`, "info");
  if (r.belowMinWage) html += note("The salary is below the KWD 75 legal minimum.", "warn");
  html += note("The office guarantee is 6 months from receipt: it refunds what was paid and takes the worker back if she refuses to work or is absent. Health insurance and medical test fees are not included.", "info");
  return html;
});
