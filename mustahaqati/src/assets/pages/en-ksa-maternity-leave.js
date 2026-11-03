import { ksaMaternityPlan, ksaMaternityPay, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "SAR");

bind(form, result, (v) => {
  if (!v.due) return null;
  const M = rules.sa.maternity;
  const p = ksaMaternityPlan({ due: v.due, start: v.start || v.due, wage: v.wage || 0 });
  let html = big("Last day of paid maternity leave", dateEn(p.lastPaid), `${M.weeks} weeks (${plural(p.totalDays, "day")}) on full pay · back on ${dateEn(p.back)}`);
  html += table(
    [
      ["Earliest possible start (4 weeks before the expected date)", dateEn(p.earliest)],
      ["Leave starts", dateEn(p.start), { strong: true }],
      ["Expected delivery date", dateEn(v.due)],
      ["Days before → after the expected date", `${plural(p.preDays, "day")} → ${plural(p.postDays, "day")}`],
      ["End of the 6 compulsory weeks after the birth", dateEn(p.mandatoryUntil)],
      ["Last day on full pay", dateEn(p.lastPaid), { strong: true }],
      ["Back to work", dateEn(p.back)],
      ["Back to work with the unpaid month", dateEn(p.extendedBack), { muted: true }],
    ],
    "Dates if the baby arrives on the expected date"
  );
  if (v.wage || v.insuredWage) {
    const pay = ksaMaternityPay({ contribMonths: v.contribMonths, insuredWage: v.insuredWage, wage: v.wage });
    html += pay.payer === "gosi"
      ? table(
          [
            ["Paid by", "GOSI (maternity benefit)", { strong: true }],
            ["Monthly benefit (100% of the average insured wage)", m(pay.monthly)],
            ["Duration", plural(pay.months, "month")],
            ["Total", m(pay.total), { strong: true }],
          ],
          "Who pays for the leave?"
        )
      : table(
          [
            ["Paid by", "Your employer", { strong: true }],
            ["Daily wage (actual ÷ 30)", m(pay.daily)],
            ["Pay for 84 days", m(pay.total), { strong: true }],
          ],
          "Who pays for the leave?"
        );
    html += pay.payer === "gosi"
      ? note(`The benefit cannot be combined with your wage, and your employer keeps paying contributions.${pay.capped ? " The average was capped at the SAR 45,000 contribution ceiling." : ""} An extra month is added if the baby is ill or has a disability and needs a companion.`, "info")
      : note(`The GOSI benefit needs 12 months of contributions within the 36 months before the birth, and you are ${plural(pay.shortBy, "month")} short, so your employer pays your full wage under the Labour Law.`, "info");
  }
  if (p.tooEarly) html += note("Leave may not start more than 4 weeks before the expected date, so we used the earliest allowed date.", "warn");
  if (p.late) html += note("We started the leave on the expected date itself, because it cannot start after the birth.", "warn");
  html += note("If the birth is late so that less than 6 weeks remain after it, the shortfall is added unpaid. For a sick or disabled baby who needs constant care: one more month on full pay, then one unpaid month on request.", "info");
  return html;
});
