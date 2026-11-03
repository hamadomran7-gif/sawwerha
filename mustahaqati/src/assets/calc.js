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
  resignation: "استقالة من عقد محدد المدة (المادة 79 مكرر)",
  worker_notice: "إنهاء العامل عقداً غير محدد المدة بإشعار (المادة 75)",
  mutual: "اتفاق الطرفين كتابةً على الإنهاء",
  article_81: "ترك العامل العمل لإحدى حالات المادة 81",
  resignation_marriage: "استقالة العاملة خلال 6 أشهر من الزواج",
  resignation_childbirth: "استقالة العاملة خلال 3 أشهر من الوضع",
  force_majeure: "ترك العمل لقوة قاهرة خارجة عن الإرادة (المادة 87)",
  article_80: "فسخ العقد لإحدى حالات المادة 80",
  probation: "إنهاء العقد خلال فترة التجربة",
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
  } else if (reason === "probation") {
    fraction = 0;
    rule = "لا تُستحق المكافأة عند إنهاء العقد خلال فترة التجربة (المادة 54)";
  } else if (reason === "article_81") {
    fraction = 1;
    rule = "ترك العمل لإحدى حالات المادة 81 يحفظ حقوقك كلها: المكافأة كاملة (المادة 84)";
  } else if (reason === "mutual") {
    fraction = 1;
    rule = "إنهاء العقد باتفاق الطرفين كتابةً: المكافأة كاملة (المادة 84)";
  } else if (reason === "resignation" || reason === "worker_notice") {
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
    disputed: reason === "worker_notice" && fraction < 1,
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

/** inKindHousing: قيمة السكن العيني (سدس الأساسي) — تدخل وعاء الاشتراك ولا تدخل الراتب النقدي. */
export function ksaNetSalary({ basic, housing = 0, transport = 0, other = 0, inKindHousing = 0, isSaudi = true, newSubscriber = false, asOf = new Date() }) {
  const gross = (Number(basic) || 0) + (Number(housing) || 0) + (Number(transport) || 0) + (Number(other) || 0);
  const gosi = gosiContribution({ basic, housing: (Number(housing) || 0) + (Number(inKindHousing) || 0), isSaudi, newSubscriber, asOf });
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
    const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" });
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

/* ------------------------------------------------------------------ */
/* بقية دول الخليج — مكافأة نهاية الخدمة                               */
/* ------------------------------------------------------------------ */

const dayBefore = (iso) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};
const isoOf = (x) => toUTC(x).toISOString().slice(0, 10);

/** مدة الخدمة بالسنوات العشرية لجزء من الفترة يقع بين حدّين (شاملاً اليوم الأخير)، أو 0. */
function segmentYears(start, end, from, to) {
  const s = isoOf(start) > from ? isoOf(start) : from;
  const e = isoOf(end) < to ? isoOf(end) : to;
  if (e < s) return 0;
  const d = serviceDuration(s, e, 0);
  return d ? d.decimalYears : 0;
}

/**
 * قطر — المادة 54: أجر 21 يوماً (3 أسابيع) من الأجر الأساسي الأخير عن كل سنة كحد أدنى،
 * بعد سنة خدمة، بلا سقف ولا تخفيض عند الاستقالة. تسقط عند الفصل وفق المادة 61.
 */
export function qatarGratuity({ basicSalary, years, forfeited = false }) {
  const q = rules.qa.eos;
  const basic = Number(basicSalary) || 0;
  const y = Math.max(0, Number(years) || 0);
  const dailyWage = basic / q.daysPerMonth;
  const eligible = y >= q.minServiceYears && basic > 0 && !forfeited;
  const days = y * q.daysPerYear;
  const total = eligible ? days * dailyWage : 0;
  return { eligible, forfeited, dailyWage: r2(dailyWage), days: r2(days), total: r2(total) };
}

export const KW_REASONS = {
  employer: "إنهاء العقد من صاحب العمل أو انتهاء العقد محدد المدة",
  resignation: "استقالة العامل من عقد غير محدد المدة",
  marriage: "إنهاء العاملة العقد خلال سنة من الزواج",
  forfeit: "فصل وفق المادة 41/أ (خسارة جسيمة، غش، إفشاء أسرار)",
};

/**
 * الكويت — المادة 51/ب (الأجر الشهري): 15 يوماً عن كل سنة من أول 5 سنوات ثم أجر شهر عن كل سنة،
 * بسقف أجر 18 شهراً، على آخر أجر شامل. المادة 53: الاستقالة ⇒ لا شيء دون 3 سنوات، النصف حتى 5، الثلثان حتى 10، ثم كاملة.
 * الأجر اليومي = الشهري ÷ 26 (الممارسة المتبعة) أو ÷ 30.
 */
export function kuwaitIndemnity({ wage, years, reason = "employer", divisor }) {
  const k = rules.kw.eos;
  const w = Number(wage) || 0;
  const y = Math.max(0, Number(years) || 0);
  const div = Number(divisor) || k.divisor;
  const dailyWage = w / div;
  const firstYears = Math.min(y, k.firstYears);
  const secondYears = Math.max(0, y - k.firstYears);
  const firstAmount = firstYears * k.daysFirst * dailyWage;
  const secondAmount = secondYears * k.monthsAfter * w;
  const uncapped = firstAmount + secondAmount;
  const cap = k.capMonths * w;
  const gross = Math.min(uncapped, cap);
  let fraction = 1;
  if (reason === "forfeit") fraction = 0;
  else if (reason === "resignation") {
    const t = k.resignation.find((b) => y >= b.minYears && (b.maxYears === null || y < b.maxYears));
    fraction = t ? t.fraction : 1;
  }
  return {
    divisor: div,
    dailyWage: r2(dailyWage),
    firstYears: r2(firstYears),
    secondYears: r2(secondYears),
    firstAmount: r2(firstAmount),
    secondAmount: r2(secondAmount),
    cap: r2(cap),
    capped: uncapped > cap,
    gross: r2(gross),
    fraction: Math.round(fraction * 1000) / 1000,
    total: r2(gross * fraction),
  };
}

/**
 * عُمان — غير العمانيين: المادة 61 من قانون 53/2023 (أجر شهر أساسي عن كل سنة منذ 31/7/2023).
 * المدة قبل ذلك بأحكام القانون السابق وفق موقف وزارة العمل: 15 يوماً عن كل سنة من أول 3 سنوات خدمة ثم شهر.
 */
export function omanGratuity({ basicSalary, start, end }) {
  const o = rules.om.eos;
  const basic = Number(basicSalary) || 0;
  if (!start || !end || isoOf(end) < isoOf(start)) return null;
  const preYears = segmentYears(start, end, "1900-01-01", dayBefore(o.cutoff));
  const postYears = segmentYears(start, end, o.cutoff, "2999-12-31");
  const preMonths = Math.min(preYears, o.legacyFirstYears) * o.legacyMonthsFirst + Math.max(0, preYears - o.legacyFirstYears) * o.legacyMonthsAfter;
  const postMonths = postYears * o.currentMonthsPerYear;
  const months = preMonths + postMonths;
  const literalMonths = (preYears + postYears) * o.currentMonthsPerYear;
  return {
    preYears: r2(preYears),
    postYears: r2(postYears),
    preMonths: Math.round(preMonths * 1000) / 1000,
    postMonths: Math.round(postMonths * 1000) / 1000,
    preAmount: r2(preMonths * basic),
    postAmount: r2(postMonths * basic),
    total: r2(months * basic),
    literalTotal: r2(literalMonths * basic),
  };
}

/**
 * البحرين — غير البحرينيين: المادة 116 (والمادة 9 من القرار 109/2023): نصف شهر عن كل سنة من أول 3 سنوات ثم شهر،
 * على الأجر الأخير (الأساسي + العلاوة الاجتماعية)، بلا حد أدنى ولا سقف ولا تخفيض للاستقالة.
 * منذ 1/3/2024 تصرف هيئة التأمين الاجتماعي الجزء اللاحق، ويدفع صاحب العمل ما قبله.
 */
export function bahrainGratuity({ wage, start, end }) {
  const b = rules.bh.eos;
  const w = Number(wage) || 0;
  if (!start || !end || isoOf(end) < isoOf(start)) return null;
  const monthsFor = (y) => Math.min(y, b.firstYears) * b.monthsFirst + Math.max(0, y - b.firstYears) * b.monthsAfter;
  const totalYears = segmentYears(start, end, "1900-01-01", "2999-12-31");
  const employerYears = segmentYears(start, end, "1900-01-01", dayBefore(b.sioStart));
  const totalMonths = monthsFor(totalYears);
  const employerMonths = monthsFor(employerYears);
  return {
    years: r2(totalYears),
    employerYears: r2(employerYears),
    sioYears: r2(Math.max(0, totalYears - employerYears)),
    months: Math.round(totalMonths * 1000) / 1000,
    total: r2(totalMonths * w),
    employerAmount: r2(employerMonths * w),
    sioAmount: r2((totalMonths - employerMonths) * w),
  };
}

/* ------------------------------------------------------------------ */
/* الإجازات والإنذار والإنهاء — الإمارات والسعودية                     */
/* ------------------------------------------------------------------ */

/** يوزّع أيام الإجازة على الشرائح ويحسب المدفوع. */
function tierPay(days, tiers, daily) {
  let remaining = Math.max(0, Math.floor(Number(days) || 0));
  const rows = [];
  let paid = 0;
  for (const t of tiers) {
    const d = Math.min(remaining, t.days);
    const amount = d * daily * t.frac;
    rows.push({ days: d, frac: t.frac, amount: r2(amount) });
    paid += amount;
    remaining -= d;
  }
  return { rows, paid, over: remaining };
}

/** الإمارات — المادة 31: 90 يوماً لكل سنة خدمة بعد التجربة: 15 بأجر كامل، 30 بنصفه، 45 بلا أجر. */
export function uaeSickLeave({ wage, days, probation = false }) {
  const s = rules.ae.sickLeave;
  const w = Number(wage) || 0;
  const d = Math.max(0, Math.floor(Number(days) || 0));
  const daily = w / s.daysPerMonth;
  const counted = Math.min(d, s.maxDays);
  if (probation) return { probation: true, daily: r2(daily), rows: [], paid: 0, normal: r2(d * daily), deduction: r2(d * daily), exceeded: false };
  const t = tierPay(counted, s.tiers, daily);
  return { probation: false, daily: r2(daily), rows: t.rows, paid: r2(t.paid), normal: r2(counted * daily), deduction: r2(counted * daily - t.paid), exceeded: d > s.maxDays };
}

/** الإمارات — المادة 30: 60 يوماً (45 كامل + 15 نصف)، وإضافات اختيارية. */
export function uaeMaternity({ wage, extraUnpaidDays = 0, sickChild = false, sickChildUnpaid = false }) {
  const m = rules.ae.maternity;
  const w = Number(wage) || 0;
  const daily = w / m.daysPerMonth;
  const full = m.fullPayDays * daily;
  const half = m.halfPayDays * daily * 0.5;
  const extra = Math.min(Math.max(0, Math.floor(Number(extraUnpaidDays) || 0)), m.extraUnpaidMaxDays);
  const child = sickChild ? m.sickChildFullPayDays * daily : 0;
  const childUnpaid = sickChild && sickChildUnpaid ? m.sickChildUnpaidDays : 0;
  const totalDays = m.fullPayDays + m.halfPayDays + extra + (sickChild ? m.sickChildFullPayDays : 0) + childUnpaid;
  const paid = full + half + child;
  return { daily: r2(daily), full: r2(full), half: r2(half), extraUnpaidDays: extra, child: r2(child), childUnpaidDays: childUnpaid, totalDays, paid: r2(paid), normal: r2(totalDays * daily), deduction: r2(totalDays * daily - paid) };
}

/** الإمارات — المادة 43: بدل الإنذار = آخر أجر شامل عن المهلة أو الجزء غير المراعى منها. */
export function uaeNoticePay({ wage, noticeDays, servedDays = 0 }) {
  const n = rules.ae.notice;
  const w = Number(wage) || 0;
  const nd = Math.min(Math.max(Number(noticeDays) || n.minDays, n.minDays), n.maxDays);
  const served = Math.min(Math.max(0, Math.floor(Number(servedDays) || 0)), nd);
  const daily = w / n.daysPerMonth;
  const remaining = nd - served;
  return { noticeDays: nd, servedDays: served, remainingDays: remaining, daily: r2(daily), amount: r2(remaining * daily), adjusted: nd !== Number(noticeDays) };
}

/** الإمارات — المادة 9: الإخطار خلال فترة التجربة والتعويض عن مخالفته. */
export function uaeProbationNotice({ wage, who = "employer", servedDays = 0 }) {
  const n = rules.ae.notice;
  const days = who === "employer" ? n.probationEmployerDays : who === "to_uae_employer" ? n.probationToUaeEmployerDays : n.probationLeavingUaeDays;
  const daily = (Number(wage) || 0) / n.daysPerMonth;
  const remaining = Math.max(0, days - Math.max(0, Math.floor(Number(servedDays) || 0)));
  return { noticeDays: days, remainingDays: remaining, daily: r2(daily), amount: r2(remaining * daily) };
}

/** السعودية — المادة 117: خلال سنة تبدأ من أول إجازة مرضية: 30 كامل، 60 بثلاثة أرباع، 30 بلا أجر. */
export function ksaSickLeave({ wage, days }) {
  const s = rules.sa.sickLeave;
  const w = Number(wage) || 0;
  const d = Math.max(0, Math.floor(Number(days) || 0));
  const daily = w / s.daysPerMonth;
  const counted = Math.min(d, s.maxDays);
  const t = tierPay(counted, s.tiers, daily);
  return { daily: r2(daily), rows: t.rows, paid: r2(t.paid), normal: r2(counted * daily), deduction: r2(counted * daily - t.paid), exceeded: d > s.maxDays };
}

/** السعودية — المادة 77: 15 يوماً عن كل سنة (غير محدد المدة) أو أجر المدة الباقية (محدد)، بحد أدنى أجر شهرين. */
export function ksaArt77({ wage, type = "indefinite", years = 0, remainingDays = 0 }) {
  const a = rules.sa.art77;
  const w = Number(wage) || 0;
  const daily = w / a.daysPerMonth;
  const base = type === "fixed" ? Math.max(0, Number(remainingDays) || 0) * daily : Math.max(0, Number(years) || 0) * a.daysPerYear * daily;
  const minimum = a.minMonths * w;
  const total = Math.max(base, minimum);
  return { daily: r2(daily), base: r2(base), minimum: r2(minimum), minimumApplied: base < minimum, total: r2(total) };
}

/** السعودية — المادتان 75 و76: المهلة 30 (العامل) أو 60 (صاحب العمل) للأجر الشهري، و30 لغيره؛ والتعويض بالأجر الفعلي. */
export function ksaNotice({ wage, monthly = true, who = "employer", givenDays = 0 }) {
  const n = rules.sa.notice;
  const required = monthly ? (who === "employer" ? n.monthlyEmployerDays : n.monthlyWorkerDays) : n.notMonthlyDays;
  const given = Math.min(Math.max(0, Math.floor(Number(givenDays) || 0)), required);
  const daily = (Number(wage) || 0) / n.daysPerMonth;
  const unserved = required - given;
  return { requiredDays: required, givenDays: given, unservedDays: unserved, daily: r2(daily), amount: r2(unserved * daily), fullAmount: r2(required * daily) };
}

/** السعودية — المادة 107: أجر الساعة الفعلي + 50% من أجر الساعة الأساسي (صيغة وزارة الموارد البشرية). */
export function ksaOvertime({ basic, actual, hours }) {
  const o = rules.sa.overtime;
  const b = Number(basic) || 0;
  const a = Math.max(Number(actual) || 0, b);
  const h = Math.max(0, Number(hours) || 0);
  const hourlyActual = a / o.daysPerMonth / o.hoursPerDay;
  const hourlyBasic = b / o.daysPerMonth / o.hoursPerDay;
  const rate = hourlyActual + o.premium * hourlyBasic;
  return { hourlyActual: r2(hourlyActual), hourlyBasic: r2(hourlyBasic), premiumPerHour: r2(o.premium * hourlyBasic), rate: r2(rate), total: r2(rate * h), compLeaveHours: r2(h * o.compLeaveHoursPerOtHour) };
}

/** الإمارات — رمضان: تخفيض ساعتين يومياً (اللائحة م15/2)، وما زاد على الساعات المخفضة إضافي (استنتاج من م19/2). */
export function uaeRamadanOvertime({ basic, normalHours = 8, workedHours, days = 1, night = false, divisor }) {
  const o = rules.ae.overtime;
  const reduced = Math.max(0, (Number(normalHours) || o.hoursPerDay) - rules.ae.ramadan.reductionHoursPerDay);
  const worked = Math.max(0, Number(workedHours) || 0);
  const extraPerDay = Math.max(0, worked - reduced);
  const div = Number(divisor) || o.hoursPerDay;
  const hourly = (Number(basic) || 0) / o.daysPerMonth / div;
  const mult = night ? o.nightMultiplier : o.dayMultiplier;
  const perDay = extraPerDay * hourly * mult;
  const d = Math.max(0, Math.floor(Number(days) || 0));
  return { reducedHours: reduced, extraPerDay, hourly: r2(hourly), multiplier: mult, perDay: r2(perDay), total: r2(perDay * d), overLimit: extraPerDay > o.maxOvertimeHoursPerDay };
}

const addDaysUTC = (x, n) => {
  const d = toUTC(x);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
};
const addMonthsUTC = (x, n) => {
  const d = toUTC(x);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + n;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(d.getUTCDate(), last)));
};
const daysBetween = (a, b) => Math.round((toUTC(b) - toUTC(a)) / 86400000);

