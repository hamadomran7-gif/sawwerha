import { ksaAllowance500, ksaPayDate } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const survField = form.querySelector("[data-survivors]");
const NAMES = { civil: "Civil employee", military: "Military", operating: "Operating programme contractor", retiree: "Retiree", survivors: "Survivor of a deceased member", socialSecurity: "Social security family", saned: "Saned beneficiary", private: "Private sector" };
const sync = () => { survField.hidden = form.category.value !== "survivors"; };
form.category.addEventListener("change", sync);

bind(form, result, (v) => {
  sync();
  const s = ksaAllowance500({ category: v.category, income: v.income, survivors: v.survivors, kwh: v.kwh, amps: v.amps, m3: v.m3 });
  let html;
  if (!s.eligible) {
    html = big("SAR 500 allowance", "Not covered", NAMES[s.category]);
    html += note(s.category === "saned" ? "GOSI said the allowance does not cover Saned beneficiaries." : "The allowance covers civil and military state employees, retirees and social security families. In the private sector, the Nitaqat threshold for counting a Saudi rises to SAR 5,000 and then 6,000.", "warn");
  } else {
    const sub = s.category === "socialSecurity" ? "Family support · start date not announced" : "From January 2027";
    html = big("Your monthly allowance", m(s.amount), `${NAMES[s.category]} · ${sub}`);
    const rows = [
      ["Monthly allowance", m(s.amount), { strong: true }],
      ["Yearly", m(s.annual)],
      s.income ? ["Your current monthly income", m(s.income)] : null,
      s.income ? [`Your income from January 2027 (+${numEn(s.pct)}%)`, m(s.newIncome), { strong: true }] : null,
    ];
    if (["civil", "military", "operating"].includes(s.category)) {
      const p = ksaPayDate({ item: "salary", year: 2027, month: 1 });
      if (p && p.date) rows.push(["Expected first salary with the allowance", dateEn(p.date)]);
    }
    html += table(rows, "Allowance breakdown");
  }
  if (s.hasBills) {
    html += table(
      [
        ["Electricity bill now → 2027", `${m(s.electricity.old)} → ${m(s.electricity.new)}`],
        ["Water bill now → 2027", `${m(s.water.old)} → ${m(s.water.new)}`],
        ["Monthly increase in both bills", `+ ${m(s.billIncrease)}`],
        [s.net >= 0 ? "Left of the allowance after the increase" : "The increase exceeds the allowance by", m(Math.abs(s.net)), { strong: true }],
      ],
      "Allowance versus 2027 bills"
    );
    html += note("Bills include 15% VAT at 2027 residential tariffs and exclude today's unpublished meter fee, so the real increase may be slightly lower.", "info");
  }
  if (s.category === "survivors") html += note("GOSI said the allowance is split equally among the survivors of a deceased member.", "info");
  if (s.category === "retiree") html += note("Paid to retirees automatically from 1 January 2027, with one allowance for anyone with several pensions. Pensions are paid on the 1st of each month.", "info");
  if (s.category === "socialSecurity") html += note("Support for social security families follows 'the regulating mechanisms and controls'; no start date, and no word on whether it is per family or per person, as of 3 November 2026.", "warn");
  if (s.eligible && s.category !== "socialSecurity") html += note("As reported, the allowance is not added to basic salary, so no pension is deducted from it and it does not change pensions or increments.", "info");
  return html;
});
