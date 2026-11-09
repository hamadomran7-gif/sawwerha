import { gccUtilityCompare } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const money = (n) => moneyEn(n, "AED");
const N = { dewa: "Dubai (DEWA)", abudhabi: "Abu Dhabi and Al Ain (TAQA Distribution)", etihadwe: "Ajman, UAQ, RAK and Fujairah (Etihad WE)", ksa: "Saudi Arabia (SEC and NWC)", bahrain: "Bahrain (EWA)", kuwait: "Kuwait (MEW)" };
const loc = (x) => `${x.cur} ${x.local.toLocaleString("en-US", { minimumFractionDigits: x.cur === "BHD" || x.cur === "KWD" ? 3 : 2, maximumFractionDigits: x.cur === "BHD" || x.cur === "KWD" ? 3 : 2 })}`;

bind(form, result, (v) => {
  const r = gccUtilityCompare({ kwh: v.kwh || 0, m3: v.m3 || 0, who: v.who, home: v.home });
  const c = r.cheapest, d = r.dearest;
  let html = big(`Cheapest for your use: ${N[c.id]}`, money(c.aed), `Dearest ${N[d.id]} at ${money(d.aed)} a month`);
  html += table(
    r.rows.map((x) => [`${N[x.id]}: ${loc(x)}${x.perKwhAed ? ` · ${(x.perKwhAed * 100).toFixed(1)} fils per kWh` : ""}`, money(x.aed), x === c ? { strong: true } : {}]),
    `A ${numEn(r.kwh)} kWh and ${r.m3} m³ monthly bill in AED, cheapest first`
  );
  html += note("Figures include VAT, fuel surcharges, meter charges and consumption-based sewerage, but not rent-based fees (Dubai's housing fee, Abu Dhabi's and Bahrain's municipality fees). Saudi Arabia uses the tariff in force until end-2026; Abu Dhabi a 30-day cycle.", "info");
  if (v.who === "national") html += note("Nationals: special tariffs in Dubai, Abu Dhabi and the northern emirates, the first-home tariff in Bahrain and private housing in Kuwait; the Saudi tariff does not distinguish.", "info");
  return html;
});
