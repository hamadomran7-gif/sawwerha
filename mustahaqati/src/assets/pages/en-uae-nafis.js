import { uaeNafis, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const N = rules.ae.nafis;
const m = (x) => moneyEn(x, "AED");
const EDU = { bachelor: "bachelor's", diploma: "diploma", highSchool: "high school", below: "below high school" };
const show = (sel, on) => form.querySelectorAll(sel).forEach((el) => (el.hidden = !on));
const mfmt = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const monthLabel = (iso) => mfmt.format(new Date(`${iso}T00:00:00Z`));

bind(form, result, (v) => {
  const emirati = v.category === "emirati";
  show("[data-emirati]", emirati);
  show("[data-wife]", v.category === "wife");
  show("[data-existing]", emirati && v.status === "existing");
  show("[data-below]", emirati && v.education === "below");
  form.querySelector('label[for="children"]').textContent = v.category === "wife" ? "Number of your children" : "Number of eligible children";
  if (v.salary === "" || v.salary === null || v.salary === undefined) return null;
  const r = uaeNafis({
    category: v.category, status: v.status, education: v.education, family: v.family === "yes", salary: v.salary, current: v.current,
    mohre: v.mohre !== "no", children: v.children, claimant: v.claimant, spouseGov: v.spouseGov === "yes", pensionShare: v.pensionShare,
    marriageYears: v.marriageYears, exempt: v.exempt === "yes", today: new Date(),
  });
  const S = r.support;

  if (!emirati) {
    const WHY = {
      degree: "A bachelor's degree accredited by the Ministry of Higher Education is required.",
      belowMin: "The minimum gross salary is AED 6,000.",
      aboveMax: `The salary limit for this category is ${m(S.maxSalary)}.`,
      family: "At least two children or five years of marriage are required.",
      exemptYears: "Medical and teaching staff and PhD holders need two years of marriage, which you have not reached.",
    };
    let html = S.reason ? big("You do not appear eligible", m(0), "reason below") : big("Salary support", `up to ${m(S.amount)}`, "a month from September 2026");
    if (S.reason) html += note(WHY[S.reason], "warn");
    html += note("The two new categories (children of Emirati mothers and wives of Emirati men) were announced in April 2026 with support \"of up to AED 3,000\" in the private sector; it has not been stated whether the amount is fixed or a maximum. The child allowance and Eshtirak are for nationals.", "info");
    return html;
  }

  const rows = [];
  let html = "";
  if (v.status === "existing") {
    html += big("Total Nafis support this month", m(r.total), "salary support + child allowance");
    rows.push(["Salary support now", m(S.amount)]);
  } else {
    html += big("Total monthly Nafis support", m(r.total), "salary support + child allowance");
    rows.push([`Salary support (${EDU[v.education]})`, m(S.amount)]);
  }
  rows.push([r.child.kids ? `Child allowance (${plural(r.child.kids, "child", "children")} × ${m(N.child.perChild)})` : "Child allowance", m(r.child.amount)]);
  rows.push(["Monthly total", m(r.total), { strong: true }]);
  rows.push([`Eshtirak: your pension share (${Math.round(r.pension.pct * 100)}%) paid by Nafis`, r.pension.eligible ? m(r.pension.amount) : "Does not apply", { muted: !r.pension.eligible }]);
  html += table(rows, "Breakdown");

  if (v.status === "existing" && S.rows.length) {
    const sched = S.rows.map((x) => [x.to ? `${monthLabel(x.from)} – ${monthLabel(x.to)}` : `From ${monthLabel(x.from)}`, m(x.amount)]);
    if (S.remaining !== null && S.remaining > 0) sched.push(["Total salary support from September 2026 until it ends", m(S.remaining), { strong: true }]);
    html += table(sched, `Salary support schedule (starting from ${m(S.start)})`);
  }

  const notes = [];
  if (v.status === "new") {
    if (S.reason === "belowMin") notes.push(["The minimum for all Nafis programmes has been a gross AED 6,000 a month since September 2026.", "warn"]);
    if (S.reason === "aboveMax") notes.push(["Salary support and Eshtirak are for gross salaries up to AED 20,000; the child allowance continues up to 50,000.", "warn"]);
  } else {
    if (S.reason === "suspended") notes.push(["Your salary support stopped on 1 September 2026 because your gross salary is below 6,000 at an employer covered by the Emirati minimum wage decision. It resumes when the salary is corrected, and the employer faces penalties.", "warn"]);
    if (S.reason === "outside") notes.push(["Outside the ministry and Central Bank umbrella your current support is paid in full for six months, then 70% for six months, then 30% for three months, and then stops, unless your salary is raised to 6,000 or more. Announcements on this case are not fully consistent.", "warn"]);
    if (S.reason === "noCut") notes.push(["Your current support is not above the new amount for your qualification, so the step-down does not apply.", "info"]);
    if (S.reason === "aboveOld") notes.push(["The 2022 rules covered salaries up to AED 30,000, so you have no salary support. If you do receive support, enter the amount.", "warn"]);
    if (S.assumed === "low" || S.assumed === "high") notes.push([`We estimated your current support from the November 2022 rules (${m(S.start)}); enter your actual amount if it differs.`, "info"]);
    if (S.assumed === "noLegacy") notes.push(["We found no old amount for below high school, so we assumed the new amount; enter your actual amount.", "info"]);
    if (S.target > 0 && !S.reason) notes.push([`Your support settles at the new amount for your qualification (${m(S.target)}) while your salary is 20,000 or less.`, "info"]);
  }
  const CW = {
    claimant: "A mother receives the child allowance if her husband has died, or if she is the provider by court ruling with the husband unable to earn or out of work.",
    spouseGov: "The child allowance is not paid if your spouse works for a federal or local government entity.",
    belowMin: "The child allowance requires a salary of AED 6,000 or more.",
    aboveMax: "The child allowance is for salaries up to AED 50,000.",
  };
  if (CW[r.child.reason]) notes.push([CW[r.child.reason], "warn"]);
  notes.push(["This is a guide based on the rules announced for 1 September 2026; Nafis decides after checking your details.", "info"]);
  return html + notes.map(([t, k]) => note(t, k)).join("");
});
