import { bind, money, num, table, big, note, daysAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");

bind(form, result, (v) => {
  const salary = Number(v.salary);
  if (!salary || salary <= 0) return null;
  const basis = Number(v.basis) || 30;
  const hours = Number(v.hours) || 8;
  const daily = salary / basis;
  const hourly = daily / hours;
  const absent = Math.max(0, Number(v.absent) || 0);
  const deduction = Math.min(salary, daily * absent);

  let html = big("الأجر اليومي", money(daily), `أجر الساعة ${money(hourly)}`);
  html += table([
    ["الأجر اليومي", money(daily), { strong: true }],
    [`أجر الساعة (${num(hours, 1)} ${Number.isInteger(hours) && hours >= 3 && hours <= 10 ? "ساعات" : "ساعة"} يومياً)`, money(hourly), { strong: true }],
    ["أجر الدقيقة", money(hourly / 60)],
    ["الأجر الأسبوعي", money((salary * 12) / 52)],
    ["الأجر السنوي", money(salary * 12)],
  ], `راتب ${money(salary)} ÷ ${basis}`);
  if (absent) {
    html += table([
      [`خصم ${daysAr(absent)}`, money(deduction)],
      ["الراتب بعد الخصم", money(salary - deduction), { strong: true }],
    ], "أيام الغياب أو الإجازة بدون راتب");
  }
  if (basis !== 30) html += note(`بالقسمة على 30 يكون الأجر اليومي ${money(salary / 30)}. الطريقة المعتمدة نظاماً لأغلب المستحقات هي 30 يوماً.`, "info");
  return html;
});
