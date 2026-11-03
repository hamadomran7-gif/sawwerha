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
  ksaWaterBill,
  nitaqatWeight,
  nitaqatPhaseAt,
  parseWageList,
  nitaqatSummary,
  bahrainPension,
  omanPension,
  omanOldAge,
  qatarPension,
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

import { zakatCalc } from "../src/assets/calc.js";

test("الزكاة: النصاب وربع العشر وتحويل العيارات", () => {
  const z = zakatCalc({ cash: 50000, g21: 97.14, price24: 400, priceSilver: 5, basis: "gold24" });
  near(z.goldPure, 85, 0.01);
  near(z.nisabGold24, 34000);
  near(z.total, 84000, 1);
  assert.equal(z.due, true);
  near(z.zakat, 2100, 0.1);
  const low = zakatCalc({ cash: 10000, price24: 400, priceSilver: 5 });
  near(low.nisab, 2975);
  assert.equal(low.due, true);
  near(low.zakat, 250);
  const no = zakatCalc({ cash: 10000, price24: 400, priceSilver: 5, basis: "gold24" });
  assert.equal(no.due, false);
  near(zakatCalc({ cash: 10000, price24: 400, basis: "gold21" }).nisab, 29750);
  near(zakatCalc({ cash: 50000, debts: 20000, deductDebts: true, price24: 400, basis: "gold21" }).zakat, 750);
  assert.equal(zakatCalc({ cash: 50000, debts: 20000, deductDebts: true, price24: 400, basis: "gold24" }).due, false);
});

import { probationEnd } from "../src/assets/calc.js";

test("نهاية فترة التجربة", () => {
  assert.equal(probationEnd({ country: "ae", start: "2026-01-15", months: 6 }).lastDay, "2026-07-14");
  assert.equal(probationEnd({ country: "ae", start: "2026-01-15", months: 9 }).capped, true);
  assert.equal(probationEnd({ country: "sa", start: "2026-01-01", days: 90 }).lastDay, "2026-03-31");
  assert.equal(probationEnd({ country: "sa", start: "2026-01-01", days: 90, excluded: 5 }).lastDay, "2026-04-05");
  assert.equal(probationEnd({ country: "sa", start: "2026-01-01", days: 200 }).capped, true);
});

import { ksaExpatFees, ksaExitReentryFee } from "../src/assets/calc.js";

test("رسوم المرافقين والعامل في السعودية", () => {
  assert.equal(ksaExpatFees({ dependents: 4, months: 12 }).dependentsFee, 19200);
  assert.equal(ksaExpatFees({ dependents: 4, months: 3 }).dependentsFee, 4800);
  const w = ksaExpatFees({ dependents: 4, months: 12, includeWorker: true, expatsExceed: true, iqamaFee: "reported" });
  near(w.worker.total, 10350);
  near(ksaExpatFees({ months: 3, includeWorker: true, expatsExceed: true, iqamaFee: "reported" }).worker.total, 2588);
  near(ksaExpatFees({ months: 12, includeWorker: true, expatsExceed: false }).worker.total, 9000);
});

test("رسوم الخروج والعودة", () => {
  assert.equal(ksaExitReentryFee({ type: "single", days: 60 }).perPerson, 200);
  assert.equal(ksaExitReentryFee({ type: "single", days: 61 }).perPerson, 300);
  assert.equal(ksaExitReentryFee({ type: "single", days: 120 }).perPerson, 400);
  assert.equal(ksaExitReentryFee({ type: "multiple", days: 180 }).perPerson, 1100);
  assert.equal(ksaExitReentryFee({ type: "multiple", days: 91 }).perPerson, 700);
  assert.equal(ksaExitReentryFee({ type: "single", days: 90, persons: 5 }).total, 1500);
  assert.equal(ksaExitReentryFee({ type: "multiple", days: 90, extendMonths: 2, outside: true }).extension, 800);
});

import { ksaMortgage, annuityFactor } from "../src/assets/calc.js";

test("عامل الخصم للتمويل العقاري", () => {
  near(annuityFactor(5, 300), 171.06, 0.001);
  near(annuityFactor(6.5, 300), 148.1027, 0.001);
  near(annuityFactor(6.5, 144), 99.8083, 0.001);
});

test("التمويل العقاري: مثال 1 — راتب 15,000 والحاكم نسبة التمويل", () => {
  const m = ksaMortgage({ salary: 15000, personal: 2000, price: 900000, apr: 5, years: 25, age: 35 });
  assert.equal(m.cap, 0.55);
  near(m.loanDbr, 1069125, 2);
  near(m.loanLtv, 810000);
  assert.equal(m.binding, "ltv");
  near(m.installment, 4735.18, 0.01);
  near(m.dbrAfter, 0.449, 0.001);
  near(m.downPayment, 90000);
  near(m.cashAtSigning, 95750);
  assert.equal(m.rett, 0);
  near(m.maxPrice, 1069125 / 0.9, 3);
});

