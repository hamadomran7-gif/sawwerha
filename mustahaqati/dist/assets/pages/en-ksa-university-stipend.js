import { ksaUniversityStipend, ksaNextPayDates } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");
const NAME = { science: "science major", humanities: "humanities major", graduate: "graduate studies", disabilitySevere: "disability, first class", disabilityModerate: "disability, second class", tvtcCollege: "technical college", tvtcInstitute: "secondary institute" };
const wdf = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" });
const df = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const mf = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const D = (iso) => new Date(`${iso}T00:00:00Z`);
const full = (iso) => df.format(D(iso));
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
    const s = ksaUniversityStipend({ category: v.category, excellence: v.excellence });
    if (!s) return null;
    const list = ksaNextPayDates({ item: "stipend", today: v.from || new Date(), count: 6 });
    const p = list[0];
    let html = big("Days until the stipend", p.days === 0 ? "Today" : plural(p.days, "day"), full(p.date));
    if (!v.from || v.from === localToday()) html += `<p class="ticker" data-to="${p.date}" aria-hidden="true"></p>`;
    html += table(
      [
        [`Monthly stipend (${NAME[s.category]})`, m(s.gross)],
        s.deduction ? ["Student fund deduction", `− ${m(s.deduction)}`] : null,
        ["Net per month", m(s.net), { strong: true }],
        s.excellence ? ["Excellence reward (once a year)", m(s.excellence)] : null,
        ["Over 12 months", m(s.annual)],
        s.graduate ? ["Yearly book allowance (one month)", m(s.graduate.books)] : null,
      ],
      "Stipend breakdown"
    );
    html += table(list.map((x) => [mf.format(D(x.month + "-01")), `${full(x.date)}${x.shifted ? `<br><small>the 27th is a ${wdf.format(D(x.nominal))}</small>` : ""}`]), "Upcoming payment dates");
    if (s.tvtc) html += note("The trainee amount comes from the Technical and Vocational Training Corporation's FAQ (2023); we do not know whether a fund deduction applies or the payment day. The dates above are for universities.", "warn");
    if (s.category.startsWith("disability")) html += note("The disability amounts come from the University of Jeddah only, with the classification issued by the Ministry of Human Resources. Check with your university.", "warn");
    if (v.excellence && !s.excellence) html += note("The SAR 1,000 excellence reward is for bachelor's students only.", "info");
    html += note("The 27th is the practice at major universities, not a national rule, and any university may pay early for occasions. Some universities do not pay in summer except to summer-course students.", "info");
    setTimeout(startTicker, 0);
    return html;
  },
  { save: false }
);
