import { gccFuelCompare } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const money = (n) => moneyEn(n, "AED");
const N = { ae: "UAE", sa: "Saudi Arabia", qa: "Qatar", om: "Oman", kw: "Kuwait", bh: "Bahrain" };
const G = { 91: "91 petrol", 95: "95 petrol", 98: "98 petrol", diesel: "diesel" };
const mf = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const when = (x) => (x.country === "om" ? "cap since Oct 2021" : x.country === "sa" ? "since Jan 2026" : x.asOf && /^\d{4}-\d{2}$/.test(x.asOf) ? mf.format(new Date(`${x.asOf}-01T00:00:00Z`)) : x.asOf === "2026-Q3" ? "Q3 2026" : "");
const loc = (x) => `${x.cur} ${x.local.toFixed(x.cur === "OMR" || x.cur === "KWD" || x.cur === "BHD" ? 3 : 2)}`;

bind(form, result, (v) => {
  const r = gccFuelCompare({ grade: v.grade, tank: v.tank || 0 });
  if (!r.rows.length) return null;
  const c = r.cheapest, d = r.dearest;
  let html = big(`Cheapest ${G[r.grade]}: ${N[c.country]}`, money(c.tankAed), `A ${numEn(r.tank)}-litre fill · dearest ${N[d.country]} at ${money(d.tankAed)}`);
  html += table(
    r.rows.map((x) => [`${N[x.country]}: ${loc(x)} a litre${when(x) ? ` (${when(x)})` : ""} = AED ${x.aed.toFixed(2)}`, money(x.tankAed), x === c ? { strong: true } : {}]),
    `A ${numEn(r.tank)}-litre tank in AED, cheapest first`
  );
  html += note(`Gap between the cheapest and dearest tank: ${money(d.tankAed - c.tankAed)}. Converted at the official pegs; the Kuwaiti dinar at its October 2026 average.`, "info");
  if (r.rows.some((x) => x.country === "bh" || x.country === "kw")) html += note("Bahrain shows its latest published price (September 2026) as it changes monthly, and Kuwait its Q3 2026 decision; Kuwait's 91, 95 and diesel prices have been fixed since 2016.", "info");
  return html;
});
