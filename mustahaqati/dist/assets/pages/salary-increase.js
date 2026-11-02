import { bind, money, num, table, big, note, yearsGen } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const p2 = (x) => `${num(x, 2)}%`;

const toggle = () => {
  const mode = form.mode.value;
  form.querySelectorAll("[data-mode]").forEach((el) => (el.hidden = !el.dataset.mode.split(" ").includes(mode)));
};
form.mode.addEventListener("change", toggle);

function realNote(ratePct, infl, years = 1) {
  if (infl === null || infl === undefined || isNaN(infl) || infl === 0) return "";
  const real = (Math.pow((1 + ratePct / 100) / (1 + infl / 100), 1 / years) - 1) * 100;
  const kind = real >= 0 ? "info" : "warn";
  const per = years > 1 ? " سنوياً" : "";
  return note(`بعد تضخم ${p2(infl)}${per}، الزيادة الحقيقية في قدرتك الشرائية ${p2(real)}${per}${real < 0 ? "، أي أن راتبك يشتري أقل مما كان رغم الزيادة" : ""}.`, kind);
}

bind(form, result, (v) => {
  toggle();
  const old = Number(v.old);
  if (!old || old <= 0) return null;

  if (v.mode === "diff") {
    if (v.new === null) return null;
    const diff = v.new - old;
    const rate = (diff / old) * 100;
    let html = big(diff >= 0 ? "نسبة الزيادة" : "نسبة النقص", p2(Math.abs(rate)), `${diff >= 0 ? "زيادة" : "نقص"} ${money(Math.abs(diff))} شهرياً`);
    html += table([
      ["الراتب القديم", money(old)],
      ["الراتب الجديد", money(v.new)],
      ["الفرق الشهري", money(diff)],
      ["الفرق السنوي", money(diff * 12), { strong: true }],
    ]);
    return html + realNote(rate, v.inflation);
  }

  if (v.pct === null) return null;
  if (v.mode === "pct") {
    const nw = old * (1 + v.pct / 100);
    let html = big("الراتب بعد الزيادة", money(nw), `زيادة ${p2(v.pct)}`);
    html += table([
      ["الراتب الحالي", money(old)],
      ["الزيادة الشهرية", money(nw - old)],
      ["الزيادة السنوية", money((nw - old) * 12)],
      ["الراتب الجديد", money(nw), { strong: true }],
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
    if (years <= 15 || y <= 5 || y > years - 5) rows.push([`بعد ${yearsGen(y)}`, money(s)]);
    else if (y === 6) rows.push(["…", "…"]);
  }
  const total = (s / old - 1) * 100;
  let html = big(`الراتب بعد ${yearsGen(years)}`, money(s), `بزيادة ${p2(v.pct)} كل سنة، أي ${p2(total)} إجمالاً`);
  html += table(rows, "الراتب سنة بعد سنة");
  html += table([
    ["الزيادة الشهرية في آخر سنة", money(s - old)],
    ["مجموع ما كسبته فوق الراتب الحالي", money(extra), { strong: true }],
  ]);
  return html + realNote(v.pct, v.inflation, 1);
});