test("التمويل العقاري: مثال 2 — دعم 150 ألفاً", () => {
  const m = ksaMortgage({ salary: 9000, personal: 1500, price: 650000, apr: 6.5, years: 25, age: 35, support: "dp150" });
  near(m.loanDbr, 510954, 2);
  near(m.loan, 500000);
  assert.equal(m.binding, "need");
  near(m.installment, 3376.04, 0.01);
  near(m.dbrAfter, 0.542, 0.001);
  near(m.downPayment, 0);
  const n = ksaMortgage({ salary: 9000, personal: 1500, price: 650000, apr: 6.5, years: 25, age: 35, support: "dp100" });
  near(n.loan, 510954, 2);
  assert.equal(n.binding, "dbr");
  near(n.downPayment, 39046, 2);
  const reg = ksaMortgage({ salary: 9000, personal: 1500, price: 650000, apr: 6.5, years: 25, age: 35, support: "profit", capMode: "regulatory" });
  assert.equal(reg.cap, 0.65);
});

test("التمويل العقاري: مثال 3 — متقاعد عمره 58", () => {
  const m = ksaMortgage({ salary: 12000, personal: 2500, retiree: true, price: 600000, apr: 6.5, years: 25, age: 58, maxAge: 70 });
  assert.equal(m.years, 12);
  assert.equal(m.limitedBy, "age");
  assert.ok(m.salaryCapOk);
  near(m.loanDbr, 409214, 2);
  assert.equal(m.binding, "dbr");
  near(m.downPayment, 190786, 2);
  const x = ksaMortgage({ salary: 12000, personal: 3500, retiree: true, price: 600000, age: 58 });
  assert.equal(x.salaryCapOk, false);
});

test("التمويل العقاري: الشرائح ونسب التمويل والضريبة", () => {
  assert.equal(ksaMortgage({ salary: 15000, price: 1e6 }).cap, 0.55);
  assert.equal(ksaMortgage({ salary: 15001, price: 1e6 }).cap, 0.65);
  assert.equal(ksaMortgage({ salary: 30000, price: 1e6 }).cap, 0.65);
  assert.equal(ksaMortgage({ salary: 30000, price: 1e6, capMode: "high70" }).cap, 0.7);
  assert.equal(ksaMortgage({ salary: 20000, price: 1e6, firstHome: false }).ltv, 0.7);
  assert.equal(ksaMortgage({ salary: 20000, price: 1e6, firstHome: false, lender: "financeCo" }).ltv, 0.85);
  assert.equal(ksaMortgage({ salary: 20000, price: 1e6, citizen: false }).ltv, 0.7);
  assert.equal(ksaMortgage({ salary: 20000, price: 700000, redfReduced: true }).ltv, 0.95);
  assert.equal(ksaMortgage({ salary: 20000, price: 900000, redfReduced: true }).ltv, 0.9);
  near(ksaMortgage({ salary: 40000, price: 1500000 }).rett, 25000);
  near(ksaMortgage({ salary: 40000, price: 1500000, firstHome: false }).rett, 75000);
  near(ksaMortgage({ salary: 40000, price: 1500000 }).adminFee, 5000);
});

import { ksaSpecialLeave, addHijriMonths } from "../src/assets/calc.js";

test("الإجازات الخاصة في السعودية", () => {
  const m = ksaSpecialLeave({ type: "marriage", date: "2026-11-01" });
  assert.equal(m.days, 5);
  assert.equal(m.end, "2026-11-05");
  assert.equal(m.back, "2026-11-06");
  assert.equal(ksaSpecialLeave({ type: "sibling", date: "2026-11-01" }).end, "2026-11-03");
  const p = ksaSpecialLeave({ type: "paternity", date: "2026-11-01", start: "2026-11-05" });
  assert.equal(p.end, "2026-11-07");
  assert.equal(p.withinWindow, true);
  assert.equal(ksaSpecialLeave({ type: "paternity", date: "2026-11-01", start: "2026-11-06" }).withinWindow, false);
  assert.equal(ksaSpecialLeave({ type: "paternity", date: "2026-11-01", start: "2026-11-09" }).lateStart, true);
  const h = ksaSpecialLeave({ type: "hajj", date: "2027-05-10", hajjDays: 20, years: 1 });
  assert.equal(h.days, 15);
  assert.equal(h.eligible, false);
  const i = ksaSpecialLeave({ type: "iddah", date: "2026-06-16" });
  assert.ok(i.days >= 127 && i.days <= 130, String(i.days));
  assert.equal(i.gBack, "2026-10-26");
  assert.equal(ksaSpecialLeave({ type: "iddahNonMuslim", date: "2026-11-01" }).end, "2026-11-15");
});

