// اختبارات المعادلات — تُشغَّل بـ: node --test tests/
// كل حالة محسوبة يدوياً من النص القانوني، وتطابق الأمثلة المنشورة في الصفحات.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  serviceDuration,
  uaeGratuity,
  ksaEndOfService,
  gosiContribution,
  gosiNewEntrantPensionRate,
  ksaNetSalary,
  uaeOvertime,
  uaeLeaveAccrued,
  uaeLeaveEncashment,
  ksaLeave,
  loanInstallment,
  uaePersonalLoanCheck,
  ksaFinanceCheck,
  uaeMortgageLtv,
  dubaiPurchaseCosts,
  iloe,
  vat,
  ageCalc,
  hijriParts,
} from "../src/assets/calc.js";

const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);

test("مدة الخدمة: اليوم الأخير محسوب", () => {
  const d = serviceDuration("2020-01-01", "2024-12-31");
  assert.deepEqual([d.years, d.months, d.days], [5, 0, 0]);
  near(d.decimalYears, 5);
  const d2 = serviceDuration("2019-03-01", "2026-11-30");
  assert.deepEqual([d2.years, d2.months, d2.days], [7, 9, 0]);
  assert.equal(serviceDuration("2024-01-01", "2023-01-01"), null);
});

test("مدة الخدمة: طرح أيام بدون راتب", () => {
  const d = serviceDuration("2020-01-01", "2024-12-31", 45);
  assert.deepEqual([d.years, d.months, d.days], [4, 10, 15]);
});

test("الإمارات: مكافأة نهاية الخدمة — مثال الصفحة (8000 × 7س9ش = 50,000)", () => {
  const g = uaeGratuity({ basicSalary: 8000, years: 7.75 });
  near(g.dailyWage, 266.67);
  near(g.firstAmount, 28000);
  near(g.secondAmount, 22000);
  near(g.total, 50000);
  assert.equal(g.capped, false);
});

test("الإمارات: أقل من سنة = لا مكافأة، و3 سنوات = 63 يوماً", () => {
  assert.equal(uaeGratuity({ basicSalary: 5000, years: 0.9 }).eligible, false);
  const g = uaeGratuity({ basicSalary: 5000, years: 3 });
  near(g.total, (5000 / 30) * 63);
});

test("الإمارات: السقف أجر سنتين", () => {
  const g = uaeGratuity({ basicSalary: 10000, years: 30 });
  assert.equal(g.capped, true);
  near(g.total, 240000);
});

test("السعودية: مثال الصفحة (9000 × 7س11ش، استقالة = ثلثان = 32,500)", () => {
  const e = ksaEndOfService({ wage: 9000, years: 7 + 11 / 12, reason: "resignation" });
  near(e.gross, 48750);
  near(e.total, 32500);
});

test("السعودية: مثال صبار (6000 × 3س استقالة = 3,000؛ 7س استقالة = 18,000)", () => {
  near(ksaEndOfService({ wage: 6000, years: 3, reason: "resignation" }).total, 3000);
  near(ksaEndOfService({ wage: 6000, years: 7, reason: "resignation" }).total, 18000);
});

test("السعودية: حدود المادة 85", () => {
  assert.equal(ksaEndOfService({ wage: 6000, years: 1.9, reason: "resignation" }).total, 0);
  near(ksaEndOfService({ wage: 6000, years: 5, reason: "resignation" }).fraction, 0.333, 0.001);
  near(ksaEndOfService({ wage: 6000, years: 5.01, reason: "resignation" }).fraction, 0.667, 0.001);
  assert.equal(ksaEndOfService({ wage: 6000, years: 10, reason: "resignation" }).fraction, 1);
  assert.equal(ksaEndOfService({ wage: 6000, years: 10, reason: "article_80" }).total, 0);
  assert.equal(ksaEndOfService({ wage: 6000, years: 1, reason: "resignation_marriage" }).fraction, 1);
  near(ksaEndOfService({ wage: 6000, years: 1, reason: "contract_end" }).total, 3000);
});

test("التأمينات: السعودي القديم 9.75% / 11.75% على الوعاء بسقف 45,000", () => {
  const g = gosiContribution({ basic: 8000, housing: 2000, isSaudi: true });
  near(g.employeeAmount, 975);
  near(g.employerAmount, 1175);
  const capped = gosiContribution({ basic: 50000, housing: 10000, isSaudi: true });
  assert.equal(capped.capped, true);
  near(capped.employeeAmount, 45000 * 0.0975);
});

test("التأمينات: غير السعودي 2% على صاحب العمل فقط", () => {
  const g = gosiContribution({ basic: 8000, housing: 2000, isSaudi: false });
  assert.equal(g.employeeAmount, 0);
  near(g.employerAmount, 200);
});