/** السعودية — المادة 151: 12 أسبوعاً بأجر كامل، تبدأ قبل الموعد المرجح بأربعة أسابيع على الأكثر، و6 أسابيع بعد الوضع إلزامية. */
export function ksaMaternityPlan({ due, start, wage = 0 }) {
  const m = rules.sa.maternity;
  const totalDays = m.weeks * 7;
  const earliest = addDaysUTC(due, -m.maxPreWeeks * 7);
  let s = toUTC(start || due);
  const late = s > toUTC(due);
  if (late) s = toUTC(due);
  const tooEarly = s < earliest;
  if (tooEarly) s = earliest;
  const preDays = daysBetween(s, due);
  const lastPaid = addDaysUTC(s, totalDays - 1);
  const back = addDaysUTC(s, totalDays);
  const mandatoryUntil = addDaysUTC(due, m.mandatoryPostWeeks * 7 - 1);
  const extendedBack = addMonthsUTC(back, m.unpaidExtensionMonths);
  const daily = (Number(wage) || 0) / 30;
  return {
    start: isoOf(s),
    earliest: isoOf(earliest),
    lastPaid: isoOf(lastPaid),
    back: isoOf(back),
    extendedBack: isoOf(extendedBack),
    mandatoryUntil: isoOf(mandatoryUntil),
    preDays,
    postDays: totalDays - preDays,
    totalDays,
    tooEarly,
    late,
    paid: r2(daily * totalDays),
  };
}

/** يزيح تاريخ ISO بعدد من الأيام ويعيده ISO. */
export function shiftDate(iso, days) {
  return isoOf(addDaysUTC(iso, days));
}

/** يزيح تاريخ ISO بعدد من الأشهر (مع ضبط نهاية الشهر) ويعيده ISO. */
export function shiftMonths(iso, months) {
  return isoOf(addMonthsUTC(iso, months));
}

/* ------------------------------------------------------------------ */
/* التحويل بين التقويمين والفرق بين تاريخين                            */
/* ------------------------------------------------------------------ */

/** هجري (أم القرى) → ميلادي ISO. يعيد null إذا كان اليوم غير موجود في ذلك الشهر أو خارج نطاق التقويم. */
export function hijriToGregorian({ year, month, day }) {
  const y = Number(year), m = Number(month), d = Number(day);
  if (!(y >= 1300 && y <= 1600 && m >= 1 && m <= 12 && d >= 1 && d <= 30)) return null;
  const epoch = Date.UTC(622, 6, 19); // 1 محرم 1هـ ≈ 19 يوليو 622م (ميلادي ممتد)
  const guess = epoch + Math.round((y - 1) * 354.36667 + (m - 1) * 29.530589 + (d - 1)) * 86400000;
  for (let off = 0; off <= 45; off++) {
    for (const s of off ? [off, -off] : [0]) {
      const t = new Date(guess + s * 86400000);
      const h = hijriParts(t);
      if (h && h.year === y && h.month === m && h.day === d) return isoOf(t);
    }
  }
  return null;
}

/** عدد أيام الشهر الهجري (29 أو 30) وفق أم القرى. */
export function hijriMonthLength(year, month) {
  return hijriToGregorian({ year, month, day: 30 }) ? 30 : hijriToGregorian({ year, month, day: 29 }) ? 29 : null;
}

export const WEEKDAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const WEEKENDS = { "fri-sat": [5, 6], "sat-sun": [6, 0], fri: [5], sun: [0], none: [] };

