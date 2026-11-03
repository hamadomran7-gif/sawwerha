// اختبارات المعادلات — تُشغَّل بـ: node --test tests/
// كل حالة محسوبة يدوياً من النص القانوني، وتطابق الأمثلة المنشورة في الصفحات.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  serviceDuration,
  uaeNafis,
  uaeNetSalary,
  kuwaitNetSalary,
  qatarNetSalary,
  bahrainNetSalary,
  omanNetSalary,
  gccMaternityPlan,
  ksaMaternityPay,
  hijriMonthGrid,
  hijriEventCountdown,
  ramadanHours,
  gccUnemployment,
  familyResidenceCost,
  ksaPayDate,
  ksaNextPayDates,
  ksaPayCountdown,
  gccFinalSettlement,
  uaeNafisJobLoss,
  kuwaitLabourSupport,
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
  gccPensionCompare,
  abuDhabiPension,
  adPeriod,
  uaeEmiratisation,
  ksaRetirementAge,
  omanIncomeTax,
  gccOvertime,
  gccNotice,
  uaeResidencyCheck,
  ksaLumpSum,
  ksaWorkInjury,
  uaeWorkInjury,
  overstayFine,
  ksaResidencyFine,
  ksaGovLeaveComp,
  ksaGovContractorAward,
  upcomingHolidays,
  holidayWorkPay,
  dateRuns,
  ksaHafiz,
  omanJobSecurity,
  bahrainUnemployment,
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

test("مقارنة معاشات الخليج — النسب عند 30 سنة", () => {
  const rows = Object.fromEntries(gccPensionCompare({ years: 30, salary: 10000 }).map((r) => [r.key, r]));
  near(rows["ae-legacy"].pct, 0.9, 1e-9);
  near(rows["ae-new"].pct, 0.801, 1e-9);
  near(rows["sa-legacy"].pct, 0.75, 1e-9);
  near(rows["sa-new"].pct, 0.675, 1e-9);
  near(rows.kw.pct, 0.95, 1e-9);
  near(rows.qa.pct, 1, 1e-9);
  near(rows.bh.pct, 0.6, 1e-9);
  near(rows.om.pct, 0.6, 1e-9);
  assert.equal(rows.qa.pension, 10000);
  const r15 = Object.fromEntries(gccPensionCompare({ years: 15 }).map((r) => [r.key, r]));
  assert.equal(r15.qa.eligible, false);
  assert.equal(r15["sa-legacy"].eligible, true);
  near(gccPensionCompare({ years: 35 }).find((r) => r.key === "ae-new").pct, 1, 1e-9);
});

test("أبوظبي — معاش صندوق أبوظبي بعد القانون 18/2023", () => {
  assert.equal(adPeriod("2023-11-30"), 0);
  assert.equal(adPeriod("2023-12-01"), 1);
  assert.equal(adPeriod("2026-11-03"), 3);
  assert.equal(adPeriod("2026-12-01"), 4);
  // مثال 1: جديد، 30 سنة عند 55، متوسط 30,000 → 90%
  const e1 = abuDhabiPension({ category: "new", birth: "1990-01-01", exit: "2045-01-01", years: 30, avgSalary: 30000 });
  assert.equal(e1.track, "early");
  near(e1.pct, 0.9, 1e-9);
  assert.equal(e1.pension, 27000);
  // مثال 2: جديد عند 60 بخدمة 18 سنة و4 أشهر
  const e2 = abuDhabiPension({ category: "new", birth: "1980-01-01", exit: "2040-01-01", years: 18, months: 4, avgSalary: 25000 });
  near(e2.pension, 14666.67, 0.01);
  const e2b = abuDhabiPension({ category: "new", birth: "1980-01-01", exit: "2040-01-01", years: 18, months: 4, avgSalary: 15000 });
  assert.equal(e2b.pension, 10200);
  assert.ok(e2b.minApplied);
  // مثال 3: حالي، مولود 15/5/1980، ترك 31/5/2026 بعد 25 سنة و3 أشهر، متوسط 41,666.67 → مسار 25 سنة، 80.5%
  const e3 = abuDhabiPension({ category: "existing", birth: "1980-05-15", exit: "2026-05-31", years: 25, months: 3, avgSalary: 41666.67 });
  assert.equal(e3.track, "route25");
  near(e3.pct, 0.805, 1e-9);
  near(e3.pension, 33541.67, 0.02);
  // تنويع: مولود 1/7/1980 يكمل 25 سنة في 1/12/2026 → لا يستحق، ويستحق 1/1/2027
  const e4 = abuDhabiPension({ category: "existing", birth: "1980-07-01", exit: "2026-12-01", years: 25, avgSalary: 40000 });
  assert.equal(e4.eligible, false);
  assert.equal(e4.next.date, "2027-01-01");
  // مكافأة غير المستحق: جديد عند 40 بعد 12 سنة، متوسط 20,000 → 23.5 راتباً
  const e5 = abuDhabiPension({ category: "new", birth: "1990-01-01", exit: "2030-01-01", years: 12, avgSalary: 20000 });
  assert.equal(e5.eligible, false);
  assert.equal(e5.gratuity, 470000);
  // الأم الجديدة بخمسة أولاد: 23 سنة و52
  assert.equal(abuDhabiPension({ category: "new", gender: "f", children: 5, birth: "1980-01-01", exit: "2032-06-01", years: 23, avgSalary: 20000 }).track, "mother");
  // حق مكتسب: حالي أكمل 25 سنة قبل 1/12/2023
  assert.equal(abuDhabiPension({ category: "existing", birth: "1975-01-01", exit: "2026-06-01", years: 28, avgSalary: 50000 }).track, "acquired");
  // أكثر من 35 سنة: 3 رواتب عن كل سنة زائدة
  assert.equal(abuDhabiPension({ category: "new", birth: "1998-01-01", exit: "2060-01-01", years: 37, avgSalary: 30000 }).excess, 180000);
  // حالي تجاوز 25 سنة قبل 1/12/2023: لا نسبة عن الزائد قبل التعديل، و2% عن السنوات اللاحقة، ومنفعة مستقلة
  const e6 = abuDhabiPension({ category: "existing", birth: "1960-01-01", exit: "2026-06-01", years: 37, avgSalary: 30000 });
  assert.equal(e6.track, "acquired");
  near(e6.counted, 27.5, 0.01);
  near(e6.pct, 0.85, 0.001);
  assert.equal(e6.excess, 0);
  near(e6.preExcess, 3 * 30000 * 9.5, 1000);
  // تاريخ الاستحقاق التالي بدقة اليوم: أم حالية تبلغ 51.5 في 1/7/2026
  const e7 = abuDhabiPension({ category: "existing", gender: "f", children: 2, birth: "1975-01-01", exit: "2026-06-30", years: 12, avgSalary: 25000 });
  assert.equal(e7.eligible, false);
  assert.equal(e7.next.date, "2026-07-01");
  assert.equal(e7.next.track, "routeMotherAge");
});