test("إضافة أشهر هجرية", () => {
  const d = addHijriMonths("2026-06-16", 4);
  assert.ok(d > "2026-10-10" && d < "2026-10-16", d);
});

import { uaeSpecialLeave, addWorkingDays } from "../src/assets/calc.js";

test("أيام العمل والإجازات الخاصة في الإمارات", () => {
  // 2026-11-02 اثنين
  const w = addWorkingDays("2026-11-02", 5, "sat-sun");
  assert.equal(w.first, "2026-11-02");
  assert.equal(w.last, "2026-11-06");
  assert.equal(w.back, "2026-11-09");
  const w2 = addWorkingDays("2026-11-07", 1, "sat-sun"); // سبت
  assert.equal(w2.first, "2026-11-09");
  assert.equal(addWorkingDays("2026-11-05", 5, "fri-sat").last, "2026-11-11");
  const s = uaeSpecialLeave({ type: "spouse", date: "2026-11-01" });
  assert.equal(s.end, "2026-11-05");
  assert.equal(uaeSpecialLeave({ type: "relative", date: "2026-11-01" }).back, "2026-11-04");
  const p = uaeSpecialLeave({ type: "parental", date: "2026-05-10", start: "2026-11-05" });
  assert.equal(p.deadline, "2026-11-09");
  assert.equal(p.withinWindow, false);
  assert.equal(uaeSpecialLeave({ type: "parental", date: "2026-05-10", start: "2026-06-01" }).withinWindow, true);
  assert.equal(uaeSpecialLeave({ type: "study", date: "2026-12-01", years: 1 }).eligible, false);
  assert.equal(uaeSpecialLeave({ type: "study", date: "2026-12-01", years: 3 }).calendarDays, 14);
});

import { workHours } from "../src/assets/calc.js";

test("ساعات العمل والساعات الإضافية", () => {
  const a = workHours({ country: "sa", start: "08:00", end: "17:00", breakMin: 60, days: 5 });
  assert.equal(a.workMin, 480);
  assert.equal(a.weeklyMin, 2400);
  assert.equal(a.otDailyStdMin, 0);
  const b = workHours({ country: "sa", start: "08:00", end: "18:00", breakMin: 60, days: 5 });
  assert.equal(b.otDailyStdMin, 300);
  assert.equal(b.otWeeklyStdMin, 0);
  const c = workHours({ country: "sa", start: "09:00", end: "17:00", breakMin: 30, days: 6, ramadan: true });
  assert.equal(c.dailyMaxMin, 360);
  assert.equal(c.otWeeklyStdMin, 450 * 6 - 36 * 60);
  const n = workHours({ country: "ae", start: "22:00", end: "07:00", breakMin: 60, days: 6 });
  assert.equal(n.presenceMin, 540);
  assert.equal(n.otWeeklyStdMin, 0);
  assert.equal(workHours({ country: "ae", start: "09:00", end: "17:00", breakMin: 60, days: 5, ramadan: true }).otPerDayMin, 60);
});

import { uaeFinalSettlement, ksaFinalSettlement } from "../src/assets/calc.js";

test("المستحقات النهائية في الإمارات", () => {
  // 7 سنوات تماماً: 2019-03-01 إلى 2026-02-28
  const s = uaeFinalSettlement({ basic: 8000, gross: 12000, start: "2019-03-01", end: "2026-02-28", leaveDays: 10, endedBy: "employer", noticeDays: 30, servedDays: 10, salaryDays: 15, other: 500, deductions: 1000 });
  near(s.gratuity.total, 44000, 1);
  near(s.leave.amount, 2666.67, 0.01);
  near(s.notice, 8000);
  near(s.salary, 6000);
  near(s.total, 44000 + 2666.67 + 8000 + 6000 + 500 - 1000, 1);
  const r = uaeFinalSettlement({ basic: 8000, gross: 12000, start: "2019-03-01", end: "2026-02-28", endedBy: "employee", noticeDays: 30, servedDays: 0 });
  near(r.notice, -12000);
});

