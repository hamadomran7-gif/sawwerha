import { ksaCivilPension, ksaMilitaryPension, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "SAR");
const ym = (n) => {
  const y = Math.floor(n / 12), mo = n % 12;
  return [y ? plural(y, "year") : "", mo ? plural(mo, "month") : ""].filter(Boolean).join(" ") || "0 months";
};
const pct = (p) => `${numEn(Math.round(p * 10000) / 100)}%`;

const toggle = () => {
  const s = form.system.value;
  form.querySelectorAll("[data-calc]").forEach((el) => (el.hidden = s === "new"));
  form.querySelectorAll("[data-civil]").forEach((el) => (el.hidden = s !== "civil"));
  form.querySelectorAll("[data-mil]").forEach((el) => (el.hidden = s !== "military"));
  form.querySelectorAll("[data-trans]").forEach((el) => (el.hidden = s !== "civil" || form.transitional.value !== "yes"));
};

const STATUS = {
  pension: "Pension paid from the day after service ends",
  pension_conditional: "Pension if the employer approves the retirement request",
  deferred: "Deferred pension paid at 60",
  notional: "Buy service at 60, or a lump sum",
  lump: "Lump sum paid at 60 or on death",
};

bind(form, result, (v) => {
  toggle();
  if (v.system === "new") {
    return note(`Anyone who joined government service for the first time from 3 July 2024 is under the new Social Insurance Law: 2.25% of the average wage for each year, age 65, and early retirement with 360 months from age 55 with a 3% reduction per year. Calculate your pension with the <a href="../gosi-pension-calculator/">GOSI pension calculator</a> by choosing the new system.`, "info");
  }
  const basic = Number(v.basic) || 0;
  const months = Math.max(0, Math.floor(Number(v.years) || 0)) * 12 + Math.min(11, Math.max(0, Math.floor(Number(v.months) || 0)));
  if (!basic || !months) return null;

  if (v.system === "military") {
    const M = rules.sa.militaryPension;
    const r = ksaMilitaryPension({ lastSalary: basic, months, civilMonths: v.civilMonths || 0, age: v.age || 0 });
    let html = r.eligible
      ? big("Your estimated military pension", m(r.pension), `${pct(r.pct)} of your last salary`)
      : big("You do not meet the military pension conditions", m(0), "A lump sum is paid instead");
    html += table(
      [
        ["Military service", ym(months)],
        v.civilMonths ? ["Combined civil service", ym(Number(v.civilMonths))] : null,
        ["Service counted", `${ym(r.counted)}${r.counted >= M.maxMonthsInferred ? " (maximum)" : ""}`],
        ["Formula", `${m(basic)} × ${numEn(r.counted)} ÷ ${M.divisorMonths}`],
        [r.eligible ? "Monthly pension" : "Pension if you met the conditions", m(r.pension), r.eligible ? { strong: true } : { muted: true }],
      ],
      "How it is calculated"
    );
    if (!r.eligible) html += note(`Military pension conditions: ${plural(M.minActualMonths / 12, "year")} of actual military service, or ${plural(M.minCombinedMonths / 12, "year")} of civil and military service including ${plural(M.minMilitaryWithinCombined / 12, "year")} military, or reaching ${numEn(M.pensionAtAge)}. Those who do not qualify receive a lump sum under Articles 9 and 10 of the Military Retirement Law; we have not verified its rates.`, "warn");
    html += note("The 100% maximum at 35 years is inferred from the divisor. The retirement age varies by rank, and we have not verified the minimum military pension.", "info");
    return html;
  }

  const C = rules.sa.civilPension;
  const transitional = v.transitional === "yes";
  const r = ksaCivilPension({ lastBasic: basic, months, reason: v.reason, transitional, monthsAt2024: v.at2024 || 0 });
  const paysPension = r.status === "pension" || r.status === "pension_conditional" || r.status === "deferred";
  let html;
  if (paysPension) html = big(r.status === "deferred" ? "Your estimated deferred pension" : "Your estimated monthly pension", m(r.pension), `${STATUS[r.status]} · ${pct(r.pct)} of your last salary`);
  else if (r.status === "notional") html = big("Two options at 60", `${m(r.pensionAfterBuy)} a month`, `after buying ${ym(r.buyMonths)}, or a lump sum of ${m(r.lump)}`);
  else html = big("Estimated end-of-service lump sum", m(r.lump), STATUS.lump);

  const rows = [
    ["Length of service", `${ym(months)} (${plural(months, "month")})`],
    ["Service counted for the pension", `${plural(r.counted, "month")}${months > C.maxMonths ? " (maximum)" : ""}`],
    ["Formula", `${m(basic)} × ${numEn(r.counted)} ÷ ${C.divisorMonths}`],
    [paysPension ? "Pension by the formula" : "Pension by the formula if you met the conditions", m(r.pension), paysPension ? { strong: true } : { muted: true }],
    ["Service needed for a pension on resignation", `${plural(r.anyExitRequired, "month")}${transitional ? " (affected group)" : ""}`],
    ["Result", STATUS[r.status]],
  ];
  if (r.status === "notional" || r.status === "lump") {
    rows.push([`Lump sum (${numEn(r.lumpRate * 100)}% × annual salary × years)`, m(r.lump), { strong: r.status === "lump" }]);
  }
  if (r.status === "notional") {
    rows.push([`Cost of buying ${ym(r.buyMonths)} (18% of the last salary per month)`, m(r.buyCost)]);
    rows.push(["Pension after buying (10 years ÷ 40)", m(r.pensionAfterBuy), { strong: true }]);
  }
  html += table(rows, "How it is calculated");

  if (r.status === "pension_conditional") html += note("Retiring with 20 years needs the employer's approval, which has been restricted since 2021, and since February 2026 a ministerial committee decides requests from employees classed as surplus staff. If the request is refused and you resign, your pension is deferred to 60.", "warn");
  if (r.status === "deferred") html += note(`Your service ended before the conditions for an immediate pension, and you have ${plural(C.deferredMinMonths / 12, "year")} or more, so your pension is paid at 60 instead of a lump sum (Article 23 bis).`, "info");
  if (r.status === "notional") html += note("With 5 to under 10 years of service you may, at 60, add notional service to reach 10 years by paying all the contributions for it on your last salary, in one payment or instalments. The 18% rate (9% + 9%) is our reading of the text, and GOSI sets the final cost.", "info");
  if (r.status === "notional" || r.status === "lump") html += note("The lump sum is 14% of the annual salary (last salary × 12) for each year, or 10% on resignation or disciplinary dismissal, with part years pro rata. It is paid at 60 or on death, whichever comes first, not when you leave.", "info");
  if (paysPension && r.belowMin) html += note(`The pension by the formula is below ${m(C.minPensionUnverified)}, the minimum used by GOSI. We found no official text confirming it for civil retirement; if it applies, your pension is raised to it.`, "warn");
  if (transitional) html += note("You are in the group affected by the 2024 amendments: your retirement age and the service needed for a pension before it change, but the formula does not. It is not yet settled whether the 20-year option with approval still applies to you, or how compulsory retirement at 60 Hijri years interacts with your new age. Work out your new age with the Saudi retirement age calculator.", "warn");
  html += note("This is an estimate that assumes all service is actual, countable service. Periods combined from GOSI under the benefits exchange are paid on the last civil salary for all periods, but since 2022 they do not complete the condition for a pension before 60 except in specific cases.", "info");
  return html;
});
