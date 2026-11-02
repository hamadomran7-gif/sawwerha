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

import { uaeSickLeave, uaeMaternity, uaeNoticePay, uaeProbationNotice, ksaSickLeave, ksaArt77, ksaNotice, ksaOvertime } from "../src/assets/calc.js";

test("الإمارات: الإجازة المرضية 15 كامل ثم 30 نصف ثم 45 بلا أجر، ولا أجر في التجربة", () => {
  near(uaeSickLeave({ wage: 12000, days: 20 }).paid, 7000);
  near(uaeSickLeave({ wage: 12000, days: 60 }).paid, 12000);
  near(uaeSickLeave({ wage: 12000, days: 60 }).deduction, 12000);
  assert.equal(uaeSickLeave({ wage: 12000, days: 5, probation: true }).paid, 0);
  assert.equal(uaeSickLeave({ wage: 12000, days: 100 }).exceeded, true);
});

test("الإمارات: إجازة الوضع 45 كامل + 15 نصف، والطفل المريض 30 كاملة", () => {
  const m = uaeMaternity({ wage: 9000 });
  near(m.paid, 15750);
  near(m.deduction, 2250);
  const c = uaeMaternity({ wage: 9000, sickChild: true });
  near(c.child, 9000);
  near(c.paid, 24750);
});

test("الإمارات: بدل الإنذار على الأجر الشامل عن المهلة أو باقيها", () => {
  near(uaeNoticePay({ wage: 15000, noticeDays: 60 }).amount, 30000);
  near(uaeNoticePay({ wage: 15000, noticeDays: 60, servedDays: 20 }).amount, 20000);
  assert.equal(uaeNoticePay({ wage: 15000, noticeDays: 120 }).noticeDays, 90);
  near(uaeProbationNotice({ wage: 15000, who: "employer" }).amount, 7000);
  near(uaeProbationNotice({ wage: 15000, who: "to_uae_employer" }).amount, 15000);
});

test("السعودية: الإجازة المرضية 30 كامل ثم 60 بثلاثة أرباع ثم 30 بلا أجر", () => {
  near(ksaSickLeave({ wage: 9000, days: 45 }).paid, 12375);
  near(ksaSickLeave({ wage: 9000, days: 120 }).paid, 22500);
});

test("السعودية: تعويض المادة 77 بحد أدنى أجر شهرين", () => {
  const a = ksaArt77({ wage: 10000, type: "indefinite", years: 3.5 });
  near(a.base, 17500);
  near(a.total, 20000);
  assert.equal(a.minimumApplied, true);
  near(ksaArt77({ wage: 10000, type: "indefinite", years: 12 }).total, 60000);
  near(ksaArt77({ wage: 10000, type: "fixed", remainingDays: 210 }).total, 70000);
  near(ksaArt77({ wage: 10000, type: "fixed", remainingDays: 30 }).total, 20000);
});

test("السعودية: مهلة الإشعار 60/30 للأجر الشهري والتعويض عن غير المراعى", () => {
  near(ksaNotice({ wage: 12000, who: "employer" }).amount, 24000);
  near(ksaNotice({ wage: 12000, who: "employer", givenDays: 20 }).amount, 16000);
  near(ksaNotice({ wage: 12000, who: "worker" }).amount, 12000);
  assert.equal(ksaNotice({ wage: 12000, monthly: false, who: "employer" }).requiredDays, 30);
});

test("السعودية: الأجر الإضافي = أجر الساعة الفعلي + 50% من الأساسي", () => {
  const a = ksaOvertime({ basic: 4000, actual: 6000, hours: 3 });
  near(a.rate, 33.33);
  near(a.total, 100, 0.02);
  const b = ksaOvertime({ basic: 10000, actual: 14000, hours: 20 });
  near(b.rate, 79.17);
  near(b.total, 1583.33);
  near(b.compLeaveHours, 30);
});

import { uaeRamadanOvertime, ksaMaternityPlan } from "../src/assets/calc.js";

test("الإمارات: رمضان — ساعتان زائدتان يومياً على الساعات المخفضة", () => {
  const a = uaeRamadanOvertime({ basic: 6000, normalHours: 8, workedHours: 8, days: 22 });
  assert.equal(a.reducedHours, 6);
  near(a.perDay, 62.5);
  near(a.total, 1375);
  near(uaeRamadanOvertime({ basic: 6000, normalHours: 8, workedHours: 8, days: 22, night: true }).total, 1650);
  near(uaeRamadanOvertime({ basic: 6000, normalHours: 8, workedHours: 8, days: 22, divisor: 6 }).total, 1833.33, 0.05);
  assert.equal(uaeRamadanOvertime({ basic: 6000, workedHours: 6, days: 22 }).total, 0);
});

