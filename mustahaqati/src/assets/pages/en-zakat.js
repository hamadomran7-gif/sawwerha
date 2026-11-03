import { zakatCalc } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const BASIS = {
  lower: "lower of the gold and silver nisab",
  gold24: "85 grams of pure (24-carat) gold",
  gold21: "85 grams of 21-carat gold",
  silver: "595 grams of silver",
};

bind(form, result, (v) => {
  const m = (n) => moneyEn(n, v.cur || "");
  if (!v.price24 && !v.priceSilver) return note("Enter today's price of a gram of 24-carat gold (and of silver if you want the silver nisab) to work out the nisab.", "info");
  const z = zakatCalc({
    cash: v.cash, g24: v.g24, g22: v.g22, g21: v.g21, g18: v.g18, silverGrams: v.silver, trade: v.trade, receivables: v.receivables,
    debts: v.debts, deductDebts: !!v.deductDebts, price24: v.price24, priceSilver: v.priceSilver, basis: v.basis,
  });
  if (!z.nisab) return note("Enter the gram price needed for the nisab method you chose.", "warn");
  let html = z.due
    ? big("Zakat due", m(z.zakat), `2.5% (one fortieth) of ${m(z.total)}`)
    : big("No zakat on this amount", m(0), `Your zakatable wealth of ${m(z.total)} is below the nisab of ${m(z.nisab)}`);
  html += table(
    [
      ["Cash, balances and savings", m(Number(v.cash) || 0)],
      z.goldPure ? [`Gold (${numEn(Math.round(z.goldPure * 100) / 100)} g pure)`, m(z.goldValue)] : null,
      z.silverValue ? ["Silver", m(z.silverValue)] : null,
      v.trade ? ["Trade goods and trading shares", m(Number(v.trade) || 0)] : null,
      v.receivables ? ["Money owed to you", m(Number(v.receivables) || 0)] : null,
      v.deductDebts && v.debts ? ["Less: debts due now", `− ${m(Number(v.debts) || 0)}`] : null,
      ["Zakatable wealth", m(z.total), { strong: true }],
      [`Nisab (${BASIS[v.basis] || ""})`, m(z.nisab)],
      z.due ? ["Zakat (wealth ÷ 40)", m(z.zakat), { strong: true }] : null,
    ],
    "Breakdown"
  );
  const parts = [];
  if (z.nisabGold24) parts.push(`24-carat gold: ${m(z.nisabGold24)}`);
  if (z.nisabGold21) parts.push(`21-carat gold: ${m(z.nisabGold21)}`);
  if (z.nisabSilver) parts.push(`silver: ${m(z.nisabSilver)}`);
  html += note(`Nisab at the prices you entered — ${parts.join(" · ")}.`, "info");
  html += note("Zakat is due when wealth reaches the nisab and a full lunar year passes while you own it. For special cases such as jewellery worn, debts and investment shares, ask a trusted fatwa authority in your country.", "info");
  return html;
});
