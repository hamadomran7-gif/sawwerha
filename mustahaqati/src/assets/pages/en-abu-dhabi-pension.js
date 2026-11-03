import { abuDhabiPension, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");
const pc = (x) => `${numEn(Math.round(x * 10000) / 100)}%`;
const n1 = (x) => numEn(Math.round(x * 10) / 10);
const dur = (x) => {
  const y = Math.floor(x + 1e-9);
  const mo = Math.floor((x - y) * 12 + 1e-6);
  return mo ? `${plural(y, "year")} and ${plural(mo, "month")}` : plural(y, "year");
};
const TRACK = (e) =>
  ({
    age60: "Age 60 with at least 15 years of contributions",
    early: "25 years of contributions and age 55 (no reduction)",
    mother: `Mothers' route: ${n1(e.needYears)} years of contributions and age ${n1(e.needAge)}`,
    acquired: "Acquired right: you met an old-law condition before 1 December 2023",
    route25: `25 years of service and the minimum age (${n1(e.needAge)})`,
    route60: `Age 60 with ${n1(e.needYears)} years of service`,
    routeWomen: `Women: age ${n1(e.needAge)} with ${n1(e.needYears)} years of service`,
    routeMotherAge: `Mothers: age ${n1(e.needAge)} with ${n1(e.needYears)} years of service`,
    routeMotherService: `Mothers: ${n1(e.needYears)} years of service at any age`,
  })[e.track];

bind(form, result, (v) => {
  form.querySelectorAll("[data-female]").forEach((el) => (el.hidden = v.gender !== "f"));
  if (!v.birth || !v.exit || v.years === null || !v.avgSalary) return null;
  const A = rules.ae.abuDhabiPension;
  const r = abuDhabiPension({ category: v.category, gender: v.gender, children: v.gender === "f" ? v.children || 0 : 0, birth: v.birth, exit: v.exit, years: v.years, months: v.months || 0, avgSalary: v.avgSalary });
  if (!r) return null;
  const C = v.category === "new" ? A.new : A.existing;
  let html;
  if (r.eligible) {
    html = big("Your monthly pension", m(r.pension), `${pc(r.pension / r.S)} of your average salary · ${TRACK(r.need)}`);
    const credited = r.credited > r.years;
    html += table(
      [
        ["Your age when you leave", dur(r.age)],
        ["Contribution period", `${dur(r.years)}${credited ? ` (pension calculated on ${plural(Math.round(r.credited), "year")})` : ""}`],
        ["Qualifying route", TRACK(r.need)],
        r.counted < r.years ? ["Years counted for the percentage", `25 + ${numEn(Math.round((r.counted - 25) * 100) / 100)} after the amendment`] : null,
        [`Percentage: 3.2% × ${numEn(Math.round(Math.min(Math.max(r.counted, r.credited), 25) * 100) / 100)}${r.counted > 25 ? ` + 2% × ${numEn(Math.round((Math.min(r.counted, 35) - 25) * 100) / 100)}` : ""}`, pc(r.pct)],
        ["Average salary used", `${m(r.S)}${r.capped ? " (cap)" : ""}`],
        ["Calculated pension", m(r.gross)],
        r.minApplied ? ["Raised to the minimum", m(A.minPension)] : null,
        ["Monthly pension", m(r.pension), { strong: true }],
        r.excess ? ["Lump sum: 3 salaries for each year beyond 35", m(r.excess)] : null,
        r.preExcess ? ["Benefit for years above 25 before December 2023 (estimate)", m(r.preExcess)] : null,
      ],
      "How it is calculated"
    );
    if (v.category !== "new" && r.track !== "acquired") html += note("Existing members' conditions rise by half a year every 1 December, so if you leave after that date, recalculate with the new date.", "info");
    if (r.preExcess) html += note(`Your service passed 25 years before 1 December 2023 by about ${numEn(Math.round((r.yearsAtCut - 25) * 100) / 100)} years. Those years earn no percentage; they are paid as a separate benefit under the old rules when your service ends. We estimate it at 3 salaries per year on your current average; the fund calculates it on your salary at the amendment date.`, "warn");
  } else {
    html = big("No pension at this date", r.gratuity ? m(r.gratuity) : "—", r.gratuity ? "End-of-service gratuity (Article 45)" : "Less than one year of contributions");
    html += table(
      [
        ["Your age when you leave", dur(r.age)],
        ["Contribution period", dur(r.years)],
        r.gratuity ? ["Gratuity: 1.5 / 2 / 3 salaries per year", m(r.gratuity), { strong: true }] : null,
        r.next ? ["You qualify if you keep working until", dateEn(r.next.date), { strong: true }] : null,
        r.next ? ["Route at that date", TRACK(r.next.need)] : null,
      ],
      "Your position"
    );
    html += note("You may be able to buy the missing service or age on terms and at a cost set by the fund (26% of salary for each month bought in some cases), or defer the gratuity so the service can be added later.", "info");
  }
  html += table(
    [
      [`Your share (${pc(C.employee)})`, m(r.employee)],
      [`Employer's share (${pc(C.employer)})`, m(r.employer)],
      C.government ? [`Abu Dhabi government contribution (${pc(C.government)})`, m(r.government)] : null,
    ],
    "Monthly contributions on this average"
  );
  if (v.sector === "gov" && v.category !== "new") html += note("In the government sector, months before December 2023 inside the six-year window are valued at the pre-amendment salary (three-year average basic salary plus latest allowances), so the official average may differ slightly.", "info");
  if (v.sector === "private" && Number(v.avgSalary) < A.privateFloor) html += note(`The minimum contribution salary in the private sector is AED ${numEn(A.privateFloor)}.`, "warn");
  html += note("This is an estimate; the official pension is set by the Abu Dhabi Pension Fund.", "info");
  return html;
});
