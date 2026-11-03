import { holidayWorkPay, upcomingHolidays } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const next = document.getElementById("next");
const cc = form.dataset.country;
const CUR = { ae: "AED", sa: "SAR", qa: "QR", kw: "KD", om: "OMR", bh: "BHD" }[cc];
const m = (x) => moneyEn(x, CUR);
const days = (n) => plural(n, "day");
const hrs = (n) => plural(n, "hour");

try {
  const up = upcomingHolidays({ country: cc, from: new Date() });
  if (next && up.length) {
    const h = up[0];
    const range = h.days > 1 ? `${dateEn(h.start)} – ${dateEn(h.end)}` : dateEn(h.start);
    const when = h.ongoing ? "on now" : h.daysUntil === 0 ? "today" : h.daysUntil === 1 ? "tomorrow" : `in ${days(h.daysUntil)}`;
    const after = up.slice(1, 4).map((x) => `${x.en} (${dateEn(x.start)}${x.official ? "" : ", expected"})`).join("; ");
    next.innerHTML = big("Next public holiday", h.en, `${when} · ${range}${h.days > 1 ? ` (${days(h.days)})` : ""}${h.official ? "" : " · expected"}`) + (after ? note(`Then: ${after}.`, "info") : "");
  }
} catch {}

bind(form, result, (v) => {
  const r = holidayWorkPay({ country: cc, basic: v.basic, total: v.total, days: v.days ?? 1, hours: v.hours ?? 8, nightHours: v.nightHours ?? 0, consent: v.consent !== "no" });
  if (!r) return null;
  const d = Number(v.days) || 0;
  if (cc === "ae") {
    if (!v.basic) return null;
    let html = big("Pay for working on the holiday", m(r.total), `${days(d)} × ${m(r.perDay)} on top of your monthly salary`);
    html += table([["Day's wage (total ÷ 30)", m(r.dayWage)], ["+ 50% of daily basic", m(r.premium)], ["Per day", m(r.perDay)], ["Total", m(r.total), { strong: true }]], "How it is calculated");
    return html + note(`Or ${days(r.substituteDays)} of substitute rest instead of cash (Article 28). The text does not say who chooses.`, "info");
  }
  if (cc === "sa") {
    if (!v.basic) return null;
    let html = big("Pay for working on the holiday", m(r.total), `${hrs(r.hours)} × ${m(r.hourly)} on top of holiday pay`);
    html += table([["Actual hourly wage (actual ÷ 240)", m(r.actualHourly)], ["+ 50% of basic hourly wage", m(r.premiumHourly)], ["Overtime hourly rate", m(r.hourly)], ["Total", m(r.total), { strong: true }]], "How it is calculated");
    return html + note(`Or, with your consent, paid compensatory leave of at least ${hrs(r.compLeaveHours)} (an hour and a half per hour) used within 60 days.`, "info");
  }
  if (cc === "qa") {
    if (!v.basic) return null;
    let html = big("Pay for working on the holiday", m(r.total), `On a basic hourly wage of ${m(r.hourlyBasic)}`);
    html += table([r.dayHours ? [`${hrs(r.dayHours)} × ${m(r.hourlyBasic)} × 1.25`, m(r.dayHours * r.hourlyBasic * 1.25)] : null, r.nightHours ? [`${hrs(r.nightHours)} at night × ${m(r.hourlyBasic)} × 1.5`, m(r.nightHours * r.hourlyBasic * 1.5)] : null, ["Total", m(r.total), { strong: true }]], "How it is calculated");
    return html + note("Article 74 applies to work on holidays: basic + at least 25%, and + 50% between 9 pm and 3 am except for shift workers, with no substitute day in the text.", "info");
  }
  if (cc === "kw") {
    if (!v.total) return null;
    let html = big("Pay for working on the holiday", m(r.total), `Double pay for ${days(d)}, plus ${days(r.substituteDays)} off`);
    html += table([["Day's wage (total ÷ 26)", m(r.daily)], [`2 × day's wage × ${d}`, m(r.total), { strong: true }], ["Minimum reading (one day's wage on top of salary)", m(r.totalMin), { muted: true }], ["Dividing salary by 30", m(r.total30), { muted: true }]], "How it is calculated");
    return html + note("Article 68: \"double pay\" plus a substitute day. Whether \"double\" includes the holiday pay already in your salary is not settled, so we show both readings.", "warn");
  }
  if (cc === "om") {
    if (!v.basic) return null;
    const consent = v.consent !== "no";
    let html = big("Pay for working on the holiday", m(r.total), consent ? `Day's wage + 100% of daily basic, for ${days(d)}` : `200% on top of the day's wage without your consent, for ${days(d)}`);
    html += table([["Daily basic wage (÷ 30)", m(r.dailyBasic)], [consent ? `2 × ${m(r.dailyBasic)} × ${d}` : `3 × ${m(r.dailyBasic)} × ${d}`, m(r.total), { strong: true }], consent && v.total ? ["If the day's wage uses total pay", m(r.totalGrossDay), { muted: true }] : null], "How it is calculated");
    return html + note(consent ? `Or ${days(r.compDays)} of compensatory leave instead of cash (Article 71).` : `Or ${days(r.compDays)} of rest for the work (Article 72, for stocktaking and emergencies).`, "info");
  }
  if (cc === "bh") {
    if (!v.total) return null;
    let html = big("Pay for working on the holiday", m(r.total), `Day's wage + 150% for ${days(d)}`);
    html += table([["Day's wage (÷ 30)", m(r.daily)], [`2.5 × ${m(r.daily)} × ${d}`, m(r.total), { strong: true }], ["If the day's wage counts as already in salary (1.5×)", m(r.totalMin), { muted: true }]], "How it is calculated");
    return html + note(`Or ${days(r.substituteDays)} off instead, at the worker's choice (Article 64).`, "info");
  }
  return null;
});