test("الإمارات — مستهدفات التوطين", () => {
  const at = (r, date) => r.deadlines.find((d) => d.date === date);
  // S = 60: جدول القرار 2 سنوياً → 8 / 9 / 10، والنسبة → 5 / 6 / 6
  const r60 = uaeEmiratisation({ total: 80, skilled: 60, emiratis: 8 });
  assert.equal(r60.scope, "large");
  assert.equal(r60.inc, 2);
  assert.deepEqual([at(r60, "2025-12-31").a, at(r60, "2026-06-30").a, at(r60, "2026-12-31").a], [8, 9, 10]);
  assert.deepEqual([at(r60, "2025-12-31").b, at(r60, "2026-06-30").b, at(r60, "2026-12-31").b], [5, 6, 6]);
  assert.equal(at(r60, "2026-06-30").contribA, 60000);
  assert.equal(at(r60, "2026-12-31").contribA, 240000);
  assert.equal(at(r60, "2026-12-31").contribB, 0);
  // S = 150 → 12 / 14 / 15 بالطريقتين
  const r150 = uaeEmiratisation({ total: 200, skilled: 150, emiratis: 13 });
  assert.deepEqual([at(r150, "2025-12-31").a, at(r150, "2026-06-30").a, at(r150, "2026-12-31").a], [12, 14, 15]);
  assert.deepEqual([at(r150, "2025-12-31").b, at(r150, "2026-06-30").b, at(r150, "2026-12-31").b], [12, 14, 15]);
  // S = 600 → 60 بنهاية 2026، و50 مواطناً → نقص 10 = 1,200,000
  const r600 = uaeEmiratisation({ total: 900, skilled: 600, emiratis: 50 });
  assert.equal(at(r600, "2026-12-31").a, 60);
  assert.equal(at(r600, "2026-12-31").contribA, 1200000);
  assert.equal(at(r600, "2026-06-30").contribA, 240000);
  // الحد الأدنى مواطن سنوياً: W = 55، S = 30 → 4 / 5 / 5 مقابل 3 / 3 / 3
  const r30 = uaeEmiratisation({ total: 55, skilled: 30, emiratis: 0 });
  assert.deepEqual([at(r30, "2025-12-31").a, at(r30, "2026-06-30").a, at(r30, "2026-12-31").a], [4, 5, 5]);
  assert.deepEqual([at(r30, "2025-12-31").b, at(r30, "2026-06-30").b, at(r30, "2026-12-31").b], [3, 3, 3]);
  // خط الأساس يضاف في القراءة A فقط
  const rb = uaeEmiratisation({ total: 120, skilled: 100, emiratis: 10, baseline: 3 });
  assert.equal(at(rb, "2026-12-31").a, 13);
  assert.equal(at(rb, "2026-12-31").b, 10);
  // إعفاء 70%
  assert.equal(uaeEmiratisation({ total: 60, skilled: 50, emiratis: 42 }).exempt, true);
  assert.equal(at(uaeEmiratisation({ total: 60, skilled: 60, emiratis: 42 }), "2026-12-31").contribA, 0);
  // 20–49 في الأنشطة الـ14
  const s = uaeEmiratisation({ total: 30, skilled: 20, emiratis: 1, sector14: true });
  assert.equal(s.scope, "small");
  assert.equal(s.years.find((y) => y.year === 2025).short, 1);
  assert.equal(s.years.find((y) => y.year === 2025).contrib, 108000);
  assert.equal(uaeEmiratisation({ total: 30, skilled: 20, emiratis: 1, sector14: false }).scope, "none");
  assert.equal(uaeEmiratisation({ total: 12, skilled: 5 }).scope, "none");
});

test("السعودية — سن التقاعد وتاريخه", () => {
  // مشترك جديد: 65 ميلادية، والمبكر بعد 360 شهراً مع بلوغ 55
  const n = ksaRetirementAge({ birth: "2000-01-01", start: "2025-01-01" });
  assert.equal(n.category, "new");
  assert.equal(n.normalDate, "2065-01-01");
  assert.equal(n.earlyDate, "2055-01-01");
  // مشمول بالتعديلات: عمره 34 في 3/7/2024 ومدته دون 180 → 63 سنة (756 شهراً)، والمبكر 360 شهراً
  const t1 = ksaRetirementAge({ birth: "1990-05-10", start: "2012-01-01" });
  assert.equal(t1.category, "transitional");
  assert.equal(t1.normalAgeMonths, 756);
  assert.equal(t1.normalDate, "2053-05-10");
  assert.equal(t1.earlyMonthsNeeded, 360);
  // غير مشمول (عمره 49 في 3/7/2024): 60 هجرية، والمبكر 300 شهر
  const l = ksaRetirementAge({ birth: "1975-03-01", start: "2000-01-01" });
  assert.equal(l.category, "legacy");
  assert.equal(l.earlyMonthsNeeded, 300);
  assert.ok(l.normalDate > "2033-01-01" && l.normalDate < "2033-12-31");
  // مدة 240 شهراً فأكثر في 3/7/2024 تُخرجه من التعديلات حتى لو كان صغير السن
  assert.equal(ksaRetirementAge({ birth: "1980-01-01", start: "2003-01-01" }).category, "legacy");
  // إدخال الأشهر يدوياً
  const t2 = ksaRetirementAge({ birth: "1985-06-15", start: "2010-01-01", monthsAtEff: 200 });
  assert.equal(t2.category, "transitional");
  assert.equal(t2.earlyMonthsNeeded, 336);
});

test("عُمان — ضريبة دخل الأفراد (من 2028)", () => {
  // راتب 3,000 شهرياً: دون الحد
  assert.equal(omanIncomeTax({ monthlySalary: 3000 }).tax, 0);
  assert.equal(omanIncomeTax({ monthlySalary: 3500 }).filingRequired, false);
  // عُماني: راتب 4,000 + إيجار 6,000 + فوائد قرض المسكن 2,000 → 320، والاستقطاع 165
  const a = omanIncomeTax({ omani: true, monthlySalary: 4000, rent: 6000, loanInterest: 2000 });
  assert.equal(a.G, 54000);
  assert.equal(a.contrib, 2700);
  assert.equal(a.taxable, 6400);
  assert.equal(a.tax, 320);
  assert.equal(a.withholding, 165);
  // بتكاليف إيجار فعلية 1,500 → 290
  assert.equal(omanIncomeTax({ omani: true, monthlySalary: 4000, rent: 6000, rentActualCost: 1500, loanInterest: 2000 }).tax, 290);
  // وافد بلا اشتراك → 455
  assert.equal(omanIncomeTax({ monthlySalary: 4000, rent: 6000, loanInterest: 2000 }).tax, 455);
  // وافد 5,000 شهرياً → 900، ومع مدارس 4,000 وعلاج 500 → 675
  assert.equal(omanIncomeTax({ monthlySalary: 5000 }).tax, 900);
  assert.equal(omanIncomeTax({ monthlySalary: 5000, education: 4000, health: 500 }).tax, 675);
  // عُماني بدخول متعددة: 87,000 إجمالي، والتبرعات بحد 5% → 1,722.5
  const b = omanIncomeTax({ omani: true, monthlySalary: 6000, other: 13000, exemptIncome: 2000, donations: 5000, health: 1500 });
  assert.equal(b.G, 87000);
  assert.equal(b.donationsAllowed, 4350);
  assert.equal(b.exemptions, 10550);
  assert.equal(b.tax, 1722.5);
  assert.equal(b.withholding, 1365);
  // وافد 8 أشهر بـ4,500 ومكافأة 25,000 → 950
  assert.equal(omanIncomeTax({ monthlySalary: 4500, months: 8, gratuity: 25000 }).tax, 950);
});

