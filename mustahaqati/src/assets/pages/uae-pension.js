import { uaePension, rules } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "درهم";

bind(form, result, (v) => {
  if (!v.birth || !v.first || !v.end || !v.avg) return null;
  const p = uaePension({ birth: v.birth, firstReg: v.first, end: v.end, avgSalary: v.avg, gender: v.gender });
  if (!p) return note("تاريخ نهاية الخدمة يجب أن يكون بعد تاريخ التسجيل.", "bad");
  const isNew = p.law === "new";
  const L = isNew ? rules.ae.pension.new : rules.ae.pension.legacy;
  const lawTxt = isNew ? "المرسوم بقانون 57/2023 (سُجّلت من 31 أكتوبر 2023)" : "القانون 7/1999 (سُجّلت قبل 31 أكتوبر 2023)";
  let html;
  if (p.status === "normal" || p.status === "early") {
    html = big("معاشك الشهري التقديري", money(p.pension, cur), `${p.status === "normal" ? "بلوغ السن مع المدة المطلوبة" : "تقاعد بطلبك (استقالة)"} · ${num(p.pct, 2)}% من راتب حساب المعاش`);
  } else {
    html = big(p.gratuity ? "لا معاش — مكافأة نهاية الخدمة" : "لا يستحق معاشاً بعد", money(p.gratuity, cur), `${num(p.years, 2)} سنة اشتراك · العمر ${num(p.age, 1)} سنة`);
  }
  html += table(
    [
      ["القانون المطبق", lawTxt],
      ["مدة الاشتراك", `${num(p.years, 2)} سنة`],
      ["العمر في نهاية الخدمة", `${num(p.age, 1)} سنة`],
      ["نسبة المعاش", `${num(p.pct, 2)}%`],
      p.topUp ? ["تكملة الحكومة إلى الحد الأدنى (10,000)", money(p.topUp, cur)] : null,
      p.bonusOver35 ? ["مكافأة السنوات بعد 35 (3 رواتب عن كل سنة)", money(p.bonusOver35, cur)] : null,
      [`اشتراكك الشهري (${num(L.contribEmployee * 100, 0)}%)`, money(p.employeeContribution, cur), { muted: true }],
    ],
    "تفصيل الحساب"
  );
  if (p.status === "deferred") html += note(`لديك 20 سنة اشتراك لكنك دون سن الاستقالة (${p.resignAge} سنة). لم نتحقق من مصدر رسمي هل يُؤجَّل المعاش إلى بلوغها أم تُصرف المكافأة، فراجع الهيئة العامة للمعاشات قبل الاستقالة.`, "warn");
  if (p.status === "none") html += note(isNew ? "شروط المعاش في القانون الجديد: بلوغ 60 مع 15 سنة اشتراك، أو 30 سنة اشتراك مع عمر 55 عند الاستقالة. ومن لا يستحق معاشاً تُصرف له مكافأة: 1.5 راتب عن كل سنة من الخمس الأولى، ثم راتبان، ثم 3 رواتب." : "شروط المعاش في القانون 7/1999: بلوغ 60 مع 15 سنة، أو الاستقالة بعد 20 سنة مع بلوغ السن المحددة. ومن لا يستحق معاشاً تُصرف له مكافأة نهاية الخدمة.", "info");
  if (!isNew && v.gender === "m" && v.first >= "2007-02-28" && p.years >= 18) html += note("سن الاستقالة للرجل المنضم بعد 28 فبراير 2007 هو 55 في نص التعديل واللائحة، بينما تذكر بعض إجابات الهيئة 50 سنة. تحقق من الهيئة قبل اتخاذ قرارك.", "info");
  html += note("الحساب للمواطنين المسجلين لدى الهيئة العامة للمعاشات (الحكومة الاتحادية والقطاع الخاص)، ولا يشمل صندوق أبوظبي للتقاعد ولا حكومة الشارقة.", "info");
  return html;
});
