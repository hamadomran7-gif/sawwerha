import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n);
const p2 = (x) => `${numEn(Math.round(x * 100) / 100)}%`;

const toggle = () => {
  const mode = form.mode.value;
  form.querySelectorAll("[data-mode]").forEach((el) => (el.hidden = !el.dataset.mode.split(" ").includes(mode)));
};
form.mode.addEventListener("change", toggle);

function realNote(ratePct, infl, years = 1) {
  if (infl === null || infl === undefined || isNaN(infl) || infl === 0) return "";
  const real = (Math.pow((1 + ratePct / 100) / (1 + infl / 100), 1 / years) - 1) * 100;
  const per = years > 1 ? " a year" : "";
  return note(`After ${p2(infl)}${per} inflation, the real change in your purchasing power is ${p2(real)}${per}${real < 0 ? ", so your salary buys less than before despite the raise" : ""}.`, real >= 0 ? "info" : "warn");
}

bind(form, result, (v) => {
  toggle();
  const old = Number(v.old);
  if (!old || old <= 0) return null;

  if (v.mode === "diff") {
    if (v.new === null) return null;
    const diff = v.new - old;
    const rate = (diff / old) * 100;
    let html = big(diff >= 0 ? "Raise" : "Cut", p2(Math.abs(rate)), `${m(Math.abs(diff))} ${diff >= 0 ? "more" : "less"} a month`);
    html += table([
      ["Old salary", m(old)],
      ["New salary", m(v.new)],
      ["Monthly difference", m(diff)],
      ["Yearly difference", m(diff * 12), { strong: true }],
    ]);
    return html + realNote(rate, v.inflation);
  }

  if (v.pct === null) return null;
  if (v.mode === "pct") {
    const nw = old * (1 + v.pct / 100);
    let html = big("Salary after the raise", m(nw), `A raise of ${p2(v.pct)}`);
    html += table([
      ["Current salary", m(old)],
      ["Monthly increase", m(nw - old)],
      ["Yearly increase", m((nw - old) * 12)],
      ["New salary", m(nw), { strong: true }],
    ]);
    return html + realNote(v.pct, v.inflation);
  }

  const years = Math.max(1, Math.min(40, Math.floor(v.years || 1)));
  const rows = [];
  let s = old;
  let extra = 0;
  for (let y = 1; y <= years; y++) {
    s *= 1 + v.pct / 100;
    extra += (s - old) * 12;
    if (years <= 15 || y <= 5 || y > years - 5) rows.push([`After ${plural(y, "year")}`, m(s)]);
    else if (y === 6) rows.push(["…", "…"]);
  }
  const total = (s / old - 1) * 100;
  let html = big(`Salary after ${plural(years, "year")}`, m(s), `${p2(v.pct)} a year, ${p2(total)} in total`);
  html += table(rows, "Salary year by year");
  html += table([
    ["Monthly increase in the last year", m(s - old)],
    ["Total earned above your current salary", m(extra), { strong: true }],
  ]);
  return html + realNote(v.pct, v.inflation, 1);
});
