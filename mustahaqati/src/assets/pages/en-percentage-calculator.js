import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const $ = (id) => document.getElementById(id);
const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });
const n = (x) => nf.format(x);
const p = (x) => `${numEn(Math.round(x * 100) / 100)}%`;
const m = (x) => moneyEn(x);
const ok = (...xs) => xs.every((x) => x !== null && x !== undefined && !isNaN(x));

bind($("f1"), $("r1"), (v) => {
  if (!ok(v.p, v.a)) return null;
  const r = (v.a * v.p) / 100;
  return big(`${p(v.p)} of ${n(v.a)}`, n(r), `${n(v.a)} × ${n(v.p)} ÷ 100`) + table([
    ["Amount plus the percentage", n(v.a + r)],
    ["Amount minus the percentage", n(v.a - r)],
  ]);
});

bind($("f2"), $("r2"), (v) => {
  if (!ok(v.x, v.y)) return null;
  if (v.y === 0) return note("Cannot divide by zero: enter the whole.", "warn");
  return big(`${n(v.x)} of ${n(v.y)}`, p((v.x / v.y) * 100), `${n(v.x)} ÷ ${n(v.y)} × 100`);
});

bind($("f3"), $("r3"), (v) => {
  if (!ok(v.o, v.n)) return null;
  if (v.o === 0) return note("The old value is zero, so a percentage change cannot be calculated from it.", "warn");
  const ch = ((v.n - v.o) / Math.abs(v.o)) * 100;
  const label = ch > 0 ? "Percentage increase" : ch < 0 ? "Percentage decrease" : "No change";
  return big(label, p(Math.abs(ch)), `Difference ${n(v.n - v.o)}`) + table([
    ["From", n(v.o)],
    ["To", n(v.n)],
    ["Difference", n(v.n - v.o)],
    ["Percentage", `${ch > 0 ? "+" : ""}${p(ch)}`, { strong: true }],
  ]);
});

bind($("f4"), $("r4"), (v) => {
  if (!ok(v.a, v.p)) return null;
  const add = v.k === "add";
  let price = v.a * (1 + ((add ? 1 : -1) * v.p) / 100);
  const second = !add && ok(v.q) && v.q ? v.q : 0;
  if (second) price *= 1 - second / 100;
  const diff = v.a - price;
  let html = big(add ? "Price after adding" : "Price after discount", m(price), add ? `Increase of ${m(-diff)}` : `You save ${m(diff)}`);
  const rows = [["Original price", m(v.a)], [add ? `Added ${p(v.p)}` : `Discount ${p(v.p)}`, m((v.a * v.p) / 100)]];
  if (second) rows.push([`Extra ${p(second)} off ${m(v.a * (1 - v.p / 100))}`, m(v.a * (1 - v.p / 100) * (second / 100))], ["Actual total discount", p((diff / v.a) * 100)]);
  rows.push([add ? "Final price" : "Price after discount", m(price), { strong: true }]);
  html += table(rows);
  if (add) html += note(`To find the price before adding from a final price, divide it by ${n(1 + v.p / 100)}.`, "info");
  return html;
});
