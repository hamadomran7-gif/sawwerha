import { gccUtilityCompare } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const N = { dewa: "دبي (ديوا)", abudhabi: "أبوظبي والعين (طاقة للتوزيع)", etihadwe: "عجمان وأم القيوين ورأس الخيمة والفجيرة (الاتحاد)", ksa: "السعودية (الكهرباء والمياه الوطنية)", bahrain: "البحرين (هيئة الكهرباء والماء)", kuwait: "الكويت (وزارة الكهرباء والماء)" };
const CUR = { AED: "درهم", SAR: "ريال", BHD: "د.ب", KWD: "د.ك" };
const f3 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const loc = (x) => (x.cur === "BHD" || x.cur === "KWD" ? `${f3.format(x.local)} ${CUR[x.cur]}` : money(x.local, CUR[x.cur]));
const sync = () => form.querySelectorAll("[data-home]").forEach((el) => (el.hidden = false));

bind(form, result, (v) => {
  sync();
  const r = gccUtilityCompare({ kwh: v.kwh || 0, m3: v.m3 || 0, who: v.who, home: v.home });
  const c = r.cheapest, d = r.dearest;
  let html = big(`الأرخص لاستهلاكك: ${N[c.id]}`, money(c.aed, "درهم"), `الأغلى ${N[d.id]} بـ${money(d.aed, "درهم")} شهرياً`);
  html += table(
    r.rows.map((x) => [`${N[x.id]}: ${loc(x)}${x.perKwhAed ? ` · الكيلوواط ${num(x.perKwhAed * 100, 1)} فلس` : ""}`, money(x.aed, "درهم"), x === c ? { strong: true } : {}]),
    `فاتورة ${num(r.kwh, 0)} ك.و.س و${num(r.m3, 1)} م³ شهرياً بالدرهم، من الأرخص`
  );
  html += note("الأرقام شاملة الضريبة ورسوم الوقود والعدادات والصرف الصحي المرتبط بالاستهلاك، ولا تشمل الرسوم المرتبطة بالإيجار (رسم السكن في دبي والبلدية في أبوظبي والبحرين). والسعودية بالتعرفة النافذة حتى نهاية 2026، وأبوظبي بدورة 30 يوماً.", "info");
  if (v.who === "national") html += note("المواطن: تعرفة خاصة في دبي وأبوظبي والشمالية، والسكن الأول في البحرين، والسكن الخاص في الكويت؛ ولا تمييز في التعرفة السعودية.", "info");
  return html;
});