test("السعودية: خطة إجازة الوضع 12 أسبوعاً", () => {
  const p = ksaMaternityPlan({ due: "2026-06-01", start: "2026-05-04", wage: 9000 });
  assert.equal(p.earliest, "2026-05-04");
  assert.equal(p.preDays, 28);
  assert.equal(p.postDays, 56);
  assert.equal(p.lastPaid, "2026-07-26");
  assert.equal(p.back, "2026-07-27");
  assert.equal(p.mandatoryUntil, "2026-07-12");
  assert.equal(p.extendedBack, "2026-08-27");
  near(p.paid, 25200);
  const e = ksaMaternityPlan({ due: "2026-06-01", start: "2026-04-01" });
  assert.equal(e.tooEarly, true);
  assert.equal(e.start, "2026-05-04");
});

import { hijriToGregorian, hijriMonthLength, dateDiff } from "../src/assets/calc.js";

test("التحويل الهجري ↔ الميلادي (أم القرى)", () => {
  assert.equal(hijriToGregorian({ year: 1447, month: 9, day: 1 }), "2026-02-18");
  assert.equal(hijriToGregorian({ year: 1446, month: 1, day: 1 }), "2024-07-07");
  const h = hijriParts(new Date(Date.UTC(2026, 10, 2)));
  assert.deepEqual(h, { year: 1448, month: 5, day: 22 });
  assert.equal(hijriToGregorian({ year: h.year, month: h.month, day: h.day }), "2026-11-02");
  assert.ok([29, 30].includes(hijriMonthLength(1447, 9)));
  assert.equal(hijriToGregorian({ year: 1447, month: 13, day: 1 }), null);
});

test("الفرق بين تاريخين وأيام العمل", () => {
  const d = dateDiff({ start: "2026-11-01", end: "2026-12-01", weekend: "fri-sat" });
  assert.equal(d.total, 30);
  assert.equal(d.months, 1);
  assert.equal(d.workDays, 22);
  const inc = dateDiff({ start: "2026-11-01", end: "2026-11-30", inclusive: true, weekend: "sat-sun" });
  assert.equal(inc.total, 30);
  assert.equal(inc.workDays, 21);
  assert.equal(dateDiff({ start: "2026-12-01", end: "2026-11-01" }).sign, -1);
});

import { ksaPension, ksaSaned, uaePension } from "../src/assets/calc.js";

test("السعودية: أسباب الانتهاء الجديدة في حاسبة المكافأة", () => {
  assert.equal(ksaEndOfService({ wage: 10000, years: 4, reason: "probation" }).total, 0);
  near(ksaEndOfService({ wage: 10000, years: 4, reason: "article_81" }).total, 20000);
  near(ksaEndOfService({ wage: 10000, years: 4, reason: "mutual" }).total, 20000);
  const w = ksaEndOfService({ wage: 10000, years: 4, reason: "worker_notice" });
  near(w.total, 6666.67);
  assert.equal(w.disputed, true);
  assert.equal(ksaEndOfService({ wage: 10000, years: 12, reason: "worker_notice" }).disputed, false);
});

test("السعودية: معاش النظام القديم والفئة الانتقالية", () => {
  // غير مشمول بالتعديلات: عمره 50 في 2024 ومدته 300 شهر عند التقاعد
  const a = ksaPension({ system: "legacy", birth: "1974-01-01", start: "2000-01-01", end: "2025-01-01", avgWage: 10000 });
  assert.equal(a.transitional, false);
  assert.equal(a.months, 300);
  assert.equal(a.status, "early");
  near(a.pension, 6250);
  const low = ksaPension({ system: "legacy", birth: "1960-01-01", start: "2008-01-01", end: "2018-06-01", avgWage: 3000 });
  assert.equal(low.status, "normal");
  near(low.pension, 1983.75);
  // انتقالي: عمره 35.5 ومدته 10 سنوات في 3/7/2024
  const t = ksaPension({ system: "legacy", birth: "1989-01-03", start: "2014-07-03", end: "2030-01-01", avgWage: 10000 });
  assert.equal(t.transitional, true);
  assert.equal(t.earlyMonthsNeeded, 360);
  assert.equal(t.normalDate, "2051-09-03");
  assert.equal(t.status, "none");
});

