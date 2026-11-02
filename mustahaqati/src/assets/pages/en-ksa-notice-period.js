import { ksaNotice } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");

bind(form, result, (v) => {
  if (!v.wage) return null;
  const employer = v.who === "employer";
  const n = ksaNotice({ wage: v.wage, monthly: v.pay !== "other", who: v.who, givenDays: v.given || 0 });
  const payer = employer ? "the employer pays you" : "you pay the employer";
  let html = big(n.amount ? `Notice pay (${payer})` : "Nothing owed: notice fully given", m(n.amount), `Legal notice ${plural(n.requiredDays, "day")} · on the actual wage`);
  html += table(
    [
      ["Legal notice period", plural(n.requiredDays, "day")],
      ["Days of notice given", plural(n.givenDays, "day")],
      ["Days not given", plural(n.unservedDays, "day")],
      ["Daily wage (actual wage ÷ 30)", m(n.daily)],
      ["Compensation", m(n.amount), { strong: true }],
      n.givenDays > 0 ? ["If calculated on the whole notice period", m(n.fullAmount), { muted: true }] : null,
    ],
    "Breakdown (Articles 75 and 76)"
  );
  if (n.givenDays > 0) html += note("Article 76 refers to \"the employee's wage for the notice period\". Paying only for the unserved part is the common practice; the full-period amount is shown for comparison.", "info");
  html += note("These periods apply to open-ended contracts. Fixed-term contracts have no Article 75 notice: early termination by the employer falls under Article 77, and a resignation is accepted after 30 days, which the employer may defer to 60.", "ok");
  return html;
});
