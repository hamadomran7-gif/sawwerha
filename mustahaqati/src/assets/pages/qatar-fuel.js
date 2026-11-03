import { gccFuelCost } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const NAME = { premium91: "ممتاز 91", super95: "سوبر 95", diesel: "ديزل" };
const mf = new Intl.DateTimeFormat("ar-u-nu-latn", { month: "long", year: "numeric", timeZone: "UTC" });
const mon = (k) => mf.format(new Date(`${k}-01T00:00:00Z`));
const fx = (n) => n.toFixed(2);
const sign = (n) => (n > 0 ? `+${fx(n)}` : fx(n));
const r2 = (n) => Math.round(n * 100) / 100;

bind(form, result, (v) => {
  const r = gccFuelCost({ country: "qa", fuel: v.fuel, tank: v.tank || 0, km: v.km || 0, per100: v.per100 || 0 });
  if (!r) return null;
  const diff = r.prev !== null ? r2(r.tankCost - r.tankPrev) : null;
  let html = big(`تعبئة الخزان ${NAME[r.fuel]} في ${mon(r.month)}`, money(r.tankCost, cur), `${fx(r.price)} ريال للتر${diff !== null ? ` · ${diff < 0 ? `أقل من ${mon(r.prevMonth)} بـ${money(-diff, cur)}` : diff > 0 ? `أكثر من ${mon(r.prevMonth)} بـ${money(diff, cur)}` : `مثل ${mon(r.prevMonth)}`}` : ""}`);
  html += table(
    [
      ["سعر اللتر", `${fx(r.price)} ريال`],
      r.prev !== null ? [`سعر ${mon(r.prevMonth)}`, `${fx(r.prev)} ريال${r.change ? ` (${sign(r.change)}، ${sign(r.changePct)}%)` : " (دون تغيير)"}`, { muted: true }] : null,
      ["اللترات الشهرية", `${num(r.litres, 1)} لتر`],
      ["كلفة الوقود الشهرية", money(r.monthly, cur), { strong: true }],
      ["الكلفة السنوية بأسعار هذا الشهر", money(r.yearly, cur)],
    ],
    "كلفتك"
  );
  html += table(
    Object.entries(r.all).map(([k, x]) => [`${NAME[k]}: ${fx(x.price)} ريال${x.prev !== null && x.price !== x.prev ? ` (${sign(r2(x.price - x.prev))})` : ""}`, money(x.tank, cur), k === r.fuel ? { strong: true } : {}]),
    `تعبئة خزان ${num(v.tank || 0, 0)} لتراً بكل نوع`
  );
  html += note("تعلن قطر للطاقة الأسعار في آخر يوم من كل شهر وتسري من أوله، ولا ضريبة قيمة مضافة عليها.", "info");
  return html;
});