test("الخليج — العمل الإضافي في قطر والكويت وعُمان والبحرين", () => {
  // قطر: أساسي 6,000 → 25 للساعة؛ 10 نهارية + 4 يوم راحة نقداً = 562.50، وباليوم البديل 312.50
  const q = gccOvertime({ country: "qa", wage: 6000, day: 10, rest: 4 });
  assert.equal(q.hourly, 25);
  assert.equal(q.total, 562.5);
  assert.equal(gccOvertime({ country: "qa", wage: 6000, day: 10, rest: 4, restCash: false }).total, 312.5);
  assert.equal(gccOvertime({ country: "qa", wage: 6000, night: 6, holiday: 4 }).total, 350);
  // الكويت: شامل 6,000 ÷ 208 = 28.8462؛ 10 إضافية + 4 راحة = 533.65 ويوم بديل؛ و8 ساعات عطلة = 461.54
  const k = gccOvertime({ country: "kw", wage: 6000, day: 10, rest: 4 });
  near(k.total, 533.654, 0.001);
  assert.equal(k.substituteDays, 1);
  near(gccOvertime({ country: "kw", wage: 6000, holiday: 8 }).total, 461.538, 0.001);
  assert.equal(gccOvertime({ country: "kw", wage: 6000, day: 10, altDivisor: true }).total, 312.5);
  // عُمان: 10 نهارية + 4 راحة = 512.50؛ ودون موافقة (جرد) 6 ليلية + 4 نهارية = 375
  assert.equal(gccOvertime({ country: "om", wage: 6000, day: 10, rest: 4 }).total, 512.5);
  assert.equal(gccOvertime({ country: "om", wage: 6000, night: 6, day: 4, consent: false }).total, 412.5);
  // البحرين: 10 + 4 راحة = 562.50؛ 4 ليلية + 8 عطلة = 650
  assert.equal(gccOvertime({ country: "bh", wage: 6000, day: 10, rest: 4 }).total, 562.5);
  assert.equal(gccOvertime({ country: "bh", wage: 6000, night: 4, holiday: 8 }).total, 650);
});

test("الخليج — مهلة الإخطار وبدلها", () => {
  assert.equal(gccNotice({ country: "qa", wage: 6000, years: 3 }).inLieu, 12000);
  assert.equal(gccNotice({ country: "qa", wage: 6000, years: 2 }).days, 30);
  assert.equal(gccNotice({ country: "qa", wage: 6000, years: 3, servedDays: 30 }).inLieu, 6000);
  assert.equal(gccNotice({ country: "kw", wage: 8000 }).inLieu, 24000);
  assert.equal(gccNotice({ country: "kw", wage: 8000, monthlyPaid: false }).days, 30);
  assert.equal(gccNotice({ country: "om", wage: 8000 }).inLieu, 8000);
  assert.equal(gccNotice({ country: "om", wage: 8000, servedDays: 10 }).inLieu, 5333.333);
  assert.equal(gccNotice({ country: "om", wage: 8000, monthlyPaid: false }).days, 15);
  assert.equal(gccNotice({ country: "bh", wage: 6000 }).inLieu, 6000);
});

test("الإمارات — أهلية الإقامة الذهبية والخضراء والمتقاعدين", () => {
  const st = (r, id) => r.results.find((x) => x.id === id).status;
  // مهندس: مستوى 1، بكالوريوس، أساسي 32,000 → ذهبية مهني، وخضراء
  const a = uaeResidencyCheck({ emirate: "dubai", employed: true, skill: 1, degree: "bachelor", basic: 32000, total: 40000 });
  assert.equal(st(a, "g-skilled"), "yes");
  assert.equal(st(a, "gr-skilled"), "yes");
  // أساسي 20,000 وإجمالي 32,000 → ذهبية محتملة
  assert.equal(st(uaeResidencyCheck({ employed: true, skill: 1, degree: "bachelor", basic: 20000, total: 32000 }), "g-skilled"), "maybe");
  // محاسبة: مستوى 2، 18,000 → ليست ذهبية، خضراء
  const b = uaeResidencyCheck({ employed: true, skill: 2, degree: "bachelor", basic: 18000, total: 18000 });
  assert.equal(st(b, "g-skilled"), "no");
  assert.equal(st(b, "gr-skilled"), "yes");
  // مستقل بدخل 300,000 في كل سنة → محتمل (مجموع السنتين ≥ 360,000)، و150,000 → لا
  assert.equal(st(uaeResidencyCheck({ freelance: true, degree: "bachelor", freelanceIncome1: 300000, freelanceIncome2: 300000 }), "gr-freelance"), "maybe");
  assert.equal(st(uaeResidencyCheck({ freelance: true, degree: "diploma", freelanceIncome1: 400000, freelanceIncome2: 380000 }), "gr-freelance"), "yes");
  // متقاعد 56 بعقار 1.2 مليون في دبي دون 15 سنة خدمة → محتمل، وفي غير دبي → مؤهل
  assert.equal(st(uaeResidencyCheck({ emirate: "dubai", age: 56, propertyValue: 1200000 }), "retirement"), "maybe");
  assert.equal(st(uaeResidencyCheck({ emirate: "other", age: 56, propertyValue: 1200000 }), "retirement"), "yes");
  assert.equal(st(uaeResidencyCheck({ emirate: "dubai", age: 56, serviceYears: 20, propertyValue: 1200000 }), "retirement"), "yes");
  // فيلا 3 ملايين برهن 1.5 مليون: أبوظبي لا، دبي محتمل
  assert.equal(st(uaeResidencyCheck({ emirate: "abudhabi", propertyValue: 3000000, mortgage: 1500000 }), "g-property"), "no");
  assert.equal(st(uaeResidencyCheck({ emirate: "dubai", propertyValue: 3000000, mortgage: 1500000 }), "g-property"), "maybe");
  assert.equal(st(uaeResidencyCheck({ emirate: "abudhabi", propertyValue: 3000000, mortgage: 500000 }), "g-property"), "yes");
  // خريجة جامعة ضمن أفضل 100 بمعدل 3.6 قبل سنة → ذهبية
  assert.equal(st(uaeResidencyCheck({ student: "intl-top", score: 3.6, yearsSinceGrad: 1 }), "g-student"), "yes");
  assert.equal(st(uaeResidencyCheck({ student: "school", score: 94 }), "g-student"), "no");
  // وديعة 2 مليون → ذهبية مستثمر، وخضراء مستثمر
  const c = uaeResidencyCheck({ investment: 2000000 });
  assert.equal(st(c, "g-investment"), "yes");
  assert.equal(st(c, "gr-investor"), "yes");
});