test("المستحقات النهائية في السعودية", () => {
  const s = ksaFinalSettlement({ wage: 9000, start: "2018-03-01", end: "2026-02-28", reason: "contract_end", leaveDays: 21, noticeCase: "employer", givenDays: 30, salaryDays: 10 });
  near(s.eos.total, 49500, 1);
  near(s.leave.amount, 6300);
  near(s.notice, 9000);
  near(s.salary, 3000);
  near(s.total, 49500 + 6300 + 9000 + 3000, 1);
  const w = ksaFinalSettlement({ wage: 9000, start: "2018-03-01", end: "2026-02-28", reason: "worker_notice", noticeCase: "worker", givenDays: 0 });
  near(w.notice, -9000);
  near(w.eos.total, 33000, 1);
});

import { ksaDomesticSettlement, uaeDomesticSettlement, uaeDomesticLeaveAccrued, uaeRecruitmentRefund } from "../src/assets/calc.js";

test("العمالة المنزلية في السعودية", () => {
  // 3 سنوات و4 أشهر
  const a = ksaDomesticSettlement({ wage: 1500, start: "2023-01-01", end: "2026-04-30", reason: "employer_unlawful", leaveDays: 30 });
  assert.equal(a.eos, 0);
  near(a.comp, 3000);
  near(a.leave, 1500);
  near(a.total, 4500);
  const p = ksaDomesticSettlement({ wage: 1500, start: "2023-01-01", end: "2026-04-30", mode: "prorata", reason: "employer_unlawful", leaveDays: 30 });
  near(p.eos, 1250, 1);
  const b = ksaDomesticSettlement({ wage: 2000, start: "2017-05-01", end: "2026-04-30" });
  near(b.eos, 4000);
  near(ksaDomesticSettlement({ wage: 2000, start: "2017-05-01", end: "2026-04-30", mode: "prorata" }).eos, 4500, 1);
  near(ksaDomesticSettlement({ wage: 1500, start: "2023-01-01", end: "2026-04-30", reason: "worker_noreason" }).comp, -3000);
  assert.equal(ksaDomesticSettlement({ wage: 1500, start: "2017-01-01", end: "2026-04-30", reason: "art26" }).eos, 0);
});

test("عمال الخدمة المساعدة في الإمارات", () => {
  const a = uaeDomesticSettlement({ basic: 1500, start: "2023-01-01", end: "2026-04-30", leaveDays: 10 });
  near(a.gratuity, 2333.33, 0.5);
  near(a.leave, 500);
  assert.equal(uaeDomesticSettlement({ basic: 1500, start: "2023-01-01", end: "2026-04-30", absence: true }).gratuity, 0);
  assert.equal(uaeDomesticSettlement({ basic: 1500, start: "2026-01-01", end: "2026-10-31" }).eligible, false);
  assert.equal(uaeDomesticLeaveAccrued(5), 0);
  assert.equal(uaeDomesticLeaveAccrued(9), 18);
  assert.equal(uaeDomesticLeaveAccrued(14), 35);
  near(uaeRecruitmentRefund({ cost: 12000, contractMonths: 24, monthsWorked: 4 }).refund, 10000);
  near(uaeRecruitmentRefund({ cost: 12000, contractMonths: 24, monthsWorked: 0.5 }).refund, 12000);
});

import { kuwaitPension, kuwaitGratuityTiers } from "../src/assets/calc.js";

test("معاش التقاعد في الكويت", () => {
  const e1 = kuwaitPension({ gender: "m", age: 55, serviceYears: 25, base: 2000, married: true, children: 2 });
  near(e1.basic, 1275);
  assert.equal(e1.toppedUp, false);
  near(e1.remuneration, 27000);
  const e2 = kuwaitPension({ gender: "f", age: 50, serviceYears: 20, base: 1000 });
  near(e2.basic, 750);
  assert.equal(e2.final, 1010);
  near(e2.remuneration, 18000);
  near(kuwaitPension({ gender: "f", age: 47, serviceYears: 20, base: 1000 }).basic, 637.5);
  const e3 = kuwaitPension({ gender: "m", age: 52, serviceYears: 26, serviceMonths: 6, base: 1400, married: true });
  near(e3.pct, 0.88, 0.0001);
  near(e3.basic, 1047.2, 0.01);
  assert.equal(e3.reductionType, "permanent");
  near(e3.remuneration, 25200);
  const b3 = kuwaitPension({ gender: "m", age: 52, serviceYears: 31, base: 1400, married: true });
  near(b3.basic, 1250.2, 0.01);
  assert.equal(b3.reductionType, "temporary");
  near(b3.excessLump.total, 1680);
  const c3 = kuwaitPension({ gender: "m", age: 52, serviceYears: 35, base: 1400 });
  near(c3.basic, 1330);
  near(c3.excessLump.total, 8400);
  near(kuwaitGratuityTiers(1200, 12).total, 20160);
  assert.equal(kuwaitPension({ gender: "m", age: 38, serviceYears: 12, base: 1200 }).status, "none");
  assert.equal(kuwaitPension({ gender: "m", age: 45, serviceYears: 20, base: 1200 }).status, "too_young");
});

