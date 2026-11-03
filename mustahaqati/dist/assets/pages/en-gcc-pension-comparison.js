import { gccPensionCompare } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const NAME = {
  "ae-legacy": "UAE (before Oct 2023)",
  "ae-new": "UAE (new entrants)",
  "sa-legacy": "Saudi Arabia (before Jul 2024)",
  "sa-new": "Saudi Arabia (new entrants)",
  kw: "Kuwait",
  qa: "Qatar",
  bh: "Bahrain",
  om: "Oman",
};
const pc = (x) => `${numEn(Math.round(x * 1000) / 10)}%`;

bind(form, result, (v) => {
  if (!v.years) return null;
  const rows = gccPensionCompare({ years: v.years, salary: v.salary || 0 });
  const best = rows[0];
  const S = Number(v.salary) || 0;
  let html = big(`Highest pension rate after ${numEn(v.years)} years`, best.eligible ? NAME[best.key] : "—", best.eligible ? `${pc(best.pct)} of the pension salary${S ? ` · ${numEn(Math.round(best.pension))}` : ""}` : "");
  html += table(
    rows.map((r) => [
      `${NAME[r.key]} · age ${r.age}`,
      r.eligible ? `${pc(r.pct)}${S ? ` = ${numEn(Math.round(r.pension))}` : ""}` : `No pension: ${r.minYears} years needed`,
      r === best ? { strong: true } : {},
    ]),
    "Pension rate and amount at normal retirement age"
  );
  if (rows.some((r) => r.key === "qa" && !r.eligible)) html += note("Qatar: those insured before 2023 who reach retirement age after 15 years or more have the pension settled on 25 years or more (Article 82), so they do qualify.", "info");
  html += note("An approximate comparison that assumes the same salary is the pension basis in every country and leaves out minimum pensions, supplementary pensions and bonuses. Use your country's calculator for an exact figure.", "info");
  return html;
});