test("السعودية — تعويض الدفعة الواحدة", () => {
  assert.equal(ksaLumpSum({ months: 96, avgWage: 8000 }).lump, 82560);
  assert.equal(ksaLumpSum({ months: 150, avgWage: 10000 }).lump, 168000);
  assert.equal(ksaLumpSum({ months: 150, pre1422Months: 30, avgWage: 10000 }).lump, 156000);
  const b = ksaLumpSum({ months: 96, avgWage: 8000 });
  assert.equal(b.buyMonths, 24);
  assert.equal(b.buyCost, 34560);
  assert.equal(b.pensionAfterBuy, 2000);
  const n1 = ksaLumpSum({ system: "new", monthlyWage: 8000, start: "2024-08-01", end: "2027-07-31" });
  assert.equal(n1.months, 36);
  assert.equal(n1.nominal, 54960);
  assert.equal(n1.lumpOnly, true);
  const n2 = ksaLumpSum({ system: "new", monthlyWage: 10000, start: "2026-07-01", end: "2036-06-30" });
  assert.equal(n2.months, 120);
  assert.equal(n2.nominal, 260400);
});

test("السعودية — إصابة العمل في التأمينات", () => {
  assert.equal(ksaWorkInjury({ type: "temporary", wage: 8000, days: 45 }).total, 12000);
  near(ksaWorkInjury({ type: "temporary", wage: 8000, days: 45, gosiDays: 10 }).total, 11333.33, 0.01);
  { const t = ksaWorkInjury({ type: "temporary", wage: 8000, days: 45, gosiDays: 10 }); near(t.fullPay, 9333.33, 0.01); near(t.gosiPay, 2000, 0.01); }
  assert.equal(ksaWorkInjury({ wage: 8000, degree: 0.3, age: 35 }).lump, 144000);
  assert.equal(ksaWorkInjury({ wage: 8000, degree: 0.3, age: 52 }).lump, 127200);
  assert.equal(ksaWorkInjury({ wage: 8000, degree: 0.3, age: 75 }).lump, 86400);
  assert.equal(ksaWorkInjury({ wage: 20000, degree: 0.3, age: 35 }).lump, 360000);
  assert.equal(ksaWorkInjury({ wage: 8000, degree: 0.6 }).monthly, 4800);
  assert.equal(ksaWorkInjury({ wage: 8000, degree: 0.6, saudi: false }).lump, 288000);
  const d3 = ksaWorkInjury({ type: "death", wage: 8000, survivors: 3 });
  assert.equal(d3.monthly, 8000);
  assert.equal(d3.grant, 10000);
  assert.equal(ksaWorkInjury({ type: "death", wage: 8000, survivors: 2 }).monthly, 6000);
  assert.equal(ksaWorkInjury({ type: "death", wage: 8000, survivors: 3, system: "new" }).monthly, 6000);
  assert.equal(ksaWorkInjury({ type: "death", wage: 8000, saudi: false }).lump, 672000);
  assert.equal(ksaWorkInjury({ wage: 1500, degree: 1 }).monthly, 1983.75);
});

test("الإمارات — تعويض إصابة العمل", () => {
  assert.equal(uaeWorkInjury({ basic: 6000, total: 9000, treatmentDays: 45 }).treatmentPay, 13500);
  { const u = uaeWorkInjury({ basic: 10000, total: 10000, treatmentDays: 400 }); assert.equal(u.fullPay, 60000); assert.equal(u.halfPay, 30000); assert.equal(u.treatmentPay, 90000); assert.equal(u.uncoveredDays, 40); }
  assert.equal(uaeWorkInjury({ basic: 6000, degree: 0.3 }).partial, 43200);
  assert.equal(uaeWorkInjury({ basic: 12000, degree: 0.3 }).partial, 60000);
  assert.equal(uaeWorkInjury({ basic: 12000, degree: 0.3 }).partialAlt, 86400);
  assert.equal(uaeWorkInjury({ basic: 2000, degree: 0.3 }).partial, 14400);
  assert.equal(uaeWorkInjury({ basic: 6000 }).death, 144000);
  assert.equal(uaeWorkInjury({ basic: 10000 }).death, 200000);
  assert.equal(uaeWorkInjury({ basic: 700 }).death, 18000);
  const t = uaeWorkInjury({ basic: 6000, total: 9000, treatmentDays: 300 });
  assert.equal(t.fullDays, 180);
  assert.equal(t.halfDays, 120);
  assert.equal(t.treatmentPay, 180 * 300 + 120 * 150);
});

test("غرامات تجاوز الإقامة: الإمارات والكويت وقطر والسعودية", () => {
  const f = (o) => overstayFine(o);
  // الإمارات: آخر يوم مسموح = الإلغاء + السماح، ويُحتسب يوم المغادرة
  assert.equal(f({ country: "ae", type: "res30", event: "2026-08-01", exit: "2026-10-15" }).total, 2250);
  assert.equal(f({ country: "ae", type: "res60", event: "2026-08-01", exit: "2026-10-15" }).total, 750);
  assert.equal(f({ country: "ae", type: "res90", event: "2026-08-01", exit: "2026-10-15" }).total, 0);
  assert.equal(f({ country: "ae", type: "visit", event: "2026-09-10", exit: "2026-09-20" }).total, 500);
  const id = f({ country: "ae", type: "eid", event: "2026-07-01", exit: "2026-10-15" });
  assert.equal(id.days, 76); assert.equal(id.total, 1000); assert.ok(id.capped);
  const nb = f({ country: "ae", type: "newborn", event: "2026-03-01", exit: "2026-10-15" });
  assert.equal(nb.total, 5400); assert.equal(nb.totalAlt, 10800); assert.equal(nb.waiverDays, undefined);
  const st = f({ country: "ae", type: "visit", event: "2026-03-01", exit: "2026-07-20" });
  assert.equal(st.totalAfterWaiver, 550);
  // الكويت: 2 في الشهر الأول ثم 4، والسقف 1,200
  assert.equal(f({ country: "kw", type: "residence", event: "2026-08-01", exit: "2026-10-15" }).total, 240);
  assert.equal(f({ country: "kw", type: "domestic", event: "2026-08-01", exit: "2026-10-15" }).total, 150);
  assert.equal(f({ country: "kw", type: "visit", event: "2026-08-01", exit: "2026-10-15" }).total, 750);
  const cap = f({ country: "kw", type: "residence", event: "2026-08-01", exit: "2027-07-15" });
  assert.equal(cap.total, 1200); assert.equal(cap.capDay, 315);
  assert.equal(f({ country: "kw", type: "newborn", event: "2026-01-10", exit: "2026-10-15" }).total, 572);
  // قطر
  assert.equal(f({ country: "qa", type: "cancelled", event: "2026-08-01", exit: "2026-10-15" }).total, 610);
  assert.equal(f({ country: "qa", type: "visit", event: "2026-08-01", exit: "2026-10-15" }).totalCapReported, 12000);
  // السعودية: بالمخالفة
  assert.equal(ksaResidencyFine({ type: "iqama", offence: 1 }).fine, 500);
  assert.equal(ksaResidencyFine({ type: "iqama", offence: 2 }).fine, 1000);
  assert.ok(ksaResidencyFine({ type: "iqama", offence: 3 }).deportation);
  assert.equal(ksaResidencyFine({ type: "finalExit" }).fine, 1000);
});