test("السعودية: معاش النظام الجديد والمبكر بالخصم", () => {
  const n = ksaPension({ system: "new", birth: "1965-01-01", start: "2005-01-01", end: "2030-01-01", avgWage: 10000 });
  assert.equal(n.status, "normal");
  near(n.pension, 5625);
  const e = ksaPension({ system: "new", birth: "1972-01-01", start: "1995-01-01", end: "2030-01-01", avgWage: 10000 });
  assert.equal(e.status, "early");
  assert.equal(e.months, 420);
  near(e.reduction, 0.15);
  near(e.pension, 6693.75);
  const e2 = ksaPension({ system: "new", birth: "1975-01-01", start: "2000-01-01", end: "2030-01-01", avgWage: 10000 });
  near(e2.pension, 4725);
});

test("السعودية: ساند", () => {
  near(ksaSaned({ avgWage: 8000, months: 12 }).total, 50400);
  near(ksaSaned({ avgWage: 20000, months: 12 }).total, 94500);
});

test("الإمارات: معاش القانون الجديد والقديم ومكافأة عدم الاستحقاق", () => {
  const a = uaePension({ birth: "1998-01-01", firstReg: "2023-11-01", end: "2053-10-31", avgSalary: 17500 });
  assert.equal(a.law, "new");
  assert.equal(a.status, "early");
  near(a.years, 30);
  near(a.pension, 14017.5);
  const b = uaePension({ birth: "1978-01-01", firstReg: "2023-11-01", end: "2038-10-31", avgSalary: 18000 });
  assert.equal(b.status, "normal");
  near(b.pension, 10000);
  near(b.topUp, 2791, 0.01);
  const c = uaePension({ birth: "1990-01-01", firstReg: "2023-11-01", end: "2035-10-31", avgSalary: 15000 });
  assert.equal(c.status, "none");
  near(c.gratuity, 352500);
  const d = uaePension({ birth: "1975-06-01", firstReg: "2006-01-01", end: "2025-12-31", avgSalary: 20000 });
  assert.equal(d.law, "legacy");
  assert.equal(d.status, "early");
  near(d.pension, 14000);
});

import { gccLeaveBalance, gccLeaveEncash, gccSickPay } from "../src/assets/calc.js";

test("إجازات قطر والكويت وعُمان والبحرين: البدل والمرضية", () => {
  near(gccLeaveEncash({ country: "qa", days: 20, basic: 10000, allowances: 4000 }).amount, 6666.67);
  near(gccLeaveEncash({ country: "kw", days: 20, basic: 8000, allowances: 2000 }).amount, 7692.31);
  near(gccLeaveEncash({ country: "kw", days: 20, basic: 8000, allowances: 2000, divisor: 30 }).amount, 6666.67);
  near(gccLeaveEncash({ country: "om", days: 20, basic: 6000, allowances: 4000 }).amount, 6666.67);
  near(gccLeaveEncash({ country: "om", days: 20, basic: 6000, allowances: 4000, timing: "inService" }).amount, 4000);
  near(gccLeaveEncash({ country: "bh", days: 20, basic: 9000, social: 1000, allowances: 3000 }).amount, 6666.67);
  near(gccSickPay({ country: "qa", days: 40, basic: 10000 }).paid, 9000);
  near(gccSickPay({ country: "kw", days: 40, basic: 10000 }).paid, 9583.33);
  const om = gccSickPay({ country: "om", days: 40, basic: 10000 });
  near(om.paid, 11333.33);
  near(om.employerShare, 2333.33);
  near(om.fundShare, 9000);
  near(gccSickPay({ country: "bh", days: 40, basic: 10000 }).paid, 8333.33);
  assert.equal(gccSickPay({ country: "qa", days: 10, basic: 10000, eligible: false }).paid, 0);
});

test("رصيد الإجازة السنوية: قطر 21 ثم 28، والكويت بعد 6 أشهر", () => {
  near(gccLeaveBalance({ country: "qa", start: "2020-01-01", end: "2025-12-31" }).accrued, 133);
  near(gccLeaveBalance({ country: "qa", start: "2022-07-01", end: "2025-12-31" }).accrued, 73.5);
  const q = gccLeaveBalance({ country: "qa", start: "2025-05-01", end: "2025-12-31" });
  assert.equal(q.alt, 0);
  near(q.accrued, 14);
  assert.equal(gccLeaveBalance({ country: "kw", start: "2025-08-01", end: "2025-12-31" }).accrued, 0);
  near(gccLeaveBalance({ country: "kw", start: "2025-05-01", end: "2025-12-31" }).accrued, 20);
  near(gccLeaveBalance({ country: "bh", start: "2025-06-01", end: "2025-12-31", taken: 5 }).balance, 12.5);
});
