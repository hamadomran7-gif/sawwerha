// حاسبات «مستحقاتي» — دوال نقية بلا أي اعتماد على المتصفح.
// كل رقم قانوني يأتي من rules.js (المولَّد من rules.json). لا أرقام مكتوبة يدوياً هنا.
import rules from "./rules.js";

export { rules };

const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export const round2 = r2;

/* ------------------------------------------------------------------ */
/* مدة الخدمة                                                          */
/* ------------------------------------------------------------------ */

function toUTC(d) {
  const x = d instanceof Date ? d : new Date(d);
  return new Date(Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()));
}

function daysInMonthUTC(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * مدة الخدمة بين تاريخ المباشرة وآخر يوم عمل (شاملاً اليوم الأخير).
 * تُطرح أيام الإجازة بدون راتب من المدة.
 * المدة العشرية = سنوات + أشهر/12 + أيام/365 (الطريقة المتعارف عليها في الموارد البشرية).
 */
export function serviceDuration(start, end, unpaidDays = 0) {
  const s = toUTC(start);
  const e = toUTC(end);
  if (isNaN(s) || isNaN(e) || e < s) return null;
  const eInc = new Date(e.getTime() + 86400000); // اليوم الأخير محسوب
  let years = eInc.getUTCFullYear() - s.getUTCFullYear();
  let months = eInc.getUTCMonth() - s.getUTCMonth();
  let days = eInc.getUTCDate() - s.getUTCDate();
  if (days < 0) {
    months -= 1;
    const pm = eInc.getUTCMonth() === 0 ? 11 : eInc.getUTCMonth() - 1;
    const py = eInc.getUTCMonth() === 0 ? eInc.getUTCFullYear() - 1 : eInc.getUTCFullYear();
    days += daysInMonthUTC(py, pm);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  let totalDays = Math.round((eInc - s) / 86400000) - Math.max(0, unpaidDays | 0);
  if (totalDays < 0) totalDays = 0;
  // طرح أيام بدون راتب من المدة التقويمية
  days -= Math.max(0, unpaidDays | 0);
  while (days < 0) {
    if (months > 0) {
      months -= 1;
      days += 30;
    } else if (years > 0) {
      years -= 1;
      months += 11;
      days += 30;
    } else {
      days = 0;
      break;
    }
  }
  const decimalYears = years + months / 12 + days / 365;
  return { years, months, days, totalDays, decimalYears };
}

/* ------------------------------------------------------------------ */
/* الإمارات — مكافأة نهاية الخدمة                                      */
/* ------------------------------------------------------------------ */

/**
 * المادة 51 من المرسوم بقانون اتحادي 33/2021:
 * 21 يوماً من الأجر الأساسي عن كل سنة من السنوات الخمس الأولى، و30 يوماً عمّا زاد،
 * بشرط إكمال سنة خدمة، وبحد أقصى أجر سنتين، مع استحقاق نسبي عن أجزاء السنة.
 */
export function uaeGratuity({ basicSalary, years }) {
  const g = rules.ae.gratuity;
  const basic = Number(basicSalary) || 0;
  const y = Math.max(0, Number(years) || 0);
  const dailyWage = basic / g.daysPerMonth;
  const eligible = y >= g.minServiceYears && basic > 0;
  const firstYears = Math.min(y, g.firstPeriodYears);
  const secondYears = Math.max(0, y - g.firstPeriodYears);
  const firstAmount = eligible ? firstYears * g.daysFirstFiveYears * dailyWage : 0;
  const secondAmount = eligible ? secondYears * g.daysAfterFiveYears * dailyWage : 0;
  const gross = firstAmount + secondAmount;
  const cap = basic * 12 * g.capYearsOfWage;
  const total = Math.min(gross, cap);
  return {
    eligible,
    dailyWage: r2(dailyWage),
    firstYears: r2(firstYears),
    secondYears: r2(secondYears),
    firstDays: r2(firstYears * g.daysFirstFiveYears),
    secondDays: r2(secondYears * g.daysAfterFiveYears),
    firstAmount: r2(firstAmount),
    secondAmount: r2(secondAmount),
    gross: r2(gross),
    cap: r2(cap),
    capped: gross > cap,
    total: r2(total),
  };
}

/* ------------------------------------------------------------------ */
/* السعودية — مكافأة نهاية الخدمة                                      */
/* ------------------------------------------------------------------ */

export const KSA_REASONS = {
  contract_end: "انتهاء مدة العقد أو إنهاؤه من صاحب العمل",
  resignation: "استقالة العامل",
  resignation_marriage: "استقالة العاملة خلال 6 أشهر من الزواج",
  resignation_childbirth: "استقالة العاملة خلال 3 أشهر من الوضع",
  force_majeure: "ترك العمل لقوة قاهرة خارجة عن الإرادة (المادة 87)",
  article_80: "فسخ العقد لإحدى حالات المادة 80",
};

/**
 * المادة 84: نصف شهر عن كل سنة من السنوات الخمس الأولى وشهر كامل عمّا زاد،
 * على أساس الأجر الأخير، مع استحقاق نسبي عن أجزاء السنة.
 * المادة 85: عند الاستقالة: لا شيء دون سنتين، الثلث من سنتين إلى خمس،
 * الثلثان فوق خمس ودون عشر، والمكافأة كاملة من عشر سنوات فأكثر.
 * المادة 87: الاستقالة لقوة قاهرة أو زواج/وضع ⇒ المكافأة كاملة.
 */
export function ksaEndOfService({ wage, years, reason = "contract_end" }) {
  const e = rules.sa.eos;
  const w = Number(wage) || 0;
  const y = Math.max(0, Number(years) || 0);
  const firstYears = Math.min(y, e.halfMonthYears);
  const secondYears = Math.max(0, y - e.halfMonthYears);
  const firstAmount = firstYears * e.firstPeriodFraction * w;
  const secondAmount = secondYears * e.afterPeriodFraction * w;
  const gross = firstAmount + secondAmount;
  let fraction = 1;
  let rule = "المكافأة كاملة (المادة 84)";
  if (reason === "article_80") {
    fraction = 0;
    rule = "لا تُستحق المكافأة عند الفسخ لإحدى حالات المادة 80";
  } else if (reason === "resignation") {
    if (y < 2) {
      fraction = 0;
      rule = "استقالة قبل إكمال سنتين: لا تُستحق المكافأة (المادة 85)";
    } else if (y <= 5) {
      fraction = 1 / 3;
      rule = "استقالة بعد سنتين وحتى خمس سنوات: ثلث المكافأة (المادة 85)";
    } else if (y < 10) {
      fraction = 2 / 3;
      rule = "استقالة بعد أكثر من خمس ودون عشر سنوات: ثلثا المكافأة (المادة 85)";
    } else {
      fraction = 1;
      rule = "استقالة بعد عشر سنوات فأكثر: المكافأة كاملة (المادة 85)";
    }
  } else if (reason === "resignation_marriage" || reason === "resignation_childbirth" || reason === "force_majeure") {
    fraction = 1;
    rule = "استثناء المادة 87: المكافأة كاملة رغم الاستقالة";
  }
  const total = gross * fraction;
  return {
    firstYears: r2(firstYears),
    secondYears: r2(secondYears),
    firstAmount: r2(firstAmount),
    secondAmount: r2(secondAmount),
    gross: r2(gross),
    fraction: Math.round(fraction * 1000) / 1000,
    rule,
    total: r2(total),
  };
}

/* ------------------------------------------------------------------ */
/* السعودية — التأمينات الاجتماعية والراتب الصافي                      */
/* ------------------------------------------------------------------ */

/** نسبة فرع المعاشات للمشترك الجديد (بدأ بعد 3 يوليو 2024): 9% ثم +0.5% كل سنة حتى 11%. */
export function gosiNewEntrantPensionRate(asOf = new Date()) {
  const g = rules.sa.gosi;
  const first = new Date(g.firstStepDate + "T00:00:00Z");
  const d = toUTC(asOf);
  let steps = 0;
  if (d >= first) {
    steps = d.getUTCFullYear() - first.getUTCFullYear() + 1;
    const anniv = new Date(Date.UTC(d.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate()));
    if (d < anniv) steps -= 1;
  }
  const rate = g.pensionRateNewStart + steps * g.pensionRateNewStep;
  return Math.min(rate, g.pensionRateNewMax);
}

/**
 * اشتراك التأمينات: الوعاء = الأساسي + بدل السكن النقدي، بسقف 45,000.
 * السعودي: معاشات (9% أو نسبة المشترك الجديد) + ساند 0.75% على الموظف،
 * وصاحب العمل: المعاشات + الأخطار المهنية 2% + ساند 0.75%.
 * غير السعودي: الأخطار المهنية 2% على صاحب العمل فقط، ولا خصم من الموظف.
 */
export function gosiContribution({ basic, housing = 0, isSaudi = true, newSubscriber = false, asOf = new Date() }) {
  const g = rules.sa.gosi;
  const base = Math.min(Math.max(0, (Number(basic) || 0) + (Number(housing) || 0)), g.wageCeiling);
  const pensionRate = isSaudi ? (newSubscriber ? gosiNewEntrantPensionRate(asOf) : g.pensionRateLegacy) : 0;
  const employeeRate = isSaudi ? pensionRate + g.sanedRate : 0;
  const employerRate = isSaudi ? pensionRate + g.hazardsRate + g.sanedRate : g.hazardsRate;
  return {
    base: r2(base),
    capped: (Number(basic) || 0) + (Number(housing) || 0) > g.wageCeiling,
    pensionRate,
    employeeRate: Math.round(employeeRate * 10000) / 10000,
    employerRate: Math.round(employerRate * 10000) / 10000,
    employeeAmount: r2(base * employeeRate),
    employerAmount: r2(base * employerRate),
    pensionEmployee: r2(base * pensionRate),
    sanedEmployee: r2(isSaudi ? base * g.sanedRate : 0),
    hazardsEmployer: r2(base * g.hazardsRate),
  };
}

export function ksaNetSalary({ basic, housing = 0, transport = 0, other = 0, isSaudi = true, newSubscriber = false, asOf = new Date() }) {
  const gross = (Number(basic) || 0) + (Number(housing) || 0) + (Number(transport) || 0) + (Number(other) || 0);
  const gosi = gosiContribution({ basic, housing, isSaudi, newSubscriber, asOf });
  return { gross: r2(gross), gosi, net: r2(gross - gosi.employeeAmount), annualNet: r2((gross - gosi.employeeAmount) * 12) };
}

/* ------------------------------------------------------------------ */
/* الإمارات — العمل الإضافي                                            */
/* ------------------------------------------------------------------ */

export const UAE_OT_TYPES = {
  day: "ساعات إضافية في يوم عمل عادي (+25%)",
  night: "ساعات إضافية بين 10 مساءً و4 صباحاً (+50%)",
  restday: "عمل في يوم الراحة الأسبوعية (+50%)",
  holiday: "عمل في عطلة رسمية (+50%)",
};

export function uaeOvertime({ basicSalary, hours, type = "day" }) {
  const o = rules.ae.overtime;
  const basic = Number(basicSalary) || 0;
  const h = Math.max(0, Number(hours) || 0);
  const dailyWage = basic / o.daysPerMonth;
  const hourlyWage = dailyWage / o.hoursPerDay;
  const multiplier = type === "day" ? o.dayMultiplier : type === "night" ? o.nightMultiplier : o.restDayMultiplier;
  const pay = hourlyWage * multiplier * h;
  const premiumOnly = hourlyWage * (multiplier - 1) * h;
  return { dailyWage: r2(dailyWage), hourlyWage: r2(hourlyWage), multiplier, pay: r2(pay), premiumOnly: r2(premiumOnly) };
}

/* ------------------------------------------------------------------ */
/* الإجازات                                                            */
/* ------------------------------------------------------------------ */

/** رصيد الإجازة السنوية المستحق في الإمارات بحسب مدة الخدمة (المادة 29). */
export function uaeLeaveAccrued({ years, months, days = 0 }) {
  const l = rules.ae.annualLeave;
  const y = Math.max(0, Number(years) || 0);
  const m = Math.max(0, Number(months) || 0);
  const d = Math.max(0, Number(days) || 0);
  const totalMonths = y * 12 + m + d / 30;
  if (totalMonths < 12) {
    if (totalMonths <= 6) return { accruedDays: 0, note: "لا يُستحق رصيد قبل إكمال ستة أشهر من الخدمة" };
    return {
      accruedDays: r2(Math.floor(totalMonths) * l.daysPerMonthAfterSixMonths),
      note: "خلال السنة الأولى وبعد إكمال ستة أشهر: يومان عن كل شهر خدمة",
    };
  }
  return { accruedDays: r2((totalMonths / 12) * l.daysPerYear), note: "ثلاثون يوماً عن كل سنة خدمة، وبالنسبة عن أجزاء السنة" };
}

export function uaeLeaveEncashment({ basicSalary, unusedDays }) {
  const l = rules.ae.annualLeave;
  const daily = (Number(basicSalary) || 0) / l.daysPerMonth;
  return { dailyWage: r2(daily), amount: r2(daily * Math.max(0, Number(unusedDays) || 0)) };
}

/** السعودية: 21 يوماً سنوياً، و30 يوماً بعد خمس سنوات متصلة (المادة 109)؛ البدل على أساس الأجر (المادة 111). */
export function ksaLeave({ wage, yearsOfService, usedDays = 0, monthsInCurrentYear = 12 }) {
  const l = rules.sa.annualLeave;
  const y = Math.max(0, Number(yearsOfService) || 0);
  const entitlement = y >= l.afterYears ? l.daysPerYearAfterFive : l.daysPerYear;
  const accrued = (entitlement * Math.min(12, Math.max(0, Number(monthsInCurrentYear) || 0))) / 12;
  const remaining = Math.max(0, accrued - (Number(usedDays) || 0));
  const daily = (Number(wage) || 0) / l.daysPerMonth;
  return { entitlement, accrued: r2(accrued), remaining: r2(remaining), dailyWage: r2(daily), amount: r2(daily * remaining) };
}

/* ------------------------------------------------------------------ */
/* القروض                                                              */
/* ------------------------------------------------------------------ */

/**
 * قسط القرض. method = "reducing" (فائدة متناقصة، وهي الطريقة النظامية) أو "flat" (فائدة ثابتة على الأصل).
 * annualRatePct بالنسبة المئوية السنوية.
 */
export function loanInstallment({ principal, annualRatePct, months, method = "reducing" }) {
  const P = Math.max(0, Number(principal) || 0);
  const n = Math.max(1, Math.round(Number(months) || 1));
  const rate = Math.max(0, Number(annualRatePct) || 0) / 100;
  let installment;
  if (method === "flat") {
    installment = (P + (P * rate * n) / 12) / n;
  } else {
    const i = rate / 12;
    installment = i === 0 ? P / n : (P * i) / (1 - Math.pow(1 + i, -n));
  }
  const totalPayment = installment * n;
  const totalInterest = totalPayment - P;
  // المعدل المكافئ للفائدة الثابتة (تقريب) لتوضيح الفرق
  const equivalentReducing = method === "flat" && n > 1 ? r2(((2 * n * (rate * 100)) / (n + 1)) * 1) : null;
  return {
    installment: r2(installment),
    totalPayment: r2(totalPayment),
    totalInterest: r2(totalInterest),
    equivalentReducingPct: equivalentReducing,
  };
}

export function uaePersonalLoanCheck({ principal, months, salary, installment, otherObligations = 0 }) {
  const p = rules.ae.personalLoan;
  const sal = Number(salary) || 0;
  const maxAmount = sal * p.maxSalaryMultiple;
  const maxInstallment = sal * p.maxDeductionRatio;
  const totalObligations = (Number(installment) || 0) + (Number(otherObligations) || 0);
  return {
    maxAmount: r2(maxAmount),
    maxMonths: p.maxMonths,
    maxInstallment: r2(maxInstallment),
    dbr: sal > 0 ? Math.round((totalObligations / sal) * 10000) / 100 : null,
    amountOk: (Number(principal) || 0) <= maxAmount,
    monthsOk: (Number(months) || 0) <= p.maxMonths,
    dbrOk: totalObligations <= maxInstallment,
  };
}

export function ksaFinanceCheck({ installment, salary, otherObligations = 0, retiree = false }) {
  const f = rules.sa.finance;
  const sal = Number(salary) || 0;
  const limit = retiree ? f.maxDeductionRetiree : f.maxDeductionEmployee;
  const total = (Number(installment) || 0) + (Number(otherObligations) || 0);
  return {
    limitPct: limit * 100,
    maxInstallment: r2(sal * limit),
    ratio: sal > 0 ? Math.round((total / sal) * 10000) / 100 : null,
    ok: total <= sal * limit,
  };
}

/* ------------------------------------------------------------------ */
/* دبي — الرهن العقاري ورسوم الشراء                                     */
/* ------------------------------------------------------------------ */

export function uaeMortgageLtv({ price, buyerType = "expat", purpose = "first", offplan = false }) {
  const m = rules.ae.mortgage;
  if (offplan) return m.ltv.offplan;
  const t = m.ltv[buyerType] || m.ltv.expat;
  if (purpose === "second") return t.second;
  return (Number(price) || 0) > m.priceThreshold ? t.firstOver5m : t.firstUnder5m;
}

export function dubaiPurchaseCosts({
  price,
  buyerType = "expat",
  purpose = "first",
  offplan = false,
  useMortgage = true,
  annualRatePct = 4.5,
  years = 25,
  includeAgent = true,
  bankFeePct = 1,
}) {
  const d = rules.ae.dld;
  const P = Math.max(0, Number(price) || 0);
  const ltv = useMortgage ? uaeMortgageLtv({ price: P, buyerType, purpose, offplan }) : 0;
  const loan = P * ltv;
  const downPayment = P - loan;
  const transferFee = P * d.transferFeePct;
  const trusteeFee = (P > d.trusteeThreshold ? d.trusteeFeeOver500k : d.trusteeFeeUnder500k) * (1 + d.vat);
  const titleFee = d.titleDeedFee + d.adminFees;
  const mortgageReg = useMortgage ? loan * d.mortgageRegistrationPct + d.mortgageRegistrationFixed : 0;
  const valuation = useMortgage ? d.valuationFeeTypical : 0;
  const bankFee = useMortgage ? loan * (Math.max(0, Number(bankFeePct) || 0) / 100) : 0;
  const agent = includeAgent ? P * d.agentCommissionPct * (1 + d.vat) : 0;
  const fees = transferFee + trusteeFee + titleFee + mortgageReg + valuation + bankFee + agent;
  const inst = useMortgage ? loanInstallment({ principal: loan, annualRatePct, months: Math.round(years * 12) }) : null;
  return {
    ltv,
    loan: r2(loan),
    downPayment: r2(downPayment),
    transferFee: r2(transferFee),
    trusteeFee: r2(trusteeFee),
    titleFee: r2(titleFee),
    mortgageReg: r2(mortgageReg),
    valuation: r2(valuation),
    bankFee: r2(bankFee),
    agent: r2(agent),
    fees: r2(fees),
    cashNeeded: r2(downPayment + fees),
    installment: inst ? inst.installment : 0,
    totalInterest: inst ? inst.totalInterest : 0,
  };
}

/* ------------------------------------------------------------------ */
/* الإمارات — التأمين ضد التعطل ILOE                                   */
/* ------------------------------------------------------------------ */

export function iloe({ basicSalary }) {
  const i = rules.ae.iloe;
  const basic = Math.max(0, Number(basicSalary) || 0);
  const category = basic <= i.categoryAMaxBasic ? "A" : "B";
  const cap = category === "A" ? i.capA : i.capB;
  const premium = category === "A" ? i.premiumA : i.premiumB;
  const monthly = Math.min(basic * i.compensationRate, cap);
  return {
    category,
    premium,
    annualPremium: premium * 12,
    monthly: r2(monthly),
    capped: basic * i.compensationRate > cap,
    cap,
    total: r2(monthly * i.maxMonths),
    months: i.maxMonths,
  };
}

/* ------------------------------------------------------------------ */
/* ضريبة القيمة المضافة                                                */
/* ------------------------------------------------------------------ */

export function vat({ amount, ratePct, mode = "add" }) {
  const a = Math.max(0, Number(amount) || 0);
  const rate = Math.max(0, Number(ratePct) || 0) / 100;
  if (mode === "extract") {
    const net = a / (1 + rate);
    return { net: r2(net), tax: r2(a - net), gross: r2(a) };
  }
  return { net: r2(a), tax: r2(a * rate), gross: r2(a * (1 + rate)) };
}

/* ------------------------------------------------------------------ */
/* العمر                                                               */
/* ------------------------------------------------------------------ */

export function ageCalc({ birth, asOf = new Date() }) {
  const b = toUTC(birth);
  const t = toUTC(asOf);
  if (isNaN(b) || isNaN(t) || t < b) return null;
  let years = t.getUTCFullYear() - b.getUTCFullYear();
  let months = t.getUTCMonth() - b.getUTCMonth();
  let days = t.getUTCDate() - b.getUTCDate();
  if (days < 0) {
    months -= 1;
    const pm = t.getUTCMonth() === 0 ? 11 : t.getUTCMonth() - 1;
    const py = t.getUTCMonth() === 0 ? t.getUTCFullYear() - 1 : t.getUTCFullYear();
    days += daysInMonthUTC(py, pm);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalDays = Math.round((t - b) / 86400000);
  let next = new Date(Date.UTC(t.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()));
  if (next <= t) next = new Date(Date.UTC(t.getUTCFullYear() + 1, b.getUTCMonth(), b.getUTCDate()));
  const daysToBirthday = Math.round((next - t) / 86400000);
  return { years, months, days, totalDays, daysToBirthday };
}

/** التاريخ الهجري (أم القرى) عبر Intl؛ يُعيد null إذا لم يدعمه المحرك. */
export function hijriParts(date) {
  try {
    const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric" });
    const parts = Object.fromEntries(fmt.formatToParts(toUTC(date)).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
    const y = parseInt(String(parts.year).replace(/\D/g, ""), 10);
    const m = parseInt(parts.month, 10);
    const d = parseInt(parts.day, 10);
    if (!y || !m || !d) return null;
    return { year: y, month: m, day: d };
  } catch {
    return null;
  }
}

export const HIJRI_MONTHS = ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];

/** عمر تقريبي بالسنوات الهجرية (السنة الهجرية ≈ 354.367 يوماً). */
export function hijriAgeFromDays(totalDays) {
  const y = Math.floor(totalDays / 354.367);
  const rem = totalDays - y * 354.367;
  const m = Math.floor(rem / 29.53);
  const d = Math.floor(rem - m * 29.53);
  return { years: y, months: m, days: d };
}
