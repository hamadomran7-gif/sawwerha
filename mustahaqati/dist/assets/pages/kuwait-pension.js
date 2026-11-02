import { kuwaitPension, rules } from "../calc.js";
import { bind, money, num, table, big, note, yearsAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "دينار";
const p = (x) => `${num(x * 100, 2)}%`;

bind(form, result, (v) => {
  if (!v.base || v.age === null || v.serviceYears === null) return null;
  const K = rules.kw.pension;
  const r = kuwaitPension({
    gender: v.gender, age: v.age, serviceYears: v.serviceYears, serviceMonths: v.serviceMonths, base: v.base,
    supplementary: v.supplementary, married: v.married === "yes", children: v.children, contribSince2015: !!v.contribSince2015,
  });
  const lumpTable = (lump, caption) =>
    table(
      [...lump.parts.map((x) => [`${yearsAr(x.years)} × 12 × ${p(x.rate)}`, money(x.amount, cur)]), ["المجموع", money(lump.total, cur), { strong: true }]],
      caption
    );

  if (r.status === "none") {
    return big("مكافأة التقاعد (لا معاش)", money(r.lump.total, cur), `خدمة ${num(r.decimalYears, 2)} سنة، والمعاش يتطلب 15 سنة`) + lumpTable(r.lump, `على مرتب تسوية ${money(r.base, cur)}`) + note("من انتهت خدمته دون استحقاق معاش تُصرف له مكافأة التقاعد. وتُرد إن عاد للعمل خلال سنة.", "info");
  }
  if (r.status === "too_young") {
    return big("لا يستحق المعاش بعد", "—", `أقل سن للتقاعد المبكر ${r.earlyMin} سنة`) + note(`بخدمة ${num(r.decimalYears, 2)} سنة يُستحق المعاش ببلوغ ${r.normalAge} سنة، أو مبكراً من ${r.earlyMin} بتخفيض. للاسترشاد، مكافأة التقاعد عن مدتك لو انتهت الخدمة دون معاش: ${money(r.lump.total, cur)}.`, "warn");
  }

  let html = big("معاشك التقاعدي الشهري", money(r.final, cur), r.toppedUp ? "بعد رفعه إلى الحد الأدنى" : `${p(r.pct)} من مرتب التسوية`);
  html += table(
    [
      ["مرتب التسوية (بحد 1,500)", money(r.base, cur)],
      [`نسبة المعاش لخدمة ${num(r.decimalYears, 2)} سنة`, p(r.pct)],
      ["المعاش الأساسي قبل التخفيض", money(r.gross, cur)],
      r.reduction ? [`تخفيض التقاعد المبكر (${r.reductionType === "temporary" ? `مؤقت حتى ${r.reductionEndsAge}` : "دائم"})`, `${p(r.reduction)} = ${money(r.gross - r.basic, cur)}`] : null,
      ["المعاش الأساسي", money(r.basic, cur)],
      r.supplementary ? ["المعاش التكميلي", money(r.supplementary, cur)] : null,
      ["المجموع", money(r.total, cur), { strong: !r.toppedUp }],
      [`الحد الأدنى لحالتك`, money(r.minimum, cur), { muted: !r.toppedUp }],
      r.toppedUp ? ["المعاش بعد الرفع", money(r.final, cur), { strong: true }] : null,
    ],
    "تفصيل المعاش"
  );
  if (r.toppedUp && r.reduction) html += note(`لم يُحسم هل يُرفع المعاش المخفض للتقاعد المبكر إلى الحد الأدنى؛ فإن لم يُرفع يبقى ${money(r.total, cur)}.`, "warn");
  if (r.reductionType === "temporary") html += note(`التخفيض المؤقت يتوقف عند بلوغ ${r.reductionEndsAge} سنة، فيعود المعاش إلى ${money(r.gross + r.supplementary, cur)} مع الزيادات.`, "info");

  const one = [];
  if (r.remuneration) one.push([`المكافأة المالية: ${num(Math.min(r.decimalYears, r.capYears), 2)} × مرتب التسوية (حد ${yearsAr(r.capYears)})`, money(r.remuneration, cur)]);
  if (r.excessLump) one.push([`مكافأة المدة الزائدة على 30 سنة (${yearsAr(r.excessYears)})`, money(r.excessLump.total, cur)]);
  if (one.length) html += table(one, "مبالغ تُصرف مرة واحدة");
  if (!r.remunerationOk) html += note("المكافأة المالية تتطلب 24 شهر اشتراك بعد 1/1/2015، إلا لمن بلغ السن القانونية أو خدم 30 سنة.", "info");
  if (v.base > K.basicWageCap && !r.supplementary) html += note("مرتبك فوق 1,500، فلك معاش تكميلي عن الشريحة الزائدة (حتى 1,250) يُحسب من رصيد حسابك؛ أدخله من كشف المؤسسة ليُضاف.", "info");
  html += note(`يزيد المعاش ${K.annualIncrease} ديناراً شهرياً في الأول من أغسطس كل عام.`, "ok");
  return html;
});
