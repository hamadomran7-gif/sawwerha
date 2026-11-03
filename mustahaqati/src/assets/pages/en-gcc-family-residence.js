import { familyResidenceCost } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cc = form.dataset.country;
const CUR = { ae: "AED", qa: "QAR", kw: "KWD", bh: "BHD", om: "OMR" }[cc];
const m = (x) => moneyEn(x, CUR);
const L = {
  inside: "Change of status inside the country", entry: cc === "kw" ? "Entry visa and its health fee" : "Entry permit", residence: cc === "kw" ? "Residence fee" : "Residence (application, issue and services)", eid: "Emirates ID", medical: "Medical test (adults)",
  parentDeposit: "Refundable deposit per parent plus deposit fee", permit: cc === "bh" ? "Dependent residence permit and admin fee" : "Residence permit", idCard: "Qatar ID card", parentResidence: "Parents' residence", health: "Health insurance fee",
  civilId: "Civil ID", smartCard: "Smart card", visa: "Family joining visa", renewal: "Visa renewal", card: "Resident card",
};

bind(form, result, (v) => {
  const country = cc === "ae" ? v.emirate || "ae-dubai" : cc;
  let insurance = v.insurance;
  if (cc === "ae") {
    const ins = form.querySelector("#insurance");
    if (ins && !ins.dataset.touched) { insurance = country === "ae-dubai" ? 600 : 0; ins.value = String(insurance); }
  }
  const r = familyResidenceCost({ country, spouse: v.spouse, children: v.children, childrenOver10: v.over10, parents: v.parents, years: v.years, insurance, inside: v.inside === "yes", sponsor: v.sponsor, salary: v.salary, housing: v.housing === "yes" });
  if (!r || !r.persons) return null;
  const cycle = plural(r.years, "year");
  let html = big("Paid at issue", m(r.firstYear), `for ${cycle} of residence${r.insurance ? " with a year of insurance" : ""}, then about ${m(r.annualAfter)} a year`);
  const rows = r.items.filter((i) => i.stage !== "renewal" && i.stage !== "deposit").map((i) => [`${L[i.id]} (${m(i.unit)} × ${i.n})`, m(i.total)]);
  if (r.insurance) rows.push([`Health insurance for a year (${m(r.insurancePerPerson)} × ${cc === "bh" ? r.persons - Number(v.parents || 0) : r.persons})`, m(r.insurance)]);
  rows.push(["Total at issue", m(r.firstYear), { strong: true }]);
  if (r.deposit) rows.push(["Refundable deposit for parents (not in the total)", m(r.deposit), { muted: true }]);
  html += table(rows, "Fees at issue");
  html += table([[`Renewal fees every ${r.years === 1 ? "year" : cycle}`, m(r.renewalCycle)], ["Yearly cost after that (with insurance)", m(r.annualAfter), { strong: true }]], "After the first year");
  if (r.eligible === false) html += note(`Your salary is below the minimum to sponsor your family (${m(r.need)}).`, "warn");
  if (r.eligible === true) html += note(`Your salary meets the minimum to sponsor your family (${m(r.need)}).`, "info");
  html += note("Official government fees; typing and service centres add their own charges, and market prices can be higher.", "info");
  return html;
});
form.querySelector("#insurance")?.addEventListener("input", (e) => (e.target.dataset.touched = "1"));
