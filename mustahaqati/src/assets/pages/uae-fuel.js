import { uaeFuelCost } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";
const NAME = { super98: "سوبر 98", special95: "خاص 95", eplus91: "إي بلس 91", diesel: "ديزل" };
const mf = new Intl.DateTimeFormat("ar-u-nu-latn", { month: "long", year: "numeric", timeZone: "UTC" });
const mon = (k) => mf.format(new Date(`${k}-01T00:00:00Z`));
const sign = (n) => (n > 0 ? `+${num(n, 2)}` : num(n, 2));

bind(form, result, (v) => {
  const r = uaeFuelCost({ fuel: v.fuel, tank: v.tank || 0, km: v.km || 0, per100: v.per100 || 0 });
  if (!r) return null;
  let html = big(`تعبئة الخزان ${NAME[v.fuel]} في ${mon(r.month)}`, money(r.tankCost, cur), `${num(r.price, 2)} درهم للتر${r.prev !== null ? ` · ${r.change < 0 ? "أقل" : r.change > 0 ? "أكثر" : "مثل"} من ${mon(r.prevMonth)} بـ${money(Math.abs(r.tankCost - r.tankPrev), cur)}` : ""}`);
  html += table(
    [
      ["سعر اللتر", `${num(r.price, 2)} درهم`],
      r.prev !== null ? [`سعر ${mon(r.prevMonth)}`, `${num(r.prev, 2)} درهم (${sign(r.change)}، ${sign(r.changePct)}%)`, { muted: true }] : null,
      ["اللترات الشهرية", `${num(r.litres, 1)} لتر`],
      ["كلفة الوقود الشهرية", money(r.monthly, cur), { strong: true }],
      ["الكلفة السنوية بأسعار هذا الشهر", money(r.yearly, cur)],
    ],
    "كلفتك"
  );
  html += table(
    Object.entries(r.all).map(([k, x]) => [`${NAME[k]}: ${num(x.price, 2)} درهم${x.prev !== null ? ` (${sign(r2(x.price - x.prev))})` : ""}`, money(x.tank, cur), k === v.fuel ? { strong: true } : {}]),
    `تعبئة خزان ${num(v.tank || 0, 0)} لتراً بكل نوع`
  );
  html += note("أسعار التجزئة تشمل ضريبة القيمة المضافة، وتتغير أول كل شهر.", "info");
  return html;
});
function r2(n) { return Math.round(n * 100) / 100; }