test("التأمينات: جدول المشترك الجديد 9% → 11%", () => {
  near(gosiNewEntrantPensionRate(new Date("2025-01-01")), 0.09, 1e-9);
  near(gosiNewEntrantPensionRate(new Date("2025-07-03")), 0.095, 1e-9);
  near(gosiNewEntrantPensionRate(new Date("2026-11-01")), 0.1, 1e-9);
  near(gosiNewEntrantPensionRate(new Date("2027-08-01")), 0.105, 1e-9);
  near(gosiNewEntrantPensionRate(new Date("2028-07-03")), 0.11, 1e-9);
  near(gosiNewEntrantPensionRate(new Date("2031-01-01")), 0.11, 1e-9);
});

test("الراتب الصافي: مثال الصفحة = 12,281.25", () => {
  const r = ksaNetSalary({ basic: 10000, housing: 2500, transport: 1000, isSaudi: true });
  near(r.gross, 13500);
  near(r.gosi.employeeAmount, 1218.75);
  near(r.net, 12281.25);
});

test("العمل الإضافي: مثال الصفحة (6000، 20 ساعة عادية = 625)", () => {
  const o = uaeOvertime({ basicSalary: 6000, hours: 20, type: "day" });
  near(o.hourlyWage, 25);
  near(o.pay, 625);
  near(uaeOvertime({ basicSalary: 7500, hours: 2, type: "night" }).pay, 93.75);
});

test("الإجازة في الإمارات: 34 شهراً = 85 يوماً، والبدل 10,500", () => {
  const a = uaeLeaveAccrued({ years: 2, months: 10, days: 0 });
  near(a.accruedDays, 85);
  near(uaeLeaveEncashment({ basicSalary: 7000, unusedDays: 45 }).amount, 10500);
  assert.equal(uaeLeaveAccrued({ years: 0, months: 5 }).accruedDays, 0);
  assert.equal(uaeLeaveAccrued({ years: 0, months: 8 }).accruedDays, 16);
});

test("الإجازة في السعودية: 6 سنوات، 8 أشهر، 5 أيام مستخدمة = 4,000", () => {
  const l = ksaLeave({ wage: 8000, yearsOfService: 6, usedDays: 5, monthsInCurrentYear: 8 });
  assert.equal(l.entitlement, 30);
  near(l.remaining, 15);
  near(l.amount, 4000);
  assert.equal(ksaLeave({ wage: 8000, yearsOfService: 2, monthsInCurrentYear: 12 }).entitlement, 21);
});

test("القرض: 150,000 بفائدة 6.5% متناقصة على 48 شهراً", () => {
  const l = loanInstallment({ principal: 150000, annualRatePct: 6.5, months: 48 });
  near(l.installment, 3557.42, 0.5);
  near(l.totalInterest, 20756, 30);
  const flat = loanInstallment({ principal: 120000, annualRatePct: 4, months: 48, method: "flat" });
  near(flat.installment, 2900);
  const zero = loanInstallment({ principal: 12000, annualRatePct: 0, months: 12 });
  near(zero.installment, 1000);
});

test("القرض السعودي: 100,000 بمعدل 7% على 60 شهراً ≈ 1,980", () => {
  near(loanInstallment({ principal: 100000, annualRatePct: 7, months: 60 }).installment, 1980.1, 0.5);
});

test("قواعد المصرف المركزي الإماراتي وساما", () => {
  const c = uaePersonalLoanCheck({ principal: 150000, months: 48, salary: 12000, installment: 3557 });
  assert.equal(c.maxAmount, 240000);
  assert.equal(c.amountOk && c.monthsOk && c.dbrOk, true);
  assert.equal(uaePersonalLoanCheck({ principal: 300000, months: 60, salary: 12000, installment: 6000 }).amountOk, false);
  const k = ksaFinanceCheck({ installment: 1980, salary: 9000 });
  assert.equal(k.ok, true);
  near(k.maxInstallment, 2970);
  assert.equal(ksaFinanceCheck({ installment: 2500, salary: 9000, retiree: true }).ok, false);
});

test("نسب التمويل العقاري", () => {
  assert.equal(uaeMortgageLtv({ price: 1500000, buyerType: "expat" }), 0.8);
  assert.equal(uaeMortgageLtv({ price: 6000000, buyerType: "expat" }), 0.65);
  assert.equal(uaeMortgageLtv({ price: 6000000, buyerType: "national" }), 0.7);
  assert.equal(uaeMortgageLtv({ price: 1000000, buyerType: "expat", purpose: "second" }), 0.6);
  assert.equal(uaeMortgageLtv({ price: 1000000, offplan: true }), 0.5);
});

