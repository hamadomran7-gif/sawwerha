import { holidayWorkPay, upcomingHolidays, rules } from "../calc.js";
import { bind, money, table, big, note, arDate, daysAr, hoursAr, daysGen, hoursGen } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const next = document.getElementById("next");
const cc = form.dataset.country;
const CUR = { ae: "درهم", sa: "ريال", qa: "ريال", kw: "دينار", om: "ريال", bh: "دينار" }[cc];
const m = (x) => money(x, CUR);

// العطلة القادمة
try {
  const up = upcomingHolidays({ country: cc, from: new Date() });
  if (next && up.length) {
    const h = up[0];
    const range = h.days > 1 ? `${arDate(h.start)} – ${arDate(h.end)}` : arDate(h.start);
    const when = h.ongoing ? "جارية الآن" : h.daysUntil === 0 ? "اليوم" : h.daysUntil === 1 ? "غداً" : `بعد ${daysGen(h.daysUntil)}`;
    const after = up.slice(1, 4).map((x) => `${x.ar} (${arDate(x.start)}${x.official ? "" : "، متوقع"})`).join("، ");
    next.innerHTML = big("العطلة الرسمية القادمة", h.ar, `${when} · ${range}${h.days > 1 ? ` (${daysAr(h.days)})` : ""}${h.official ? "" : " · متوقع"}`) + (after ? note(`ثم: ${after}.`, "info") : "");
  }
} catch {}

bind(form, result, (v) => {
  const r = holidayWorkPay({ country: cc, basic: v.basic, total: v.total, days: v.days ?? 1, hours: v.hours ?? 8, nightHours: v.nightHours ?? 0, consent: v.consent !== "no" });
  if (!r) return null;
  const d = Number(v.days) || 0;
  if (cc === "ae") {
    if (!v.basic) return null;
    let html = big("أجر العمل في العطلة", m(r.total), `${daysAr(d)} × ${m(r.perDay)} فوق راتبك الشهري`);
    html += table([["أجر اليوم (الشامل ÷ 30)", m(r.dayWage)], ["+ 50% من الأساسي اليومي", m(r.premium)], ["عن اليوم الواحد", m(r.perDay)], ["المجموع", m(r.total), { strong: true }]], "تفصيل الحساب");
    return html + note("أو يوم راحة بديل عن كل يوم عمل بدلاً من النقد (المادة 28). والنص لا يحدد من يختار.", "info");
  }
  if (cc === "sa") {
    if (!v.basic) return null;
    let html = big("أجر العمل في العطلة", m(r.total), `${hoursAr(r.hours)} × ${m(r.hourly)} فوق أجر العطلة`);
    html += table([["أجر الساعة الفعلي (الفعلي ÷ 240)", m(r.actualHourly)], ["+ 50% من أجر الساعة الأساسي", m(r.premiumHourly)], ["أجر الساعة الإضافية", m(r.hourly)], ["المجموع", m(r.total), { strong: true }]], "تفصيل الحساب");
    return html + note(`أو بموافقتك إجازة تعويضية مدفوعة لا تقل عن ${hoursGen(r.compLeaveHours)} (ساعة ونصف عن كل ساعة) تُستخدم خلال 60 يوماً.`, "info");
  }
  if (cc === "qa") {
    if (!v.basic) return null;
    let html = big("أجر العمل في العطلة", m(r.total), `على أجر الساعة الأساسي ${m(r.hourlyBasic)}`);
    html += table([r.dayHours ? [`${hoursAr(r.dayHours)} × ${m(r.hourlyBasic)} × 1.25`, m(r.dayHours * r.hourlyBasic * 1.25)] : null, r.nightHours ? [`${hoursAr(r.nightHours)} ليلاً × ${m(r.hourlyBasic)} × 1.5`, m(r.nightHours * r.hourlyBasic * 1.5)] : null, ["المجموع", m(r.total), { strong: true }]], "تفصيل الحساب");
    return html + note("تُطبق المادة 74 على العمل في العطلة: الأساسي + 25% على الأقل، و+50% بين 9 مساءً و3 صباحاً عدا عمال المناوبة، ولا يوم بديل في النص.", "info");
  }
  if (cc === "kw") {
    if (!v.total) return null;
    let html = big("أجر العمل في العطلة", m(r.total), `أجر مضاعف عن ${daysGen(d)}، ومعه يوم بديل عن كل يوم`);
    html += table([["أجر اليوم (الشامل ÷ 26)", m(r.daily)], [`2 × أجر اليوم × ${d}`, m(r.total), { strong: true }], ["بالقراءة الدنيا (أجر يوم واحد فوق الراتب)", m(r.totalMin), { muted: true }], ["بقسمة الراتب على 30", m(r.total30), { muted: true }]], "تفصيل الحساب");
    return html + note("المادة 68: «أجر مضاعف» مع يوم بديل. هل يشمل المضاعف أجر العطلة المدفوع أصلاً؟ غير محسوم، فنعرض القراءتين.", "warn");
  }
  if (cc === "om") {
    if (!v.basic) return null;
    const consent = v.consent !== "no";
    let html = big("أجر العمل في العطلة", m(r.total), consent ? `أجر اليوم + 100% من الأساسي اليومي، عن ${daysGen(d)}` : `200% فوق أجر اليوم دون موافقتك، عن ${daysGen(d)}`);
    html += table([["الأجر الأساسي اليومي (÷ 30)", m(r.dailyBasic)], [consent ? `2 × ${m(r.dailyBasic)} × ${d}` : `3 × ${m(r.dailyBasic)} × ${d}`, m(r.total), { strong: true }], consent && v.total ? ["إن حُسب أجر اليوم على الشامل", m(r.totalGrossDay), { muted: true }] : null], "تفصيل الحساب");
    return html + note(consent ? "أو إجازة تعويضية عن كل يوم بدلاً من النقد (المادة 71)." : "أو يوما راحة عن كل يوم عمل (المادة 72، في الجرد والطوارئ).", "info");
  }
  if (cc === "bh") {
    if (!v.total) return null;
    let html = big("أجر العمل في العطلة", m(r.total), `أجر اليوم + 150% عن ${daysGen(d)}`);
    html += table([["أجر اليوم (÷ 30)", m(r.daily)], [`2.5 × ${m(r.daily)} × ${d}`, m(r.total), { strong: true }], ["إن عُدّ أجر اليوم داخل الراتب (1.5×)", m(r.totalMin), { muted: true }]], "تفصيل الحساب");
    return html + note("أو يوم بديل عن كل يوم عمل، والخيار للعامل (المادة 64).", "info");
  }
  return null;
});
