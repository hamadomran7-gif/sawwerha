import { hijriParts, hijriToGregorian, hijriMonthLength, HIJRI_MONTHS, WEEKDAYS_AR } from "../calc.js";
import { bind, table, big, note, arDate } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const gOnly = form.querySelectorAll("[data-g]");
const hOnly = form.querySelectorAll("[data-h]");
const hText = (h) => `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} هـ`;
const wd = (iso) => WEEKDAYS_AR[new Date(`${iso}T00:00:00Z`).getUTCDay()];

bind(form, result, (v) => {
  const toG = v.mode === "h2g";
  gOnly.forEach((el) => (el.hidden = toG));
  hOnly.forEach((el) => (el.hidden = !toG));
  if (toG) {
    if (!v.hy || !v.hm || !v.hd) return null;
    const iso = hijriToGregorian({ year: v.hy, month: v.hm, day: v.hd });
    if (!iso) {
      const len = v.hy >= 1300 && v.hy <= 1600 ? hijriMonthLength(v.hy, v.hm) : null;
      return note(len ? `شهر ${HIJRI_MONTHS[v.hm - 1]} ${v.hy} هـ ${len} يوماً فقط في تقويم أم القرى، فاليوم ${v.hd} غير موجود.` : "أدخل سنة هجرية بين 1300 و1600.", "warn");
    }
    const len = hijriMonthLength(v.hy, v.hm);
    let html = big("التاريخ الميلادي", arDate(iso), `${wd(iso)} · ${iso}`);
    html += table(
      [
        ["التاريخ الهجري المُدخل", hText({ year: v.hy, month: v.hm, day: v.hd })],
        ["اليوم", wd(iso)],
        ["الميلادي بالأرقام", iso.split("-").reverse().join("/")],
        len ? [`عدد أيام شهر ${HIJRI_MONTHS[v.hm - 1]} ${v.hy}`, `${len} يوماً`] : null,
      ],
      "تفاصيل التحويل"
    );
    return html + note("التحويل بتقويم أم القرى. الأشهر المرتبطة بالرؤية (رمضان وشوال وذو الحجة) قد تختلف يوماً عن الإعلان الرسمي للرؤية.", "info");
  }
  if (!v.g) return null;
  const h = hijriParts(new Date(`${v.g}T00:00:00Z`));
  if (!h) return note("متصفحك لا يدعم تقويم أم القرى. جرّب متصفحاً أحدث.", "warn");
  const len = hijriMonthLength(h.year, h.month);
  let html = big("التاريخ الهجري", hText(h), `${wd(v.g)} · ${h.day}/${h.month}/${h.year} هـ`);
  html += table(
    [
      ["التاريخ الميلادي المُدخل", arDate(v.g)],
      ["اليوم", wd(v.g)],
      ["الهجري بالأرقام", `${h.day}/${h.month}/${h.year}`],
      len ? [`عدد أيام شهر ${HIJRI_MONTHS[h.month - 1]} ${h.year}`, `${len} يوماً`] : null,
    ],
    "تفاصيل التحويل"
  );
  return html + note("التحويل بتقويم أم القرى المعتمد في السعودية. الأشهر المرتبطة بالرؤية قد تختلف يوماً عن الإعلان الرسمي.", "info");
});
