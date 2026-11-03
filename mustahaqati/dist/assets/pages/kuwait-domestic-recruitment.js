import { kwRecruitCost } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "دينار";
const REG = { asia: "آسيا", africa: "أفريقيا", privatePassport: "الجواز الخاص" };

bind(form, result, (v) => {
  const r = kwRecruitCost({ region: v.region, price: v.price, sponsor: v.sponsor, existingCount: v.existingCount, salary: v.salary });
  const atCap = !Number(v.price);
  const n = Math.max(0, Math.floor(Number(v.existingCount) || 0)) + 1;
  let html = big("كلفة السنة الأولى", money(r.firstYear, cur), atCap ? `بالحد الأعلى لـ${REG[v.region]}` : "بسعر المكتب الذي أدخلته");
  html += table([
    [atCap ? `الحد الأعلى للاستقدام (${REG[v.region]})${v.region === "privatePassport" ? "" : " شاملاً التذكرة"}` : "سعر المكتب", money(r.contract, cur)],
    [`إقامة العاملة رقم ${num(n, 0)} لأسرة ${v.sponsor === "expat" ? "وافدة" : "كويتية"} لسنة`, money(r.residence, cur)],
    r.wage ? [`الراتب: ${num(r.wage, 0)} × 12`, money(r.wages, cur)] : null,
    ["كلفة السنة الأولى", money(r.firstYear, cur), { strong: true }],
    ["كلفة سنتين (إقامتان و24 راتباً)", money(r.twoYears, cur)],
    ["المتوسط الشهري على سنتين", money(Math.round((r.twoYears / 24) * 100) / 100, cur), { strong: true }],
  ]);
  if (r.overCap) html += note(`السعر الذي أدخلته أعلى من الحد الأعلى لـ${REG[v.region]} (${money(r.cap, cur)}) بقرار وزير التجارة 2/2024.`, "warn");
  if (r.residenceExtra) html += note(`العاملة رقم ${num(n, 0)} تتجاوز ${v.sponsor === "expat" ? "عاملين للأسرة الوافدة" : "3 عمال للأسرة الكويتية"}، فرسم إقامتها ${money(r.residence, cur)} سنوياً بدل ${v.sponsor === "expat" ? "50" : "10"}.${r.residenceAssumed ? " ورسم هذا العدد لم يُنشر، فافترضنا رسم العامل السابق." : ""}`, "info");
  if (r.belowMinWage) html += note("الراتب أقل من الحد الأدنى القانوني 75 ديناراً.", "warn");
  html += note("ضمان المكتب 6 أشهر من الاستلام: يرد المدفوع ويعيد العاملة إذا رفضت العمل أو تغيبت. ولم تُحسب رسوم التأمين الصحي ولا الفحص الطبي.", "info");
  return html;
});
