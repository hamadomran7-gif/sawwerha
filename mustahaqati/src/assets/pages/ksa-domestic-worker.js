import { ksaDomesticSettlement, rules } from "../calc.js";
import { bind, money, num, table, big, note, duration, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";

bind(form, result, (v) => {
  if (!v.wage || !v.start || !v.end) return null;
  const D = rules.sa.domestic;
  const s = ksaDomesticSettlement({ wage: v.wage, start: v.start, end: v.end, mode: v.mode, reason: v.reason, leaveDays: v.leaveDays, compMonths: v.compMonths });
  if (!s) return note("تاريخ آخر يوم عمل يجب أن يكون بعد تاريخ البداية.", "bad");
  const workerEnded = v.reason === "worker_art27" || v.reason === "worker_noreason";
  let html = big(s.total >= 0 ? "مستحقات العامل المنزلي" : "صافي المستحق لصاحب العمل", money(Math.abs(s.total), cur), `مدة الخدمة: ${duration(s.duration)}`);
  html += table(
    [
      [v.reason === "art26" ? "مكافأة نهاية الخدمة (تسقط بحالات المادة 26)" : `مكافأة نهاية الخدمة: ${num(s.blocks, 2)} × أجر شهر`, money(s.eos, cur)],
      s.comp > 0 ? ["تعويض الإنهاء غير المشروع (المادة 25)", money(s.comp, cur)] : null,
      s.comp < 0 ? ["تعويض لصاحب العمل لترك العمل دون سبب (المادة 25)", money(s.comp, cur)] : null,
      s.leave ? [`بدل الإجازة: ${daysAr(Number(v.leaveDays))} × ${num(s.daily)}`, money(s.leave, cur)] : null,
      ["الإجمالي", money(s.total, cur), { strong: true }],
    ],
    "تفصيل المستحقات"
  );
  if (v.mode === "blocks" && s.blocksExact > s.blocks && v.reason !== "art26") {
    html += note(`المدة ${num(s.years, 2)} سنة، أي ${num(s.blocksExact, 2)} من الكتل الرباعية. اللائحة لا تذكر الكسور، فحسبنا الكتل الكاملة فقط. بالحساب التناسبي تكون المكافأة ${money(s.blocksExact * Number(v.wage), cur)}.`, "info");
  }
  if (v.reason === "worker_art27") html += note("ترك العمل لإحدى حالات المادة 27 يحفظ للعامل حقوقه النظامية، وقد يطالب أيضاً بالتعويض لأن الإخلال من صاحب العمل.", "info");
  if (v.reason === "worker_noreason") html += note("يتحمل العامل في هذه الحالة تكلفة عودته، ويحق لصاحب العمل تعويض أجر شهرين يحسمه من المستحقات (قراءة للمادتين 24 و25).", "warn");
  if (v.reason === "employer_unlawful" || v.reason === "end") html += note("تذكرة عودة العامل إلى بلده على صاحب العمل.", "info");
  html += note(`تُصرف المستحقات خلال ${workerEnded ? "أسبوعين" : "أسبوع"} على الأكثر (المادة 23)، ولا يتجاوز الحسم من الأجر ${D.deductionCapPct}%. وتسقط المطالبة بعد ${D.claimTimeLimitMonths} شهراً من انتهاء العقد.`, "ok");
  return html;
});
