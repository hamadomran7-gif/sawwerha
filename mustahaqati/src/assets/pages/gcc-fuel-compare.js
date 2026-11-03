import { gccFuelCompare } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const N = { ae: "الإمارات", sa: "السعودية", qa: "قطر", om: "عُمان", kw: "الكويت", bh: "البحرين" };
const CUR = { AED: "درهم", SAR: "ريال", QAR: "ريال قطري", OMR: "ريال عُماني", KWD: "دينار كويتي", BHD: "دينار بحريني" };
const G = { 91: "بنزين 91", 95: "بنزين 95", 98: "بنزين 98", diesel: "الديزل" };
const mf = new Intl.DateTimeFormat("ar-u-nu-latn", { month: "long", year: "numeric", timeZone: "UTC" });
const when = (x) => (x.country === "om" ? "سقف أكتوبر 2021" : x.country === "sa" ? "منذ يناير 2026" : x.asOf && /^\d{4}-\d{2}$/.test(x.asOf) ? mf.format(new Date(`${x.asOf}-01T00:00:00Z`)) : x.asOf === "2026-Q3" ? "الربع الثالث 2026" : "");
const loc = (x) => `${x.local.toFixed(x.cur === "OMR" || x.cur === "KWD" || x.cur === "BHD" ? 3 : 2)} ${CUR[x.cur]}`;

bind(form, result, (v) => {
  const r = gccFuelCompare({ grade: v.grade, tank: v.tank || 0 });
  if (!r.rows.length) return null;
  const c = r.cheapest, d = r.dearest;
  let html = big(`الأرخص في ${G[r.grade]}: ${N[c.country]}`, money(c.tankAed, "درهم"), `تعبئة ${num(r.tank, 0)} لتراً · الأغلى ${N[d.country]} بـ${money(d.tankAed, "درهم")}`);
  html += table(
    r.rows.map((x) => [`${N[x.country]}: ${loc(x)} للتر${when(x) ? ` (${when(x)})` : ""} = ${num(x.aed, 2)} درهم`, money(x.tankAed, "درهم"), x === c ? { strong: true } : {}]),
    `تعبئة خزان ${num(r.tank, 0)} لتراً بالدرهم، من الأرخص`
  );
  html += note(`الفرق بين الأرخص والأغلى في خزان واحد: ${money(d.tankAed - c.tankAed, "درهم")}. التحويل بأسعار الربط الرسمية، والدينار الكويتي بمتوسط أكتوبر 2026.`, "info");
  if (r.rows.some((x) => x.country === "bh" || x.country === "kw")) html += note("سعر البحرين آخر سعر رسمي منشور (سبتمبر 2026) لأنه يتغير شهرياً، والكويت بقرار الربع الثالث 2026؛ وبنزين 91 و95 والديزل في الكويت ثابتة منذ 2016.", "info");
  return html;
});
