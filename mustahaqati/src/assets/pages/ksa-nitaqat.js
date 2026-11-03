import { nitaqatSummary, nitaqatWeight, nitaqatPhaseAt, parseWageList, rules } from "../calc.js";
import { bind, money, num, table, big, note, arDate, countAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const N = rules.sa.nitaqat;
const LABEL = ["اليوم", "من 25 أبريل 2027", "من 25 أبريل 2028"];
const w = (x) => (x === 1 ? "1" : x === 0.5 ? "½" : "0");
const cnt = (x) => num(x, x % 1 ? 1 : 0);
const empAr = (k) => countAr(k, "موظف واحد", "موظفَين", "موظفين", "موظفاً", "موظف");
const group = (list) => {
  const m = new Map();
  list.forEach((x) => m.set(x, (m.get(x) || 0) + 1));
  return [...m.entries()].sort((a, b) => a[0] - b[0]);
};

bind(form, result, (v) => {
  const wages = parseWageList(v.wages);
  if (!wages.length) return null;
  const halfBand = v.halfBand !== "no";
  const S = nitaqatSummary(wages, halfBand);
  const now = nitaqatPhaseAt(new Date());
  const n = wages.length;
  let html = big(
    n === 1 ? "وزن الموظف في نطاقات اليوم" : `السعوديون المحتسبون اليوم من أصل ${empAr(n)}`,
    n === 1 ? w(nitaqatWeight(wages[0], now, halfBand)) : cnt(S[now].total),
    S.slice(now + 1).map((s, i) => `${LABEL[now + 1 + i]}: ${n === 1 ? w(s.total) : cnt(s.total)}`).join(" · ")
  );
  html += table(
    S.map((s, i) => [
      `${LABEL[i]} (الكامل من ${num(s.full, 0)}${s.halfOfficial || halfBand ? `، والنصف من ${num(s.half, 0)}` : ""})`,
      `${cnt(s.total)} (كامل: ${num(s.fullCount, 0)}${s.halfCount ? `، نصف: ${num(s.halfCount, 0)}` : ""}${s.zeroCount ? `، لا يُحتسب: ${num(s.zeroCount, 0)}` : ""})`,
      i === now ? { strong: true } : {},
    ]),
    "عدد المحتسبين في كل مرحلة"
  );
  html += table(
    S.map((s, i) =>
      i < now ? null : [s.toRaise ? `${LABEL[i]}: رفع أجر ${empAr(s.toRaise)} إلى ${num(s.full, 0)} ريال` : `${LABEL[i]}: كل الأجور ${num(s.full, 0)} ريال فأكثر`, s.toRaise ? `${money(s.raiseCost, cur)} شهرياً` : "لا يلزم رفع", s.toRaise && i > now ? { strong: true } : {}]
    ),
    "الزيادة الشهرية اللازمة ليُحتسب الجميع كاملاً"
  );
  const groups = group(wages);
  if (n > 1 && groups.length <= 40) {
    html += table(
      groups.map(([x, k]) => [`${num(x, 0)} ريال${k > 1 ? ` × ${num(k, 0)}` : ""}`, S.map((s, i) => w(nitaqatWeight(x, i, halfBand))).join(" ← ")]),
      "وزن كل موظف (اليوم ← 2027 ← 2028)"
    );
  }
  if (halfBand) html += note("نطاق «النصف» بعد الرفع (من 4,000 إلى 4,999 في 2027، ومن 5,000 إلى 5,999 في 2028) افتراض يطابق القاعدة الحالية ولم يُنشر رسمياً بعد. اختر «لا يُحتسب» لترى الحالة الأشد.", "warn");
  html += note(`الأجر المعتمد هو ${N.wageBasis}. إن رفعت أجر موظف فحدّثه في التأمينات ليظهر أثره في نطاقات. وتكلفة الرفع أعلاه للأجور فقط، دون اشتراكات التأمينات على الزيادة.`, "info");
  html += note(`تواريخ التطبيق ${arDate(N.phases[1].from)} و${arDate(N.phases[2].from)} بحسب تصريح وكيل وزارة الموارد البشرية. والطلاب وذوو الإعاقة والدوام الجزئي لهم أوزان خاصة في الجدول أسفل الصفحة.`, "info");
  return html;
});
