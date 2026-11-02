import { ksaSaned, rules } from "../calc.js";
import { bind, money, table, big, note, monthsAr, monthsGen } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";

bind(form, result, (v) => {
  if (!v.avg) return null;
  if (v.reason === "resigned") return big("تعويض ساند", money(0, cur), "ترك العمل بالاستقالة") + note("لا يُصرف تعويض ساند لمن ترك العمل لعدم رغبته في الاستمرار فيه، ولا لمن فُصل لسبب راجع إليه.", "warn");
  const S = rules.sa.saned;
  const s = ksaSaned({ avgWage: v.avg, months: v.months || S.maxMonths });
  let html = big("مجموع تعويض ساند", money(s.total, cur), `على ${monthsGen(s.monthsFirst + s.monthsAfter)} تعطل`);
  html += table(
    [
      [`الأشهر 1–${Math.min(3, s.monthsFirst) || 3}: 60% من المتوسط${s.cappedFirst ? " (بحد 9,000)" : ""}`, `${money(s.first, cur)} شهرياً`],
      s.monthsAfter ? [`الأشهر 4–${3 + s.monthsAfter}: 50% من المتوسط${s.cappedAfter ? " (بحد 7,500)" : ""}`, `${money(s.after, cur)} شهرياً`] : null,
      ["المجموع", money(s.total, cur), { strong: true }],
    ],
    "تفصيل الحساب"
  );
  html += note(`الشروط: سعودي دون 60 سنة، ومشترك ${S.firstClaimMonths} شهراً على الأقل خلال آخر ${S.firstClaimWithin} شهراً (للمطالبة الأولى)، وترك العمل لغير الاستقالة، والتقديم خلال ${S.applyWithinDays} يوماً من ترك العمل، والتسجيل والبحث الجاد عن عمل.`, "info");
  return html;
});
