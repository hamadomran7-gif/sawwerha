import { ksaMilitarySalary, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const nextJanYear = () => new Date().getUTCFullYear() + 1;

bind(form, result, (v) => {
  const s = ksaMilitarySalary({ rank: v.rank, step: v.step });
  if (!s) return null;
  const R = rules.sa.militaryScale.enlisted[v.rank];
  let html = big("Your monthly net pay", m(s.net), `${R.nameEn} · step ${s.step} of ${s.maxStep}`);
  html += table(
    [
      ["Basic pay", m(s.basic)],
      ["Transport allowance", m(s.transport)],
      ["Gross", m(s.gross)],
      ["Military pension deduction 9% of basic", `− ${m(s.deduction)}`],
      ["Net", m(s.net), { strong: true }],
      [`Net from January 2027 with the SAR ${numEn(s.allowance2027)} allowance`, m(s.net + s.allowance2027)],
      s.nextBasic ? [`Basic after the next increment (usually January ${nextJanYear()}, +${m(s.increment)})`, m(s.nextBasic)] : ["Next increment", "None: this is the last step of the rank"],
    ],
    "Pay breakdown"
  );
  html += note(`The state pays the equivalent of 13% of basic pay (${m(s.state)}) towards your pension; it is not deducted from you.`, "info");
  html += note("The table circulates unofficially and is arithmetically consistent; the private's first step matches the 2010 scale after the 15% cost-of-living merger. Check your payslip.", "warn");
  html += note("The monthly SAR 500 allowance applies to officers and enlisted personnel from 1 January 2027 under the royal order of 25 October 2026 and is not part of basic pay, so no pension is deducted from it. Danger, infection, technical, security and aviation allowances are not included.", "info");
  return html;
});