test("موظفو الدولة في السعودية: تعويض الإجازات ومكافأة المتعاقد", () => {
  assert.equal(ksaGovLeaveComp({ basic: 12000, newDays: 150, reason: "retirement" }).amount, 28800);
  assert.equal(ksaGovLeaveComp({ basic: 12000, newDays: 50, oldDays: 100, reason: "resignation" }).amount, 60000);
  assert.equal(ksaGovLeaveComp({ basic: 12000, newDays: 150, reason: "death" }).amount, 60000);
  assert.equal(ksaGovLeaveComp({ basic: 12000, newDays: 60, oldDays: 160, reason: "retirement" }).amount, 72000);
  assert.equal(ksaGovLeaveComp({ basic: 12000, newDays: 250, reason: "disability" }).amount, 100000);
  assert.equal(ksaGovLeaveComp({ basic: 12000, newDays: 40, reason: "dismissal" }).amount, 16000);
  assert.equal(ksaGovLeaveComp({ basic: 12000, newDays: 150, reason: "retirement" }).lostDays, 78);
  assert.equal(ksaGovContractorAward({ salary: 10000, years: 7, reason: "resign" }).award, 35000);
  const c = ksaGovContractorAward({ salary: 12000, years: 12, reason: "end" });
  assert.equal(c.award, 50000); assert.ok(c.capped);
  assert.equal(ksaGovContractorAward({ salary: 10000, years: 2, months: 11, reason: "resign" }).award, 0);
  assert.equal(ksaGovContractorAward({ salary: 10000, years: 5, months: 8, reason: "end" }).award, 25000);
  assert.equal(ksaGovContractorAward({ salary: 10000, years: 9, reason: "disciplinary" }).award, 0);
  assert.equal(ksaGovContractorAward({ salary: 10000, years: 4, reason: "abolished", remainingMonths: 8 }).compensation, 20000);
});

test("العطل الرسمية: المواعيد القادمة وأجر العمل فيها", () => {
  assert.deepEqual(dateRuns(["2027-01-05", "2027-12-25"]).map((x) => x.days), [1, 1]);
  assert.deepEqual(dateRuns(["2026-12-03", "2026-12-02"]), [{ start: "2026-12-02", end: "2026-12-03", days: 2 }]);
  const ae = upcomingHolidays({ country: "ae", from: "2026-11-03" });
  assert.equal(ae[0].id, "nationalDay"); assert.equal(ae[0].daysUntil, 29); assert.equal(ae[0].days, 2);
  const om = upcomingHolidays({ country: "om", from: "2026-11-03" });
  assert.equal(om[0].start, "2026-11-25");
  assert.equal(upcomingHolidays({ country: "sa", from: "2026-11-03" })[0].id, "foundingDay");
  const kwIsra = upcomingHolidays({ country: "kw", from: "2026-11-03" }).filter((x) => x.id === "israMiraj");
  assert.equal(kwIsra.length, 2);
  // أمثلة البحث: أساسي 6,000 وشامل 8,000
  assert.equal(holidayWorkPay({ country: "ae", basic: 6000, total: 8000 }).total, 366.67);
  assert.equal(holidayWorkPay({ country: "sa", basic: 6000, total: 8000, hours: 8 }).total, 366.67);
  assert.equal(holidayWorkPay({ country: "qa", basic: 6000, hours: 8 }).total, 250);
  assert.equal(holidayWorkPay({ country: "qa", basic: 6000, hours: 8, nightHours: 4 }).total, 275);
  const kw = holidayWorkPay({ country: "kw", total: 8000 });
  assert.equal(kw.total, 615.38); assert.equal(kw.totalMin, 307.69); assert.equal(kw.total30, 533.33);
  assert.equal(holidayWorkPay({ country: "om", basic: 6000, total: 8000 }).total, 400);
  assert.equal(holidayWorkPay({ country: "om", basic: 6000, total: 8000, consent: false }).total, 600);
  const bh = holidayWorkPay({ country: "bh", total: 8000 });
  assert.equal(bh.total, 666.67); assert.equal(bh.totalMin, 400);
});

test("إعانات الباحثين عن عمل: حافز والأمان الوظيفي والتعطل في البحرين", () => {
  const today = "2026-11-03";
  const g = ksaHafiz({ birth: "2002-05-01", today, status: "graduate", eventDate: "2026-06-01" });
  assert.ok(g.eligible); assert.equal(g.total, 20250); assert.equal(g.payments, 15);
  assert.equal(ksaHafiz({ birth: "2000-01-01", today, income: 600 }).total, 11250);
  const i800 = ksaHafiz({ birth: "2000-01-01", today, income: 800 });
  assert.equal(i800.total, 8400); assert.equal(i800.stoppedBy, "income");
  assert.equal(ksaHafiz({ birth: "2000-01-01", today, income: 950 }).rows[8].pay, 100);
  const old = ksaHafiz({ birth: "1987-05-03", today }); // 39 سنة و6 أشهر
  assert.equal(old.payments, 6); assert.equal(old.total, 11000); assert.equal(old.stoppedBy, "age");
  assert.equal(ksaHafiz({ birth: "1990-01-01", today, familySize: 5 }).familyCap, 9600);
  assert.ok(ksaHafiz({ birth: "1990-01-01", today, familySize: 5, familyIncome: 10000 }).reasons.includes("family"));
  const w = ksaHafiz({ birth: "1994-01-01", today, status: "worked", eventDate: "2025-09-30" });
  assert.ok(w.reasons.includes("wait")); assert.equal(w.waitUntil, "2027-09-30");
  assert.equal(omanJobSecurity({ avgWage: 800 }).total, 5040);
  assert.equal(omanJobSecurity({ avgWage: 180 }).total, 1380);
  assert.equal(omanJobSecurity({ avgWage: 2500 }).total, 15750);
  assert.equal(omanJobSecurity({ avgWage: 800, reason: "resignation" }).total, 0);
  assert.equal(bahrainUnemployment({ avgWage: 1200 }).total, 6480);
  assert.equal(bahrainUnemployment({ avgWage: 2500 }).total, 9000);
  assert.equal(bahrainUnemployment({ avgWage: 300 }).total, 1800);
  assert.equal(bahrainUnemployment({ avgWage: 180 }).total, 1620);
  assert.equal(bahrainUnemployment({ avgWage: 900, contribMonths: 8 }).total, 1800);
  assert.equal(bahrainUnemployment({ reason: "firstJob", graduate: false }).total, 1350);
  assert.equal(bahrainUnemployment({ avgWage: 500, bahraini: false }).monthly, 300);
  assert.equal(bahrainUnemployment({ avgWage: 500, reason: "resignation" }).kind, "none");
});

