import { ksaSocialSecurity, rules } from "../calc.js";
import { bind, money, num, table, big, note, countAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const depsAr = (n) => countAr(n, "تابع واحد", "تابعان", "تابعين", "تابعاً", "تابع");

bind(form, result, (v) => {
  if (v.dependents === null) return null;
  const S = rules.sa.socialSecurity;
  const deps = Math.max(0, Math.floor(v.dependents || 0));
  const r = ksaSocialSecurity({ dependents: deps, earned: v.earned, unearned: v.unearned, citizenAccount: v.citizenAccount, countCitizenAccount: !!v.countCitizenAccount });
  let html = r.eligible
    ? big("معاش الضمان المتوقع شهرياً", money(r.capFinal, cur), r.capMatters ? `أو ${money(r.capMinimum, cur)} بحسب طريقة تطبيق السقف` : "يُصرف في الأول من كل شهر")
    : big("لا يُستحق معاش الضمان", money(0, cur), "الدخل المحتسب يبلغ الحد الأدنى للأسرة أو يتجاوزه");
  html += table(
    [
      [deps ? `الحد الأدنى: ${num(S.basicHead, 0)} + ${depsAr(deps)} × ${num(S.perDependent, 0)}` : "الحد الأدنى للمستقل أو رب الأسرة وحده", money(r.minimum, cur)],
      [`الدخل المكتسب × 50%`, money((Number(v.earned) || 0) * S.earnedRate, cur)],
      v.unearned ? [`الدخل غير المكتسب × 100%`, money(Number(v.unearned) || 0, cur)] : null,
      v.countCitizenAccount && v.citizenAccount ? ["حساب المواطن", money(Number(v.citizenAccount) || 0, cur)] : null,
      ["الدخل المحتسب", money(r.counted, cur)],
      ["المعاش (الحد الأدنى − الدخل المحتسب)", money(r.raw, cur), { strong: r.eligible }],
    ],
    "تفصيل الحساب"
  );
  if (r.capMatters) html += note(`تذكر مصادر صحفية حداً أعلى للأسرة قدره ${num(S.familyMax, 0)} ريال. إن طُبق على المعاش النهائي فالمعاش ${money(r.capFinal, cur)}، وإن طُبق على الحد الأدنى قبل خصم الدخل فالمعاش ${money(r.capMinimum, cur)}.`, "warn");
  if (!r.capMatters && r.eligible && r.capFinal < r.raw) html += note(`تذكر مصادر صحفية حداً أعلى للأسرة قدره ${num(S.familyMax, 0)} ريال، فاقتصر المعاش عليه.`, "info");
  if (!v.countCitizenAccount && v.citizenAccount) html += note("لم يُحتسب حساب المواطن لأن أحدث نص رسمي يستثنيه، وفعّل الخيار إن أردت حساب الرقم الأحوط.", "info");
  html += note("الحساب تقديري ولا يشمل شروط الثروة والمدخرات والإقامة خارج المملكة؛ القرار النهائي للوزارة بعد دراسة الطلب.", "info");
  return html;
});
