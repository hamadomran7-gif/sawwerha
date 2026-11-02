import { uaeNoticePay, uaeProbationNotice, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");
const probOnly = form.querySelectorAll("[data-prob]");
const afterOnly = form.querySelectorAll("[data-after]");

bind(form, result, (v) => {
  const inProb = v.stage === "probation";
  probOnly.forEach((el) => (el.hidden = !inProb));
  afterOnly.forEach((el) => (el.hidden = inProb));
  if (!v.basic) return null;
  const wage = (v.basic || 0) + (v.allowances || 0);
  const employer = v.who === "employer";
  const payer = employer ? "the employer pays you" : "you pay the employer";
  if (inProb) {
    const kind = employer ? "employer" : v.dest === "leave" ? "leaving_uae" : "to_uae_employer";
    const p = uaeProbationNotice({ wage, who: kind, servedDays: v.served || 0 });
    const what = employer ? "Employer ends the contract during probation" : kind === "leaving_uae" ? "Employee resigns to leave the UAE" : "Employee resigns to join another UAE employer";
    let html = big(p.amount ? `Compensation for unserved notice (${payer})` : "Nothing owed: notice fully served", m(p.amount), what);
    html += table(
      [
        ["Required notice", plural(p.noticeDays, "day")],
        ["Notice days served", plural(p.noticeDays - p.remainingDays, "day")],
        ["Daily wage (gross ÷ 30)", m(p.daily)],
        ["Compensation for unserved days", m(p.amount), { strong: true }],
      ],
      "Breakdown (Article 9)"
    );
    if (kind === "to_uae_employer") html += note("The new employer compensates the original employer for recruitment or contracting costs, unless agreed otherwise.", "info");
    if (kind === "leaving_uae") html += note("If you return on a new work permit within 3 months of leaving, the new employer must compensate the original employer.", "info");
    return html;
  }
  const n = uaeNoticePay({ wage, noticeDays: v.notice || rules.ae.notice.minDays, servedDays: v.served || 0 });
  let html = big(n.amount ? `Notice pay (${payer})` : "No notice pay: notice fully served", m(n.amount), `${plural(n.noticeDays, "day")} notice · on gross pay of ${m(wage)}`);
  html += table(
    [
      ["Notice period in the contract", plural(n.noticeDays, "day")],
      ["Days served", plural(n.servedDays, "day")],
      ["Days not served", plural(n.remainingDays, "day")],
      ["Daily wage (gross ÷ 30)", m(n.daily)],
      ["Notice pay", m(n.amount), { strong: true }],
    ],
    "Breakdown (Article 43)"
  );
  if (n.adjusted) html += note("The legal notice period is between 30 and 90 days, so we adjusted your figure to the nearest limit.", "warn");
  if (employer && n.servedDays > 0) html += note("Because the employer ended the contract, you may take one unpaid day a week during the notice to look for work, telling the employer 3 days in advance.", "info");
  html += note("Notice pay is due in addition to end-of-service gratuity and unused leave, and it is owed even if the other side suffered no loss.", "ok");
  return html;
});