test("نافس ودعم العمالة الكويتية — أمثلة البحث 22", () => {
  const today = "2026-11-03";
  const m1 = uaeNafis({ education: "bachelor", salary: 12000, children: 3, today });
  assert.equal(m1.support.amount, 6000); assert.equal(m1.child.amount, 1800); assert.equal(m1.pension.amount, 1320); assert.equal(m1.total, 7800);
  const m2 = uaeNafis({ education: "bachelor", salary: 22000, children: 3, today });
  assert.equal(m2.support.amount, 0); assert.equal(m2.pension.amount, 0); assert.equal(m2.child.amount, 1800);
  const m3 = uaeNafis({ status: "existing", education: "bachelor", salary: 25000, current: 3500, today }).support;
  assert.equal(m3.amount, 3000); assert.equal(m3.remaining, 63000); assert.equal(m3.endsOn, "2029-09-01"); assert.equal(m3.rows.length, 7);
  const m4 = uaeNafis({ status: "existing", education: "diploma", salary: 15000, current: 6000, today: "2027-04-01" }).support;
  assert.equal(m4.amount, 5000); assert.equal(m4.rows[0].amount, 5500);
  const m5 = uaeNafis({ status: "existing", education: "bachelor", salary: 5000, current: 7000, mohre: false, today: "2027-05-01" }).support;
  assert.equal(m5.amount, 4900); assert.equal(m5.remaining, 77700); assert.equal(m5.endsOn, "2027-12-01");
  assert.equal(uaeNafis({ status: "existing", education: "bachelor", salary: 5000, current: 7000, today }).support.reason, "suspended");
  assert.equal(uaeNafis({ status: "existing", education: "bachelor", salary: 18000, today }).support.start, 7000);
  assert.equal(uaeNafis({ status: "existing", education: "highSchool", salary: 24000, today }).support.start, 2500);
  assert.equal(uaeNafis({ education: "below", family: true, salary: 7000, today }).support.amount, 4000);
  assert.equal(uaeNafis({ education: "below", salary: 7000, today }).support.amount, 3000);
  assert.equal(uaeNafis({ education: "bachelor", salary: 12000, children: 2, spouseGov: true, today }).child.amount, 0);
  assert.equal(uaeNafis({ education: "bachelor", salary: 12000, children: 2, claimant: "motherOther", today }).child.amount, 0);
  assert.equal(uaeNafis({ education: "bachelor", salary: 50000, children: 5, today }).child.amount, 3000);
  assert.equal(uaeNafis({ education: "bachelor", salary: 12000, pensionShare: "old", today }).pension.amount, 600);
  assert.equal(uaeNafis({ category: "wife", education: "bachelor", salary: 10000, children: 1, marriageYears: 6, today }).support.amount, 3000);
  assert.equal(uaeNafis({ category: "wife", education: "bachelor", salary: 10000, children: 1, marriageYears: 3, today }).support.amount, 0);
  assert.equal(uaeNafis({ category: "wife", education: "bachelor", salary: 10000, marriageYears: 3, exempt: true, today }).support.amount, 3000);
  assert.equal(uaeNafis({ category: "wife", education: "bachelor", salary: 16000, children: 2, today }).support.reason, "aboveMax");
  assert.equal(uaeNafis({ category: "motherChild", education: "bachelor", salary: 18000, today }).support.amount, 3000);
  assert.equal(uaeNafis({ category: "motherChild", education: "diploma", salary: 18000, today }).support.reason, "degree");
  const j = uaeNafisJobLoss({ children: 3 });
  assert.equal(j.monthly, 17900); assert.equal(j.totalConsecutive, 107400);
  assert.equal(uaeNafisJobLoss({ children: 3, otherIncome: 3000 }).monthly, 14900);
  assert.equal(uaeNafisJobLoss({ spouse: false, children: 5 }).monthly, 13400);
  assert.equal(uaeNafisJobLoss({ reason: "resignation" }).eligible, false);
  assert.equal(uaeNafisJobLoss({ age: 61 }).why, "age");
  assert.equal(kuwaitLabourSupport({ category: "uniPro", married: true, children: 2, salary: 900 }).total, 948);
  assert.equal(kuwaitLabourSupport({ category: "uniOther", salary: 1500 }).total, 640);
  assert.equal(kuwaitLabourSupport({ category: "uniMed", married: true, children: 4, degree: "phd", salary: 2200 }).total, 1198);
  assert.equal(kuwaitLabourSupport({ category: "secondary", married: true, children: 9, salary: 500 }).total, 988);
  assert.equal(kuwaitLabourSupport({ category: "diploma", salary: 1250 }).total, 629);
  assert.equal(kuwaitLabourSupport({ category: "intermediateCourse", salary: 600 }).alt, 531);
  for (const c of ["uniMed", "uniPro", "uniOther", "diploma", "secondaryCourse", "secondary", "intermediateCourse", "intermediate", "belowIntermediate"])
    for (const married of [false, true]) assert.ok(kuwaitLabourSupport({ category: c, married }).formulaOk, c + married);
});

test("مقارنة أنظمة التعطل في الخليج", () => {
  const ae = gccUnemployment({ country: "ae", national: true, wage: 12000 });
  assert.equal(ae.rows.find((x) => x.id === "ae-iloe").total, 21600);
  assert.equal(ae.best.id, "ae-nafis"); assert.equal(ae.best.total, 42000);
  assert.equal(gccUnemployment({ country: "ae", national: false, wage: 20000 }).best.total, 36000);
  assert.equal(gccUnemployment({ country: "sa", wage: 12000 }).best.total, 75600);
  assert.equal(gccUnemployment({ country: "sa", national: false, wage: 12000 }).best, null);
  assert.equal(gccUnemployment({ country: "om", wage: 800 }).best.total, 5040);
  assert.equal(gccUnemployment({ country: "bh", wage: 1200 }).best.total, 6480);
  assert.equal(gccUnemployment({ country: "bh", national: false, wage: 500, reason: "resignation" }).best, null);
  assert.equal(gccUnemployment({ country: "kw", wage: 1000 }).rows[0].why, "notCovered");
});

