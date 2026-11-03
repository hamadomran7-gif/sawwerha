import { gccNotice } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { numEn, plural } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const C = form.dataset.country;
const CUR = { qa: "QAR", kw: "KWD", om: "OMR", bh: "BHD" }[C];
const DIG = C === "qa" ? 2 : 3;
const fmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: DIG, maximumFractionDigits: DIG });
const m = (x) => `${CUR} ${fmt.format(x)}`;
const BASIS = { basic: "Basic wage", total: "Total wage", basicSocial: "Basic wage plus social allowance" };

bind(form, result, (v) => {
  form.querySelectorAll("[data-years]").forEach((el) => (el.hidden = C !== "qa"));
  form.querySelectorAll("[data-paybasis]").forEach((el) => (el.hidden = !(C === "kw" || C === "om")));
  if (!v.wage) return null;
  const r = gccNotice({ country: C, wage: v.wage, years: v.years || 0, monthlyPaid: v.payBasis !== "other", servedDays: v.served || 0 });
  if (!r) return null;
  const byEmployer = v.who !== "employee";
  const label = r.unserved ? (byEmployer ? "Pay in lieu of notice owed to you" : "What you owe the employer if you leave without notice") : "Nothing owed: the full notice was served";
  let html = big(label, m(r.unserved ? r.inLieu : 0), `Notice period ${plural(r.days, "day")}${r.served ? ` · ${plural(r.served, "day")} served` : ""}`);
  html += table(
    [
      ["Notice period", `${plural(r.days, "day")}${r.days % 30 === 0 ? ` (${plural(r.days / 30, "month")})` : ""}`],
      ["Basis for pay in lieu", BASIS[r.basis]],
      ["Daily wage (÷ 30)", m(r.daily)],
      ["Days not served", plural(r.unserved, "day")],
      [byEmployer ? "Pay in lieu owed to the worker" : "Pay in lieu owed to the employer", m(r.inLieu), { strong: true }],
    ],
    "How it is calculated"
  );
  const tips = {
    qa: "Since Law 18 of 2020: one month in the first two years of service and two months after, for both sides and every pay basis, with pay in lieu on the basic wage. An expatriate who leaves without complying may be barred from a work permit for a year.",
    kw: "Notice is 3 months for monthly-paid workers and one month for others, for both sides. If the employer gives notice, you get a paid day or 8 hours a week to look for work, and the employer may release you from work during notice on full pay, still counted as service.",
    om: "Termination needs written notice and a legitimate reason: 30 days for monthly-paid workers and 15 for others, with pay in lieu on the last total wage. During notice you get 10 paid hours a week to look for work.",
    bh: "Notice is 30 days for both sides; a longer period can be agreed only when the employer terminates. If the employer does not observe it, the notice still counts as service, and you get a day or 8 hours a week to look for work.",
  };
  html += note(tips[C], "info");
  html += note("Pay in lieu of notice is separate from end-of-service gratuity and leave pay, and notice may not be given during leave. The amount is an estimate, and your contract may give a longer notice period.", "info");
  return html;
});