import { ksaSocialSecurity } from "../src/assets/calc.js";

test("الضمان الاجتماعي المطور", () => {
  const a = ksaSocialSecurity({ dependents: 4, earned: 2000 });
  assert.equal(a.minimum, 3960);
  near(a.counted, 1000);
  near(a.capFinal, 2960);
  near(ksaSocialSecurity({ dependents: 4, earned: 2000, citizenAccount: 1500, countCitizenAccount: true }).capFinal, 1460);
  near(ksaSocialSecurity({ dependents: 0, earned: 1800, unearned: 300 }).capFinal, 120);
  const c = ksaSocialSecurity({ dependents: 8, earned: 3000 });
  near(c.capFinal, 5000);
  near(c.capMinimum, 3500);
  assert.equal(c.capMatters, true);
  assert.equal(ksaSocialSecurity({ dependents: 0, earned: 2640 }).eligible, false);
});

import { ksaCivilPension, ksaMilitaryPension } from "../src/assets/calc.js";

test("التقاعد المدني والعسكري في السعودية", () => {
  const e1 = ksaCivilPension({ lastBasic: 12000, months: 304, reason: "resign" });
  assert.equal(e1.status, "pension");
  near(e1.pension, 7600);
  assert.equal(ksaCivilPension({ lastBasic: 12000, months: 304, reason: "resign", transitional: true, monthsAt2024: 230 }).status, "pension");
  const t = ksaCivilPension({ lastBasic: 12000, months: 304, reason: "resign", transitional: true, monthsAt2024: 200 });
  assert.equal(t.anyExitRequired, 336);
  assert.equal(t.status, "deferred");
  const e2 = ksaCivilPension({ lastBasic: 10000, months: 240, reason: "early" });
  assert.equal(e2.status, "pension_conditional");
  near(e2.pension, 5000);
  assert.equal(ksaCivilPension({ lastBasic: 10000, months: 240, reason: "resign" }).status, "deferred");
  near(ksaCivilPension({ lastBasic: 15000, months: 420, reason: "age" }).pension, 13125);
  near(ksaCivilPension({ lastBasic: 15000, months: 504, reason: "age" }).pension, 15000);
  const e4 = ksaCivilPension({ lastBasic: 9000, months: 96, reason: "resign" });
  assert.equal(e4.status, "notional");
  near(e4.lump, 86400);
  near(e4.buyCost, 38880);
  near(e4.pensionAfterBuy, 2250);
  near(ksaCivilPension({ lastBasic: 9000, months: 96, reason: "abolished" }).lump, 120960);
  assert.equal(ksaCivilPension({ lastBasic: 9000, months: 200, reason: "abolished" }).status, "pension");
  assert.equal(ksaCivilPension({ lastBasic: 9000, months: 40, reason: "resign" }).status, "lump");
  const mil = ksaMilitaryPension({ lastSalary: 7744, months: 300 });
  near(mil.pension, 5531.43, 0.01);
  assert.equal(mil.eligible, true);
  assert.equal(ksaMilitaryPension({ lastSalary: 7744, months: 120 }).eligible, false);
  near(ksaMilitaryPension({ lastSalary: 15000, months: 420 }).pension, 15000);
});


test("الراتب الصافي: السكن العيني يدخل الوعاء لا الراتب النقدي", () => {
  const r = ksaNetSalary({ basic: 12000, inKindHousing: 2000, transport: 1000, isSaudi: true, asOf: new Date("2026-11-03") });
  near(r.gosi.base, 14000);
  near(r.gross, 13000);
  near(r.net, 13000 - 14000 * 0.0975);
});

import { uaeCorporateTax, dubaiRentIncrease } from "../src/assets/calc.js";

test("ضريبة الشركات في الإمارات", () => {
  near(uaeCorporateTax({ taxableIncome: 1000000, revenue: 5000000 }).tax, 56250);
  const s = uaeCorporateTax({ taxableIncome: 600000, revenue: 2500000 });
  assert.equal(s.status, "sbr");
  near(s.tax, 0);
  near(s.taxWithoutSbr, 20250);
  near(uaeCorporateTax({ taxableIncome: 600000, revenue: 2500000, electSbr: false }).tax, 20250);
  near(uaeCorporateTax({ taxableIncome: 600000, revenue: 2500000, periodEndYear: 2030 }).tax, 20250);
  near(uaeCorporateTax({ taxableIncome: 600000, revenue: 2500000, mne: true }).tax, 20250);
  const l = uaeCorporateTax({ taxableIncome: 1000000, revenue: 5000000, losses: 500000 });
  near(l.lossUsed, 500000);
  near(l.tax, 11250);
  const l2 = uaeCorporateTax({ taxableIncome: 1000000, revenue: 5000000, losses: 900000 });
  near(l2.lossUsed, 750000);
  near(l2.lossLeft, 150000);
  near(l2.tax, 0);
  assert.equal(uaeCorporateTax({ taxableIncome: 400000, revenue: 800000, person: "individual" }).status, "outOfScope");
  near(uaeCorporateTax({ taxableIncome: 400000, revenue: 4000000, person: "individual" }).tax, 2250);
});

