import { ageCalc, hijriParts, hijriAgeFromDays } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { plural, durationEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const MONTHS = ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Shaban", "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"];
const hijriText = (h) => (h ? `${h.day} ${MONTHS[h.month - 1]} ${h.year} AH` : "Not available in this browser");

bind(form, result, (v) => {
  if (!v.birth) return null;
  const asOf = v.asof ? new Date(v.asof) : new Date();
  const a = ageCalc({ birth: v.birth, asOf });
  if (!a) return note("The date of birth must be before the calculation date.", "bad");
  const hb = hijriParts(new Date(v.birth));
  const ht = hijriParts(asOf);
  const ha = hijriAgeFromDays(a.totalDays);
  let html = big("Your Gregorian age", durationEn(a), `Hijri age about ${durationEn(ha)}`);
  html += table(
    [
      ["Your Hijri date of birth (Umm al-Qura)", hijriText(hb)],
      ["Calculation date in Hijri", hijriText(ht)],
      ["Days lived", plural(a.totalDays, "day")],
      ["In Gregorian months", plural(a.years * 12 + a.months, "month")],
      ["In weeks", plural(Math.floor(a.totalDays / 7), "week")],
      ["Until your next birthday", plural(a.daysToBirthday, "day")],
    ],
    "Details"
  );
  return html;
});
