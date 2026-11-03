import { gccUnemployment } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const CUR = { ae: "AED", sa: "SAR", om: "OMR", bh: "BHD", qa: "QAR", kw: "KWD" };
const NAME = {
  "ae-iloe": "Unemployment insurance (UAE)",
  "ae-nafis": "Nafis job loss support (nationals, without family additions)",
  "sa-saned": "SANED",
  "sa-hafiz": "Hafiz",
  "om-job-security": "Job security allowance",
  "bh-unemployment": "Unemployment insurance (Bahrain)",
  "sa-none": "SANED and Hafiz",
  "om-none": "Job security allowance",
};
const WHY = {
  resignation: "Not paid on resignation",
  disciplinary: "Not paid after disciplinary dismissal",
  hafizLater: "For job seekers aged 20 to 40, and for former employees 24 months after leaving work",
  saudiOnly: "SANED and Hafiz are for Saudis only",
  omaniOnly: "The job security allowance is for Omanis only",
};

bind(form, result, (v) => {
  if (v.wage === null || v.wage === undefined) return null;
  const r = gccUnemployment({ country: v.country, national: v.national !== "no", wage: v.wage, reason: v.reason });
  const m = (x) => moneyEn(x, CUR[v.country]);
  if (r.rows[0].why === "notCovered") return big("This country is not covered yet", "—", "") + note("We have not verified the unemployment schemes of Qatar and Kuwait yet, so no figure is shown.", "info");
  const varying = (x) => x.id === "sa-saned" || x.id === "om-job-security";
  const desc = (x) => (varying(x) ? `${m(x.total)} over ${plural(x.months, "month")} (starting at ${m(x.monthly)} a month)` : `${m(x.monthly)} × ${plural(x.months, "month")} = ${m(x.total)}`);
  let html = r.best
    ? big("The most you can receive", m(r.best.total), `${NAME[r.best.id]} over ${plural(r.best.months, "month")}`)
    : big("No benefit available in your case", m(0), "reasons below");
  html += table(
    r.rows.map((x) => [NAME[x.id] || "—", x.eligible ? desc(x) : WHY[x.why] || "Not payable", x === r.best ? { strong: true } : { muted: !x.eligible }]),
    "Schemes in this country"
  );
  const s = r.rows.find((x) => x.id === "sa-saned");
  if (s && s.eligible) html += note(`SANED: ${m(s.monthly)} for the first three months, then ${m(s.after)} for nine months.`, "info");
  if (r.rows.some((x) => x.id === "om-job-security" && x.eligible)) html += note("Oman: 60% for six months, then 50% for three and 40% for three; the monthly amount shown is for the first months.", "info");
  if (r.rows.some((x) => x.id === "ae-nafis" && x.eligible)) html += note("Nafis: 6 consecutive months and 12 in total, plus 4,500 for a non-working spouse and 2,400, 2,400 and 1,600 for children.", "info");
  html += note("An approximate comparison that assumes the contribution period is met. Use each scheme's calculator for your exact case.", "info");
  return html;
});
