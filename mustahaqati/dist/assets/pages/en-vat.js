import { vat, rules } from "../calc.js";
import { bind, table, big } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const rateInput = document.getElementById("rate");
const countrySel = document.getElementById("country");
const RATES = rules.gcc.vat;
const CUR = { ae: "AED", sa: "SAR", bh: "BHD", om: "OMR", custom: "" };

countrySel.addEventListener("change", () => {
  if (countrySel.value !== "custom") rateInput.value = RATES[countrySel.value] * 100;
});

bind(form, result, (v) => {
  if (v.amount === null || v.amount === undefined) return null;
  const r = vat({ amount: v.amount, ratePct: v.rate || 0, mode: v.mode });
  const m = (n) => moneyEn(n, CUR[v.country] || "");
  const headline = v.mode === "add" ? ["Amount including VAT", r.gross] : ["Amount before VAT", r.net];
  let html = big(headline[0], m(headline[1]), `VAT rate ${numEn(v.rate || 0)}%`);
  html += table(
    [
      ["Amount before VAT", m(r.net)],
      [`VAT (${numEn(v.rate || 0)}%)`, m(r.tax), { strong: true }],
      ["Amount including VAT", m(r.gross), { strong: true }],
    ],
    "Breakdown"
  );
  return html;
});
