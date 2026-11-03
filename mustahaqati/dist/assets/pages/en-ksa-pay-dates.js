import { ksaNextPayDates, ksaPayCountdown, KSA_PAY_ITEMS } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const MODE = form.dataset.mode || "item";
const NAME = { salary: "Government salaries", citizen: "Citizen's Account", social: "Developed social security", pension: "GOSI pensions", saned: "SANED", hafiz: "Hafiz", disability: "Disability allowance (comprehensive rehabilitation)", sakani: "Housing support (Sakani)", stipend: "University student stipends" };
const ON = { salary: "payday", citizen: "the Citizen's Account deposit", social: "the social security deposit", pension: "the pension deposit", saned: "the SANED deposit", hafiz: "the Hafiz deposit", disability: "the disability allowance", sakani: "the housing support deposit", stipend: "the university stipend" };
const RULE = {
  salary: "Paid on the 27th of each Gregorian month; a Friday moves to the Thursday before and a Saturday to the Sunday after. The Ministry of Finance may pay early before Eid by a decision announced at the time.",
  citizen: "Deposited on the 10th of each Gregorian month; a Friday moves to the Thursday before and a Saturday to the Sunday after. In April 2024 the 10th was the first day of Eid and the deposit came a week early.",
  social: "Deposited on the 1st of each Gregorian month; in 2026 a Friday or Saturday moved to the Thursday before, and early payment before Eid is announced. Eligibility results appear between the 25th and 27th of the month before.",
  pension: "Civil, military and GOSI pensions are paid on the 1st of each Gregorian month since May 2024; a Friday or Saturday moves to the Thursday before, and a public holiday to the last working day before it.",
  saned: "SANED is paid at the start of each Gregorian month with pensions, under the same rule: a Friday or Saturday moves to the Thursday before.",
  hafiz: "Deposited on the 5th of each Gregorian month, with eligibility results between the 2nd and 4th. HRDF states no weekend rule; in 2019 the Eid payment came early.",
  disability: "The comprehensive rehabilitation allowance is paid on the 26th of each Gregorian month; on a weekend it moves to the next working day (Sunday).",
  sakani: "Housing support is deposited on the 24th of each Gregorian month by REDF decision; when the 24th fell on a Friday or Saturday in 2026, the deposit was announced the following Sunday.",
  stipend: "Major universities pay stipends on the 27th of each Gregorian month with the salary cycle; each university pays from its own budget and may bring it forward for occasions. Moving Friday to Thursday and Saturday to Sunday is our inference from the salary rule.",
};
const HM = ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qa'dah", "Dhu al-Hijjah"];
const wdf = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" });
const df = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const mf = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const D = (iso) => new Date(`${iso}T00:00:00Z`);
const full = (iso) => df.format(D(iso));
const hij = (h) => (h ? `${h.day} ${HM[h.month - 1]} ${h.year} AH` : "");
const left = (n) => (n === 0 ? "today" : n >= 7 ? `${plural(n, "day")} (${plural(Math.floor(n / 7), "week")}${n % 7 ? ` and ${plural(n % 7, "day")}` : ""})` : plural(n, "day"));
function why(p) {
  const out = [];
  if (p.announced) out.push("date announced by the authority");
  else if (p.reason === "holiday") out.push("falls on a public holiday, so it moves to the last working day before");
  else if (p.shifted) out.push(`the ${ord(Number(p.nominal.slice(8)))} is a ${wdf.format(D(p.nominal))}, so it moves to ${wdf.format(D(p.date))}`);
  else if (p.unsure) out.push(`falls on a ${wdf.format(D(p.date))}; the authority announces another date`);
  if (p.holiday) out.push(`falls in the ${p.holiday.en} holiday, so another date may be announced`);
  return out.join("; ");
}
const ord = (n) => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
let timer = null;
function startTicker() {
  clearInterval(timer);
  const el = result.querySelector(".ticker");
  if (!el) return;
  const target = Date.parse(`${el.dataset.to}T00:00:00+03:00`);
  const tick = () => {
    const ms = target - Date.now();
    if (ms <= 0) { el.innerHTML = "<span><b>Today</b><small>payment day</small></span>"; clearInterval(timer); return; }
    const s = Math.floor(ms / 1000);
    const parts = [[Math.floor(s / 86400), "days"], [Math.floor((s % 86400) / 3600), "hours"], [Math.floor((s % 3600) / 60), "minutes"], [s % 60, "seconds"]];
    el.innerHTML = parts.map(([n, l]) => `<span><b>${String(n).padStart(2, "0")}</b><small>${l}</small></span>`).join("");
  };
  tick();
  timer = setInterval(tick, 1000);
}

bind(
  form,
  result,
  (v) => {
    const today = v.from || new Date();
    let html = "";
    if (MODE === "all") {
      const next = ksaPayCountdown({ today });
      if (!next.length) return null;
      const n = next[0];
      html += big("Next payment", `${NAME[n.item]}: ${n.days === 0 ? "today" : `in ${plural(n.days, "day")}`}`, `${full(n.date)} · ${hij(n.hijri)}`);
      html += table(next.map((p) => [NAME[p.item], `${full(p.date)} · <strong>${left(p.days)}</strong><br><small>${hij(p.hijri)}${why(p) ? ` · ${why(p)}` : ""}</small>`]), "Next date of each payment");
      const soon = KSA_PAY_ITEMS.flatMap((item) => ksaNextPayDates({ item, today, count: 3 })).filter((p) => p.days <= 62).sort((a, b) => a.date.localeCompare(b.date) || KSA_PAY_ITEMS.indexOf(a.item) - KSA_PAY_ITEMS.indexOf(b.item));
      html += table(soon.map((p) => [full(p.date), `${NAME[p.item]} · ${left(p.days)}`]), "All payment dates in the next two months");
      html += note("The housing support date follows what happened in 2026, the Hafiz date may change when it falls on a holiday, and early payment before Eid is announced at the time.", "info");
      return html;
    }
    const item = KSA_PAY_ITEMS.includes(v.item) ? v.item : form.dataset.item || "salary";
    const list = ksaNextPayDates({ item, today, count: 12 });
    if (!list.length) return null;
    const p = list[0];
    html += big(`Days until ${ON[item]}`, p.days === 0 ? "Today" : plural(p.days, "day"), `${full(p.date)} · ${hij(p.hijri)}`);
    if (!v.from || v.from === localToday()) html += `<p class="ticker" data-to="${p.date}" aria-hidden="true"></p>`;
    if (why(p)) html += note(why(p).replace(/^./, (c) => c.toUpperCase()) + ".", p.holiday || p.unsure ? "warn" : "info");
    html += table(list.map((x) => [mf.format(D(x.month + "-01")), `${full(x.date)}<br><small>${hij(x.hijri)}${why(x) ? ` · ${why(x)}` : ""}</small>`]), `Upcoming dates: ${NAME[item]}`);
    html += note(RULE[item], item === "sakani" ? "warn" : "info");
    setTimeout(startTicker, 0);
    return html;
  },
  { save: false }
);
