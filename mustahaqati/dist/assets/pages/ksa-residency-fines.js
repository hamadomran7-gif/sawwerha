import { ksaResidencyFine, rules } from "../calc.js";
import { bind, money, table, big, note, arDate, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const F = rules.sa.residencyFines;
const ORD = ["الأولى", "الثانية", "الثالثة"];

bind(form, result, (v) => {
  const t = v.type;
  form.querySelectorAll("[data-iqama]").forEach((el) => (el.hidden = t !== "iqama"));
  const r = ksaResidencyFine({ type: t, offence: v.offence });
  if (!r) return null;
  if (t === "iqama") {
    const n = Math.max(1, Math.floor(v.count || 1));
    if (r.deportation) return big("المخالفة الثالثة", "الإبعاد", "يُبعد المخالف عن البلاد") + note("بعد غرامتي المرة الأولى والثانية، يُبعد من تأخر تجديد إقامته للمرة الثالثة.", "warn");
    let html = big(`غرامة المخالفة ${ORD[r.offence - 1]}`, money(r.fine * n, cur), n > 1 ? `${n} × ${money(r.fine, cur)}` : "لكل هوية، لا عن كل يوم");
    html += table(
      [
        ["الغرامة لكل هوية", money(r.fine, cur)],
        ["عدد الإقامات", String(n)],
        ["المجموع فوق رسوم التجديد", money(r.fine * n, cur), { strong: true }],
        r.offence === 1 ? ["في المخالفة الثانية", money(F.iqamaLate[1] * n, cur)] : ["في المخالفة الثالثة", "الإبعاد"],
      ],
      "التفاصيل"
    );
    html += note(`جدّد قبل انتهاء الهوية بـ${daysAr(F.renewBeforeDays)} على الأقل. غرامة إقامة العامل على صاحب العمل (المادة 40)، وإقامات المرافقين على رب الأسرة.`, "info");
    return html;
  }
  if (t === "finalExit") return big("غرامة الخروج النهائي غير المستخدم", money(r.fine, cur), `صلاحية التأشيرة ${daysAr(r.validityDays)}`) + note("يُشترط لسداد الغرامة وإلغاء التأشيرة أن تكون هوية مقيم سارية؛ فقد تحتاج إلى تجديد الإقامة أولاً.", "warn");
  if (t === "firstIqama") return big("غرامة تأخر إصدار الإقامة", money(r.fine, cur), `بعد ${daysAr(r.days)} من الدخول`) + note("تُصدر الإقامة للعامل القادم بتأشيرة عمل خلال 90 يوماً من دخوله، ورسومها وغرامة تأخيرها على صاحب العمل. المبلغ منقول عن الجوازات عبر الصحف (2023).", "info");
  if (t === "visitor") return big("الزائر المتأخر عن المغادرة", `حتى ${money(r.fineMax, cur)}`, `وسجن حتى ${r.jailMonthsMax} أشهر وترحيل`) + note("لا غرامة يومية منشورة، والمبلغ حد أقصى لا عدّاد. ويعاقَب المستقدِم الذي لم يبلّغ عن عدم مغادرة زائره بالعقوبة نفسها، ويُرحَّل إن كان مقيماً. وقد يُمنع المخالف من دخول المملكة مدة بحسب نوع المخالفة.", "warn");
  if (t === "exitReentry") return big("لا غرامة ولا منع تلقائي", money(0, cur), `أُلغي منع ${r.previousBanYears} سنوات من ${arDate(r.banLifted)}`) + note("كان من خرج بتأشيرة خروج وعودة ولم يعد يُمنع من الدخول 3 سنوات إلا على صاحب عمله السابق، وأُلغي ذلك في يناير 2024 بحسب ما نقلته الصحف عن الجوازات.", "info");
  return null;
});