test("زيادة الإيجار في دبي (المرسوم 43/2013)", () => {
  const a = dubaiRentIncrease({ rent: 80000, average: 100000 });
  near(a.pct, 0.05);
  near(a.maxRent, 84000);
  near(dubaiRentIncrease({ rent: 95000, average: 100000 }).pct, 0);
  near(dubaiRentIncrease({ rent: 90000, average: 100000 }).pct, 0);
  near(dubaiRentIncrease({ rent: 75000, average: 100000 }).maxRent, 82500);
  near(dubaiRentIncrease({ rent: 65000, average: 100000 }).maxRent, 74750);
  near(dubaiRentIncrease({ rent: 55000, average: 100000 }).maxRent, 66000);
  near(dubaiRentIncrease({ rent: 110000, average: 100000 }).pct, 0);
});

import { ksaElectricityBill } from "../src/assets/calc.js";

test("فاتورة الكهرباء السعودية بتعرفة 2027", () => {
  const a = ksaElectricityBill({ kwh: 1000, amps: 60 });
  near(a.consumption, 210);
  near(a.fixed, 70);
  near(a.subtotal, 280);
  near(a.total, 322);
  const b = ksaElectricityBill({ kwh: 7000, amps: 150 });
  near(b.consumption, 1590);
  near(b.fixed, 80);
  near(b.total, 1920.5);
  near(ksaElectricityBill({ kwh: 1000, amps: 300 }).fixed, 100);
  near(ksaElectricityBill({ kwh: 1000, amps: 60, days: 15 }).fixed, 35);
  const old = ksaElectricityBill({ kwh: 1000, tariff: "old" });
  near(old.consumption, 180);
  near(old.fixed, 0);
  near(ksaElectricityBill({ kwh: 7000, sector: "commercial", fixedOverride: 0 }).consumption, 1850);
  near(ksaElectricityBill({ kwh: 1000, sector: "government" }).consumption, 350);
});

import { ksaGovSalary } from "../src/assets/calc.js";

test("سلم رواتب موظفي الدولة والمعلمين", () => {
  assert.equal(ksaGovSalary({ rank: 8, step: 1 }).basic, 8010);
  assert.equal(ksaGovSalary({ rank: 1, step: 1 }).basic, 3000);
  assert.equal(ksaGovSalary({ rank: 15, step: 10 }).basic, 28640);
  assert.equal(ksaGovSalary({ rank: 15, step: 10 }).atMax, true);
  assert.equal(ksaGovSalary({ rank: 15, step: 1 }).car, true);
  assert.equal(ksaGovSalary({ rank: 11, step: 15 }), null);
  const g = ksaGovSalary({ rank: 6, step: 5 });
  assert.equal(g.basic, 7285);
  assert.equal(g.transport, 700);
  near(g.deduction, 655.65);
  near(g.net, 7285 + 700 - 655.65);
  assert.equal(g.nextBasic, 7590);
  // أرقام عكاظ 2022 الصافية للمعلم الممارس: 7,588.70 و20,037.50
  near(ksaGovSalary({ scale: "teacher", rank: "practicing", level: 1, step: 1 }).net, 7588.7);
  near(ksaGovSalary({ scale: "teacher", rank: "practicing", level: 5, step: 3 }).net, 20037.5);
  assert.equal(ksaGovSalary({ scale: "teacher", rank: "practicing", level: 5, step: 4 }), null);
  const t = ksaGovSalary({ scale: "teacher", rank: "assistant", level: 1, step: 6 });
  assert.equal(t.basic, 6700);
  assert.equal(t.nextBasic, 7000);
  assert.equal(t.increment, 300);
  near(ksaGovSalary({ rank: 8, step: 1, system: "gosiNew", asOf: new Date("2026-11-03") }).deduction, 801);
});

