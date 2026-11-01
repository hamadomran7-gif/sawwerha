import { vat, rules } from "../calc.js";
import { bind, money, num, table, big } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const rateInput = document.getElementById("rate");
const countrySel = document.getElementById("country");
const RATES = rules.gcc.vat;
const CUR = { ae: "درهم", sa: "ريال", bh: "دينار", om: "ريال عُماني", custom: "" };

countrySel.addEventListener("change", () => {
  if (countrySel.value !== "custom") rateInput.value = RATES[countrySel.value] * 100;
});

bind(form, result, (v) => {
  if (v.amount === null || v.amount === undefined) return null;
  const r = vat({ amount: v.amount, ratePct: v.rate || 0, mode: v.mode });
  const cur = CUR[v.country] || "";
  const headline = v.mode === "add" ? ["المبلغ شامل الضريبة", r.gross] : ["المبلغ قبل الضريبة", r.net];
  let html = big(headline[0], money(headline[1], cur), `نسبة ${num(v.rate || 0, 2)}%`);
  html += table(
    [
      ["المبلغ قبل الضريبة", money(r.net, cur)],
      [`الضريبة (${num(v.rate || 0, 2)}%)`, money(r.tax, cur), { strong: true }],
      ["المبلغ شامل الضريبة", money(r.gross, cur), { strong: true }],
    ],
    "التفصيل"
  );
  return html;
});