/** الفرق بين تاريخين: أيام كلية، وسنوات/أشهر/أيام، وأيام العمل بعد استبعاد عطلة نهاية الأسبوع. */
export function dateDiff({ start, end, inclusive = false, weekend = "fri-sat" }) {
  const s = toUTC(start), e = toUTC(end);
  if (isNaN(s) || isNaN(e)) return null;
  const sign = e < s ? -1 : 1;
  const a = sign > 0 ? s : e, b = sign > 0 ? e : s;
  const bEff = inclusive ? new Date(b.getTime() + 86400000) : b;
  const total = Math.round((bEff - a) / 86400000);
  const ymd = ageCalc({ birth: a, asOf: bEff }) || { years: 0, months: 0, days: 0 };
  const off = WEEKENDS[weekend] || [];
  let work = 0;
  const full = Math.floor(total / 7);
  work += full * (7 - off.length);
  for (let i = full * 7; i < total; i++) {
    const wd = new Date(a.getTime() + i * 86400000).getUTCDay();
    if (!off.includes(wd)) work++;
  }
  return { sign, total, weeks: Math.floor(total / 7), restDays: total % 7, years: ymd.years, months: ymd.months, days: ymd.days, workDays: work, startWeekday: WEEKDAYS_AR[s.getUTCDay()], endWeekday: WEEKDAYS_AR[e.getUTCDay()] };
}

/* ------------------------------------------------------------------ */
/* معاش التقاعد — السعودية (التأمينات) والإمارات (الهيئة العامة للمعاشات) */
/* ------------------------------------------------------------------ */

const yearsBetween = (a, b) => (toUTC(b) - toUTC(a)) / (365.2425 * 86400000);
const monthsFromDur = (d, roundDays) => (d ? d.years * 12 + d.months + (d.days >= roundDays ? 1 : 0) : 0);

/** تاريخ بلوغ عمر هجري معيّن (أم القرى)، مع بديل تقريبي إن لم يدعم المحرك التقويم. */
function hijriBirthdayAt(birth, years) {
  const h = hijriParts(toUTC(birth));
  if (h) {
    const y = h.year + years;
    for (const day of [h.day, 29, 28]) {
      if (day > h.day) continue;
      const iso = hijriToGregorian({ year: y, month: h.month, day });
      if (iso) return iso;
    }
  }
  return isoOf(addDaysUTC(birth, Math.round(years * 354.367)));
}

/** السعودية — معاش التقاعد في النظامين القديم والجديد، مع الفئة الانتقالية. */
export function ksaPension({ system = "legacy", birth, start, end, gapMonths = 0, avgWage }) {
  const P = rules.sa.pension;
  const avg = Math.max(0, Number(avgWage) || 0);
  const dur = serviceDuration(start, end, 0);
  if (!dur || !birth) return null;
  const months = Math.max(0, monthsFromDur(dur, P.legacy.daysToCountAsMonth) - Math.max(0, Math.floor(Number(gapMonths) || 0)));
  const ageAtEnd = yearsBetween(birth, end);
  const out = { system, months, years: r2(months / 12), ageAtEnd: r2(ageAtEnd) };

  if (system === "new") {
    const N = P.new;
    const normalDate = isoOf(addMonthsUTC(birth, N.retirementAge * 12));
    const earliestEarly = isoOf(addMonthsUTC(birth, N.retirementAge * 12 - N.earlyMaxMonthsBefore));
    const e = toUTC(end);
    const atNormal = e >= toUTC(normalDate);
    const base = Math.min(N.accrualPerYear * avg * (months / 12), N.maxPct * avg);
    let status = "none", reduction = 0, deferral = 0, minimum = null;
    if (atNormal && months >= N.minMonths) {
      status = "normal";
      const after = Math.max(0, Math.floor((e - toUTC(normalDate)) / (30.436875 * 86400000)));
      deferral = N.deferralIncreasePerYear * (after / 12);
      const m = Math.min(months, N.minPensionFullMonths);
      minimum = N.minPensionFull - (N.minPensionFullMonths - m) * ((N.minPensionFull - N.minPensionFloor) / (N.minPensionFullMonths - N.minPensionFloorMonths));
    } else if (!atNormal && months >= N.earlyMinMonths && e >= toUTC(earliestEarly)) {
      status = "early";
      const to65 = Math.max(0, Math.ceil((toUTC(normalDate) - e) / (30.436875 * 86400000)));
      const short = Math.max(0, N.earlyReferenceMonths - months);
      reduction = N.earlyReductionPerYear * (Math.min(to65, short) / 12);
    }
    let pension = 0;
    if (status !== "none") {
      pension = base * (1 - reduction) * (1 + deferral);
      if (minimum && pension < minimum) pension = minimum;
    }
    return Object.assign(out, {
      status, normalDate, earliestEarly, base: r2(base), reduction: Math.round(reduction * 10000) / 10000, deferral: Math.round(deferral * 10000) / 10000,
      minimum: minimum === null ? null : r2(minimum), pension: r2(pension), pct: avg ? Math.round((pension / avg) * 10000) / 100 : 0,
      earlyMonthsNeeded: N.earlyMinMonths, minMonths: N.minMonths,
    });
  }

  // النظام القديم (ومنه الفئة الانتقالية)
  const L = P.legacy, T = P.transitional;
  const eff = T.effective;
  const ageOnEff = yearsBetween(birth, eff);
  const durEff = toUTC(start) < toUTC(eff) ? serviceDuration(start, eff, 0) : null;
  const monthsOnEff = durEff ? monthsFromDur(durEff, L.daysToCountAsMonth) : 0;
  const transitional = ageOnEff < T.affectedIfAgeBelow && monthsOnEff < T.affectedIfMonthsBelow;
  let normalDate, earlyMonthsNeeded;
  if (transitional) {
    const row = T.ageTable.find(([a, b]) => ageOnEff >= a && ageOnEff < b) || T.ageTable[0];
    normalDate = isoOf(addMonthsUTC(birth, row[2]));
    const er = T.earlyTable.find(([a, b]) => monthsOnEff >= a && monthsOnEff < b);
    earlyMonthsNeeded = er ? er[2] : L.earlyMinMonths;
  } else {
    normalDate = hijriBirthdayAt(birth, L.retirementAgeHijri);
    earlyMonthsNeeded = L.earlyMinMonths;
  }
  const e = toUTC(end);
  let status = "none";
  if (e >= toUTC(normalDate) && months >= L.minMonths) status = "normal";
  else if (months >= earlyMonthsNeeded) status = "early";
  const raw = avg * (Math.min(months, L.divisorMonths) / L.divisorMonths);
  let pension = 0;
  if (status !== "none") pension = Math.max(Math.min(raw, L.maxPct * avg), L.minPension);
  const lumpSum = status === "none" ? avg * (Math.min(months, 60) * L.lumpSumPctFirst60 + Math.max(0, months - 60) * L.lumpSumPctAfter60) : 0;
  return Object.assign(out, {
    status, transitional, ageOnEff: r2(ageOnEff), monthsOnEff, normalDate, earlyMonthsNeeded, minMonths: L.minMonths,
    base: r2(Math.min(raw, avg)), minimum: L.minPension, pension: r2(pension), pct: avg ? Math.round((pension / avg) * 10000) / 100 : 0, lumpSum: r2(lumpSum),
  });
}

/** السعودية — ساند: 60% من متوسط آخر 24 شهراً للأشهر الثلاثة الأولى (بحد 9,000)، ثم 50% (بحد 7,500)، حتى 12 شهراً. */
export function ksaSaned({ avgWage, months = 12 }) {
  const S = rules.sa.saned;
  const avg = Math.max(0, Number(avgWage) || 0);
  const n = Math.min(Math.max(0, Math.floor(Number(months) || 0)), S.maxMonths);
  const first = Math.min(avg * S.pctFirst3, S.capFirst3);
  const after = Math.min(avg * S.pctAfter3, S.capAfter3);
  const m1 = Math.min(n, 3), m2 = Math.max(0, n - 3);
  return { first: r2(first), after: r2(after), monthsFirst: m1, monthsAfter: m2, total: r2(m1 * first + m2 * after), cappedFirst: avg * S.pctFirst3 > S.capFirst3, cappedAfter: avg * S.pctAfter3 > S.capAfter3 };
}

/** الإمارات — معاش المواطن (الهيئة العامة للمعاشات): القانون الجديد 57/2023 أو القانون 7/1999. */
export function uaePension({ birth, firstReg, end, avgSalary, gender = "m" }) {
  const A = rules.ae.pension;
  const avg = Math.max(0, Number(avgSalary) || 0);
  const dur = serviceDuration(firstReg, end, 0);
  if (!dur || !birth) return null;
  const isNew = toUTC(firstReg) >= toUTC(A.new.from);
  const L = isNew ? A.new : A.legacy;
  const months = isNew ? monthsFromDur(dur, 1) : dur.years * 12 + dur.months + dur.days / 30;
  const years = months / 12;
  const age = yearsBetween(birth, end);
  let pct = 0;
  if (isNew) pct = Math.min(Math.min(years, L.breakYears) * L.accrualUpTo30 + Math.max(0, years - L.breakYears) * L.accrualOver30, L.maxPct);
  else if (years >= L.baseYears) pct = Math.min(L.basePct + (years - L.baseYears) * L.stepPct, L.maxPct);
  let status = "none", resignAge = null;
  if (age >= L.retirementAge && years >= L.minYears) status = "normal";
  else if (isNew && years >= L.earlyYears && age >= L.earlyAge) status = "early";
  else if (!isNew) {
    resignAge = toUTC(firstReg) < toUTC(L.cutoff2007) ? L.resignAgeBefore2007 : gender === "f" ? L.resignAgeWomen : L.resignAgeMenAfter2007;
    if (years >= L.resignYears && age >= resignAge) status = "early";
    else if (years >= L.resignYears) status = "deferred";
  }
  let pension = status === "normal" || status === "early" ? avg * pct : 0;
  let topUp = 0;
  if (isNew && pension > 0 && pension < L.minPension) {
    topUp = L.minPension - pension;
    pension = L.minPension;
  }
  const g = L.gratuity;
  const gratuity = (status === "none" || status === "deferred") && years >= 1 ? avg * (Math.min(years, 5) * g[0] + Math.min(Math.max(years - 5, 0), 5) * g[1] + Math.max(years - 10, 0) * g[2]) : 0;
  const bonusOver35 = years > 35 && (status === "normal" || status === "early") ? avg * 3 * Math.floor(years - 35) : 0;
  const contribSalary = isNew ? Math.min(Math.max(avg, L.salaryMin), L.salaryMax) : Math.min(avg, L.salaryMax);
  return {
    law: isNew ? "new" : "legacy", months: r2(months), years: r2(years), age: r2(age), pct: Math.round(pct * 10000) / 100, status, resignAge,
    pension: r2(pension), topUp: r2(topUp), gratuity: r2(gratuity), bonusOver35: r2(bonusOver35),
    employeeContribution: r2(contribSalary * L.contribEmployee),
  };
}

