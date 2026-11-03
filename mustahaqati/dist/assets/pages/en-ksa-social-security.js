import { ksaSocialSecurity, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "SAR");

bind(form, result, (v) => {
  if (v.dependents === null) return null;
  const S = rules.sa.socialSecurity;
  const deps = Math.max(0, Math.floor(v.dependents || 0));
  const r = ksaSocialSecurity({ dependents: deps, earned: v.earned, unearned: v.unearned, citizenAccount: v.citizenAccount, countCitizenAccount: !!v.countCitizenAccount });
  let html = r.eligible
    ? big("Estimated monthly social security payment", m(r.capFinal), r.capMatters ? `or ${m(r.capMinimum)}, depending on how the cap is applied` : "paid on the 1st of each month")
    : big("No social security payment due", m(0), "counted income reaches or exceeds the family minimum");
  html += table(
    [
      [deps ? `Minimum: ${numEn(S.basicHead)} + ${plural(deps, "dependent")} × ${numEn(S.perDependent)}` : "Minimum for an independent applicant or head of family alone", m(r.minimum)],
      ["Earned income × 50%", m((Number(v.earned) || 0) * S.earnedRate)],
      v.unearned ? ["Unearned income × 100%", m(Number(v.unearned) || 0)] : null,
      v.countCitizenAccount && v.citizenAccount ? ["Citizen's Account", m(Number(v.citizenAccount) || 0)] : null,
      ["Counted income", m(r.counted)],
      ["Payment (minimum − counted income)", m(r.raw), { strong: r.eligible }],
    ],
    "Calculation breakdown"
  );
  if (r.capMatters) html += note(`Press sources mention a family maximum of SAR ${numEn(S.familyMax)}. If it applies to the final payment, the payment is ${m(r.capFinal)}; if it applies to the minimum before income is deducted, the payment is ${m(r.capMinimum)}.`, "warn");
  if (!r.capMatters && r.eligible && r.capFinal < r.raw) html += note(`Press sources mention a family maximum of SAR ${numEn(S.familyMax)}, so the payment is limited to it.`, "info");
  if (!v.countCitizenAccount && v.citizenAccount) html += note("The Citizen's Account was not counted because the latest official text excludes it; tick the option for the more cautious figure.", "info");
  html += note("This is an estimate and does not cover the wealth, savings and time-abroad conditions; the ministry decides after reviewing the application.", "info");
  return html;
});
