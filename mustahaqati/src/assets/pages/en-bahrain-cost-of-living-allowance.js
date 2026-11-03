import { bahrainCostOfLiving, bahrainColPayDates, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const C = rules.bh.costOfLiving;
const bhd = (n) => `BHD ${numEn(n)}`;

bind(form, result, (v) => {
  if (v.income === null) return null;
  const s = bahrainCostOfLiving({ income: v.income, category: v.category });
  let html;
  if (s.reason === "category") {
    html = big("Monthly cost-of-living allowance", bhd(0), "Single people who are not elderly are not an eligible group");
    html += note("Eligible groups: married couples, widowers with children, divorced parents with custody, elderly people in certain situations and social security recipients. A single person who is not elderly is most likely not eligible.", "warn");
    return html;
  }
  if (s.reason === "income") {
    html = big("Monthly cost-of-living allowance", bhd(0), `Head of household's income above BHD ${numEn(C.ceiling)}`);
    html += note(`The allowance is not paid when the head of household earns more than BHD ${numEn(C.ceiling)} a month.`, "warn");
    return html;
  }
  const dates = bahrainColPayDates({ from: new Date(), count: 6 });
  html = big("Monthly cost-of-living allowance", bhd(s.amount), `Bracket ${s.bracket} · from January 2026`);
  html += table(
    [
      ["Head of household's income", bhd(s.income)],
      ["Monthly allowance", bhd(s.amount), { strong: true }],
      ["Yearly allowance", bhd(s.annual)],
      [`Before January 2026 (+${numEn(s.amount - s.prev)})`, bhd(s.prev)],
      ["Next payments (on the 15th)", dates.map((d) => dateEn(d)).join("; ")],
    ],
    "Allowance breakdown"
  );
  if (s.boundary) html += note(`Your income is exactly on a bracket limit (${numEn(s.income)}). The official order and the ministry word the limit differently, so you may be placed in the other bracket.`, "warn");
  if (v.category === "socialSecurity") html += note("Social security recipients get the allowance automatically without applying, mostly in the top bracket (130).", "info");
  if (v.category === "elderly") html += note("Elderly people qualify in certain social situations, and the national portal gives no age. Check with a social centre.", "info");
  html += note("Paid on the 15th of each month according to the ministry's 2020 announcement; we found no official rule for when it falls on a holiday. The amount does not change with family size.", "info");
  return html;
});