/* ------------------------------------------------------------------ */
/* الإجازة السنوية والمرضية — قطر والكويت وعُمان والبحرين              */
/* ------------------------------------------------------------------ */

/** رصيد الإجازة السنوية المستحق عن مدة الخدمة، ناقص المستخدم. */
export function gccLeaveBalance({ country, start, end, taken = 0 }) {
  const R = rules[country].annualLeave;
  const d = serviceDuration(start, end, 0);
  if (!d) return null;
  const months = d.years * 12 + d.months + d.days / 30;
  let accrued = 0, alt = null, belowEligibility = false;
  if (country === "qa") {
    const full = Math.floor(months / 12);
    const rem = months - full * 12;
    for (let i = 1; i <= full; i++) accrued += i <= R.afterYears ? R.daysPerYear : R.daysPerYearAfterFive;
    accrued += (full + 1 <= R.afterYears ? R.daysPerYear : R.daysPerYearAfterFive) * (rem / 12);
    if (full === 0) alt = 0; // السنة الأولى غير المكتملة: قراءتان
  } else {
    if (months < R.eligibilityMonths) belowEligibility = true;
    accrued = belowEligibility && country === "kw" ? 0 : R.daysPerYear * (months / 12);
  }
  const t = Math.max(0, Number(taken) || 0);
  return { months: r2(months), accrued: r2(accrued), alt, belowEligibility, taken: t, balance: r2(Math.max(0, accrued - t)), altBalance: alt === null ? null : 0 };
}

/** أساس الأجر اليومي لكل دولة ونوع إجازة. */
function gccDailyWage(country, kind, { basic = 0, allowances = 0, social = 0, divisor, timing }) {
  const b = Number(basic) || 0, a = Number(allowances) || 0, s = Number(social) || 0;
  const R = rules[country][kind];
  let monthly, basis;
  if (country === "qa") { monthly = b; basis = "الأجر الأساسي"; }
  else if (country === "kw") { monthly = b + a + s; basis = "آخر أجر شامل (الأساسي والبدلات الدورية)"; }
  else if (country === "om") {
    if (kind === "annualLeave" && timing === "inService") { monthly = b; basis = "الأجر الأساسي (صرف أثناء الخدمة بموافقة كتابية)"; }
    else { monthly = b + a + s; basis = "الأجر الشامل"; }
  } else {
    if (kind === "annualLeave") { monthly = b + s; basis = "الأجر الأساسي مضافاً إليه العلاوة الاجتماعية"; }
    else { monthly = b + a + s; basis = "الأجر الشامل"; }
  }
  const div = Number(divisor) || R.daysPerMonth;
  return { monthly, daily: monthly / div, divisor: div, basis };
}

/** بدل الإجازة السنوية عن عدد من الأيام. */
export function gccLeaveEncash({ country, days, ...w }) {
  const x = gccDailyWage(country, "annualLeave", w);
  const n = Math.max(0, Number(days) || 0);
  return { daily: r2(x.daily), divisor: x.divisor, basis: x.basis, monthly: r2(x.monthly), amount: r2(n * x.daily) };
}

/** أجر الإجازة المرضية بالشرائح. */
export function gccSickPay({ country, days, eligible = true, ...w }) {
  const R = rules[country].sickLeave;
  const x = gccDailyWage(country, "sickLeave", w);
  const d = Math.max(0, Math.floor(Number(days) || 0));
  if (!eligible && R.minServiceMonths > 0) return { eligible: false, daily: r2(x.daily), basis: x.basis, rows: [], paid: 0, normal: r2(d * x.daily), deduction: r2(d * x.daily) };
  const counted = Math.min(d, R.maxDays);
  const t = tierPay(counted, R.tiers, x.daily);
  let employerShare = null, fundShare = null;
  if (country === "om") {
    const first = tierPay(Math.min(counted, R.spfEmployerDays), R.tiers, x.daily);
    employerShare = r2(first.paid);
    fundShare = r2(t.paid - first.paid);
  }
  return { eligible: true, daily: r2(x.daily), divisor: x.divisor, basis: x.basis, rows: t.rows, paid: r2(t.paid), normal: r2(counted * x.daily), deduction: r2(counted * x.daily - t.paid), exceeded: d > R.maxDays, employerShare, fundShare };
}

/* ------------------------------------------------------------------ */
/* الزكاة                                                               */
/* ------------------------------------------------------------------ */

/** زكاة المال: 2.5% إذا بلغ المال الزكوي النصاب وحال عليه الحول. */
export function zakatCalc({ cash = 0, g24 = 0, g22 = 0, g21 = 0, g18 = 0, silverGrams = 0, trade = 0, receivables = 0, debts = 0, deductDebts = false, price24 = 0, priceSilver = 0, basis = "lower" }) {
  const Z = rules.zakat;
  const n = (x) => Math.max(0, Number(x) || 0);
  const p24 = n(price24), pS = n(priceSilver);
  const goldPure = n(g24) + (n(g22) * 22) / 24 + (n(g21) * 21) / 24 + (n(g18) * 18) / 24;
  const goldValue = goldPure * p24;
  const silverValue = n(silverGrams) * pS;
  const gross = n(cash) + goldValue + silverValue + n(trade) + n(receivables);
  const total = Math.max(0, gross - (deductDebts ? n(debts) : 0));
  const nisabGold24 = Z.nisabGoldGrams * p24;
  const nisabGold21 = (Z.nisabGoldGrams * Z.darIftaKarat / 24) * p24;
  const nisabSilver = Z.nisabSilverGrams * pS;
  let nisab;
  if (basis === "gold24") nisab = nisabGold24;
  else if (basis === "gold21") nisab = nisabGold21;
  else if (basis === "silver") nisab = nisabSilver;
  else nisab = pS > 0 && p24 > 0 ? Math.min(nisabGold24, nisabSilver) : p24 > 0 ? nisabGold24 : nisabSilver;
  const due = nisab > 0 && total >= nisab;
  return { goldPure: r2(goldPure), goldValue: r2(goldValue), silverValue: r2(silverValue), gross: r2(gross), total: r2(total), nisab: r2(nisab), nisabGold24: r2(nisabGold24), nisabGold21: r2(nisabGold21), nisabSilver: r2(nisabSilver), due, zakat: due ? r2(total * Z.rate) : 0 };
}

/** نهاية فترة التجربة: الإمارات حتى 6 أشهر (المادة 9)، والسعودية حتى 180 يوماً (المادة 53 بعد 2025) مع أيام مستثناة يدخلها المستخدم. */
export function probationEnd({ country = "ae", start, months = 0, days = 0, excluded = 0 }) {
  if (!start) return null;
  const ex = Math.max(0, Math.floor(Number(excluded) || 0));
  if (country === "ae") {
    const m = Math.min(Math.max(0, Number(months) || 0), 6);
    const last = shiftDate(shiftMonths(start, m), -1);
    return { country, lengthLabel: m, capped: Number(months) > 6, lastDay: last, firstAfter: shiftDate(last, 1) };
  }
  const d = Math.min(Math.max(0, Math.floor(Number(days) || 0)), 180);
  const last = shiftDate(start, d + ex - 1);
  return { country, lengthLabel: d, capped: Number(days) > 180, excluded: ex, lastDay: last, firstAfter: shiftDate(last, 1) };
}

/* ------------------------------------------------------------------ */
/* رسوم الوافدين في السعودية                                            */
/* ------------------------------------------------------------------ */

/** رسوم المرافقين (400 شهرياً للفرد) ورسوم العامل على صاحب العمل لفترة 3 أو 6 أو 9 أو 12 شهراً. */
export function ksaExpatFees({ dependents = 0, months = 12, adultIqamas = 0, includeWorker = false, expatsExceed = true, iqamaFee = "base" }) {
  const F = rules.sa.expatFees;
  const m = F.periods.includes(Number(months)) ? Number(months) : 12;
  const n = (x) => Math.max(0, Math.floor(Number(x) || 0));
  const dependentsFee = n(dependents) * F.dependentMonthly * m;
  const adultIqama = n(adultIqamas) * (F.iqamaAnnualBase * m) / 12;
  let worker = null;
  if (includeWorker) {
    const levy = (expatsExceed ? F.levyHigh : F.levyLow) * m;
    const permit = (F.workPermitAnnual * m) / 12;
    const iqama = iqamaFee === "reported" ? Math.ceil((F.workerIqamaReported * m) / 12) : (F.iqamaAnnualBase * m) / 12;
    worker = { levy, permit, iqama, total: r2(levy + permit + iqama) };
  }
  return { months: m, dependentsFee, adultIqama: r2(adultIqama), family: r2(dependentsFee + adultIqama), worker, annualDependents: n(dependents) * F.dependentMonthly * 12 };
}

/** تأشيرة الخروج والعودة: المفردة 200 لشهرين ثم 100 للشهر، والمتعددة 500 لثلاثة أشهر ثم 200، وجزء الشهر شهر. */
export function ksaExitReentryFee({ type = "single", days = 60, persons = 1, extendMonths = 0, outside = false }) {
  const E = rules.sa.expatFees.exitReentry;
  const months = Math.max(1, Math.ceil(Math.max(1, Number(days) || 0) / E.daysPerMonth));
  const single = type === "single";
  const base = single ? E.singleBase + E.singleExtra * Math.max(0, months - E.singleBaseMonths) : E.multipleBase + E.multipleExtra * Math.max(0, months - E.multipleBaseMonths);
  const perExtMonth = (single ? E.singleExtra : E.multipleExtra) * (outside ? E.outsideMultiplier : 1);
  const ext = Math.max(0, Math.floor(Number(extendMonths) || 0)) * perExtMonth;
  const p = Math.max(1, Math.floor(Number(persons) || 1));
  return { months, base, perExtMonth, extension: ext, perPerson: base + ext, total: (base + ext) * p, persons: p };
}

/* ------------------------------------------------------------------ */
/* التمويل العقاري في السعودية                                          */
/* ------------------------------------------------------------------ */

/** عامل الخصم لقسط ثابت على رصيد متناقص: القرض = القسط × العامل. */
export function annuityFactor(aprPct, months) {
  const r = Number(aprPct) / 100 / 12;
  const n = Math.max(1, Math.round(months));
  return r > 0 ? (1 - Math.pow(1 + r, -n)) / r : n;
}

/**
 * أقصى تمويل عقاري: الأصغر بين حد الاستقطاع (مبادئ التمويل المسؤول) وحد نسبة التمويل إلى القيمة والمبلغ المطلوب فعلاً.
 * capMode: auto (55% حتى 15,000 ثم 65%) | regulatory (65% للمدعوم حتى 15,000 كما في النص) | high70 (70% لدخل 25,000 فأكثر).
 */