test("العد التنازلي لرمضان وساعات الدوام في رمضان", () => {
  const r = hijriEventCountdown({ event: "ramadan", today: "2026-11-03" });
  assert.equal(r.date, "2027-02-08"); assert.equal(r.days, 97); assert.equal(r.eid, "2027-03-09"); assert.equal(r.length, 29);
  assert.equal(hijriEventCountdown({ event: "eidAdha", today: "2026-11-03" }).date, "2027-05-16");
  assert.equal(hijriEventCountdown({ event: "hijriNewYear", today: "2026-11-03" }).date, "2027-06-06");
  const during = hijriEventCountdown({ event: "ramadan", today: "2027-02-20" });
  assert.equal(during.ongoing.day, 13); assert.equal(during.ongoing.daysToEid, 17); assert.equal(during.date, "2028-01-28");
  assert.equal(ramadanHours({ country: "ae", normal: 8, days: 5 }).daily, 6);
  assert.equal(ramadanHours({ country: "sa", normal: 8, days: 6, muslim: false }).daily, 8);
  assert.equal(ramadanHours({ country: "kw", normal: 8, days: 5 }).daily, 7.2);
  assert.equal(ramadanHours({ country: "om", normal: 8, days: 6 }).weekly, 30);
  assert.equal(ramadanHours({ country: "qa", normal: 8, days: 6, muslim: false }).weekly, 36);
});

test("شبكة الشهر الهجري بتقويم أم القرى", () => {
  const g = hijriMonthGrid({ year: 1448, month: 9 });
  assert.equal(g.start, "2027-02-08"); assert.equal(g.length, 29); assert.equal(g.end, "2027-03-08"); assert.equal(g.firstWeekday, 1);
  const m = hijriMonthGrid({ year: 1448, month: 5 });
  assert.equal(m.start, "2026-10-12"); assert.equal(m.length, 30); assert.equal(m.days[22].iso, "2026-11-03");
  let total = 0; for (let k = 1; k <= 12; k++) total += hijriMonthGrid({ year: 1448, month: k }).length;
  assert.equal(total, 355);
  assert.equal(hijriMonthGrid({ year: 1700, month: 1 }), null);
});

test("تعويض الأمومة من التأمينات السعودية", () => {
  assert.equal(ksaMaternityPay({ contribMonths: 8, wage: 6000 }).total, 16800);
  assert.equal(ksaMaternityPay({ contribMonths: 8, wage: 6000 }).payer, "employer");
  assert.equal(ksaMaternityPay({ contribMonths: 12, wage: 6000 }).total, 18000);
  assert.equal(ksaMaternityPay({ contribMonths: 24, wage: 9000, insuredWage: 7000 }).total, 21000);
  assert.equal(ksaMaternityPay({ contribMonths: 24, wage: 60000 }).monthly, 45000);
  assert.equal(ksaMaternityPay({ contribMonths: 24, wage: 6000, sickChild: true }).months, 4);
});

test("إجازة الوضع في قطر والكويت وعُمان والبحرين — أمثلة البحث 26", () => {
  const due = "2026-12-10";
  const qa = gccMaternityPlan({ country: "qa", due, start: due, wage: 6000, serviceMonths: 12 });
  assert.equal(qa.lastDay, "2027-01-28"); assert.equal(qa.back, "2027-01-29"); assert.equal(qa.pay, 10000); assert.equal(qa.nursing[0].to, "2028-01-28");
  assert.equal(gccMaternityPlan({ country: "qa", due, wage: 6000, serviceMonths: 8 }).pay, 0);
  const qaEarly = gccMaternityPlan({ country: "qa", due, start: "2026-11-01" });
  assert.equal(qaEarly.start, "2026-11-25"); assert.equal(qaEarly.lastDay, "2027-01-13"); assert.equal(qaEarly.postDays, 35);
  const kw = gccMaternityPlan({ country: "kw", due, start: due, wage: 6000, extra: true });
  assert.equal(kw.lastDay, "2027-02-17"); assert.equal(kw.pay, 14000); assert.equal(kw.extra.back, "2027-06-18");
  const om = gccMaternityPlan({ country: "om", due, start: due, wage: 6000, extra: true });
  assert.equal(om.lastDay, "2027-03-17"); assert.equal(om.pay, 19600); assert.equal(om.paternity.until, "2027-03-17"); assert.equal(om.extra.to, "2027-06-23");
  const bh = gccMaternityPlan({ country: "bh", due, start: due, wage: 6000, extra: true });
  assert.equal(bh.lastDay, "2027-02-07"); assert.equal(bh.pay, 12000); assert.equal(bh.banUntil, "2027-01-18"); assert.equal(bh.extra.back, "2027-02-23");
  assert.equal(bh.nursing[0].hours, 2); assert.equal(bh.nursing[1].hours, 1);
});

test("الراتب الصافي واشتراكات التأمينات — أمثلة البحث 24", () => {
  assert.equal(uaeNetSalary({ basic: 10000, housing: 4000 }).net, 12460);
  assert.equal(uaeNetSalary({ basic: 10000, housing: 4000 }).cost, 15750);
  assert.equal(uaeNetSalary({ basic: 10000, housing: 4000, nafis: true }).net, 14000);
  assert.equal(uaeNetSalary({ basic: 10000, housing: 4000, fund: "gpssaOld" }).net, 13300);
  assert.equal(uaeNetSalary({ basic: 10000, housing: 4000, sector: "government" }).cost, 16100);
  assert.equal(uaeNetSalary({ basic: 10000, housing: 4000, fund: "sharjah", sector: "government" }).net, 13500);
  assert.equal(uaeNetSalary({ basic: 25000 }).employer, 3750);
  assert.equal(uaeNetSalary({ basic: 80000 }).net, 72300);
  assert.equal(uaeNetSalary({ basic: 2500 }).net, 2170);
  assert.equal(uaeNetSalary({ national: false, basic: 10000, housing: 4000 }).net, 14000);
  assert.equal(kuwaitNetSalary({ salary: 14000 }).employee, 257.5);
  assert.equal(kuwaitNetSalary({ salary: 14000 }).employer, 316.25);
  assert.equal(kuwaitNetSalary({ salary: 1400 }).net, 1253);
  assert.equal(kuwaitNetSalary({ salary: 2000 }).employee, 197.5);
  assert.equal(kuwaitNetSalary({ salary: 2000 }).employer, 230);
  assert.equal(kuwaitNetSalary({ salary: 1400, sector: "government" }).employee, 140);
  assert.equal(qatarNetSalary({ basic: 10000, housing: 4000 }).net, 13020);
  assert.equal(qatarNetSalary({ basic: 10000, housing: 8000 }).employee, 1120);
  assert.equal(qatarNetSalary({ basic: 120000 }).net, 113000);
  assert.equal(bahrainNetSalary({ basic: 10000, allowances: 4000 }).net, 13680);
  assert.equal(bahrainNetSalary({ basic: 1000, allowances: 400 }).employer, 252);
  assert.equal(bahrainNetSalary({ basic: 1000, allowances: 1500 }).employee, 160);
  assert.equal(bahrainNetSalary({ basic: 1000, allowances: 400, year: 2028 }).employer, 280);
  assert.equal(bahrainNetSalary({ national: false, basic: 1000, allowances: 400 }).employer, 100.8);
  assert.equal(bahrainNetSalary({ national: false, basic: 1000, allowances: 400, over3: true }).employer, 159.6);
  assert.equal(omanNetSalary({ gross: 14000, today: "2026-11-03" }).employee, 295);
  assert.equal(omanNetSalary({ gross: 14000, today: "2026-11-03" }).employer, 710);
  assert.equal(omanNetSalary({ gross: 14000, today: "2026-07-01" }).employer, 570);
  assert.equal(omanNetSalary({ gross: 1400, today: "2026-11-03" }).net, 1288);
  assert.equal(omanNetSalary({ national: false, gross: 1400, basic: 1000, today: "2026-11-03" }).employer, 28);
});