test("السعودية — فاتورة المياه 2027 والتعرفة الحالية", () => {
  const n30 = ksaWaterBill({ m3: 30 });
  assert.equal(n30.water, 45);
  assert.equal(n30.sewer, 22.5);
  assert.equal(n30.fixed, 30);
  assert.equal(n30.subtotal, 97.5);
  assert.equal(n30.total, 112.13);
  const c30 = ksaWaterBill({ m3: 30, tariff: "current" });
  assert.equal(c30.subtotal, 24.75);
  assert.equal(c30.total, 28.46);
  assert.equal(ksaWaterBill({ m3: 40, tariff: "current" }).subtotal, 69.75); // مثال الوزارة 2016
  assert.equal(ksaWaterBill({ m3: 60, tariff: "current" }).subtotal, 182.25);
  assert.equal(ksaWaterBill({ m3: 60 }).subtotal, 322.5);
  // غير موصول بالصرف، وعداد 21–40 مم، ووحدتان
  const u = ksaWaterBill({ m3: 30, sewer: false, meter: 40, units: 2, vat: false });
  assert.equal(u.total, 45 + 40 + 20);
  // تجاري: 8 للمتر + 4 صرف، ورسم 40/20 لعداد ≤ 20 مم
  assert.equal(ksaWaterBill({ m3: 10, sector: "commercial", vat: false }).total, 120 + 60);
  assert.equal(ksaWaterBill({ m3: 10, sector: "government", vat: false }).total, 150 + 1500);
});

test("نطاقات — الأوزان والمراحل وتحليل قائمة الأجور", () => {
  assert.equal(nitaqatWeight(4000, 0), 1);
  assert.equal(nitaqatWeight(3999, 0), 0.5);
  assert.equal(nitaqatWeight(3000, 0), 0.5);
  assert.equal(nitaqatWeight(2999, 0), 0);
  assert.equal(nitaqatWeight(4500, 1), 0.5);
  assert.equal(nitaqatWeight(4500, 1, false), 0);
  assert.equal(nitaqatWeight(5000, 1), 1);
  assert.equal(nitaqatWeight(5500, 2), 0.5);
  assert.equal(nitaqatWeight(6000, 2), 1);
  assert.equal(nitaqatPhaseAt("2026-11-03"), 0);
  assert.equal(nitaqatPhaseAt("2027-04-24"), 0);
  assert.equal(nitaqatPhaseAt("2027-04-25"), 1);
  assert.equal(nitaqatPhaseAt("2028-04-25"), 2);
  assert.deepEqual(parseWageList("4,500 5200\n٣٨٠٠، 6000×2"), [4500, 5200, 3800, 6000, 6000]);
  assert.deepEqual(parseWageList("4500,5200,3000"), [4500, 5200, 3000]);
  const s = nitaqatSummary([3500, 4200, 4800, 5500, 6500]);
  assert.equal(s[0].total, 4.5);
  assert.equal(s[1].total, 3);
  assert.equal(s[2].total, 1.5);
  assert.equal(s[1].raiseCost, 1500 + 800 + 200);
  assert.equal(s[2].toRaise, 4);
});

test("البحرين — معاش القطاع الخاص والدفعة الواحدة", () => {
  const a = bahrainPension({ age: 60, months: 360, avgWage: 1200, year: 2026 });
  assert.equal(a.status, "oldAge");
  assert.equal(a.pension, 720);
  assert.equal(a.employee, 84);
  assert.equal(a.employer, 180);
  const b = bahrainPension({ age: 52, months: 300, avgWage: 1000 });
  assert.equal(b.status, "early");
  assert.equal(b.gross, 500);
  assert.equal(b.pension, 450);
  assert.equal(bahrainPension({ age: 44, months: 240, avgWage: 1000 }).pension, 320);
  assert.equal(bahrainPension({ age: 47, months: 240, avgWage: 1000 }).pension, 340);
  const c = bahrainPension({ age: 63, months: 504, avgWage: 2000 });
  assert.equal(c.pension, 1600); // سقف 80%
  assert.ok(c.capped);
  const d = bahrainPension({ age: 60, months: 120, avgWage: 800 });
  assert.equal(d.status, "lump");
  assert.equal(d.lump, 14400);
  const e = bahrainPension({ age: 40, months: 200, avgWage: 900 });
  assert.equal(e.status, "notYet");
  assert.equal(e.atSixty, r2t(900 * 200 / 12 / 50));
  assert.equal(e.monthsToEarly, 40);
  assert.equal(bahrainPension({ age: 60, months: 300, avgWage: 5000 }).wage, 4000);
  assert.ok(bahrainPension({ age: 60, months: 6, avgWage: 500 }).refundOnly);
});
const r2t = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

