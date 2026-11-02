import { uaeSickLeave, ksaSickLeave, gccSickPay } from "../calc.js";
import { bind, money, num, table, big, note } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");

bind(form, result, (v) => {
  const wage = Number(v.wage) || 0;
  const days = Math.max(1, Math.floor(Number(v.days) || 0));
  if (!wage || !days) return null;
  const full = (wage / 30) * days;
  const rows = [
    ["الإمارات", uaeSickLeave({ wage, days })],
    ["السعودية", ksaSickLeave({ wage, days })],
    ["قطر", gccSickPay({ country: "qa", days, basic: wage })],
    ["الكويت", gccSickPay({ country: "kw", days, basic: wage })],
    ["عُمان", gccSickPay({ country: "om", days, basic: wage })],
    ["البحرين", gccSickPay({ country: "bh", days, basic: wage })],
  ].map(([name, r]) => ({ name, paid: r.paid, normal: full, pct: full ? (r.paid / full) * 100 : 0, exceeded: r.exceeded }));
  const best = rows.reduce((a, b) => (b.paid > a.paid ? b : a));
  let html = big(`الأعلى أجراً عن ${num(days, 0)} يوماً من المرض`, best.name, `${money(best.paid)} من أصل ${money(best.normal)}`);
  html += table(
    rows
      .sort((a, b) => b.paid - a.paid)
      .map((r) => [`${r.name}${r.exceeded ? " (تجاوزت الحد الأقصى)" : ""}`, `${money(r.paid)} · ${num(r.pct, 0)}% من الأجر`]),
    "أجر الإجازة المرضية بحسب الدولة"
  );
  html += note("تفترض المقارنة أن المرض في سنة واحدة وأن شروط الاستحقاق متحققة (انتهاء التجربة في الإمارات، و3 أشهر خدمة في قطر والبحرين). الأيام التي تتجاوز الحد الأقصى غير مدفوعة.", "info");
  return html;
});
