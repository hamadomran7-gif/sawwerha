import { workHours, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");

const hm = (min) => {
  const t = Math.round(min);
  const h = Math.floor(t / 60), r = t % 60;
  const parts = [h ? plural(h, "hour") : "", r ? plural(r, "minute") : ""].filter(Boolean);
  return parts.length ? parts.join(" ") : "0";
};
const toggle = () => form.querySelectorAll("[data-country]").forEach((el) => (el.hidden = el.dataset.country !== form.country.value));
form.country.addEventListener("change", toggle);

bind(form, result, (v) => {
  toggle();
  const ae = v.country === "ae";
  const w = workHours({ country: v.country, start: v.start, end: v.end, breakMin: v.breakMin, days: v.days, ramadan: !!v.ramadan, muslim: !!v.muslim });
  if (!w) return null;
  const W = ae ? rules.ae.workHours : rules.sa.workHours;

  let html = big("Actual working hours", `${numEn(Math.round((w.weeklyMin / 60) * 100) / 100)} hours a week`, `${hm(w.workMin)} a day × ${w.days} days`);
  html += table(
    [
      ["Daily attendance", hm(w.presenceMin)],
      ["Break", hm(w.breakMin)],
      ["Actual work a day", hm(w.workMin), { strong: true }],
      ["A week", hm(w.weeklyMin)],
      ["A month (approx.)", hm(w.monthlyMin)],
      [`Legal limit${v.ramadan ? " in Ramadan" : ""}`, `${hm(w.dailyMaxMin)} a day${!ae || !v.ramadan ? ` or ${hm(w.weeklyMaxMin)} a week` : ""}`],
    ],
    "Your schedule"
  );
  html += table(
    [
      ["On the daily standard", w.otDailyStdMin ? `${hm(w.otDailyStdMin)} a week` : "None", { strong: !!w.otDailyStdMin }],
      ["On the weekly standard", w.otWeeklyStdMin ? `${hm(w.otWeeklyStdMin)} a week` : "None", { strong: !!w.otWeeklyStdMin }],
    ],
    "Overtime"
  );
  if (w.otDailyStdMin && !w.otWeeklyStdMin) html += note("Your day exceeds the daily limit but your week is within the weekly limit, so overtime depends on which standard your employer's rules use.", "info");

  const warns = [];
  if (w.presenceMin > W.maxConsecutiveHours * 60 && w.breakMin < W.minBreakMinutes) warns.push(`Your shift is longer than ${W.maxConsecutiveHours} hours, and the law requires a break of at least ${hm(W.minBreakMinutes)}.`);
  if (!ae && w.presenceMin > W.maxPresenceHours * 60) warns.push(`A worker may not stay at the workplace more than ${W.maxPresenceHours} hours a day (Article 101).`);
  if (ae && w.otPerDayMin > W.maxOvertimePerDay * 60) warns.push(`Daily overtime is ${hm(w.otPerDayMin)}; the limit is two hours a day except to prevent serious loss or an accident (Article 19).`);
  if (ae && w.weeklyMin * 3 > W.maxHoursPer3Weeks * 60) warns.push(`Total work is ${hm(w.weeklyMin * 3)} every 3 weeks; the limit is ${W.maxHoursPer3Weeks} hours.`);
  if (!ae) {
    const yearly = (Math.max(w.otDailyStdMin, w.otWeeklyStdMin) * 52) / 60;
    if (yearly > W.overtimeAnnualCapHours) warns.push(`Annual overtime is about ${numEn(Math.round(yearly))} hours; the limit is 720 hours a year unless the worker agrees to more.`);
  }
  if (w.days > 6) warns.push("Every worker is entitled to at least one paid weekly rest day.");
  warns.forEach((t) => (html += note(t, "warn")));
  return html;
});