export function ksaMortgage({
  salary = 0, otherIncome = 0, personal = 0, otherDebts = 0, retiree = false,
  price = 0, apr = 6.5, years = 25, age = 35, maxAge, tenorCap,
  citizen = true, firstHome = true, lender = "bank", support = "none", redfReduced = false, capMode = "auto",
}) {
  const H = rules.sa.homeFinance;
  const G = Math.max(0, Number(salary) || 0);
  const I = G + H.otherIncomeWeight * Math.max(0, Number(otherIncome) || 0);
  const S = Math.max(0, Number(personal) || 0);
  const N = S + Math.max(0, Number(otherDebts) || 0);
  const P = Math.max(0, Number(price) || 0);
  const subsidized = support !== "none";

  const salaryCapPct = retiree ? H.salaryDeductionCapRetiree : H.salaryDeductionCapEmployee;
  const salaryCapOk = S <= salaryCapPct * G + 0.005;
  const nonMortgageApplies = I < H.incomeHighMin;
  const nonMortgageOk = !nonMortgageApplies || N <= H.nonMortgageCap * I + 0.005;

  let band, cap;
  if (I <= H.incomeLowMax) {
    band = "low";
    cap = subsidized && capMode === "regulatory" ? H.totalCapLowSubsidizedRegulatory : H.totalCapLow;
  } else if (I < H.incomeHighMin) {
    band = "mid";
    cap = H.totalCapMid;
  } else {
    band = "high";
    cap = capMode === "high70" ? H.totalCapHighBankMax : H.totalCapHighDefault;
  }
  const maxInstallment = Math.max(0, cap * I - N);

  const tenorLimit = Number(tenorCap) || H.tenorMaxYearsDefault;
  const ageLimit = Number(maxAge) || H.ageAtMaturityDefault;
  const byAge = Math.max(0, Math.floor(ageLimit - (Number(age) || 0)));
  const yrs = Math.max(0, Math.min(Math.floor(Number(years) || 0), tenorLimit, byAge));
  const limitedBy = yrs < Math.floor(Number(years) || 0) ? (byAge < tenorLimit ? "age" : "tenor") : null;
  const n = yrs * 12;
  const af = n ? annuityFactor(apr, n) : 0;
  const loanDbr = maxInstallment * af;

  let ltv;
  const first = citizen && firstHome;
  if (first) ltv = redfReduced && P <= H.redfDpReductionMaxPrice ? H.ltvRedfReduced : H.ltvFirstHomeCitizen;
  else ltv = lender === "financeCo" ? H.ltvBaseFinanceCo : H.ltvBaseBank;
  const loanLtv = ltv * P;
  const ltvBasic = first ? H.ltvFirstHomeCitizen : ltv;

  const dpSupport = support === "dp150" ? H.dpSupportHigh : support === "dp100" ? H.dpSupportLow : 0;
  const need = Math.max(0, P - dpSupport);

  const loan = Math.max(0, Math.min(loanDbr, loanLtv, need));
  const binding = loan === need && need <= loanDbr && need <= loanLtv ? "need" : loanDbr <= loanLtv ? "dbr" : "ltv";
  const installment = af ? loan / af : 0;
  const totalPaid = installment * n;
  const dbrAfter = I ? (installment + N) / I : 0;
  const downPayment = Math.max(0, P - loan - dpSupport);

  const adminFee = Math.min(H.adminFeePct * loan, H.adminFeeCap);
  const adminFeeVat = adminFee * H.vatRate;
  const rett = H.rettRate * (first ? Math.max(0, P - H.rettFirstHomeStateBorneUpTo) : P);
  const rettExempt = H.rettRate * P - rett;

  const profitSubsidyBase = support === "profit" ? Math.min(loan, H.profitSubsidyMaxFinance) : 0;
  const profitSubsidyFirstMonth = profitSubsidyBase * (Number(apr) / 100 / 12) * (I <= H.profitSubsidyFullIncomeMax ? 1 : NaN);

  return {
    income: r2(I), band, cap, maxInstallment: r2(maxInstallment), salaryCapPct, salaryCapOk, nonMortgageApplies, nonMortgageOk,
    years: yrs, months: n, limitedBy, byAge,
    loanDbr: r2(loanDbr), ltv, loanLtv: r2(loanLtv), dpSupport, need, loan: r2(loan), binding,
    installment: r2(installment), totalPaid: r2(totalPaid), profit: r2(totalPaid - loan), dbrAfter, downPayment: r2(downPayment),
    adminFee: r2(adminFee), adminFeeVat: r2(adminFeeVat), rett: r2(rett), rettExempt: r2(rettExempt),
    cashAtSigning: r2(downPayment + adminFee + adminFeeVat),
    maxPrice: r2(Math.max(loanDbr / ltvBasic, loanDbr + dpSupport)), ltvBasic,
    profitSubsidyFirstMonth: Number.isNaN(profitSubsidyFirstMonth) ? null : r2(profitSubsidyFirstMonth),
  };
}

/* ------------------------------------------------------------------ */
/* السعودية — الإجازات الخاصة (المواد 113–116 و160)                     */
/* ------------------------------------------------------------------ */

/** يضيف أشهراً هجرية (أم القرى) إلى تاريخ ميلادي ويعيده ISO، مع قص اليوم إلى طول الشهر. */
export function addHijriMonths(iso, months) {
  const h = hijriParts(iso);
  if (!h) return null;
  const idx = h.year * 12 + (h.month - 1) + months;
  const year = Math.floor(idx / 12), month = (idx % 12) + 1;
  const len = hijriMonthLength(year, month) || 29;
  return hijriToGregorian({ year, month, day: Math.min(h.day, len) });
}

/**
 * الإجازات الخاصة بأجر في نظام العمل السعودي.
 * type: marriage | death | sibling | paternity | hajj | iddah | iddahNonMuslim
 * date: تاريخ الواقعة (أو بداية إجازة الحج)، start: بداية إجازة المولود إن اختلفت.
 */
export function ksaSpecialLeave({ type, date, start, hajjDays, years = 0 }) {
  const L = rules.sa.specialLeave;
  if (!date || isNaN(toUTC(date))) return null;
  const fixed = { marriage: L.marriage, death: L.deathClose, sibling: L.deathSibling, paternity: L.paternity, iddahNonMuslim: L.iddahNonMuslimDays };
  if (type in fixed) {
    const s = type === "paternity" && start ? start : date;
    const days = fixed[type];
    const offset = Math.round((toUTC(s) - toUTC(date)) / 86400000);
    return {
      type, days, paid: true, start: s, end: shiftDate(s, days - 1), back: shiftDate(s, days),
      withinWindow: type !== "paternity" || (offset >= 0 && offset + days <= L.paternityWithinDays),
      lateStart: type === "paternity" && (offset < 0 || offset >= L.paternityWithinDays),
    };
  }
  if (type === "hajj") {
    const days = Math.min(L.hajjMax, Math.max(L.hajjMin, Math.round(Number(hajjDays) || L.hajjMax)));
    return { type, days, paid: true, start: date, end: shiftDate(date, days - 1), back: shiftDate(date, days), eligible: Number(years) >= L.hajjServiceYears };
  }
  if (type === "iddah") {
    const hijriBack = addHijriMonths(date, L.iddahMonths);
    const back = hijriBack ? shiftDate(hijriBack, L.iddahDays) : null;
    const gBack = shiftDate(shiftMonths(date, L.iddahMonths), L.iddahDays);
    return {
      type, paid: true, start: date,
      back, end: back ? shiftDate(back, -1) : null, days: back ? Math.round((toUTC(back) - toUTC(date)) / 86400000) : null,
      gBack, gEnd: shiftDate(gBack, -1), gDays: Math.round((toUTC(gBack) - toUTC(date)) / 86400000),
    };
  }
  return null;
}

/** يعدّ n يوم عمل ابتداءً من تاريخ (أو أول يوم عمل بعده) متجاوزاً عطلة نهاية الأسبوع، ويعيد أول يوم وآخر يوم ويوم العودة. */
export function addWorkingDays(iso, n, weekend = "sat-sun") {
  const off = WEEKENDS[weekend] || [];
  const isOff = (d) => off.includes(d.getUTCDay());
  let d = addDaysUTC(iso, 0);
  let first = null, count = 0, guard = 0;
  while (count < n && guard++ < 1000) {
    if (!isOff(d)) {
      if (!first) first = isoOf(d);
      count++;
      if (count === n) break;
    }
    d = addDaysUTC(d, 1);
  }
  const last = isoOf(d);
  let back = addDaysUTC(d, 1);
  while (isOff(back) && guard++ < 1000) back = addDaysUTC(back, 1);
  return { first, last, back: isoOf(back), calendarDays: daysBetween(first, last) + 1 };
}

/**
 * الإمارات — المادة 32: الحداد 5 أيام لوفاة الزوج و3 للأقارب من تاريخ الوفاة، وإجازة الوالدين 5 أيام عمل خلال 6 أشهر من الولادة،
 * وإجازة الدراسة 10 أيام عمل في السنة بعد سنتين من الخدمة.
 */
