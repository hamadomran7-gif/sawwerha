import { hijriParts, hijriToGregorian, hijriMonthLength } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const gOnly = form.querySelectorAll("[data-g]");
const hOnly = form.querySelectorAll("[data-h]");
const MONTHS = ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Shaban", "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"];
const hText = (h) => `${h.day} ${MONTHS[h.month - 1]} ${h.year} AH`;
const weekday = (iso) => new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const longDate = (iso) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

bind(form, result, (v) => {
  const toG = v.mode === "h2g";
  gOnly.forEach((el) => (el.hidden = toG));
  hOnly.forEach((el) => (el.hidden = !toG));
  if (toG) {
    if (!v.hy || !v.hm || !v.hd) return null;
    const iso = hijriToGregorian({ year: v.hy, month: v.hm, day: v.hd });
    if (!iso) {
      const len = v.hy >= 1300 && v.hy <= 1600 ? hijriMonthLength(v.hy, v.hm) : null;
      return note(len ? `${MONTHS[v.hm - 1]} ${v.hy} AH has only ${len} days in the Umm al-Qura calendar, so day ${v.hd} does not exist.` : "Enter a Hijri year between 1300 and 1600.", "warn");
    }
    const len = hijriMonthLength(v.hy, v.hm);
    let html = big("Gregorian date", longDate(iso), `${weekday(iso)} · ${iso}`);
    html += table(
      [
        ["Hijri date entered", hText({ year: v.hy, month: v.hm, day: v.hd })],
        ["Weekday", weekday(iso)],
        ["Gregorian (dd/mm/yyyy)", iso.split("-").reverse().join("/")],
        len ? [`Days in ${MONTHS[v.hm - 1]} ${v.hy}`, `${len} days`] : null,
      ],
      "Conversion details"
    );
    return html + note("Converted with the Umm al-Qura calendar. Months tied to moon sighting (Ramadan, Shawwal and Dhu al-Hijjah) may differ by a day from the official announcement.", "info");
  }
  if (!v.g) return null;
  const h = hijriParts(new Date(`${v.g}T00:00:00Z`));
  if (!h) return note("Your browser does not support the Umm al-Qura calendar. Try a newer browser.", "warn");
  const len = hijriMonthLength(h.year, h.month);
  let html = big("Hijri date", hText(h), `${weekday(v.g)} · ${h.day}/${h.month}/${h.year} AH`);
  html += table(
    [
      ["Gregorian date entered", dateEn(v.g)],
      ["Weekday", weekday(v.g)],
      ["Hijri (d/m/yyyy)", `${h.day}/${h.month}/${h.year}`],
      len ? [`Days in ${MONTHS[h.month - 1]} ${h.year}`, `${len} days`] : null,
    ],
    "Conversion details"
  );
  return html + note("Converted with the Umm al-Qura calendar adopted in Saudi Arabia. Months tied to moon sighting may differ by a day from the official announcement.", "info");
});
