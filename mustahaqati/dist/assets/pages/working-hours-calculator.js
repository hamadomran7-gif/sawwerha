import { workHours, rules } from "../calc.js";
import { bind, table, big, note, num, countAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");

const hm = (min) => {
  const m = Math.round(min);
  const h = Math.floor(m / 60), r = m % 60;
  const hs = h ? countAr(h, "ساعة واحدة", "ساعتان", "ساعات", "ساعة", "ساعة") : "";
  const ms = r ? countAr(r, "دقيقة واحدة", "دقيقتان", "دقائق", "دقيقة", "دقيقة") : "";
  return hs && ms ? `${h === 1 ? "ساعة" : hs} و${ms}` : hs || ms || "0";
};
const toggle = () => form.querySelectorAll("[data-country]").forEach((el) => (el.hidden = el.dataset.country !== form.country.value));
form.country.addEventListener("change", toggle);

bind(form, result, (v) => {
  toggle();
  const ae = v.country === "ae";
  const w = workHours({ country: v.country, start: v.start, end: v.end, breakMin: v.breakMin, days: v.days, ramadan: !!v.ramadan, muslim: !!v.muslim });
  if (!w) return null;
  const W = ae ? rules.ae.workHours : rules.sa.workHours;

  let html = big("ساعات العمل الفعلية", `${num(w.weeklyMin / 60, 2)} ساعة أسبوعياً`, `${hm(w.workMin)} يومياً × ${w.days} أيام`);
  html += table(
    [
      ["مدة الحضور اليومي", hm(w.presenceMin)],
      ["الاستراحة", hm(w.breakMin)],
      ["العمل الفعلي يومياً", hm(w.workMin), { strong: true }],
      ["أسبوعياً", hm(w.weeklyMin)],
      ["شهرياً (تقريباً)", hm(w.monthlyMin)],
      [`الحد النظامي${v.ramadan ? " في رمضان" : ""}`, `${hm(w.dailyMaxMin)} يومياً${!ae || !v.ramadan ? ` أو ${hm(w.weeklyMaxMin)} أسبوعياً` : ""}`],
    ],
    "الدوام"
  );
  html += table(
    [
      ["بالمعيار اليومي", w.otDailyStdMin ? `${hm(w.otDailyStdMin)} أسبوعياً` : "لا يوجد", { strong: !!w.otDailyStdMin }],
      ["بالمعيار الأسبوعي", w.otWeeklyStdMin ? `${hm(w.otWeeklyStdMin)} أسبوعياً` : "لا يوجد", { strong: !!w.otWeeklyStdMin }],
    ],
    "الساعات الإضافية"
  );
  if (w.otDailyStdMin && !w.otWeeklyStdMin) html += note("يزيد يومك على الحد اليومي لكن أسبوعك ضمن الحد الأسبوعي، فالإضافي يتوقف على المعيار الذي تعتمده المنشأة في لائحتها.", "info");

  const warns = [];
  if (w.presenceMin > W.maxConsecutiveHours * 60 && w.breakMin < W.minBreakMinutes) warns.push(`دوامك يزيد على ${W.maxConsecutiveHours} ساعات، والنظام يوجب استراحة لا تقل عن ${hm(W.minBreakMinutes)}.`);
  if (!ae && w.presenceMin > W.maxPresenceHours * 60) warns.push(`لا يجوز بقاء العامل في مكان العمل أكثر من ${W.maxPresenceHours} ساعة في اليوم (المادة 101).`);
  if (ae && w.otPerDayMin > W.maxOvertimePerDay * 60) warns.push(`الإضافي اليومي ${hm(w.otPerDayMin)}، والحد ساعتان في اليوم إلا لمنع خسارة جسيمة أو حادث (المادة 19).`);
  if (ae && w.weeklyMin * 3 > W.maxHoursPer3Weeks * 60) warns.push(`مجموع العمل ${hm(w.weeklyMin * 3)} كل 3 أسابيع، والحد ${W.maxHoursPer3Weeks} ساعة.`);
  if (!ae) {
    const yearly = (Math.max(w.otDailyStdMin, w.otWeeklyStdMin) * 52) / 60;
    if (yearly > W.overtimeAnnualCapHours) warns.push(`الإضافي السنوي نحو ${num(yearly, 0)} ساعة، والحد 720 ساعة في السنة ما لم يوافق العامل على أكثر.`);
  }
  if (w.days > 6) warns.push("لكل عامل يوم راحة أسبوعية على الأقل بأجر كامل.");
  warns.forEach((t) => (html += note(t, "warn")));
  return html;
});