test("عُمان — معاش كبار السن بالجزأين والخصم", () => {
  assert.equal(omanOldAge("2030-12-31"), 60);
  assert.equal(omanOldAge("2031-01-01"), 61);
  assert.equal(omanOldAge("2060-01-01"), 65);
  // مثال البحث ع1: 20 سنة سابقة براتب 1,200، و6 سنوات بعد القانون بأجر 1,300، تقاعد 1/1/2030 بعمر 60
  const a = omanPension({ gender: "m", birth: "1970-01-01", retire: "2030-01-01", priorYears: 20, finalSalary: 1200, avgWage: 1300 });
  assert.equal(a.status, "full");
  near(a.revalued, 1432.86);
  near(a.partB, 573.15);
  near(a.avgFV, 1443.53, 0.02);
  near(a.partA, 173.22, 0.02);
  near(a.pension, 746.37, 0.03);
  // مثال ع2: امرأة بعمر 52 في 1/1/2028، 19 سنة سابقة براتب 900، و4 سنوات بأجر 950 → خصم 15%
  const b = omanPension({ gender: "f", birth: "1976-01-01", retire: "2028-01-01", priorYears: 19, finalSalary: 900, avgWage: 950 });
  assert.equal(b.status, "early");
  near(b.reduction, 0.15, 1e-6);
  near(b.gross, 466.8, 0.03);
  near(b.pension, 396.78, 0.03);
  // ع3: رجل بعمر 50 أكمل 30 سنة → خصم 30%
  const c = omanPension({ gender: "m", birth: "1979-07-01", retire: "2029-07-01", priorYears: 24.5, finalSalary: 800, avgWage: 900 });
  assert.equal(c.status, "early");
  near(c.reduction, 0.3, 1e-6);
  // ترك العمل بعمر 40 بعد 10 سنوات → مؤجل
  const d = omanPension({ gender: "m", birth: "1994-01-01", retire: "2034-01-01", avgWage: 1000 });
  assert.equal(d.status, "deferred");
  assert.equal(d.pension, 0);
  // الضمان النقدي حد أدنى
  assert.equal(omanPension({ gender: "m", birth: "1970-01-01", retire: "2030-01-01", priorYears: 20, finalSalary: 1200, avgWage: 1300, guarantee: 900 }).pension, 900);
});

test("قطر — معاش القانون 1/2022 (أمثلة مطابقة لنصوص المواد 29 و30 و34 و36 و82)", () => {
  assert.equal(qatarPension({ sector: "gov", reason: "age", ageYears: 60, years: 27, salary: 24000 }).pension, 21600);
  const p = qatarPension({ sector: "private", reason: "age", ageYears: 60, years: 30, salary: 20000, firstYearSalary: 14000 });
  assert.equal(p.pension, 18200);
  assert.ok(p.avgCapped);
  const m = qatarPension({ sector: "gov", reason: "age", ageYears: 60, years: 25, salary: 16000 });
  assert.equal(m.pension, 15000);
  assert.ok(m.minApplied);
  assert.equal(qatarPension({ sector: "gov", reason: "age", ageYears: 60, years: 22, salary: 21000, legacy: true }).pension, 21000);
  assert.equal(qatarPension({ sector: "gov", reason: "age", ageYears: 60, years: 17, salary: 21000, legacy: true }).pension, 18900);
  const r = qatarPension({ sector: "gov", reason: "resign", ageYears: 52, years: 27, salary: 24000 });
  assert.equal(r.reduction, 0.2);
  assert.equal(r.pension, 17280);
  // الاستقالة قبل 50: يُصرف عند بلوغها
  assert.equal(qatarPension({ sector: "gov", reason: "resign", ageYears: 48, years: 26, salary: 20000 }).payAge, 50);
  // جدول القرار 11/2024: مواليد 1983 بعمر 43 و17 سنة اشتراك منها 12 فعلية
  const t1 = qatarPension({ sector: "gov", reason: "resign", ageYears: 43, years: 17, actualYears: 12, salary: 20000, legacy: true, birthYear: 1983 });
  assert.ok(t1.eligible);
  near(t1.reduction, 0.425, 1e-9);
  // غير مستحق: تعويض الدفعة الواحدة = راتب حساب المعاش × السنوات
  const l = qatarPension({ sector: "private", reason: "resign", ageYears: 50, years: 15, salary: 20000 });
  assert.equal(l.eligible, false);
  assert.equal(l.lump, 300000);
  // كسر المدة: أكثر من 6 أشهر سنة كاملة
  assert.equal(qatarPension({ sector: "gov", reason: "age", ageYears: 60, years: 24, months: 7, salary: 30000 }).Y, 25);
  assert.ok(qatarPension({ sector: "gov", reason: "resign", ageYears: 40, years: 0, months: 10, salary: 10000 }).refundOnly);
});
