import { gccPensionCompare } from "../calc.js";
import { bind, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const NAME = {
  "ae-legacy": "الإمارات (قبل أكتوبر 2023)",
  "ae-new": "الإمارات (الجدد)",
  "sa-legacy": "السعودية (قبل يوليو 2024)",
  "sa-new": "السعودية (الجدد)",
  kw: "الكويت",
  qa: "قطر",
  bh: "البحرين",
  om: "عُمان",
};
const pc = (x) => `${num(x * 100, 1)}%`;

bind(form, result, (v) => {
  if (!v.years) return null;
  const rows = gccPensionCompare({ years: v.years, salary: v.salary || 0 });
  const best = rows[0];
  const S = Number(v.salary) || 0;
  let html = big(`أعلى نسبة معاش بعد ${num(v.years, 0)} سنة`, best.eligible ? NAME[best.key] : "—", best.eligible ? `${pc(best.pct)} من راتب حساب المعاش${S ? ` · ${num(best.pension, 0)}` : ""}` : "");
  html += table(
    rows.map((r) => [
      `${NAME[r.key]} · سن ${num(r.age, 0)}`,
      r.eligible ? `${pc(r.pct)}${S ? ` = ${num(r.pension, 0)}` : ""}` : `لا معاش: يلزم ${num(r.minYears, 0)} سنة`,
      r === best ? { strong: true } : {},
    ]),
    "نسبة المعاش ومبلغه عند سن التقاعد الاعتيادية"
  );
  if (rows.some((r) => r.key === "qa" && !r.eligible)) html += note("قطر: من كان مشتركاً قبل 2023 وبلغ سن التقاعد بعد 15 سنة فأكثر يُسوى معاشه على 25 سنة أو أكثر (المادة 82)، فيستحق المعاش.", "info");
  html += note("مقارنة تقريبية تفترض الراتب نفسه أساساً للمعاش في كل دولة، ولا تشمل الحدود الدنيا والمعاش التكميلي والمكافآت. احسب معاشك بدقة في حاسبة دولتك.", "info");
  return html;
});
