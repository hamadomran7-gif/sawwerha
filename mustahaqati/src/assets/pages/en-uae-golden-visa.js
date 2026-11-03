import { uaeResidencyCheck, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const F = rules.ae.residency.fees;
const aed = (x) => `AED ${numEn(Math.round(x))}`;
const NAME = {
  "g-skilled": "Golden — skilled professional",
  "g-property": "Golden — property investor",
  "g-investment": "Golden — investor (deposit, capital or taxes)",
  "g-entrepreneur": "Golden — entrepreneur",
  "g-student": "Golden — outstanding student or graduate (once)",
  "gr-skilled": "Green — skilled employee",
  "gr-freelance": "Green — freelancer",
  "gr-investor": "Green — investor or partner",
  retirement: "Retirement visa (5 years)",
};
const MAYBE = {
  "g-skilled": "Your gross pay reaches AED 30,000 but your basic is lower; the text is silent, and Dubai reportedly uses the basic salary.",
  "g-property": "The value is AED 2 million or more but less is paid up; the Dubai Land Department page asks for AED 2 million paid, while press reports say the condition was dropped.",
  "gr-skilled": "Your gross pay reaches AED 15,000 but your basic is lower; no text says which counts.",
  "gr-freelance": "The two years add up to AED 360,000 or more, but the literal reading is AED 360,000 in each year.",
  "gr-investor": "Nomination for this category is currently unavailable through the Abu Dhabi Residents Office.",
  retirement: "The regulations accept age or service, Dubai's residency page requires both, and the Retire in Dubai programme reportedly accepts AED 180,000 income or a AED 500,000 deposit plus AED 500,000 property.",
};
const GAP = {
  "g-skilled": (g) => `${aed(g)} short on monthly salary`,
  "g-property": (g) => `${aed(g)} short on property value or paid-up amount`,
  "g-investment": (g) => `${aed(g)} short on investment`,
  "g-entrepreneur": (g) => `${aed(g)} short on annual revenue`,
  "gr-skilled": (g) => `${aed(g)} short on monthly salary`,
  "gr-freelance": (g) => `${aed(g)} short on income`,
  "gr-investor": (g) => `${aed(g)} short on investment`,
};

bind(form, result, (v) => {
  form.querySelectorAll("[data-student]").forEach((el) => (el.hidden = v.student === "none"));
  const r = uaeResidencyCheck({
    emirate: v.emirate, employed: v.employed === "yes", skill: v.skill, degree: v.degree, basic: v.basic, total: v.total,
    propertyValue: v.propertyValue, mortgage: v.mortgage, investment: v.investment, revenue: v.revenue, annualTax: v.annualTax,
    freelance: v.freelance === "yes", freelanceIncome1: v.freelanceIncome1, freelanceIncome2: v.freelanceIncome2,
    age: v.age, serviceYears: v.serviceYears, deposit: v.deposit, annualIncome: v.annualIncome,
    student: v.student, score: v.score, yearsSinceGrad: v.yearsSinceGrad,
  });
  const yes = r.eligible, maybe = r.possible;
  const golden = yes.some((x) => x.visa === "golden");
  const headline = golden ? "You are likely to qualify for a Golden Visa" : yes.some((x) => x.visa === "green") ? "You are likely to qualify for a Green Visa" : yes.length ? "You are likely to qualify for a retirement visa" : maybe.length ? "You may qualify — check first" : "You do not meet the published thresholds yet";
  const sub = yes.length ? yes.map((x) => NAME[x.id]).join(" · ") : maybe.length ? maybe.map((x) => NAME[x.id]).join(" · ") : "See what you are missing below";
  let html = big("Result", headline, sub);
  if (yes.length) html += table(yes.map((x) => [NAME[x.id], "Qualifies", { strong: true }]), "You meet the conditions");
  if (maybe.length) html += table(maybe.map((x) => [NAME[x.id], MAYBE[x.id] || "Check with the authority"]), "Possible — check first");
  const close = r.results.filter((x) => x.status === "no" && x.gap > 0).sort((a, b) => a.gap - b.gap).slice(0, 3);
  if (close.length) html += table(close.map((x) => [NAME[x.id], GAP[x.id] ? GAP[x.id](x.gap) : "Not met"]), "Closest to you");
  if (yes.length) {
    html += table(
      [
        golden ? ["Golden: federal fees with a 10-year Emirates ID (inside the UAE)", `about ${aed(F.goldenIcpEstimate)}`] : null,
        golden && v.emirate === "dubai" ? ["Golden in Dubai: GDRFA residence with add-on fees", `about ${aed(F.gdrfaGolden)} + Emirates ID`] : null,
        golden && yes.some((x) => x.id === "g-property") && v.emirate === "dubai" ? ["Dubai Land Department package for the property Golden Visa (all-in)", aed(F.dldGoldenPackage)] : null,
        yes.some((x) => x.visa === "green") ? ["Green: federal fees with a 5-year Emirates ID", `about ${aed(F.greenIcpEstimate)}`] : null,
      ],
      "Approximate fees (before medical test and insurance)"
    );
  }
  html += note("Nomination routes (scientists, talents, inventors, humanitarian work, frontline heroes, and local programmes for teachers and nurses) are not assessed here; apply through the nominating body.", "info");
  html += note("This is an estimate; the Federal Authority for Identity and Citizenship or GDRFA Dubai decides when you apply, and valid health insurance is required in every category.", "warn");
  return html;
});