export function uaeSpecialLeave({ type, date, start, weekend = "sat-sun", years = 0 }) {
  const L = rules.ae.specialLeave;
  if (!date || isNaN(toUTC(date))) return null;
  if (type === "spouse" || type === "relative") {
    const days = type === "spouse" ? L.spouseDeathDays : L.relativeDeathDays;
    return { type, days, start: date, end: shiftDate(date, days - 1), back: shiftDate(date, days) };
  }
  if (type === "parental") {
    const s = start || date;
    const deadline = shiftDate(shiftMonths(date, L.parentalWithinMonths), -1);
    const w = addWorkingDays(s, L.parentalWorkingDays, weekend);
    return { type, workingDays: L.parentalWorkingDays, start: w.first, end: w.last, back: w.back, calendarDays: w.calendarDays, deadline, beforeBirth: s < date, withinWindow: s >= date && w.last <= deadline };
  }
  if (type === "study") {
    const w = addWorkingDays(date, L.studyWorkingDays, weekend);
    return { type, workingDays: L.studyWorkingDays, start: w.first, end: w.last, back: w.back, calendarDays: w.calendarDays, eligible: Number(years) >= L.studyServiceYears };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* ساعات العمل والدوام (السعودية والإمارات)                             */
/* ------------------------------------------------------------------ */

const toMin = (t) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t || ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** ساعات الدوام اليومية والأسبوعية والساعات الإضافية بالمعيارين اليومي والأسبوعي، مع فحص حدود النظام. */
export function workHours({ country = "sa", start, end, breakMin = 60, days = 5, ramadan = false, muslim = true }) {
  const s = toMin(start), e = toMin(end);
  if (s === null || e === null) return null;
  const presence = (e - s + 1440) % 1440 || 1440;
  const br = Math.max(0, Math.min(presence, Number(breakMin) || 0));
  const work = presence - br;
  const d = Math.max(1, Math.min(7, Math.round(Number(days) || 5)));
  let dailyMax, weeklyMax;
  if (country === "ae") {
    const W = rules.ae.workHours;
    dailyMax = (W.hoursPerDay - (ramadan ? W.ramadanReductionPerDay : 0)) * 60;
    weeklyMax = ramadan ? dailyMax * Math.min(d, 6) : W.hoursPerWeek * 60;
  } else {
    const W = rules.sa.workHours;
    const r = ramadan && muslim;
    dailyMax = (r ? W.ramadanMuslimPerDay : W.hoursPerDay) * 60;
    weeklyMax = (r ? W.ramadanMuslimPerWeek : W.hoursPerWeek) * 60;
  }
  const weekly = work * d;
  const otDailyStd = Math.max(0, work - dailyMax) * d;
  const otWeeklyStd = Math.max(0, weekly - weeklyMax);
  return {
    presenceMin: presence, breakMin: br, workMin: work, days: d, weeklyMin: weekly, monthlyMin: Math.round((weekly * 52) / 12),
    dailyMaxMin: dailyMax, weeklyMaxMin: weeklyMax, otDailyStdMin: otDailyStd, otWeeklyStdMin: otWeeklyStd,
    otPerDayMin: Math.max(0, work - dailyMax),
  };
}

/* ------------------------------------------------------------------ */
/* المستحقات النهائية (التسوية النهائية) — الإمارات والسعودية            */
/* ------------------------------------------------------------------ */

const nz = (x) => Math.max(0, Number(x) || 0);

/**
 * الإمارات: المكافأة (على الأساسي) + بدل الإجازات غير المستخدمة (على الأساسي) + أجر الأيام غير المدفوعة (على الشامل)
 * ± بدل الإنذار عن الأيام غير المراعاة (على الشامل: يدفعه صاحب العمل إن أنهى، ويُخصم من العامل إن استقال) + مستحقات أخرى − خصومات.
 */
export function uaeFinalSettlement({ basic, gross, start, end, unpaid = 0, leaveDays = 0, endedBy = "employer", noticeDays = 30, servedDays = 0, salaryDays = 0, other = 0, deductions = 0 }) {
  const d = serviceDuration(start, end, unpaid);
  if (!d) return null;
  const b = nz(basic), w = nz(gross) || b;
  const g = uaeGratuity({ basicSalary: b, years: d.decimalYears });
  const leave = uaeLeaveEncashment({ basicSalary: b, unusedDays: leaveDays });
  const n = uaeNoticePay({ wage: w, noticeDays, servedDays });
  const notice = endedBy === "employer" ? n.amount : -n.amount;
  const salary = (w / rules.ae.notice.daysPerMonth) * nz(salaryDays);
  const total = g.total + leave.amount + salary + notice + nz(other) - nz(deductions);
  return { duration: d, gratuity: g, leave, noticeInfo: n, notice: r2(notice), salary: r2(salary), other: r2(nz(other)), deductions: r2(nz(deductions)), total: r2(total) };
}

/**
 * السعودية: مكافأة نهاية الخدمة حسب السبب + بدل الإجازات (المادة 111) + أجر الأيام غير المدفوعة
 * ± تعويض مهلة الإشعار غير المراعاة (المادة 76) + مستحقات أخرى − خصومات، كلها على الأجر الفعلي.
 * noticeCase: none | employer (أنهى صاحب العمل عقداً غير محدد دون مهلة كاملة) | worker (أنهى العامل دون مهلة كاملة)
 */
export function ksaFinalSettlement({ wage, start, end, reason = "contract_end", leaveDays = 0, noticeCase = "none", givenDays = 0, salaryDays = 0, other = 0, deductions = 0 }) {
  const d = serviceDuration(start, end, 0);
  if (!d) return null;
  const w = nz(wage);
  const eos = ksaEndOfService({ wage: w, years: d.decimalYears, reason });
  const daily = w / rules.sa.annualLeave.daysPerMonth;
  const leave = { dailyWage: r2(daily), amount: r2(daily * nz(leaveDays)) };
  let noticeInfo = null, notice = 0;
  if (noticeCase === "employer" || noticeCase === "worker") {
    noticeInfo = ksaNotice({ wage: w, monthly: true, who: noticeCase, givenDays });
    notice = noticeCase === "employer" ? noticeInfo.amount : -noticeInfo.amount;
  }
  const salary = daily * nz(salaryDays);
  const total = eos.total + leave.amount + salary + notice + nz(other) - nz(deductions);
  return { duration: d, eos, leave, noticeInfo, notice: r2(notice), salary: r2(salary), other: r2(nz(other)), deductions: r2(nz(deductions)), total: r2(total) };
}

/* ------------------------------------------------------------------ */
/* العمالة المنزلية — السعودية والإمارات                                */
/* ------------------------------------------------------------------ */

/**
 * السعودية (لائحة 1445هـ): أجر شهر عن كل 4 سنوات متتالية بالأجر الأخير (م22)، وتعويض أجر شهرين لإنهاء غير مشروع (م25)،
 * وعوض نقدي عن الإجازة غير المستعملة (م12). mode: blocks (كتل كاملة، الحرفي) | prorata.
 * reason: end | employer_unlawful | art26 | worker_art27 | worker_noreason
 */
export function ksaDomesticSettlement({ wage, start, end, mode = "blocks", reason = "end", leaveDays = 0, compMonths }) {
  const D = rules.sa.domestic;
  const d = serviceDuration(start, end, 0);
  if (!d) return null;
  const w = nz(wage);
  const years = d.decimalYears;
  const blocksExact = years / D.eosBlockYears;
  const blocks = mode === "prorata" ? blocksExact : Math.floor(blocksExact + 1e-9);
  const eosGross = blocks * D.eosMonthsPerBlock * w;
  const eos = reason === "art26" ? 0 : eosGross;
  const cm = compMonths === undefined || compMonths === null || compMonths === "" ? D.compMonths : nz(compMonths);
  const comp = reason === "employer_unlawful" ? cm * w : reason === "worker_noreason" ? -cm * w : 0;
  const leave = (w / D.monthDays) * nz(leaveDays);
  const total = eos + comp + leave;
  return { duration: d, years: r2(years), blocks: r2(blocks), blocksExact: r2(blocksExact), eosGross: r2(eosGross), eos: r2(eos), comp: r2(comp), leave: r2(leave), total: r2(total), daily: r2(w / D.monthDays) };
}

/** الإمارات: رصيد الإجازة لعامل الخدمة المساعدة: لا شيء قبل 6 أشهر، يومان/شهر في السنة الأولى، ثم 2.5 يوم/شهر (30 يوماً في السنة). */
export function uaeDomesticLeaveAccrued(months) {
  const D = rules.ae.domestic;
  const m = Math.floor(nz(months));
  if (m < D.leaveMinMonths) return 0;
  return m < 12 ? m * D.leaveDaysPerMonthFirstYear : m * D.leaveDaysPerMonthAfter;
}

/** الإمارات: مكافأة 14 يوماً من الأجر الأساسي عن كل سنة بعد سنة خدمة (تناسبياً)، وبدل الإجازة غير المستخدمة، وتُسقط المكافأة بالانقطاع غير المشروع. */
export function uaeDomesticSettlement({ basic, start, end, unpaid = 0, leaveDays = 0, absence = false, rate }) {
  const D = rules.ae.domestic;
  const d = serviceDuration(start, end, unpaid);
  if (!d) return null;
  const b = nz(basic);
  const daily = b / D.monthDays;
  const perYear = nz(rate) || D.eosDaysPerYear;
  const eligible = d.decimalYears >= D.eosMinServiceYears && !absence;
  const gratuity = eligible ? daily * perYear * d.decimalYears : 0;
  const leave = daily * nz(leaveDays);
  return { duration: d, daily: r2(daily), perYear, eligible, gratuity: r2(gratuity), leave: r2(leave), total: r2(gratuity + leave) };
}

/** الإمارات: استرداد كلفة الاستقدام من المكتب: (الكلفة ÷ أشهر العقد) × الأشهر المتبقية، وكاملة في الشهر الأول أو لعدم اللياقة الطبية في التجربة. */
export function uaeRecruitmentRefund({ cost, contractMonths, monthsWorked, medicallyUnfit = false }) {
  const D = rules.ae.domestic;
  const c = nz(cost), cmo = nz(contractMonths) || D.contractMonthsDefault, mw = nz(monthsWorked);
  const full = mw < 1 || medicallyUnfit;
  const remaining = Math.max(0, cmo - Math.ceil(mw));
  return { full, remaining, refund: r2(full ? c : (c / cmo) * remaining) };
}

/* ------------------------------------------------------------------ */
/* الكويت — معاش التأمينات الاجتماعية للكويتيين                          */
/* ------------------------------------------------------------------ */

/** مكافأة التقاعد بشرائحها: مرتب التسوية × 12 × (10% لأول 5 سنوات، 12% للتالية، 15% للتالية، 20% لما بقي). */
export function kuwaitGratuityTiers(base, years) {
  const K = rules.kw.pension;
  let left = Math.max(0, Number(years) || 0), sum = 0, i = 0;
  const parts = [];
  for (; i < K.gratuityTierYears.length && left > 0; i++) {
    const y = Math.min(left, K.gratuityTierYears[i]);
    parts.push({ years: r2(y), rate: K.gratuityTierRates[i], amount: r2(base * 12 * K.gratuityTierRates[i] * y) });
    sum += base * 12 * K.gratuityTierRates[i] * y;
    left -= y;
  }
  if (left > 0) {
    const rate = K.gratuityTierRates[K.gratuityTierRates.length - 1];
    parts.push({ years: r2(left), rate, amount: r2(base * 12 * rate * left) });
    sum += base * 12 * rate * left;
  }
  return { total: r2(sum), parts };
}

/**
 * معاش التقاعد الأساسي في الكويت: 65% من مرتب التسوية (بحد 1,500) عن 15 سنة + 2% عن كل سنة (و1/12 منها عن كل شهر) حتى 95% عند 30 سنة،
 * مع تخفيض التقاعد المبكر (دائم أو مؤقت)، والحد الأدنى بحسب الحالة الاجتماعية، ومكافأة التقاعد والمكافأة المالية (110/2014).
 */
export function kuwaitPension({ gender = "m", age, serviceYears = 0, serviceMonths = 0, base, supplementary = 0, married = false, children = 0, contribSince2015 = true }) {
  const K = rules.kw.pension;
  const men = gender !== "f";
  const months = Math.max(0, Math.round((Number(serviceYears) || 0) * 12 + (Number(serviceMonths) || 0)));
  const yrs = Math.floor(months / 12), mon = months % 12;
  const decimalYears = months / 12;
  const b = Math.min(nz(base), K.basicWageCap);
  const a = Math.floor(Number(age) || 0);
  const normalAge = men ? K.normalAgeMen : K.normalAgeWomen;
  const earlyMin = normalAge - K.maxEarlyYears;
  const noRed = men ? K.noReductionServiceMen : K.noReductionServiceWomen;
  const tempMin = men ? K.temporaryMinServiceMen : K.temporaryMinServiceWomen;

  if (yrs < K.minServiceYears) return { status: "none", base: r2(b), decimalYears: r2(decimalYears), lump: kuwaitGratuityTiers(b, decimalYears) };
  if (a < earlyMin && yrs < noRed) return { status: "too_young", base: r2(b), decimalYears: r2(decimalYears), earlyMin, normalAge, lump: kuwaitGratuityTiers(b, decimalYears) };

  const pct = Math.min(K.maxPct, K.accrualBase + K.accrualPerYear * (yrs - K.accrualBaseYears) + (K.accrualPerYear / 12) * mon);
  const gross = b * pct;
  let reduction = 0, reductionType = null;
  if (a < normalAge && yrs < noRed) {
    const idx = Math.min(4, Math.max(0, a - earlyMin));
    if (yrs >= tempMin) { reduction = K.earlyReductionTemporary[idx]; reductionType = "temporary"; }
    else { reduction = K.earlyReductionPermanent[idx]; reductionType = "permanent"; }
  }
  const basic = gross * (1 - reduction);
  const sup = nz(supplementary);
  const total = basic + sup;
  const k = Math.max(0, Math.floor(Number(children) || 0));
  const minimum = !married ? K.minPensionSingleOrWoman : k === 0 ? K.minPensionMarriedNoChildren : K.minPensionByChildren[Math.min(k, K.minPensionByChildren.length) - 1];
  const excessYears = Math.max(0, decimalYears - K.maxServiceYears);
  const excessLump = excessYears ? kuwaitGratuityTiers(b, excessYears) : null;
  const ageOver = Math.max(0, a - normalAge);
  const capYears = K.remunerationCapYears[Math.min(ageOver, K.remunerationCapYears.length - 1)];
  const remunerationOk = contribSince2015 || a >= normalAge || decimalYears >= 30;
  const remuneration = remunerationOk ? b * Math.min(decimalYears, capYears) : 0;
  return {
    status: "pension", base: r2(b), decimalYears: r2(decimalYears), pct, gross: r2(gross), reduction, reductionType,
    reductionEndsAge: reductionType === "temporary" ? (men ? K.temporaryEndsAgeMen : K.temporaryEndsAgeWomen) : null,
    basic: r2(basic), supplementary: r2(sup), total: r2(total), minimum, toppedUp: total < minimum, final: r2(Math.max(total, minimum)),
    excessYears: r2(excessYears), excessLump, capYears, remunerationOk, remuneration: r2(remuneration),
  };
}

/* ------------------------------------------------------------------ */
/* السعودية — الضمان الاجتماعي المطور                                   */
/* ------------------------------------------------------------------ */

/**
 * المعاش = (1,320 لرب الأسرة أو المستقل + 660 لكل تابع) − الدخل المحتسب (50% من الدخل المكتسب كالرواتب والمعاشات، و100% من غيره كالإيجار والإعانات).
 * يُستحق إذا كان الدخل المحتسب أقل من الحد الأدنى. سقف الأسرة 5,000 (مصادر ثانوية، وموضع تطبيقه غير محسوم: نعرض القراءتين).
 */
export function ksaSocialSecurity({ dependents = 0, earned = 0, unearned = 0, citizenAccount = 0, countCitizenAccount = false }) {
  const S = rules.sa.socialSecurity;
  const deps = Math.max(0, Math.floor(Number(dependents) || 0));
  const minimum = S.basicHead + S.perDependent * deps;
  const counted = S.earnedRate * nz(earned) + S.unearnedRate * nz(unearned) + (countCitizenAccount ? nz(citizenAccount) : 0);
  const eligible = counted < minimum;
  const raw = eligible ? minimum - counted : 0;
  const capFinal = Math.min(raw, S.familyMax);
  const capMinimum = eligible ? Math.max(0, Math.min(minimum, S.familyMax) - counted) : 0;
  return { minimum, counted: r2(counted), eligible, raw: r2(raw), capFinal: r2(capFinal), capMinimum: r2(capMinimum), capMatters: r2(capFinal) !== r2(capMinimum) };
}

/* ------------------------------------------------------------------ */
/* السعودية — التقاعد المدني والعسكري                                    */
/* ------------------------------------------------------------------ */

/**
 * التقاعد المدني لمن اشترك قبل 3/7/2024: المعاش = آخر راتب أساسي × أشهر الخدمة ÷ 480 (بحد 480 شهراً)، بلا خصم للمبكر.
 * reason: age (بلوغ السن النظامية أو الوفاة أو العجز) | resign | early (طلب بموافقة الجهة) | abolished (إلغاء الوظيفة أو فصل غير تأديبي) | disciplinary
 * monthsAt2024: أشهر الخدمة في 3/7/2024 للمشمول بالجدول الانتقالي (يحدد الأشهر اللازمة للمعاش قبل السن).
 */
export function ksaCivilPension({ lastBasic, months, reason = "resign", transitional = false, monthsAt2024 = 0 }) {
  const C = rules.sa.civilPension;
  const b = nz(lastBasic);
  const m = Math.max(0, Math.floor(Number(months) || 0));
  const counted = Math.min(m, C.maxMonths);
  const pension = (b * counted) / C.divisorMonths;
  let anyExit = C.anyExitMinMonths;
  if (transitional) {
    const row = rules.sa.pension.transitional.earlyTable.find(([lo, hi]) => nz(monthsAt2024) >= lo && nz(monthsAt2024) < hi);
    if (row) anyExit = row[2];
  }
  let status;
  if (reason === "age") status = "pension";
  else if (m >= anyExit) status = "pension";
  else if (reason === "early" && m >= C.earlyApprovalMinMonths && !transitional) status = "pension_conditional";
  else if (reason === "abolished" && m >= C.abolitionMinMonths) status = "pension";
  else if (m >= C.deferredMinMonths) status = "deferred";
  else if (m >= C.notionalMinMonths) status = "notional";
  else status = "lump";
  const rate = reason === "resign" || reason === "disciplinary" ? C.gratuityRateResign : C.gratuityRate;
  const lump = b * 12 * rate * (m / 12);
  const buyMonths = status === "notional" ? C.notionalMaxTotalMonths - m : 0;
  return {
    counted, pct: counted / C.divisorMonths, pension: r2(pension), status, anyExitRequired: anyExit,
    belowMin: pension < C.minPensionUnverified, lumpRate: rate, lump: r2(lump),
    buyMonths, buyCost: r2(b * C.notionalRateInferred * buyMonths), pensionAfterBuy: r2((b * C.notionalMaxTotalMonths) / C.divisorMonths),
  };
}

/** التقاعد العسكري: آخر راتب × الأشهر ÷ 420 (السقف 100% عند 35 سنة استنتاجاً)، ويُستحق بـ18 سنة فعلية أو 20 مدنية وعسكرية منها 8 عسكرية أو بلوغ 55. */
export function ksaMilitaryPension({ lastSalary, months, civilMonths = 0, age = 0 }) {
  const M = rules.sa.militaryPension;
  const m = Math.max(0, Math.floor(Number(months) || 0));
  const total = m + Math.max(0, Math.floor(Number(civilMonths) || 0));
  const counted = Math.min(total, M.maxMonthsInferred);
  const eligible = m >= M.minActualMonths || (total >= M.minCombinedMonths && m >= M.minMilitaryWithinCombined) || nz(age) >= M.pensionAtAge;
  return { counted, pct: counted / M.divisorMonths, pension: r2((nz(lastSalary) * counted) / M.divisorMonths), eligible };
}

/* ------------------------------------------------------------------ */
/* الإمارات — ضريبة الشركات                                             */
/* ------------------------------------------------------------------ */

/**
 * ضريبة الشركات: 0% حتى 375,000 درهم من الدخل الخاضع و9% على ما زاد.
 * إعفاء الأعمال الصغيرة (اختياري): إيرادات ≤ 3 ملايين، للفترات المنتهية حتى 31/12/2029، ولا يشمل الشخص المؤهل في المنطقة الحرة ولا عضو المجموعة متعددة الجنسيات.
 * الخسائر المرحلة تُخصم بحد 75% من الدخل الخاضع للفترة.
 */
export function uaeCorporateTax({ taxableIncome, revenue, losses = 0, person = "company", mne = false, periodEndYear = 2026, electSbr = true }) {
  const C = rules.ae.corporateTax;
  const ti = Number(taxableIncome) || 0;
  const rev = Math.max(0, Number(revenue) || 0);
  const lossesIn = Math.max(0, Number(losses) || 0);
  if (person === "individual" && rev <= C.naturalPersonTurnover) {
    return { status: "outOfScope", tax: 0, taxWithoutSbr: 0, lossUsed: 0, lossLeft: lossesIn, taxableAfterLoss: Math.max(0, ti), sbrEligible: false, effective: 0 };
  }
  const sbrEligible = person !== "qfzp" && !mne && rev <= C.sbrRevenueMax && Number(periodEndYear) <= C.sbrLastPeriodEndYear;
  const lossUsed = ti > 0 ? Math.min(lossesIn, ti * C.lossOffsetCap) : 0;
  const taxableAfterLoss = Math.max(0, ti - lossUsed);
  const taxStd = Math.max(0, taxableAfterLoss - C.zeroBand) * C.rate;
  const sbr = sbrEligible && electSbr;
  return {
    status: sbr ? "sbr" : "taxable",
    tax: sbr ? 0 : r2(taxStd),
    taxWithoutSbr: r2(taxStd),
    lossUsed: sbr ? 0 : r2(lossUsed),
    lossLeft: sbr ? lossesIn : r2(lossesIn - lossUsed),
    taxableAfterLoss: r2(taxableAfterLoss),
    sbrEligible,
    effective: !sbr && ti > 0 ? taxStd / ti : 0,
  };
}

/* ------------------------------------------------------------------ */
/* دبي — زيادة الإيجار (المرسوم 43/2013)                                */
/* ------------------------------------------------------------------ */

/** أقصى زيادة عند التجديد بحسب نسبة انخفاض الإيجار الحالي عن متوسط المؤشر لوحدات مماثلة. */
export function dubaiRentIncrease({ rent, average }) {
  const R = rules.ae.dubaiRent;
  const cur = Math.max(0, Number(rent) || 0);
  const avg = Math.max(0, Number(average) || 0);
  if (!cur || !avg) return null;
  const gapPct = ((avg - cur) / avg) * 100;
  let pct = 0;
  if (gapPct > 0) {
    const band = R.bands.find(([upTo]) => gapPct <= upTo) || R.bands[R.bands.length - 1];
    pct = band[1];
  }
  const maxRent = cur * (1 + pct);
  return { gapPct: Math.round(gapPct * 100) / 100, pct, increase: r2(cur * pct), maxRent: r2(maxRent), monthlyIncrease: r2((cur * pct) / 12) };
}

/* ------------------------------------------------------------------ */
/* السعودية — فاتورة الكهرباء (تعرفة 1 يناير 2027)                       */
/* ------------------------------------------------------------------ */

/**
 * فاتورة الكهرباء الشهرية: شريحتان (حتى 6,000 ك.و.س وما فوقها) + رسوم ثابتة بحسب سعة القاطع للسكني (تُحتسب بعدد أيام الفاتورة) + ضريبة 15%.
 * tariff: new (من 2027) | old (الحالية: 18 و30 هللة للسكني). fixedOverride: رسوم ثابتة يدخلها المستخدم (لغير السكني أو للتعرفة الحالية).
 */
export function ksaElectricityBill({ kwh, sector = "residential", amps = 60, days = 30, tariff = "new", fixedOverride = null }) {
  const E = rules.sa.electricity;
  const S = E.sectors[sector] || E.sectors.residential;
  const prices = S[tariff] || S.new;
  const k = Math.max(0, Number(kwh) || 0);
  const t1 = Math.min(k, E.tierKwh), t2 = Math.max(0, k - E.tierKwh);
  const consumption = t1 * prices[0] + t2 * prices[1];
  const d = Math.max(1, Number(days) || E.daysPerMonth);
  let fixedMonthly = 0;
  if (fixedOverride !== null && fixedOverride !== undefined && fixedOverride !== "") fixedMonthly = Math.max(0, Number(fixedOverride) || 0);
  else if (sector === "residential" && tariff === "new") {
    const a = Math.max(0, Number(amps) || 0);
    const band = E.residentialFixed.find(([lo, hi]) => a >= lo && a < hi) || E.residentialFixed[0];
    fixedMonthly = band[2];
  }
  const fixed = (fixedMonthly * d) / E.daysPerMonth;
  const subtotal = consumption + fixed;
  const vat = subtotal * E.vat;
  return { t1, t2, p1: prices[0], p2: prices[1], consumption: r2(consumption), fixedMonthly, fixed: r2(fixed), subtotal: r2(subtotal), vat: r2(vat), total: r2(subtotal + vat) };
}

/**
 * السعودية — فاتورة المياه الشهرية: شرائح تصاعدية حدّية (كل متر بسعر شريحته)، والصرف الصحي نصف سعر المياه
 * في الاستهلاك والرسوم الثابتة، ورسم ثابت بحسب قطر العداد (+ رسم لكل وحدة سكنية إضافية)، ثم ضريبة القيمة المضافة.
 * tariff: new (من 1/1/2027) | current (قرار مجلس الوزراء 95 لعام 1437هـ، بلا رسم عداد لأنه غير منشور).
 */
export function ksaWaterBill({ m3, sector = "residential", meter = 20, units = 1, sewer = true, tariff = "new", vat = true }) {
  const W = rules.sa.waterBill;
  const T = (tariff === "current" ? W.current : W.new)[sector];
  if (!T) return null;
  const q = Math.max(0, Number(m3) || 0);
  const tiers = [];
  let water = 0;
  T.tiers.forEach(([from, price], i) => {
    const to = i + 1 < T.tiers.length ? T.tiers[i + 1][0] : Infinity;
    const qty = Math.max(0, Math.min(q, to) - from);
    if (qty > 0) {
      tiers.push({ from, to: to === Infinity ? null : to, qty, price, water: r2(qty * price), sewer: sewer ? r2(qty * price * W.sewerShare) : 0 });
      water += qty * price;
    }
  });
  let fixedWater = 0;
  if (tariff !== "current") {
    if (T.fixedFlat) fixedWater = T.fixedFlat;
    else {
      const mm = Number(meter) || 20;
      fixedWater = (T.fixed.find(([max]) => mm <= max) || T.fixed[T.fixed.length - 1])[1];
    }
    if (T.extraUnit) fixedWater += Math.max(0, Math.floor(Number(units) || 1) - 1) * T.extraUnit;
  }
  const sewerCharge = sewer ? water * W.sewerShare : 0;
  const fixedSewer = sewer ? fixedWater * W.sewerShare : 0;
  const subtotal = water + sewerCharge + fixedWater + fixedSewer;
  const tax = vat ? subtotal * W.vat : 0;
  return {
    tiers, water: r2(water), sewer: r2(sewerCharge), fixedWater, fixedSewer, fixed: fixedWater + fixedSewer,
    consumption: r2(water + sewerCharge), subtotal: r2(subtotal), vat: r2(tax), total: r2(subtotal + tax),
    perM3: q ? r2((subtotal + tax) / q) : null,
  };
}

/**
 * السعودية — «نطاقات»: وزن الموظف السعودي بدوام كامل بحسب أجره المسجل في التأمينات، في كل مرحلة:
 * الحالية (4,000 كامل و3,000 نصف)، ومن 25/4/2027 (5,000)، ومن 25/4/2028 (6,000).
 * نطاق النصف بعد التعديل غير منشور رسمياً؛ halfBand=true يفترض بقاء نطاق الألف ريال تحت الحد.
 */
export function nitaqatWeight(wage, phaseIndex = 0, halfBand = true) {
  const P = rules.sa.nitaqat.phases[phaseIndex];
  const w = Number(wage) || 0;
  if (!P) return 0;
  if (w >= P.full) return 1;
  if (w >= P.half && (P.halfOfficial || halfBand)) return 0.5;
  return 0;
}

export function nitaqatPhaseAt(date = new Date()) {
  const iso = typeof date === "string" ? date : new Date(date).toISOString().slice(0, 10);
  const phases = rules.sa.nitaqat.phases;
  let idx = 0;
  phases.forEach((p, i) => { if (iso >= p.from) idx = i; });
  return idx;
}

/** يحلل قائمة أجور نصية: «4500, 5200» أو سطر لكل أجر، مع «4500×10» لعشرة موظفين بالأجر نفسه، والأرقام العربية الهندية. */
export function parseWageList(text) {
  const t = String(text || "").replace(/[٠-٩]/g, (c) => "٠١٢٣٤٥٦٧٨٩".indexOf(c)).replace(/[۰-۹]/g, (c) => "۰۱۲۳۴۵۶۷۸۹".indexOf(c)).replace(/٫/g, ".").replace(/٬/g, ",");
  const out = [];
  for (const raw of t.split(/[\n\r،;؛]+|\s+/)) {
    if (!raw) continue;
    const parts = /^\d{1,3}(,\d{3})+(\.\d+)?([x×*]\d+)?$/i.test(raw) ? [raw.replace(/,/g, "")] : raw.split(",");
    for (const p of parts) {
      const m = p.trim().match(/^(\d+(?:\.\d+)?)(?:\s*[x×*]\s*(\d+))?$/i);
      if (!m) continue;
      const wage = Number(m[1]);
      const n = Math.min(10000, Number(m[2] || 1));
      if (wage > 0) for (let i = 0; i < n; i++) out.push(wage);
    }
  }
  return out;
}

export function nitaqatSummary(wages, halfBand = true) {
  const phases = rules.sa.nitaqat.phases;
  return phases.map((P, i) => {
    let total = 0, full = 0, half = 0, zero = 0, raiseCost = 0, toRaise = 0;
    for (const w of wages) {
      const x = nitaqatWeight(w, i, halfBand);
      total += x;
      if (x === 1) full++; else if (x === 0.5) half++; else zero++;
      if (w < P.full) { raiseCost += P.full - w; toRaise++; }
    }
    return { from: P.from, full: P.full, half: P.half, halfOfficial: P.halfOfficial, total, fullCount: full, halfCount: half, zeroCount: zero, raiseCost: r2(raiseCost), toRaise };
  });
}

/* ------------------------------------------------------------------ */
/* السعودية — سلم رواتب الموظفين العام والوظائف التعليمية               */
/* ------------------------------------------------------------------ */

/**
 * راتب موظف الدولة من السلم: الأساسي + بدل النقل − استقطاع التقاعد (9% مدني، أو نسبة نظام التأمينات الجديد لمن عُيّن من 3/7/2024).
 * scale: civil (rank 1–15, step) | teacher (rank: assistant|practicing|advanced|expert, level, step).
 * العلاوة: الدرجة التالية في 1 يناير، ولا علاوة بعد آخر درجة.
 */
export function ksaGovSalary({ scale = "civil", rank, level = 1, step = 1, system = "civil", transport = null, asOf = new Date() }) {
  let steps, idx, increment, defaultTransport = 0, maxStep, car = false;
  if (scale === "teacher") {
    const R = rules.sa.teacherScale.ranks[rank];
    if (!R) return null;
    const levels = Object.keys(R.levels).sort((a, b) => a - b);
    steps = levels.flatMap((lv) => R.levels[lv].steps);
    const lvSteps = R.levels[String(level)];
    if (!lvSteps) return null;
    const before = levels.filter((lv) => Number(lv) < Number(level)).reduce((n, lv) => n + R.levels[lv].steps.length, 0);
    const s = Math.floor(Number(step) || 1);
    if (s < 1 || s > lvSteps.steps.length) return null;
    idx = before + s - 1;
    increment = idx + 1 < steps.length ? steps[idx + 1] - steps[idx] : 0;
    defaultTransport = rules.sa.teacherScale.transportDefault;
    maxStep = steps.length;
  } else {
    const R = rules.sa.civilScale.ranks[String(rank)];
    if (!R) return null;
    const s = Math.floor(Number(step) || 1);
    if (s < 1 || s > R.maxStep) return null;
    steps = R.steps;
    idx = s - 1;
    increment = idx + 1 < steps.length ? R.increment : 0;
    maxStep = R.maxStep;
    if (R.transport > 0) defaultTransport = R.transport;
    else car = true;
  }
  const basic = steps[idx];
  const tr = transport === null || transport === undefined || transport === "" ? defaultTransport : Math.max(0, Number(transport) || 0);
  const rate = system === "gosiNew" ? gosiNewEntrantPensionRate(asOf) : rules.sa.civilScale.retirementRate;
  const deduction = basic * rate;
  const atMax = idx + 1 >= steps.length;
  return {
    basic, transport: tr, gross: basic + tr, rate, deduction: r2(deduction), net: r2(basic + tr - deduction),
    increment, nextBasic: atMax ? basic : steps[idx + 1], atMax, position: idx + 1, totalSteps: maxStep, car,
  };
}