test("رسوم شراء عقار في دبي: مثال الصفحة (1.5 مليون)", () => {
  const c = dubaiPurchaseCosts({ price: 1500000, buyerType: "expat", purpose: "first", annualRatePct: 4.5, years: 25, bankFeePct: 1 });
  near(c.downPayment, 300000);
  near(c.transferFee, 60000);
  near(c.trusteeFee, 4200);
  near(c.mortgageReg, 3290);
  near(c.agent, 31500);
  near(c.fees, 114590);
  near(c.cashNeeded, 414590);
  near(c.installment, 6670, 2);
});

test("ILOE: 12,000 → الفئة الأولى، 7,200 شهرياً، 21,600 لثلاثة أشهر", () => {
  const r = iloe({ basicSalary: 12000 });
  assert.equal(r.category, "A");
  assert.equal(r.premium, 5);
  near(r.monthly, 7200);
  near(r.total, 21600);
  const b = iloe({ basicSalary: 40000 });
  assert.equal(b.category, "B");
  assert.equal(b.capped, true);
  near(b.monthly, 20000);
});

test("ضريبة القيمة المضافة", () => {
  const add = vat({ amount: 1000, ratePct: 15, mode: "add" });
  near(add.tax, 150);
  near(add.gross, 1150);
  const ex = vat({ amount: 2300, ratePct: 15, mode: "extract" });
  near(ex.net, 2000);
  near(ex.tax, 300);
});

test("العمر والتاريخ الهجري", () => {
  const a = ageCalc({ birth: "1998-05-20", asOf: "2026-11-01" });
  assert.deepEqual([a.years, a.months, a.days], [28, 5, 12]);
  const h = hijriParts(new Date("2026-11-01"));
  if (h) {
    assert.equal(h.year, 1448);
    assert.ok(h.month >= 1 && h.month <= 12);
  }
});

import { qatarGratuity, kuwaitIndemnity, omanGratuity, bahrainGratuity } from "../src/assets/calc.js";

test("قطر: 21 يوماً من الأساسي الأخير، سنة على الأقل، بلا سقف", () => {
  near(qatarGratuity({ basicSalary: 10000, years: 3.5 }).total, 24500);
  near(qatarGratuity({ basicSalary: 10000, years: 12 }).total, 84000);
  assert.equal(qatarGratuity({ basicSalary: 10000, years: 0.9 }).total, 0);
  assert.equal(qatarGratuity({ basicSalary: 10000, years: 5, forfeited: true }).total, 0);
});

test("الكويت: 15 يوماً (÷26) ثم شهر، سقف 18 شهراً، ونسب الاستقالة", () => {
  near(kuwaitIndemnity({ wage: 10000, years: 3.5 }).total, 20192.31);
  near(kuwaitIndemnity({ wage: 10000, years: 3.5, reason: "resignation" }).total, 10096.15);
  near(kuwaitIndemnity({ wage: 10000, years: 3.5, divisor: 30 }).total, 17500);
  near(kuwaitIndemnity({ wage: 10000, years: 12 }).total, 98846.15);
  const capped = kuwaitIndemnity({ wage: 10000, years: 25 });
  assert.equal(capped.capped, true);
  near(capped.total, 180000);
  assert.equal(kuwaitIndemnity({ wage: 10000, years: 2.9, reason: "resignation" }).total, 0);
  near(kuwaitIndemnity({ wage: 10000, years: 5, reason: "resignation" }).fraction, 0.667, 0.001);
  near(kuwaitIndemnity({ wage: 10000, years: 10, reason: "resignation" }).fraction, 1);
  assert.equal(kuwaitIndemnity({ wage: 10000, years: 8, reason: "forfeit" }).total, 0);
});

test("عُمان: المدة قبل 31/7/2023 بالقانون السابق وبعدها بشهر", () => {
  const a = omanGratuity({ basicSalary: 10000, start: "2023-01-31", end: "2026-07-30" });
  near(a.preYears, 0.5);
  near(a.postYears, 3);
  near(a.total, 32500);
  near(a.literalTotal, 35000);
  const b = omanGratuity({ basicSalary: 10000, start: "2014-07-31", end: "2026-07-30" });
  near(b.preYears, 9);
  near(b.total, 105000);
  near(b.literalTotal, 120000);
  const c = omanGratuity({ basicSalary: 1000, start: "2024-01-01", end: "2025-12-31" });
  near(c.preYears, 0);
  near(c.total, 2000);
});

test("البحرين: نصف شهر لأول 3 سنوات ثم شهر، وتقسيم صاحب العمل/الهيئة", () => {
  const a = bahrainGratuity({ wage: 10000, start: "2022-09-01", end: "2026-02-28" });
  near(a.years, 3.5);
  near(a.total, 20000);
  near(a.employerAmount, 7500);
  near(a.sioAmount, 12500);
  const b = bahrainGratuity({ wage: 10000, start: "2014-03-01", end: "2026-02-28" });
  near(b.total, 105000);
  near(b.employerAmount, 85000);
  near(b.sioAmount, 20000);
});
