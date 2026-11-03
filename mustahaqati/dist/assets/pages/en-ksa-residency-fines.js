import { ksaResidencyFine, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (x) => moneyEn(x, "SAR");
const F = rules.sa.residencyFines;
const ORD = ["first", "second", "third"];

bind(form, result, (v) => {
  const t = v.type;
  form.querySelectorAll("[data-iqama]").forEach((el) => (el.hidden = t !== "iqama"));
  const r = ksaResidencyFine({ type: t, offence: v.offence });
  if (!r) return null;
  if (t === "iqama") {
    const n = Math.max(1, Math.floor(v.count || 1));
    if (r.deportation) return big("Third offence", "Deportation", "The violator is deported") + note("After the fines for the first and second offences, a third late iqama renewal leads to deportation.", "warn");
    let html = big(`Fine for the ${ORD[r.offence - 1]} offence`, m(r.fine * n), n > 1 ? `${n} × ${m(r.fine)}` : "per iqama, not per day");
    html += table(
      [
        ["Fine per iqama", m(r.fine)],
        ["Number of iqamas", String(n)],
        ["Total on top of renewal fees", m(r.fine * n), { strong: true }],
        r.offence === 1 ? ["On a second offence", m(F.iqamaLate[1] * n)] : ["On a third offence", "Deportation"],
      ],
      "Details"
    );
    html += note(`Renew at least ${plural(F.renewBeforeDays, "day")} before the iqama expires. The worker's iqama fine is paid by the employer (Article 40); family members' iqamas by the head of the family.`, "info");
    return html;
  }
  if (t === "finalExit") return big("Fine for an unused final exit visa", m(r.fine), `The visa is valid for ${plural(r.validityDays, "day")}`) + note("A valid iqama is required to pay the fine and cancel the visa, so you may need to renew the iqama first.", "warn");
  if (t === "firstIqama") return big("Fine for late iqama issuance", m(r.fine), `After ${plural(r.days, "day")} from entry`) + note("A worker arriving on a work visa must have the iqama issued within 90 days of entry; the fees and the late fine are on the employer. The amount comes from the Passports Directorate via the press (2023).", "info");
  if (t === "visitor") return big("Visitor who overstays", `Up to ${m(r.fineMax)}`, `plus jail up to ${r.jailMonthsMax} months and deportation`) + note("No daily fine is published, and the amount is a maximum, not a counter. A sponsor who fails to report that a visitor has not left faces the same penalty and is deported if an expatriate. An entry ban may also apply depending on the violation.", "warn");
  if (t === "exitReentry") return big("No fine and no automatic ban", m(0), `The ${r.previousBanYears}-year ban was lifted on ${dateEn(r.banLifted)}`) + note("Workers who left on an exit and re-entry visa and did not return used to be banned for 3 years except for their former employer; this was lifted in January 2024 according to press reports citing the Passports Directorate.", "info");
  return null;
});