test("GCC family residence cost (batch25 worked examples)", () => {
  const d = familyResidenceCost({ country: "ae-dubai", spouse: 1, children: 2, years: 2, insurance: 600 });
  assert.equal(d.firstYear, 4370);
  assert.equal(d.renewalCycle, 1940);
  assert.equal(d.annualAfter, 2770);
  const icp = familyResidenceCost({ country: "ae-icp", spouse: 1, children: 2, years: 2, insurance: 0 });
  assert.equal(icp.firstYear, 3250);
  assert.equal(icp.annualAfter, 1175);
  const q = familyResidenceCost({ country: "qa", spouse: 1, children: 2, years: 1 });
  assert.equal(q.firstYear, 2200);
  assert.equal(q.annualAfter, 1500);
  assert.equal(familyResidenceCost({ country: "qa", spouse: 1, children: 2, years: 3 }).renewalCycle, 3180);
  const k = familyResidenceCost({ country: "kw", spouse: 1, children: 2, years: 1, sponsor: "standard" });
  assert.equal(k.firstYear, 420);
  assert.equal(k.annualAfter, 375);
  assert.equal(familyResidenceCost({ country: "kw", spouse: 1, children: 2, years: 2 }).renewalCycle, 735);
  const b = familyResidenceCost({ country: "bh", spouse: 1, children: 2 });
  assert.equal(b.firstYear, 315);
  assert.equal(b.annualAfter, 142.5);
  const o = familyResidenceCost({ country: "om", spouse: 1, children: 2, childrenOver10: 2, years: 2 });
  assert.equal(o.firstYear, 150);
  assert.equal(o.annualAfter, 75);
  assert.equal(familyResidenceCost({ country: "om", spouse: 1, children: 2, childrenOver10: 0, years: 2 }).firstYear, 130);
  assert.equal(familyResidenceCost({ country: "ae-dubai", spouse: 1, children: 0, salary: 3500 }).eligible, false);
  assert.equal(familyResidenceCost({ country: "ae-dubai", spouse: 1, children: 0, salary: 3500, housing: true }).eligible, true);
  assert.equal(familyResidenceCost({ country: "qa", spouse: 1, salary: 8000, housing: true }).eligible, true);
});

test("Saudi payment dates (batch27 rules)", () => {
  const sal = ksaNextPayDates({ item: "salary", today: "2026-11-03", count: 14 }).map((p) => p.date);
  assert.deepEqual(sal, ["2026-11-26", "2026-12-27", "2027-01-27", "2027-02-28", "2027-03-28", "2027-04-27", "2027-05-27", "2027-06-27", "2027-07-27", "2027-08-26", "2027-09-27", "2027-10-27", "2027-11-28", "2027-12-27"]);
  const cit = ksaNextPayDates({ item: "citizen", today: "2026-11-03", count: 14 });
  assert.deepEqual(cit.map((p) => p.date), ["2026-11-10", "2026-12-10", "2027-01-10", "2027-02-10", "2027-03-10", "2027-04-11", "2027-05-10", "2027-06-10", "2027-07-11", "2027-08-10", "2027-09-09", "2027-10-10", "2027-11-10", "2027-12-09"]);
  assert.equal(cit[4].holiday.id, "eidAlFitr");
  const pen = ksaNextPayDates({ item: "pension", today: "2026-11-03", count: 14 }).map((p) => p.date);
  assert.deepEqual(pen.slice(0, 6), ["2026-12-01", "2026-12-31", "2027-02-01", "2027-03-01", "2027-04-01", "2027-04-29"]);
  assert.equal(pen[10], "2027-09-30");
  assert.deepEqual(ksaNextPayDates({ item: "social", today: "2026-11-03", count: 2 }).map((p) => p.date), ["2026-12-01", "2026-12-31"]);
  assert.equal(ksaPayDate({ item: "disability", year: 2027, month: 2 }).date, "2027-02-28");
  assert.equal(ksaPayDate({ item: "sakani", year: 2027, month: 9 }).date, "2027-09-26");
  assert.equal(ksaPayDate({ item: "salary", year: 2026, month: 5 }).date, "2026-05-24");
  assert.equal(ksaPayDate({ item: "hafiz", year: 2027, month: 2 }).unsure, true);
  const soc = ksaNextPayDates({ item: "social", today: "2026-12-02", count: 1 })[0];
  assert.equal(soc.date, "2026-12-31");
  assert.equal(soc.days, 29);
  assert.equal(ksaNextPayDates({ item: "salary", today: "2026-11-26", count: 1 })[0].days, 0);
  assert.equal(ksaNextPayDates({ item: "salary", today: "2026-11-27", count: 1 })[0].date, "2026-12-27");
  const c = ksaPayCountdown({ today: "2026-11-03" });
  assert.equal(c[0].item, "hafiz");
  assert.equal(c.find((p) => p.item === "salary").days, 23);
});

test("GCC final settlement (Qatar, Kuwait, Oman, Bahrain)", () => {
  const q = gccFinalSettlement({ country: "qa", basic: 6000, allowances: 3000, start: "2020-01-01", end: "2026-10-31", leaveDays: 15, noticeCase: "employer", servedDays: 30, salaryDays: 10 });
  assert.equal(q.eosTotal, 28700);
  assert.equal(q.notice, 6000);
  assert.equal(q.total, 40700);
  assert.equal(gccFinalSettlement({ country: "qa", basic: 6000, start: "2020-01-01", end: "2026-10-31", forfeited: true }).eosTotal, 0);
  const k = gccFinalSettlement({ country: "kw", basic: 600, allowances: 200, start: "2020-01-01", end: "2026-10-31", endedBy: "worker", leaveDays: 10 });
  assert.equal(k.eosTotal, 2516.24);
  assert.equal(k.total, 2823.93);
  const kn = gccFinalSettlement({ country: "kw", basic: 800, start: "2024-01-01", end: "2026-10-31", noticeCase: "worker", servedDays: 30 });
  assert.equal(kn.notice, -1600);
  const o = gccFinalSettlement({ country: "om", basic: 600, allowances: 200, start: "2020-01-01", end: "2026-10-31", leaveDays: 10 });
  assert.equal(o.total, 3467.63);
  const b = gccFinalSettlement({ country: "bh", basic: 500, social: 100, allowances: 100, start: "2020-01-01", end: "2026-10-31", leaveDays: 10 });
  assert.equal(b.total, 3400);
  assert.equal(b.sio, 1600);
  assert.equal(b.fromEmployer, 1800);
});
