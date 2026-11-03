import { nitaqatSummary, nitaqatWeight, nitaqatPhaseAt, parseWageList } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const LABEL = ["Today", "From 25 Apr 2027", "From 25 Apr 2028"];
const w = (x) => (x === 1 ? "1" : x === 0.5 ? "½" : "0");
const group = (list) => {
  const mp = new Map();
  list.forEach((x) => mp.set(x, (mp.get(x) || 0) + 1));
  return [...mp.entries()].sort((a, b) => a[0] - b[0]);
};

bind(form, result, (v) => {
  const wages = parseWageList(v.wages);
  if (!wages.length) return null;
  const halfBand = v.halfBand !== "no";
  const S = nitaqatSummary(wages, halfBand);
  const now = nitaqatPhaseAt(new Date());
  const n = wages.length;
  let html = big(
    n === 1 ? "Employee's Nitaqat weight today" : `Saudis counted today out of ${numEn(n)}`,
    n === 1 ? w(nitaqatWeight(wages[0], now, halfBand)) : numEn(S[now].total),
    S.slice(now + 1).map((s, i) => `${LABEL[now + 1 + i]}: ${n === 1 ? w(s.total) : numEn(s.total)}`).join(" · ")
  );
  html += table(
    S.map((s, i) => [
      `${LABEL[i]} (full from ${numEn(s.full)}${s.halfOfficial || halfBand ? `, half from ${numEn(s.half)}` : ""})`,
      `${numEn(s.total)} — ${numEn(s.fullCount)} full${s.halfCount ? `, ${numEn(s.halfCount)} half` : ""}${s.zeroCount ? `, ${numEn(s.zeroCount)} not counted` : ""}`,
      i === now ? { strong: true } : {},
    ]),
    "Employees counted in each phase"
  );
  html += table(
    S.map((s, i) =>
      i < now ? null : [s.toRaise ? `${LABEL[i]}: raise ${numEn(s.toRaise)} ${s.toRaise === 1 ? "wage" : "wages"} to SAR ${numEn(s.full)}` : `${LABEL[i]}: all wages are SAR ${numEn(s.full)} or more`, s.toRaise ? `${m(s.raiseCost)} a month` : "No rise needed", s.toRaise && i > now ? { strong: true } : {}]
    ),
    "Monthly wage rise needed for everyone to count fully"
  );
  const groups = group(wages);
  if (n > 1 && groups.length <= 40) {
    html += table(
      groups.map(([x, k]) => [`SAR ${numEn(x)}${k > 1 ? ` × ${numEn(k)}` : ""}`, S.map((s, i) => w(nitaqatWeight(x, i, halfBand))).join(" → ")]),
      "Weight per employee (today → 2027 → 2028)"
    );
  }
  if (halfBand) html += note("The half-count band after each increase (4,000–4,999 in 2027 and 5,000–5,999 in 2028) is an assumption that mirrors the current rule; it has not been officially published. Choose “Do not count” to see the stricter case.", "warn");
  html += note("Nitaqat uses the wage registered with GOSI and subject to contributions. If you raise a wage, update it with GOSI for it to count. The cost above covers wages only, not GOSI contributions on the increase.", "info");
  html += note("The 25 April 2027 and 25 April 2028 dates come from the Deputy Minister of Human Resources. Students, persons with disabilities and part-time staff have their own weights, shown in the table below.", "info");
  return html;
});
