// ملف مولّد آلياً من src/rules.json — لا تعدّله يدوياً
export default {
  "_about": "كل الأرقام القانونية في الموقع تأتي من هذا الملف فقط. عند أي تعديل قانوني: عدّل الرقم هنا، حدّث lastReview، ثم أعد البناء.",
  "lastReview": "2026-11-02",
  "ae": {
    "currency": "AED",
    "gratuity": {
      "law": "المرسوم بقانون اتحادي رقم 33 لسنة 2021 بشأن تنظيم علاقات العمل، المادة 51",
      "daysFirstFiveYears": 21,
      "daysAfterFiveYears": 30,
      "firstPeriodYears": 5,
      "capYearsOfWage": 2,
      "minServiceYears": 1,
      "wageBasis": "الأجر الأساسي",
      "daysPerMonth": 30,
      "paymentDeadlineDays": 14,
      "source": "https://mohre.gov.ae"
    },
    "overtime": {
      "law": "المرسوم بقانون اتحادي 33/2021 المواد 17–21 وقرار مجلس الوزراء 1/2022",
      "hoursPerDay": 8,
      "daysPerMonth": 30,
      "dayMultiplier": 1.25,
      "nightMultiplier": 1.5,
      "nightFrom": "22:00",
      "nightTo": "04:00",
      "restDayMultiplier": 1.5,
      "maxOvertimeHoursPerDay": 2
    },
    "annualLeave": {
      "law": "المرسوم بقانون اتحادي 33/2021 المادة 29",
      "daysPerYear": 30,
      "daysPerMonthAfterSixMonths": 2,
      "encashmentBasis": "الأجر الأساسي",
      "daysPerMonth": 30
    },
    "personalLoan": {
      "law": "نظام مصرف الإمارات المركزي للقروض الشخصية (u.ae، مارس 2026)",
      "maxSalaryMultiple": 20,
      "maxMonths": 48,
      "maxDeductionRatio": 0.5,
      "carLoanMaxLtv": 0.8,
      "carLoanMaxMonths": 60
    },
    "mortgage": {
      "law": "نظام القروض العقارية لمصرف الإمارات المركزي",
      "ltv": {
        "expat": {
          "firstUnder5m": 0.8,
          "firstOver5m": 0.65,
          "second": 0.6
        },
        "national": {
          "firstUnder5m": 0.8,
          "firstOver5m": 0.7,
          "second": 0.65
        },
        "offplan": 0.5
      },
      "priceThreshold": 5000000,
      "maxYears": 25
    },
    "dld": {
      "source": "دائرة الأراضي والأملاك في دبي (رسوم مجمّعة من Property Finder، يوليو 2026)",
      "transferFeePct": 0.04,
      "titleDeedFee": 580,
      "adminFees": 20,
      "trusteeFeeUnder500k": 2000,
      "trusteeFeeOver500k": 4000,
      "trusteeThreshold": 500000,
      "mortgageRegistrationPct": 0.0025,
      "mortgageRegistrationFixed": 290,
      "valuationFeeTypical": 3000,
      "agentCommissionPct": 0.02,
      "vat": 0.05
    },
    "iloe": {
      "law": "المرسوم بقانون اتحادي 13/2022 بشأن التأمين ضد التعطل عن العمل",
      "categoryAMaxBasic": 16000,
      "premiumA": 5,
      "premiumB": 10,
      "compensationRate": 0.6,
      "capA": 10000,
      "capB": 20000,
      "maxMonths": 3,
      "minSubscriptionMonths": 12,
      "claimWithinDays": 30
    },
    "vat": 0.05,
    "sickLeave": {
      "law": "المرسوم بقانون اتحادي 33/2021 المادة 31، واللائحة التنفيذية (قرار مجلس الوزراء 1/2022) المادة 20",
      "maxDays": 90,
      "tiers": [
        {
          "days": 15,
          "frac": 1
        },
        {
          "days": 30,
          "frac": 0.5
        },
        {
          "days": 45,
          "frac": 0
        }
      ],
      "daysPerMonth": 30,
      "notifyWorkingDays": 3
    },
    "maternity": {
      "law": "المرسوم بقانون اتحادي 33/2021 المادتان 30 و32",
      "fullPayDays": 45,
      "halfPayDays": 15,
      "extraUnpaidMaxDays": 45,
      "sickChildFullPayDays": 30,
      "sickChildUnpaidDays": 30,
      "parentalWorkingDays": 5,
      "parentalWithinMonths": 6,
      "nursingMinutesPerDay": 60,
      "nursingMonths": 6,
      "daysPerMonth": 30
    },
    "notice": {
      "law": "المرسوم بقانون اتحادي 33/2021 المادتان 43 و9",
      "minDays": 30,
      "maxDays": 90,
      "probationEmployerDays": 14,
      "probationToUaeEmployerDays": 30,
      "probationLeavingUaeDays": 14,
      "probationMaxMonths": 6,
      "daysPerMonth": 30
    },
    "ramadan": {
      "law": "قرار مجلس الوزراء 1/2022 المادة 15 البند 2، والمرسوم بقانون اتحادي 33/2021 المادتان 17(4) و19(2)",
      "reductionHoursPerDay": 2,
      "overtimeBeyondReduced": "استنتاج من المادة 19(2)، تؤيده أعمدة قانونية، بلا نص رسمي صريح"
    },
    "pension": {
      "new": {
        "law": "المرسوم بقانون اتحادي 57/2023 بشأن المعاشات والتأمينات الاجتماعية (من 31 أكتوبر 2023)",
        "from": "2023-10-31",
        "avgMonths": 72,
        "accrualUpTo30": 0.0267,
        "accrualOver30": 0.04,
        "breakYears": 30,
        "maxPct": 1,
        "retirementAge": 60,
        "minYears": 15,
        "earlyAge": 55,
        "earlyYears": 30,
        "minPension": 10000,
        "contribEmployee": 0.11,
        "contribEmployer": 0.15,
        "govShare": 0.025,
        "govShareBelow": 20000,
        "salaryMin": 3000,
        "salaryMax": 70000,
        "gratuity": [
          1.5,
          2,
          3
        ]
      },
      "legacy": {
        "law": "القانون الاتحادي 7/1999 وتعديلاته (لمن سُجّل قبل 31 أكتوبر 2023)",
        "avgMonths": 60,
        "basePct": 0.6,
        "baseYears": 15,
        "stepPct": 0.02,
        "maxPct": 1,
        "retirementAge": 60,
        "minYears": 15,
        "resignYears": 20,
        "resignAgeBefore2007": 50,
        "resignAgeMenAfter2007": 55,
        "resignAgeWomen": 50,
        "cutoff2007": "2007-02-28",
        "contribEmployee": 0.05,
        "contribEmployer": 0.125,
        "govShare": 0.025,
        "salaryMax": 50000,
        "gratuity": [
          1.5,
          2,
          3
        ]
      }
    },
    "specialLeave": {
      "law": "المرسوم بقانون اتحادي 33/2021 بشأن تنظيم علاقات العمل، المادة 32 (إجازات أخرى)",
      "spouseDeathDays": 5,
      "relativeDeathDays": 3,
      "parentalWorkingDays": 5,
      "parentalWithinMonths": 6,
      "studyWorkingDays": 10,
      "studyServiceYears": 2
    },
    "workHours": {
      "law": "المرسوم بقانون اتحادي 33/2021 المواد 17–19، وقرار مجلس الوزراء 1/2022 المادة 15",
      "hoursPerDay": 8,
      "hoursPerWeek": 48,
      "ramadanReductionPerDay": 2,
      "maxConsecutiveHours": 5,
      "minBreakMinutes": 60,
      "maxOvertimePerDay": 2,
      "maxHoursPer3Weeks": 144
    },
    "domestic": {
      "law": "المرسوم بقانون اتحادي 9 لسنة 2022 بشأن عمال الخدمة المساعدة ولائحته (قرار مجلس الوزراء 106 لسنة 2022)",
      "eosDaysPerYear": 14,
      "eosMinServiceYears": 1,
      "eosRateConfirmed": 0,
      "annualLeaveDaysPerYear": 30,
      "leaveMinMonths": 6,
      "leaveDaysPerMonthFirstYear": 2,
      "leaveDaysPerMonthAfter": 2.5,
      "sickFullPayDays": 15,
      "sickHalfPayDays": 15,
      "finalDuesDeadlineDays": 10,
      "probationMonthsMax": 6,
      "contractMonthsDefault": 24,
      "refundDeadlineDays": 14,
      "claimTimeLimitMonths": 3,
      "monthDays": 30
    },
    "corporateTax": {
      "law": "المرسوم بقانون اتحادي 47/2022 بشأن الضريبة على الشركات والأعمال، وقرار مجلس الوزراء 116/2023 (حد 375,000)، وقرار مجلس الوزراء 49/2023 (الأشخاص الطبيعيون)، والقرار الوزاري 73/2023 المعدل بالقرار 131/2026 (إعفاء الأعمال الصغيرة)",
      "rate": 0.09,
      "zeroBand": 375000,
      "naturalPersonTurnover": 1000000,
      "sbrRevenueMax": 3000000,
      "sbrFirstPeriodStart": "2023-06-01",
      "sbrLastPeriodEndYear": 2029,
      "sbrMneGroupRevenue": 3150000000,
      "lossOffsetCap": 0.75
    },
    "dubaiRent": {
      "law": "مرسوم دبي 43/2013 بتحديد زيادة بدل إيجار العقارات، والقانون 26/2007 المادة 14 (الإخطار قبل 90 يوماً)، ومؤشر دبي الذكي للإيجارات منذ يناير 2025",
      "bands": [
        [
          10,
          0
        ],
        [
          20,
          0.05
        ],
        [
          30,
          0.1
        ],
        [
          40,
          0.15
        ],
        [
          100,
          0.2
        ]
      ],
      "noticeDays": 90
    },
    "abuDhabiPension": {
      "law": "قانون أبوظبي 2/2000 بشأن معاشات ومكافآت التقاعد المدنية، معدلاً بالقانون 18/2023 (نافذ 1/12/2023)",
      "newFrom": "2023-12-01",
      "accrualFirst": 0.032,
      "firstYears": 25,
      "accrualAfter": 0.02,
      "maxPct": 1,
      "maxYears": 35,
      "minPension": 10200,
      "excessSalariesPerYear": 3,
      "privateFloor": 6000,
      "gratuity": [
        1.5,
        2,
        3
      ],
      "new": {
        "age": 60,
        "minYears": 15,
        "earlyAge": 55,
        "earlyYears": 25,
        "mothers": [
          [
            5,
            23,
            52
          ],
          [
            6,
            21,
            49
          ],
          [
            7,
            17.5,
            45
          ]
        ],
        "employee": 0.11,
        "employer": 0.15,
        "government": 0,
        "cap": 100000,
        "capSenior": 150000
      },
      "existing": {
        "employee": 0.05,
        "employer": 0.15,
        "government": 0.06,
        "cap": 150000,
        "oldAnyAgeYears": 25,
        "oldMenAge": 60,
        "oldWomenAge": 55,
        "oldAgeMinYears": 10,
        "oldMotherAnyAgeYears": 15,
        "oldMotherAge": 50,
        "oldMotherAgeMinYears": 10,
        "step": 0.5,
        "route25Years": 25,
        "route25AgeFirst": 45,
        "route25AgeFinal": 55,
        "route60Age": 60,
        "routeYearsBase": 10,
        "routeYearsFinal": 15,
        "routeWomenAgeBase": 55,
        "routeMotherAgeBase": 50,
        "routeAgeFinal": 60,
        "routeMotherServiceBase": 15,
        "routeMotherServiceFinal": 25,
        "minCreditedYears": 15
      }
    },
    "emiratisation": {
      "largeMin": 50,
      "smallMin": 20,
      "smallMax": 49,
      "perSkilled": 50,
      "minPerYear": 1,
      "firstYear": 2022,
      "deadlines": [
        {
          "date": "2025-12-31",
          "fullSteps": 4,
          "half": 0,
          "pct": 0.08,
          "contrib": 108000,
          "collect": "2026-01-01"
        },
        {
          "date": "2026-06-30",
          "fullSteps": 4,
          "half": 1,
          "pct": 0.09,
          "contrib": 60000,
          "collect": "2026-07-01"
        },
        {
          "date": "2026-12-31",
          "fullSteps": 5,
          "half": 0,
          "pct": 0.1,
          "contrib": 120000,
          "collect": "2027-01-01"
        }
      ],
      "monthly": {
        "2022": 6000,
        "2023": 7000,
        "2024": 8000,
        "2025": 9000,
        "2026": 10000
      },
      "small": {
        "required": {
          "2024": 1,
          "2025": 2
        },
        "contrib": {
          "2024": 96000,
          "2025": 108000
        }
      },
      "minSalary": 6000,
      "minSalaryCountFrom": "2026-07-01",
      "skilledMinSalary": 4000,
      "exemptShare": 0.7,
      "graceMonths": 2,
      "fakeMin": 20000,
      "fakeMax": 100000,
      "circumvent": [
        100000,
        300000,
        500000
      ]
    },
    "residency": {
      "law": "قرار مجلس الوزراء 65/2022 (اللائحة التنفيذية لقانون دخول الأجانب وإقامتهم) وقرار 88/2022 للرسوم",
      "golden": {
        "years": 10,
        "property": 2000000,
        "investment": 2000000,
        "annualTax": 250000,
        "entrepreneurRevenue": 1000000,
        "skilledSalary": 30000,
        "skilledMaxLevel": 2,
        "highSchool": 95,
        "uaeUniA": 3.5,
        "uaeUniB": 3.8,
        "intlRank": 100,
        "intlGpa": 3.5,
        "gradYears": 2
      },
      "green": {
        "years": 5,
        "skilledSalary": 15000,
        "skilledMaxLevel": 3,
        "freelanceIncome": 360000,
        "investor": 1000000
      },
      "retirement": {
        "years": 5,
        "age": 55,
        "serviceYears": 15,
        "property": 1000000,
        "deposit": 1000000,
        "income": 240000,
        "dubaiIncomeReported": 180000,
        "dubaiComboReported": 500000
      },
      "fees": {
        "goldenIcpEstimate": 2200,
        "greenIcpEstimate": 1200,
        "gdrfaGolden": 1640,
        "gdrfaGreen": 740,
        "dldGoldenPackage": 9884.75,
        "dldFamilyMember": 5774.5
      }
    },
    "workInjury": {
      "law": "المرسوم بقانون اتحادي 33/2021 المادتان 37 و38، والقرار الوزاري 657/2022",
      "fullWageMonths": 6,
      "halfWageMonths": 6,
      "daysPerMonth": 30,
      "deathMonthsBasic": 24,
      "deathMin": 18000,
      "deathMax": 200000,
      "gpssaPartialBase": 75000,
      "gpssaLegacyDeathLump": 75000
    },
    "overstay": {
      "law": "المرسوم بقانون اتحادي 29/2021 (م11) ولائحته التنفيذية 65/2022 (م64)، وصفحتا ICP لتجديد الإقامة ودفع الغرامات (محدّثتان 11/12/2024)",
      "lastReview": "2026-11-03",
      "perDay": 50,
      "types": {
        "res180": {
          "grace": 180
        },
        "res90": {
          "grace": 90
        },
        "res60": {
          "grace": 60
        },
        "res30": {
          "grace": 30
        },
        "visit": {
          "grace": 0
        },
        "permit": {
          "grace": 7
        },
        "newborn": {
          "grace": 120,
          "perDayAlt": 100
        },
        "eid": {
          "grace": 30,
          "perDay": 20,
          "cap": 1000
        }
      },
      "departurePermit": 200,
      "smartFee": 100,
      "statusChangeInside": 500,
      "waiver": {
        "from": "2026-02-28",
        "to": "2026-07-09",
        "types": [
          "res180",
          "res90",
          "res60",
          "res30",
          "visit",
          "permit"
        ]
      }
    },
    "holidays": {
      "law": "المرسوم بقانون اتحادي 33/2021 (م28) وقرار مجلس الوزراء 27/2024 بشأن العطلات الرسمية (نافذ 1/1/2025)",
      "lastReview": "2026-11-03",
      "items": [
        {
          "id": "newYear",
          "ar": "رأس السنة الميلادية",
          "en": "New Year's Day",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-01-01"
          ],
          "hijri": 0,
          "official2026": 0,
          "official2027": 1
        },
        {
          "id": "eidAlFitr",
          "ar": "عيد الفطر",
          "en": "Eid al-Fitr",
          "days": 3,
          "daysMax": 4,
          "d2026": [],
          "d2027": [
            "2027-03-09",
            "2027-03-10",
            "2027-03-11"
          ],
          "alt2027": [
            "2027-03-09",
            "2027-03-10",
            "2027-03-11",
            "2027-03-12"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "arafat",
          "ar": "يوم عرفة",
          "en": "Arafat Day",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-05-15"
          ],
          "alt2027": [
            "2027-05-16"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "eidAlAdha",
          "ar": "عيد الأضحى",
          "en": "Eid al-Adha",
          "days": 3,
          "d2026": [],
          "d2027": [
            "2027-05-16",
            "2027-05-17",
            "2027-05-18"
          ],
          "alt2027": [
            "2027-05-17",
            "2027-05-18",
            "2027-05-19"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "hijriNewYear",
          "ar": "رأس السنة الهجرية",
          "en": "Islamic New Year",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-06-06"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "mawlid",
          "ar": "المولد النبوي",
          "en": "Prophet's Birthday",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-08-14"
          ],
          "alt2027": [
            "2027-08-15"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "nationalDay",
          "ar": "عيد الاتحاد (اليوم الوطني)",
          "en": "Eid Al Etihad (National Day)",
          "days": 2,
          "d2026": [
            "2026-12-02",
            "2026-12-03"
          ],
          "d2027": [
            "2027-12-02",
            "2027-12-03"
          ],
          "hijri": 0,
          "official2026": 1,
          "official2027": 1
        }
      ],
      "workPay": {
        "multiplier": 1.5,
        "substituteDay": 1,
        "substituteMode": 1,
        "wageBasis": 3,
        "premiumOnBasic": 0.5,
        "mohreGuideTotalMultiplier": 2.5,
        "weekendOverlapCompDay": 0
      }
    },
    "nafis": {
      "law": "قرارات مجلس تنافسية الكوادر الإماراتية المعلنة في 14 أبريل 2026 والنافذة من 1 سبتمبر 2026",
      "lastReview": "2026-11-03",
      "newFrom": "2026-09-01",
      "existingCutoff": "2026-08-14",
      "programTo": 2040,
      "minSalary": 6000,
      "maxSalary": 20000,
      "amounts": {
        "bachelor": 6000,
        "diploma": 5000,
        "highSchool": 4000,
        "belowFamily": 4000,
        "below": 3000
      },
      "legacy": {
        "lowMax": 20000,
        "highMax": 30000,
        "low": {
          "bachelor": 7000,
          "diploma": 6000,
          "highSchool": 5000
        },
        "high": {
          "bachelor": 3500,
          "diploma": 3000,
          "highSchool": 2500
        }
      },
      "step": 500,
      "stepMonths": 6,
      "firstStep": "2026-09-01",
      "outside": [
        {
          "from": "2026-09-01",
          "to": "2027-02-28",
          "pct": 1
        },
        {
          "from": "2027-03-01",
          "to": "2027-08-31",
          "pct": 0.7
        },
        {
          "from": "2027-09-01",
          "to": "2027-11-30",
          "pct": 0.3
        }
      ],
      "special": {
        "motherChild": {
          "max": 3000,
          "maxSalary": 20000
        },
        "wife": {
          "max": 3000,
          "maxSalary": 15000,
          "minChildren": 2,
          "minYears": 5,
          "exemptYears": 2
        }
      },
      "child": {
        "perChild": 600,
        "maxSalary": 50000
      },
      "pension": {
        "maxSalary": 20000,
        "shareNew": 0.11,
        "shareOld": 0.05
      },
      "jobLoss": {
        "self": 7000,
        "spouse": 4500,
        "children": [
          2400,
          2400,
          1600
        ],
        "maxMonths": 12,
        "maxConsecutive": 6,
        "minAge": 18,
        "maxAge": 60
      }
    },
    "contrib": {
      "law": "المرسوم بقانون اتحادي 57/2023 (م4–5)، والقانون 7/1999 كما عُدّل بالمرسوم بقانون 58/2023، وقانون أبوظبي 2/2000 المعدل بالقانون 18/2023، وقانون الشارقة 5/2018",
      "lastReview": "2026-11-03",
      "gpssaNew": {
        "employee": 0.11,
        "employer": 0.15,
        "govShare": 0.025,
        "govShareBelow": 20000,
        "privateMin": 3000,
        "privateMax": 70000,
        "govMax": 100000
      },
      "gpssaOld": {
        "employee": 0.05,
        "employer": 0.15,
        "govShare": 0.025,
        "privateMin": 1000,
        "privateMax": 50000,
        "govMax": 300000
      },
      "adpfNew": {
        "employee": 0.11,
        "employer": 0.15,
        "privateMin": 6000,
        "max": 100000
      },
      "adpfCurrent": {
        "employee": 0.05,
        "employer": 0.15,
        "govAnnual": 0.06,
        "privateMin": 6000,
        "max": 150000
      },
      "sharjah": {
        "employee": 0.05,
        "employer": 0.15
      },
      "nafisMin": 6000,
      "nafisMax": 20000
    }
  },
  "sa": {
    "currency": "SAR",
    "eos": {
      "law": "نظام العمل السعودي، المواد 84 و85 و87",
      "halfMonthYears": 5,
      "firstPeriodFraction": 0.5,
      "afterPeriodFraction": 1,
      "wageBasis": "الأجر الأخير (الأجر الفعلي: الأساسي + البدلات الثابتة)",
      "resignation": [
        {
          "minYears": 0,
          "maxYears": 2,
          "fraction": 0
        },
        {
          "minYears": 2,
          "maxYears": 5,
          "fraction": 0.3333333333,
          "inclusiveMax": true
        },
        {
          "minYears": 5,
          "maxYears": 10,
          "fraction": 0.6666666667
        },
        {
          "minYears": 10,
          "maxYears": null,
          "fraction": 1
        }
      ]
    },
    "gosi": {
      "law": "نظام التأمينات الاجتماعية ونظام التأمينات الجديد الصادر في يوليو 2024",
      "pensionRateLegacy": 0.09,
      "pensionRateNewStart": 0.09,
      "pensionRateNewStep": 0.005,
      "pensionRateNewMax": 0.11,
      "newSystemStart": "2024-07-03",
      "firstStepDate": "2025-07-01",
      "sanedRate": 0.0075,
      "hazardsRate": 0.02,
      "wageCeiling": 45000,
      "contributoryWage": "الأجر الأساسي + بدل السكن النقدي"
    },
    "annualLeave": {
      "law": "نظام العمل السعودي، المادتان 109 و111",
      "daysPerYear": 21,
      "daysPerYearAfterFive": 30,
      "afterYears": 5,
      "daysPerMonth": 30
    },
    "finance": {
      "law": "تعليمات ساما لنسب الاستقطاع والتعثر (29/4/2013)",
      "maxDeductionEmployee": 0.33,
      "maxDeductionRetiree": 0.25,
      "typicalMaxMonths": 60
    },
    "vat": 0.15,
    "sickLeave": {
      "law": "نظام العمل السعودي المادة 117",
      "maxDays": 120,
      "tiers": [
        {
          "days": 30,
          "frac": 1
        },
        {
          "days": 60,
          "frac": 0.75
        },
        {
          "days": 30,
          "frac": 0
        }
      ],
      "daysPerMonth": 30
    },
    "maternity": {
      "law": "نظام العمل السعودي المادتان 151 و113 (بتعديل المرسوم الملكي م/44، نافذ 19 فبراير 2025)",
      "weeks": 12,
      "mandatoryPostWeeks": 6,
      "maxPreWeeks": 4,
      "unpaidExtensionMonths": 1,
      "sickChildFullPayMonths": 1,
      "marriageDays": 5,
      "deathFamilyDays": 5,
      "deathSiblingDays": 3,
      "paternityDays": 3,
      "paternityWithinDays": 7,
      "gosi": {
        "law": "نظام التأمينات الاجتماعية م41–42 (تعويض الأمومة)، مطبّق منذ 1 يوليو 2025",
        "from": "2025-07-01",
        "months": 3,
        "sickChildExtraMonths": 1,
        "rate": 1,
        "minContribMonths": 12,
        "withinMonths": 36,
        "wageCap": 45000
      }
    },
    "notice": {
      "law": "نظام العمل السعودي المادة 75 (معدلة 2025) والمادة 76",
      "monthlyWorkerDays": 30,
      "monthlyEmployerDays": 60,
      "notMonthlyDays": 30,
      "daysPerMonth": 30
    },
    "art77": {
      "law": "نظام العمل السعودي المادة 77",
      "daysPerYear": 15,
      "minMonths": 2,
      "daysPerMonth": 30
    },
    "overtime": {
      "law": "نظام العمل السعودي المادة 107 (معدلة 2025) والمادة 98، والدليل التوعوي لوزارة الموارد البشرية 2025",
      "premium": 0.5,
      "daysPerMonth": 30,
      "hoursPerDay": 8,
      "compLeaveHoursPerOtHour": 1.5,
      "compLeaveUseWithinDays": 60,
      "compLeaveMaxDaysPerYear": 30,
      "annualCapHours": 720
    },
    "ramadan": {
      "law": "نظام العمل السعودي المادة 98",
      "muslimHoursPerDay": 6,
      "muslimHoursPerWeek": 36
    },
    "pension": {
      "legacy": {
        "law": "نظام التأمينات الاجتماعية (م/33 لعام 1421هـ) ولائحته: المعاش = متوسط آخر 24 شهراً × الأشهر ÷ 480",
        "divisorMonths": 480,
        "maxPct": 1,
        "minPension": 1983.75,
        "retirementAgeHijri": 60,
        "minMonths": 120,
        "earlyMinMonths": 300,
        "avgMonths": 24,
        "daysToCountAsMonth": 13,
        "lumpSumPctFirst60": 0.1,
        "lumpSumPctAfter60": 0.12
      },
      "transitional": {
        "law": "المرسوم الملكي م/273 وقرار مجلس الوزراء 1022 (نافذ 3 يوليو 2024)",
        "effective": "2024-07-03",
        "affectedIfAgeBelow": 48.5,
        "affectedIfMonthsBelow": 240,
        "ageTable": [
          [
            0,
            29,
            780
          ],
          [
            29,
            30,
            776
          ],
          [
            30,
            31,
            772
          ],
          [
            31,
            32,
            768
          ],
          [
            32,
            33,
            764
          ],
          [
            33,
            34,
            760
          ],
          [
            34,
            35,
            756
          ],
          [
            35,
            36,
            752
          ],
          [
            36,
            37,
            748
          ],
          [
            37,
            38,
            744
          ],
          [
            38,
            39,
            740
          ],
          [
            39,
            40,
            736
          ],
          [
            40,
            41,
            732
          ],
          [
            41,
            42,
            728
          ],
          [
            42,
            43,
            724
          ],
          [
            43,
            44,
            720
          ],
          [
            44,
            45,
            716
          ],
          [
            45,
            46,
            712
          ],
          [
            46,
            47,
            708
          ],
          [
            47,
            48,
            704
          ],
          [
            48,
            48.5,
            700
          ]
        ],
        "earlyTable": [
          [
            0,
            180,
            360
          ],
          [
            180,
            192,
            348
          ],
          [
            192,
            204,
            336
          ],
          [
            204,
            216,
            324
          ],
          [
            216,
            228,
            312
          ],
          [
            228,
            240,
            300
          ]
        ]
      },
      "new": {
        "law": "نظام التأمينات الاجتماعية (م/273 لعام 1445هـ) المواد 16 و17 و25 و26",
        "effective": "2024-07-03",
        "retirementAge": 65,
        "minMonths": 180,
        "avgHighestMonths": 180,
        "accrualPerYear": 0.0225,
        "maxPct": 1,
        "earlyMinMonths": 360,
        "earlyMaxMonthsBefore": 120,
        "earlyReductionPerYear": 0.03,
        "earlyReferenceMonths": 480,
        "deferralIncreasePerYear": 0.03,
        "minPensionFull": 4000,
        "minPensionFullMonths": 480,
        "minPensionFloor": 2000,
        "minPensionFloorMonths": 180
      }
    },
    "saned": {
      "law": "نظام التأمينات الاجتماعية 1445 المواد 43–48، ونظام التأمين ضد التعطل (م/18 لعام 1435هـ)",
      "avgMonths": 24,
      "pctFirst3": 0.6,
      "pctAfter3": 0.5,
      "capFirst3": 9000,
      "capAfter3": 7500,
      "maxMonths": 12,
      "windowMonths": 24,
      "firstClaimMonths": 12,
      "firstClaimWithin": 36,
      "applyWithinDays": 90,
      "maxAge": 60
    },
    "expatFees": {
      "law": "قرارات مجلس الوزراء 353 و197 (المقابل المالي)، و325 (التجديد الربع سنوي)، وقرار تعديل رسوم التأشيرات 1438هـ؛ نظام العمل م40",
      "dependentMonthly": 400,
      "dependentSince": "2020-07-01",
      "levyHigh": 800,
      "levyLow": 700,
      "workPermitAnnual": 100,
      "iqamaAnnualBase": 500,
      "workerIqamaReported": 650,
      "periods": [
        3,
        6,
        9,
        12
      ],
      "smallEstablishment": {
        "maxWorkers": 9,
        "exemptOwnerOnly": 2,
        "exemptOwnerPlusSaudi": 4
      },
      "exitReentry": {
        "singleBase": 200,
        "singleBaseMonths": 2,
        "singleExtra": 100,
        "multipleBase": 500,
        "multipleBaseMonths": 3,
        "multipleExtra": 200,
        "outsideMultiplier": 2,
        "daysPerMonth": 30
      },
      "lateFines": [
        500,
        1000
      ],
      "finalExitUnusedFine": 1000
    },
    "homeFinance": {
      "law": "مبادئ التمويل المسؤول للأفراد (ساما) م13–م19 نافذة 12/8/2018؛ اللائحة التنفيذية لنظام التمويل العقاري وتعاميم ساما بنسب التمويل (آخرها 391000048362)؛ تعميم الرسوم الإدارية 361000091211؛ دليل ضريبة التصرفات العقارية",
      "lastReview": "2026-11-03",
      "incomeLowMax": 15000,
      "incomeHighMin": 25000,
      "salaryDeductionCapEmployee": 0.3333,
      "salaryDeductionCapRetiree": 0.25,
      "nonMortgageCap": 0.45,
      "totalCapLow": 0.55,
      "totalCapLowSubsidizedRegulatory": 0.65,
      "totalCapMid": 0.65,
      "totalCapHighDefault": 0.65,
      "totalCapHighBankMax": 0.7,
      "otherIncomeWeight": 0.5,
      "ltvBaseBank": 0.7,
      "ltvBaseFinanceCo": 0.85,
      "ltvFirstHomeCitizen": 0.9,
      "ltvRedfReduced": 0.95,
      "redfDpReductionMaxPrice": 800000,
      "redfDpReductionMaxAmount": 40000,
      "tenorMaxYearsDefault": 25,
      "tenorMaxYearsExtended": 30,
      "ageAtMaturityDefault": 70,
      "dpSupportHigh": 150000,
      "dpSupportLow": 100000,
      "dpSupportNetSalaryThreshold": 10000,
      "profitSubsidyMaxFinance": 500000,
      "profitSubsidyFullIncomeMax": 14000,
      "profitSubsidyYears": 20,
      "rettRate": 0.05,
      "rettFirstHomeStateBorneUpTo": 1000000,
      "adminFeePct": 0.01,
      "adminFeeCap": 5000,
      "vatRate": 0.15,
      "aprIndicativeLow": 5.5,
      "aprIndicativeHigh": 7.5,
      "aprIndicativeDefault": 6.5
    },
    "specialLeave": {
      "law": "نظام العمل: المادة 113 (معدلة بالمرسوم م/44 نافذ 19/2/2025) والمواد 114 و115 و116 و160",
      "marriage": 5,
      "deathClose": 5,
      "deathSibling": 3,
      "paternity": 3,
      "paternityWithinDays": 7,
      "hajjMin": 10,
      "hajjMax": 15,
      "hajjServiceYears": 2,
      "iddahMonths": 4,
      "iddahDays": 10,
      "iddahNonMuslimDays": 15,
      "examNoticeDays": 15,
      "unpaidSuspendAfterDays": 20
    },
    "workHours": {
      "law": "نظام العمل السعودي المواد 98 و101 و102 و104 و107",
      "hoursPerDay": 8,
      "hoursPerWeek": 48,
      "ramadanMuslimPerDay": 6,
      "ramadanMuslimPerWeek": 36,
      "maxConsecutiveHours": 5,
      "minBreakMinutes": 30,
      "maxPresenceHours": 12,
      "overtimeAnnualCapHours": 720,
      "weeklyRestHours": 24
    },
    "domestic": {
      "law": "لائحة العمالة المنزلية ومن في حكمها — قرار وزير الموارد البشرية 40676 وتاريخ 17/3/1445هـ (أم القرى 6/10/2023، نافذة بعد سنة)",
      "monthDays": 30,
      "probationDaysMax": 90,
      "maxDailyWorkHours": 10,
      "dailyRestHours": 8,
      "weeklyRestHours": 24,
      "annualLeaveDays": 30,
      "annualLeaveAfterYears": 2,
      "sickFullPayDays": 15,
      "sickHalfPayDays": 15,
      "eosMonthsPerBlock": 1,
      "eosBlockYears": 4,
      "compMonths": 2,
      "settlementDaysEmployerEnds": 7,
      "settlementDaysWorkerEnds": 14,
      "deductionCapPct": 25,
      "claimTimeLimitMonths": 12,
      "contractEndsAtAge": 60
    },
    "socialSecurity": {
      "law": "نظام الضمان الاجتماعي (المرسوم الملكي م/32 وتاريخ 4/4/1442هـ) ولائحته التنفيذية، والتوجيه الملكي برفع المبالغ (أكتوبر 2023)",
      "basicHead": 1320,
      "perDependent": 660,
      "currentSince": "2023-11-01",
      "previousHead": 1100,
      "previousDependent": 550,
      "familyMax": 5000,
      "earnedRate": 0.5,
      "unearnedRate": 1,
      "paymentDay": 1,
      "maxMonthsAbroad": 3,
      "independentMinAge": 18,
      "maxCarsIndependent": 1,
      "maxCarsFamily": 3,
      "maxDomesticWorkers": 2
    },
    "civilPension": {
      "law": "نظام التقاعد المدني (م/41 لعام 1393هـ) المواد 13 و15 و16 و18 و19 و23 و23 مكرر (المرسوم م/118 لعام 1443هـ)، وقرار مجلس الوزراء 1022 (1445هـ)",
      "contribEmployee": 0.09,
      "contribGovernment": 0.09,
      "divisorMonths": 480,
      "maxMonths": 480,
      "mandatoryAgeHijri": 60,
      "maxExtensionAgeHijri": 65,
      "anyExitMinMonths": 300,
      "earlyApprovalMinMonths": 240,
      "abolitionMinMonths": 180,
      "deferredMinMonths": 120,
      "notionalMinMonths": 60,
      "notionalMaxTotalMonths": 120,
      "notionalRateInferred": 0.18,
      "gratuityRate": 0.14,
      "gratuityRateResign": 0.1,
      "minPensionUnverified": 1983.75
    },
    "militaryPension": {
      "law": "نظام التقاعد العسكري (م/24 لعام 1395هـ) المادة 7 المعدلة",
      "divisorMonths": 420,
      "maxMonthsInferred": 420,
      "minActualMonths": 216,
      "minCombinedMonths": 240,
      "minMilitaryWithinCombined": 96,
      "pensionAtAge": 55
    },
    "electricity": {
      "law": "إعلان الشركة السعودية للطاقة بتعديل تعرفة الخدمة الكهربائية (25 أكتوبر 2026)، نافذ من 1 يناير 2027؛ والتعرفة السابقة نافذة منذ يناير 2018",
      "effective": "2027-01-01",
      "vat": 0.15,
      "tierKwh": 6000,
      "daysPerMonth": 30,
      "sectors": {
        "residential": {
          "old": [
            0.18,
            0.3
          ],
          "new": [
            0.21,
            0.33
          ]
        },
        "commercial": {
          "new": [
            0.25,
            0.35
          ]
        },
        "agricultural": {
          "new": [
            0.19,
            0.23
          ]
        },
        "industrial": {
          "new": [
            0.23,
            0.23
          ]
        },
        "government": {
          "new": [
            0.35,
            0.35
          ]
        }
      },
      "residentialFixed": [
        [
          20,
          100,
          70
        ],
        [
          100,
          200,
          80
        ],
        [
          200,
          300,
          90
        ],
        [
          300,
          100000,
          100
        ]
      ],
      "supportMonthly": 500
    },
    "waterBill": {
      "law": "تعرفة شركة المياه الوطنية المعدلة (إعلان 25/10/2026، نفاذ 1/1/2027)؛ والتعرفة الحالية بقرار مجلس الوزراء 95 في 17/3/1437هـ",
      "effective": "2027-01-01",
      "vat": 0.15,
      "sewerShare": 0.5,
      "new": {
        "residential": {
          "tiers": [
            [
              0,
              1
            ],
            [
              15,
              2
            ],
            [
              30,
              4
            ],
            [
              45,
              6
            ]
          ],
          "fixed": [
            [
              20,
              20
            ],
            [
              40,
              40
            ],
            [
              65,
              60
            ],
            [
              100,
              80
            ],
            [
              100000,
              100
            ]
          ],
          "extraUnit": 20
        },
        "commercial": {
          "tiers": [
            [
              0,
              8
            ]
          ],
          "fixed": [
            [
              20,
              40
            ],
            [
              40,
              60
            ],
            [
              65,
              80
            ],
            [
              100,
              100
            ],
            [
              100000,
              150
            ]
          ]
        },
        "government": {
          "tiers": [
            [
              0,
              10
            ]
          ],
          "fixedFlat": 1000
        }
      },
      "current": {
        "residential": {
          "tiers": [
            [
              0,
              0.1
            ],
            [
              15,
              1
            ],
            [
              30,
              3
            ],
            [
              45,
              4
            ],
            [
              60,
              6
            ]
          ]
        }
      },
      "supportMonthly": 500
    },
    "nitaqat": {
      "law": "القرار الوزاري 61706 في 3/4/1442هـ (نافذ 18/4/2021)، والتوجيه الملكي في 14/5/1448هـ (25/10/2026) برفع حد الاحتساب الكامل إلى 5,000 ثم 6,000 ريال",
      "wageBasis": "الأجر المسجل في التأمينات الاجتماعية (الخاضع للاشتراك)",
      "phases": [
        {
          "from": "2021-04-18",
          "full": 4000,
          "half": 3000,
          "halfOfficial": true
        },
        {
          "from": "2027-04-25",
          "full": 5000,
          "half": 4000,
          "halfOfficial": false
        },
        {
          "from": "2028-04-25",
          "full": 6000,
          "half": 5000,
          "halfOfficial": false
        }
      ],
      "special": {
        "partTime": {
          "weight": 0.5,
          "minWage": 3000,
          "maxEntities": 2
        },
        "flexible": {
          "weight": 0.3333333333333333,
          "hours": 168,
          "minHourly": 25
        },
        "student": {
          "weight": 0.5,
          "minWage": 3000,
          "capShare": 0.1,
          "capShareRestaurants": 0.4
        },
        "disabled": {
          "weight": 4,
          "minWage": 4000,
          "capShare": 0.1
        },
        "released": {
          "weight": 2,
          "years": 2,
          "minWage": 4000,
          "capShare": 0.1
        },
        "totalCapShare": 0.15
      },
      "hrdfSupport": {
        "share": 0.5,
        "capMonthly": 3000,
        "minWageNow": 4000,
        "maxWage": 15000,
        "maxMonths": 24
      }
    },
    "civilScale": {
      "law": "نظام الخدمة المدنية (م/49، 10/7/1397هـ): م17 المعدلة بالمرسوم م/139 (19/10/1441هـ) وم18؛ السلم الملحق (م/18، 22/5/1397هـ) بعد زيادة 15% (أ/227، 1426هـ) وضم بدل الغلاء 15% (أ/23، 20/3/1432هـ) والحد الأدنى 3,000 (أ/62، 13/4/1432هـ)؛ لائحة الحقوق والمزايا المالية (أ/28، 20/3/1432هـ) م36 وم44",
      "note": "أرقام الجدول من مصادر ثانوية متطابقة وفحص حسابي (السلم المتداول منذ 1432هـ)؛ القواعد (العلاوة وبدل النقل) من نصوص رسمية",
      "incrementMonth": 1,
      "incrementDay": 1,
      "retirementRate": 0.09,
      "rank15CarAllowance": 2000,
      "rank15CarMaxMonths": 6,
      "ranks": {
        "1": {
          "steps": [
            3000,
            3135,
            3270,
            3405,
            3540,
            3675,
            3810,
            3945,
            4080,
            4215,
            4350,
            4485,
            4620,
            4755,
            4890
          ],
          "increment": 135,
          "maxStep": 15,
          "transport": 500
        },
        "2": {
          "steps": [
            3430,
            3595,
            3760,
            3925,
            4090,
            4255,
            4420,
            4585,
            4750,
            4915,
            5080,
            5245,
            5410,
            5575,
            5740
          ],
          "increment": 165,
          "maxStep": 15,
          "transport": 500
        },
        "3": {
          "steps": [
            3945,
            4135,
            4325,
            4515,
            4705,
            4895,
            5085,
            5275,
            5465,
            5655,
            5845,
            6035,
            6225,
            6415,
            6605
          ],
          "increment": 190,
          "maxStep": 15,
          "transport": 500
        },
        "4": {
          "steps": [
            4530,
            4760,
            4990,
            5220,
            5450,
            5680,
            5910,
            6140,
            6370,
            6600,
            6830,
            7060,
            7290,
            7520,
            7750
          ],
          "increment": 230,
          "maxStep": 15,
          "transport": 500
        },
        "5": {
          "steps": [
            5240,
            5505,
            5770,
            6035,
            6300,
            6565,
            6830,
            7095,
            7360,
            7625,
            7890,
            8155,
            8420,
            8685,
            8950
          ],
          "increment": 265,
          "maxStep": 15,
          "transport": 500
        },
        "6": {
          "steps": [
            6065,
            6370,
            6675,
            6980,
            7285,
            7590,
            7895,
            8200,
            8505,
            8810,
            9115,
            9420,
            9725,
            10030,
            10335
          ],
          "increment": 305,
          "maxStep": 15,
          "transport": 700
        },
        "7": {
          "steps": [
            7010,
            7375,
            7740,
            8105,
            8470,
            8835,
            9200,
            9565,
            9930,
            10295,
            10660,
            11025,
            11390,
            11755,
            12120
          ],
          "increment": 365,
          "maxStep": 15,
          "transport": 700
        },
        "8": {
          "steps": [
            8010,
            8425,
            8840,
            9255,
            9670,
            10085,
            10500,
            10915,
            11330,
            11745,
            12160,
            12575,
            12990,
            13405,
            13820
          ],
          "increment": 415,
          "maxStep": 15,
          "transport": 700
        },
        "9": {
          "steps": [
            9275,
            9745,
            10215,
            10685,
            11155,
            11625,
            12095,
            12565,
            13035,
            13505,
            13975,
            14445,
            14915,
            15385,
            15855
          ],
          "increment": 470,
          "maxStep": 15,
          "transport": 700
        },
        "10": {
          "steps": [
            10275,
            10785,
            11295,
            11805,
            12315,
            12825,
            13335,
            13845,
            14355,
            14865,
            15375,
            15885,
            16395,
            16905,
            17415
          ],
          "increment": 510,
          "maxStep": 15,
          "transport": 700
        },
        "11": {
          "steps": [
            11815,
            12345,
            12875,
            13405,
            13935,
            14465,
            14995,
            15525,
            16055,
            16585,
            17115,
            17645,
            18175,
            18705
          ],
          "increment": 530,
          "maxStep": 14,
          "transport": 900
        },
        "12": {
          "steps": [
            13435,
            14005,
            14575,
            15145,
            15715,
            16285,
            16855,
            17425,
            17995,
            18565,
            19135,
            19705,
            20275
          ],
          "increment": 570,
          "maxStep": 13,
          "transport": 900
        },
        "13": {
          "steps": [
            15180,
            15785,
            16390,
            16995,
            17600,
            18205,
            18810,
            19415,
            20020,
            20625,
            21230,
            21835
          ],
          "increment": 605,
          "maxStep": 12,
          "transport": 900
        },
        "14": {
          "steps": [
            17015,
            17715,
            18415,
            19115,
            19815,
            20515,
            21215,
            21915,
            22615,
            23315,
            24015
          ],
          "increment": 700,
          "maxStep": 11,
          "transport": 1200
        },
        "15": {
          "steps": [
            20855,
            21720,
            22585,
            23450,
            24315,
            25180,
            26045,
            26910,
            27775,
            28640
          ],
          "increment": 865,
          "maxStep": 10,
          "transport": -1
        }
      }
    },
    "teacherScale": {
      "law": "لائحة الوظائف التعليمية وسلم رواتب شاغلي الوظائف التعليمية (موافقة مجلس الوزراء 1440هـ؛ نفاذ 10/11/1441هـ)؛ تعديلات 12/2019 واللائحة المعدلة 2024",
      "note": "أرقام البيان الصحفي لوزارة التعليم كما نقلتها الصحف (نافذ منذ 1/7/2020)؛ بدل النقل غير متحقق (700 متداول للمعلم الممارس)",
      "effective": "2020-07-01",
      "incrementMonth": 1,
      "incrementDay": 1,
      "transportDefault": 700,
      "ranks": {
        "assistant": {
          "levels": {
            "1": {
              "steps": [
                5200,
                5500,
                5800,
                6100,
                6400,
                6700
              ],
              "increment": 300
            },
            "2": {
              "steps": [
                7000,
                7320,
                7640,
                7960,
                8280,
                8600
              ],
              "increment": 320
            },
            "3": {
              "steps": [
                8920,
                9260,
                9600,
                9940,
                10280,
                10620
              ],
              "increment": 340
            },
            "4": {
              "steps": [
                10960,
                11320,
                11680,
                12040,
                12400,
                12760
              ],
              "increment": 360
            },
            "5": {
              "steps": [
                13120,
                13500,
                13880,
                14260,
                14640,
                15020
              ],
              "increment": 380
            },
            "6": {
              "steps": [
                15400,
                15800,
                16200,
                16600,
                17000,
                17400
              ],
              "increment": 400
            }
          }
        },
        "practicing": {
          "levels": {
            "1": {
              "steps": [
                7570,
                8070,
                8570,
                9070,
                9570,
                10070
              ],
              "increment": 500
            },
            "2": {
              "steps": [
                10570,
                11090,
                11610,
                12130,
                12650,
                13170
              ],
              "increment": 520
            },
            "3": {
              "steps": [
                13690,
                14230,
                14770,
                15310,
                15850,
                16390
              ],
              "increment": 540
            },
            "4": {
              "steps": [
                16930,
                17470,
                18010,
                18550,
                19090,
                19630
              ],
              "increment": 540
            },
            "5": {
              "steps": [
                20170,
                20710,
                21250
              ],
              "increment": 540
            }
          }
        },
        "advanced": {
          "levels": {
            "1": {
              "steps": [
                9950,
                10490,
                11030,
                11570,
                12110,
                12650
              ],
              "increment": 540
            },
            "2": {
              "steps": [
                13190,
                13750,
                14310,
                14870,
                15430,
                15990
              ],
              "increment": 560
            },
            "3": {
              "steps": [
                16550,
                17130,
                17710,
                18290,
                18870,
                19450
              ],
              "increment": 580
            },
            "4": {
              "steps": [
                20030,
                20610,
                21190,
                21770
              ],
              "increment": 580
            }
          }
        },
        "expert": {
          "levels": {
            "1": {
              "steps": [
                12650,
                13250,
                13850,
                14450,
                15050,
                15650
              ],
              "increment": 600
            },
            "2": {
              "steps": [
                16250,
                16870,
                17490,
                18110,
                18730,
                19350
              ],
              "increment": 620
            },
            "3": {
              "steps": [
                19970,
                20610,
                21250,
                21890,
                22530,
                23170
              ],
              "increment": 640
            }
          }
        }
      }
    },
    "lumpSum": {
      "law": "نظام التأمينات الاجتماعية (م/33 لعام 1421هـ) المادة 41 ولائحته، والنظام الجديد (م/273) المادتان 25 و27",
      "legacy": {
        "tierMonths": 60,
        "pctUpTo60": 0.1,
        "pctAbove60": 0.12,
        "pre1422UpTo60": 0.06,
        "pre1422Above60": 0.07,
        "pensionMinMonths": 120,
        "buyMaxMonths": 60,
        "buyRate": 0.18,
        "divisorMonths": 480,
        "payAgeHijri": 60
      },
      "new": {
        "effective": "2024-07-03",
        "payAge": 65,
        "pensionMinMonths": 180,
        "installmentsFromMonths": 60,
        "rates": [
          [
            "2024-07-03",
            0.18
          ],
          [
            "2025-07-01",
            0.19
          ],
          [
            "2026-07-01",
            0.2
          ],
          [
            "2027-07-01",
            0.21
          ],
          [
            "2028-07-01",
            0.22
          ]
        ]
      }
    },
    "workInjury": {
      "law": "نظام التأمينات الاجتماعية (م/273) المواد 28–40، ونظام 1421 معدلاً بالبند سادساً من المرسوم",
      "wageCap": 45000,
      "dailyPct": 1,
      "dailyPctGosiTreatment": 0.75,
      "daysPerMonth": 30,
      "totalMinLegacy": 1983.75,
      "totalMinNew": 2000,
      "attendancePct": 0.5,
      "attendanceCapLegacy": 3500,
      "partialPensionMin": 0.5,
      "partialLumpMonths": 60,
      "reduceAboveAge": 45,
      "partialLumpMinMonths": 36,
      "nonSaudiTotalMonths": 84,
      "nonSaudiPartialMonths": 60,
      "nonSaudiDeathMonths": 84,
      "survivorLegacy": [
        0.5,
        0.75,
        1
      ],
      "survivorNew": [
        0.5,
        0.75
      ],
      "deathGrantMonthsLegacy": 3,
      "deathGrantCapLegacy": 10000
    },
    "residencyFines": {
      "law": "نظام الإقامة ولائحته، وبيان المديرية العامة للجوازات (واس 17/2/2020)، وبيانات الداخلية 2026",
      "lastReview": "2026-11-03",
      "iqamaLate": [
        500,
        1000
      ],
      "renewBeforeDays": 3,
      "finalExitUnused": 1000,
      "finalExitValidityDays": 60,
      "firstIqamaDays": 90,
      "firstIqamaLateFine": 500,
      "visitorFineMax": 50000,
      "visitorJailMonthsMax": 6,
      "exitReentryBanYears": 3,
      "exitReentryBanLifted": "2024-01-16"
    },
    "govLeave": {
      "law": "اللائحة التنفيذية للموارد البشرية في الخدمة المدنية (القرار الوزاري 1550، 9/6/1440هـ) م1 وم130–م136؛ قرار مجلس الوزراء 350 (3/7/1439هـ)",
      "lastReview": "2026-11-03",
      "daysPerYear": 36,
      "newCap": 72,
      "totalCap": 180,
      "legacyCutoff": "2018-03-20",
      "divisor": 30,
      "useWithinYears": 3,
      "maxTakenPerYear": 108,
      "maxTakenSenior": 144
    },
    "govContractor": {
      "law": "نموذج عقد توظيف غير السعوديين على وظيفة بدوام كامل (أطر العمل التنظيمية للائحة الموارد البشرية 1440هـ) م8–م11 وم18–م19",
      "lastReview": "2026-11-03",
      "monthsPerYear": 0.5,
      "minYears": 3,
      "cap": 50000,
      "abolishedMonths": 2,
      "leaveDaysPerYear": 36,
      "ticketPersons": 4
    },
    "holidays": {
      "law": "نظام العمل م107 وم112، واللائحة التنفيذية م24 وتعديل 2022 (يوم التأسيس)",
      "lastReview": "2026-11-03",
      "items": [
        {
          "id": "foundingDay",
          "ar": "يوم التأسيس",
          "en": "Founding Day",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-02-22"
          ],
          "hijri": 0,
          "official2026": 0,
          "official2027": 1
        },
        {
          "id": "eidAlFitr",
          "ar": "عيد الفطر",
          "en": "Eid al-Fitr",
          "days": 4,
          "d2026": [],
          "d2027": [
            "2027-03-09",
            "2027-03-10",
            "2027-03-11",
            "2027-03-12"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "eidAlAdha",
          "ar": "عيد الأضحى",
          "en": "Eid al-Adha (from Arafat Day)",
          "days": 4,
          "d2026": [],
          "d2027": [
            "2027-05-15",
            "2027-05-16",
            "2027-05-17",
            "2027-05-18"
          ],
          "alt2027": [
            "2027-05-16",
            "2027-05-17",
            "2027-05-18",
            "2027-05-19"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "nationalDay",
          "ar": "اليوم الوطني",
          "en": "National Day",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-09-23"
          ],
          "hijri": 0,
          "official2026": 0,
          "official2027": 1
        }
      ],
      "workPay": {
        "multiplier": 1.5,
        "substituteDay": 0,
        "wageBasis": 3,
        "premiumOnBasic": 0.5,
        "hourlyDivisor": 240,
        "compLeaveInsteadWithConsent": 1,
        "compLeaveHoursPerHour": 1.5,
        "weekendOverlapCompDay": 1,
        "nationalOrFoundingDayInsideEidComp": 0
      }
    },
    "hafiz": {
      "law": "تنظيم إعانة البحث عن عمل بقرار مجلس الوزراء 575 (22/9/1442هـ، نافذ 12/8/2021) ولائحته التنفيذية، وصفحة البرنامج لدى صندوق تنمية الموارد البشرية",
      "lastReview": "2026-11-03",
      "tiers": [
        {
          "months": 4,
          "amount": 2000
        },
        {
          "months": 4,
          "amount": 1500
        },
        {
          "months": 4,
          "amount": 1000
        },
        {
          "months": 3,
          "amount": 750
        }
      ],
      "minAge": 20,
      "maxAge": 40,
      "minPayment": 100,
      "familyCapBase": 3600,
      "familyCapPerMember": 1200,
      "familyCapMin": 6000,
      "familyCapMax": 22800,
      "graduateWindowMonths": 24,
      "waitAfterJobMonths": 24
    },
    "payDates": {
      "law": "رواتب الدولة: توجيه ملكي (واس 5/1/2018) بالصرف يوم 27 ميلادي، والمالية: الجمعة تُقدَّم إلى الخميس والسبت تُؤخَّر إلى الأحد؛ حساب المواطن يوم 10 بالقاعدة نفسها؛ معاشات التقاعد وساند يوم 1 منذ 1/5/2024 والجمعة والسبت إلى الخميس قبله (تعميم ساما 2018) والعطلة الرسمية إلى آخر يوم عمل قبلها؛ الضمان المطور يوم 1 وقُدّم من الجمعة والسبت إلى الخميس في 2026؛ حافز يوم 5 (هدف)؛ التأهيل الشامل يوم 26 وعطلة نهاية الأسبوع إلى يوم العمل التالي؛ الدعم السكني يوم 24 وأُودع الأحد حين وافق الجمعة أو السبت في 2026",
      "lastReview": "2026-11-03",
      "weekend": [
        5,
        6
      ],
      "items": {
        "salary": {
          "day": 27,
          "shift": {
            "5": -1,
            "6": 1
          },
          "status": "fixed",
          "exceptions": {
            "2025-03": "2025-03-25",
            "2026-05": "2026-05-24"
          }
        },
        "citizen": {
          "day": 10,
          "shift": {
            "5": -1,
            "6": 1
          },
          "status": "fixed",
          "exceptions": {},
          "eidPrecedent": "2024-04-03"
        },
        "social": {
          "day": 1,
          "shift": {
            "5": -1,
            "6": -2
          },
          "status": "fixed",
          "results": [
            25,
            27
          ],
          "exceptions": {}
        },
        "pension": {
          "day": 1,
          "shift": {
            "5": -1,
            "6": -2
          },
          "holidayShift": -1,
          "status": "fixed",
          "since": "2024-05-01",
          "exceptions": {}
        },
        "saned": {
          "day": 1,
          "shift": {
            "5": -1,
            "6": -2
          },
          "holidayShift": -1,
          "status": "fixed",
          "exceptions": {}
        },
        "hafiz": {
          "day": 5,
          "shift": null,
          "status": "announced",
          "results": [
            2,
            4
          ],
          "exceptions": {}
        },
        "disability": {
          "day": 26,
          "shift": {
            "5": 2,
            "6": 1
          },
          "status": "fixed",
          "exceptions": {}
        },
        "sakani": {
          "day": 24,
          "shift": {
            "5": 2,
            "6": 1
          },
          "status": "practice",
          "exceptions": {}
        }
      }
    }
  },
  "gcc": {
    "vat": {
      "ae": 0.05,
      "sa": 0.15,
      "bh": 0.1,
      "om": 0.05,
      "qa": 0,
      "kw": 0
    },
    "familyResidence": {
      "lastReview": "2026-11-03",
      "ae-icp": {
        "currency": "AED",
        "salaryMin": 4000,
        "salaryMinHousing": 3000,
        "entry": 300,
        "inside": 500,
        "resApp": 100,
        "resYear": 100,
        "resSmart": 100,
        "eidYear": 100,
        "eidSmart": 100,
        "medical": 250,
        "parentDeposit": 5000,
        "parentDepositFee": 20,
        "insurance": 0,
        "maxYears": 3
      },
      "ae-dubai": {
        "currency": "AED",
        "salaryMin": 4000,
        "salaryMinHousing": 3000,
        "entry": 200,
        "vat": 0.05,
        "inside": 520,
        "resUpTo2": 200,
        "resExtraYear": 100,
        "resExtras": 40,
        "eidYear": 100,
        "eidSmart": 100,
        "medical": 320,
        "insurance": 600,
        "maxYears": 3
      },
      "qa": {
        "currency": "QAR",
        "salaryMin": 10000,
        "salaryMinHousing": 6000,
        "entry": 200,
        "permitYear": 400,
        "permitYearAlt": 500,
        "threeYearDiscount": 0.2,
        "idCard": 100,
        "medical": 100,
        "insurance": 0,
        "maxYears": 3
      },
      "kw": {
        "currency": "KWD",
        "salaryMin": 800,
        "entry": 10,
        "entryHealth": 5,
        "resYear": {
          "standard": 20,
          "partner": 40,
          "self": 100
        },
        "parentYear": 300,
        "healthYear": 100,
        "civilId": 5,
        "insurance": 0,
        "maxYears": 5,
        "before": {
          "resYear": 10,
          "healthWife": 40,
          "healthChild": 30
        }
      },
      "bh": {
        "currency": "BHD",
        "salaryMin": 400,
        "salaryMinParents": 1000,
        "permit": 90,
        "admin": 5,
        "cycleYears": 2,
        "smartCard": 10,
        "insurance": 0,
        "insuranceFrom": "2026-09-01"
      },
      "om": {
        "currency": "OMR",
        "salaryMin": 150,
        "visa": 30,
        "renewal": 30,
        "card": {
          "1": 5,
          "2": 10,
          "3": 15
        },
        "cardMinAge": 10,
        "medical": 30,
        "insurance": 0,
        "maxYears": 3
      }
    },
    "school": {
      "asOf": "2026-11-03",
      "SA": {
        "year": "1448",
        "yearGregorian": "2026-2027",
        "semesters": 2,
        "semestersSource": "SA-1;SA-14;SA-16",
        "defaultVariant": "most-regions",
        "events": [
          {
            "id": "sa-admin-return",
            "nameAr": "عودة الإداريين والمشرفين التربويين",
            "nameEn": "Administrators and supervisors return",
            "type": "teachers",
            "start": "2026-08-11",
            "end": "2026-08-11",
            "audience": "teachers",
            "source": "SA-5;SA-8"
          },
          {
            "id": "sa-teachers-return",
            "nameAr": "عودة المعلمين والمعلمات",
            "nameEn": "Teachers return",
            "type": "teachers",
            "start": "2026-08-16",
            "end": "2026-08-16",
            "hijriStart": "3/3/1448",
            "audience": "teachers",
            "source": "SA-4;SA-5;SA-9"
          },
          {
            "id": "sa-term1",
            "nameAr": "الفصل الدراسي الأول",
            "nameEn": "Semester 1",
            "type": "term",
            "start": "2026-08-23",
            "end": "2027-01-07",
            "hijriStart": "10/3/1448",
            "hijriEnd": "29/7/1448",
            "audience": "students",
            "source": "SA-2;SA-3;SA-4"
          },
          {
            "id": "sa-national-day",
            "nameAr": "إجازة اليوم الوطني",
            "nameEn": "National Day holiday",
            "type": "holiday",
            "start": "2026-09-23",
            "end": "2026-09-24",
            "hijriStart": "11/4/1448 (عكاظ) أو 12/4/1448 (المدينة)",
            "audience": "all",
            "note": "مع الجمعة والسبت 23-26 سبتمبر",
            "source": "SA-4;SA-5;SA-13"
          },
          {
            "id": "sa-extra-1",
            "nameAr": "إجازة إضافية (إدارات التعليم)",
            "nameEn": "Extra day off (education departments)",
            "type": "holiday",
            "start": "2026-10-25",
            "end": "2026-10-25",
            "hijriStart": "14/5/1448",
            "audience": "all",
            "source": "SA-10;SA-11;SA-12"
          },
          {
            "id": "sa-autumn",
            "nameAr": "إجازة الخريف",
            "nameEn": "Autumn break",
            "type": "break",
            "start": "2026-11-20",
            "end": "2026-11-28",
            "hijriStart": "10/6/1448",
            "hijriEnd": "18/6/1448",
            "returnDate": "2026-11-30",
            "audience": "all",
            "note": "آخر يوم دراسي الخميس 2026-11-19 (9/6/1448)؛ العودة الاثنين بسبب sa-extra-2",
            "source": "SA-4;SA-5;SA-12;SA-13"
          },
          {
            "id": "sa-extra-2",
            "nameAr": "إجازة إضافية ملاصقة لإجازة الخريف",
            "nameEn": "Extra day off after autumn break",
            "type": "holiday",
            "start": "2026-11-29",
            "end": "2026-11-29",
            "hijriStart": "19/6/1448",
            "audience": "all",
            "source": "SA-10;SA-12"
          },
          {
            "id": "sa-extra-3",
            "nameAr": "إجازة إضافية (آخر يوم في الفصل الأول)",
            "nameEn": "Extra day off (last day of semester 1)",
            "type": "holiday",
            "start": "2027-01-07",
            "end": "2027-01-07",
            "hijriStart": "29/7/1448",
            "audience": "all",
            "source": "SA-10"
          },
          {
            "id": "sa-midyear",
            "nameAr": "إجازة منتصف العام الدراسي",
            "nameEn": "Mid-year break",
            "type": "break",
            "start": "2027-01-08",
            "end": "2027-01-16",
            "hijriStart": "30/7/1448",
            "hijriEnd": "8/8/1448",
            "returnDate": "2027-01-17",
            "audience": "all",
            "source": "SA-4;SA-5"
          },
          {
            "id": "sa-term2",
            "nameAr": "الفصل الدراسي الثاني",
            "nameEn": "Semester 2",
            "type": "term",
            "start": "2027-01-17",
            "end": "2027-06-24",
            "hijriStart": "9/8/1448",
            "hijriEnd": "19/1/1449",
            "audience": "students",
            "source": "SA-4;SA-5"
          },
          {
            "id": "sa-founding-day",
            "nameAr": "إجازة يوم التأسيس",
            "nameEn": "Founding Day holiday",
            "type": "holiday",
            "start": "2027-02-21",
            "end": "2027-02-22",
            "hijriStart": "14/9/1448",
            "hijriEnd": "15/9/1448",
            "returnDate": "2027-02-23",
            "audience": "all",
            "note": "مع الجمعة والسبت 19-22 فبراير",
            "source": "SA-4;SA-5"
          },
          {
            "id": "sa-eid-fitr",
            "nameAr": "إجازة عيد الفطر",
            "nameEn": "Eid al-Fitr break",
            "type": "break",
            "start": "2027-02-26",
            "end": "2027-03-13",
            "hijriStart": "19/9/1448",
            "hijriEnd": "5/10/1448",
            "returnDate": "2027-03-14",
            "audience": "all",
            "note": "المدة ثابتة بالهجري؛ يوم العيد بحسب الرؤية",
            "source": "SA-4;SA-5"
          },
          {
            "id": "sa-extra-4",
            "nameAr": "إجازة إضافية",
            "nameEn": "Extra day off",
            "type": "holiday",
            "start": "2027-04-11",
            "end": "2027-04-11",
            "hijriStart": "4/11/1448",
            "audience": "all",
            "source": "SA-10"
          },
          {
            "id": "sa-eid-adha",
            "nameAr": "إجازة عيد الأضحى",
            "nameEn": "Eid al-Adha break",
            "type": "break",
            "start": "2027-05-07",
            "end": "2027-05-22",
            "hijriStart": "1/12/1448",
            "hijriEnd": "16/12/1448",
            "returnDate": "2027-05-23",
            "audience": "all",
            "note": "returnDate استنتاج",
            "source": "SA-4;SA-5;SA-8"
          },
          {
            "id": "sa-year-end",
            "nameAr": "إجازة نهاية العام الدراسي",
            "nameEn": "End-of-year (summer) break",
            "type": "break",
            "start": "2027-06-25",
            "end": "2027-08-21",
            "hijriStart": "20/1/1449",
            "audience": "students",
            "note": "آخر يوم دراسي الخميس 2027-06-24 (19/1/1449)؛ end وhijriStart استنتاج من موعد عودة 1449",
            "source": "SA-4;SA-5"
          },
          {
            "id": "sa-1449-start",
            "nameAr": "بداية العام الدراسي 1449 للطلاب",
            "nameEn": "Start of 1449 school year (students)",
            "type": "term",
            "start": "2027-08-22",
            "end": "2027-08-22",
            "hijriStart": "20/3/1449",
            "audience": "students",
            "note": "مصدر وحيد من 2025",
            "source": "SA-5"
          }
        ],
        "variants": [
          {
            "id": "most-regions",
            "nameAr": "عموم المناطق",
            "nameEn": "Most regions",
            "events": []
          },
          {
            "id": "makkah-madinah-jeddah-taif",
            "nameAr": "إدارات تعليم مكة المكرمة والمدينة المنورة وجدة والطائف",
            "removeIds": [
              "sa-extra-2",
              "sa-extra-3",
              "sa-extra-4"
            ],
            "events": [
              {
                "id": "sa-teachers-return",
                "nameAr": "عودة المعلمين",
                "nameEn": "Teachers return",
                "type": "teachers",
                "start": "2026-08-23",
                "end": "2026-08-23",
                "hijriStart": "10/3/1448",
                "audience": "teachers",
                "note": "الميلادي استنتاج",
                "source": "SA-8;SA-9"
              },
              {
                "id": "sa-term1",
                "nameAr": "الفصل الدراسي الأول",
                "nameEn": "Semester 1",
                "type": "term",
                "start": "2026-08-30",
                "end": "2027-01-07",
                "hijriStart": "17/3/1448",
                "hijriEnd": "29/7/1448",
                "audience": "students",
                "source": "SA-6;SA-8;SA-9"
              },
              {
                "id": "sa-autumn",
                "nameAr": "إجازة الخريف",
                "nameEn": "Autumn break",
                "type": "break",
                "start": "2026-11-20",
                "end": "2026-11-28",
                "hijriStart": "10/6/1448",
                "hijriEnd": "18/6/1448",
                "returnDate": "2026-11-29",
                "audience": "all",
                "source": "SA-4;SA-5"
              },
              {
                "id": "sa-eid-adha",
                "nameAr": "إجازة عيد الأضحى",
                "nameEn": "Eid al-Adha break",
                "type": "break",
                "start": "2027-04-30",
                "end": "2027-05-22",
                "hijriStart": "23/11/1448",
                "hijriEnd": "16/12/1448",
                "returnDate": "2027-05-23",
                "audience": "all",
                "note": "التحويل الميلادي استنتاج",
                "source": "SA-8"
              },
              {
                "id": "sa-term2",
                "nameAr": "الفصل الدراسي الثاني",
                "nameEn": "Semester 2",
                "type": "term",
                "start": "2027-01-17",
                "end": "2027-07-01",
                "hijriStart": "9/8/1448",
                "hijriEnd": "26/1/1449",
                "audience": "students",
                "source": "SA-4;SA-6"
              },
              {
                "id": "sa-year-end",
                "nameAr": "إجازة نهاية العام الدراسي",
                "nameEn": "End-of-year (summer) break",
                "type": "break",
                "start": "2027-07-02",
                "end": "2027-08-21",
                "audience": "students",
                "note": "آخر يوم دراسي 2027-07-01 (26/1/1449)؛ موعد عودة 1449 للمدن الأربع غير منشور",
                "source": "SA-6"
              }
            ],
            "nameEn": "Makkah, Madinah, Jeddah and Taif"
          }
        ],
        "weekend": [
          5,
          6
        ],
        "nextYearStart": "2027-08-22"
      },
      "AE": {
        "year": "2026-2027",
        "semesters": 3,
        "defaultVariant": "moe",
        "events": [],
        "variants": [
          {
            "id": "moe",
            "nameAr": "مدارس الوزارة (الحكومية والخاصة بمنهاجها)",
            "events": [
              {
                "id": "ae-staff-start",
                "nameAr": "بدء دوام الكادر الإداري والتدريسي",
                "nameEn": "Staff start",
                "type": "teachers",
                "start": "2026-08-24",
                "end": "2026-08-24",
                "audience": "teachers",
                "source": "AE-1"
              },
              {
                "id": "ae-prophet-birthday",
                "nameAr": "المولد النبوي",
                "nameEn": "Prophet's Birthday",
                "type": "holiday",
                "start": "2026-08-28",
                "end": "2026-08-28",
                "audience": "all",
                "source": "AE-1;AE-8"
              },
              {
                "id": "ae-term1",
                "nameAr": "الفصل الدراسي الأول",
                "nameEn": "Term 1",
                "type": "term",
                "start": "2026-08-31",
                "end": "2026-12-11",
                "audience": "students",
                "note": "end استنتاج",
                "source": "AE-1;AE-2"
              },
              {
                "id": "ae-midterm",
                "nameAr": "عطلة منتصف الفصل الأول",
                "nameEn": "Mid-term break",
                "type": "break",
                "start": "2026-10-12",
                "end": "2026-10-16",
                "returnDate": "2026-10-19",
                "audience": "students",
                "source": "AE-1;AE-2"
              },
              {
                "id": "ae-midterm-staff",
                "nameAr": "عطلة منتصف الفصل للكادر",
                "nameEn": "Mid-term break (staff)",
                "type": "teachers",
                "start": "2026-10-15",
                "end": "2026-10-16",
                "audience": "teachers",
                "source": "AE-1"
              },
              {
                "id": "ae-term1-exams",
                "nameAr": "اختبارات نهاية الفصل الأول",
                "nameEn": "Term 1 end-of-term exams",
                "type": "exams",
                "start": "2026-11-25",
                "end": "2026-12-11",
                "audience": "students",
                "note": "25-27/11 و7-11/12",
                "source": "AE-1"
              },
              {
                "id": "ae-national-day",
                "nameAr": "عطلة اليوم الوطني (عيد الاتحاد)",
                "nameEn": "National Day holiday",
                "type": "holiday",
                "start": "2026-12-02",
                "end": "2026-12-04",
                "audience": "all",
                "note": "العطلة العامة 2-3 ديسمبر",
                "source": "AE-1;AE-8"
              },
              {
                "id": "ae-winter",
                "nameAr": "العطلة الشتوية",
                "nameEn": "Winter break",
                "type": "break",
                "start": "2026-12-14",
                "end": "2027-01-01",
                "returnDate": "2027-01-04",
                "audience": "students",
                "source": "AE-1;AE-2"
              },
              {
                "id": "ae-winter-staff",
                "nameAr": "العطلة الشتوية للكادر",
                "nameEn": "Winter break (staff)",
                "type": "teachers",
                "start": "2026-12-21",
                "end": "2027-01-01",
                "audience": "teachers",
                "source": "AE-1"
              },
              {
                "id": "ae-term2",
                "nameAr": "الفصل الدراسي الثاني",
                "nameEn": "Term 2",
                "type": "term",
                "start": "2027-01-04",
                "end": "2027-04-02",
                "audience": "all",
                "note": "end استنتاج",
                "source": "AE-1"
              },
              {
                "id": "ae-eid-fitr",
                "nameAr": "عطلة عيد الفطر",
                "nameEn": "Eid al-Fitr holiday",
                "type": "holiday",
                "start": "2027-03-08",
                "end": "2027-03-12",
                "audience": "all",
                "note": "مرتبطة برؤية الهلال",
                "source": "AE-1;AE-8"
              },
              {
                "id": "ae-spring",
                "nameAr": "العطلة الربيعية",
                "nameEn": "Spring break",
                "type": "break",
                "start": "2027-04-05",
                "end": "2027-04-09",
                "returnDate": "2027-04-12",
                "audience": "all",
                "source": "AE-1;AE-2"
              },
              {
                "id": "ae-term3",
                "nameAr": "الفصل الدراسي الثالث",
                "nameEn": "Term 3",
                "type": "term",
                "start": "2027-04-12",
                "end": "2027-07-02",
                "audience": "students",
                "source": "AE-1"
              },
              {
                "id": "ae-eid-adha",
                "nameAr": "عطلة عيد الأضحى",
                "nameEn": "Eid al-Adha holiday",
                "type": "holiday",
                "start": "2027-05-15",
                "end": "2027-05-18",
                "audience": "all",
                "note": "مرتبطة برؤية الهلال",
                "source": "AE-1;AE-8"
              },
              {
                "id": "ae-hijri-new-year",
                "nameAr": "رأس السنة الهجرية",
                "nameEn": "Hijri New Year",
                "type": "holiday",
                "start": "2027-06-06",
                "end": "2027-06-06",
                "audience": "all",
                "source": "AE-1"
              },
              {
                "id": "ae-term3-exams",
                "nameAr": "اختبارات نهاية الفصل الثالث",
                "nameEn": "Term 3 end-of-term exams",
                "type": "exams",
                "start": "2027-06-16",
                "end": "2027-06-25",
                "audience": "students",
                "source": "AE-1"
              },
              {
                "id": "ae-last-day",
                "nameAr": "آخر يوم دراسي للطلبة",
                "nameEn": "Last day for students",
                "type": "term",
                "start": "2027-07-02",
                "end": "2027-07-02",
                "audience": "students",
                "source": "AE-1;AE-2"
              },
              {
                "id": "ae-resits",
                "nameAr": "اختبارات الإعادة",
                "nameEn": "Make-up and resit exams",
                "type": "exams",
                "start": "2027-07-05",
                "end": "2027-07-08",
                "audience": "students",
                "source": "AE-1"
              },
              {
                "id": "ae-staff-summer",
                "nameAr": "بداية العطلة الصيفية للكادر",
                "nameEn": "Staff summer break starts",
                "type": "teachers",
                "start": "2027-07-12",
                "end": "2027-07-12",
                "audience": "teachers",
                "source": "AE-1"
              }
            ],
            "nameEn": "MOE schools (public and MOE-curriculum private)"
          },
          {
            "id": "dubai-private",
            "nameAr": "مدارس دبي الخاصة",
            "events": [
              {
                "id": "dxb-start",
                "nameAr": "بدء الدراسة",
                "nameEn": "First day",
                "type": "term",
                "start": "2026-08-31",
                "end": "2026-08-31",
                "audience": "students",
                "source": "AE-6"
              },
              {
                "id": "dxb-midterm",
                "nameAr": "عطلة منتصف الفصل الأول (معدّلة)",
                "nameEn": "October half-term (revised)",
                "type": "break",
                "start": "2026-10-12",
                "end": "2026-10-16",
                "returnDate": "2026-10-19",
                "audience": "students",
                "source": "AE-5"
              },
              {
                "id": "dxb-winter",
                "nameAr": "العطلة الشتوية",
                "nameEn": "Winter break",
                "type": "break",
                "start": "2026-12-14",
                "end": "2027-01-03",
                "returnDate": "2027-01-04",
                "audience": "students",
                "source": "AE-6;AE-9"
              },
              {
                "id": "dxb-spring",
                "nameAr": "العطلة الربيعية",
                "nameEn": "Spring break",
                "type": "break",
                "start": "2027-04-05",
                "end": "2027-04-11",
                "returnDate": "2027-04-12",
                "audience": "students",
                "source": "AE-6;AE-9"
              },
              {
                "id": "dxb-last-day",
                "nameAr": "آخر يوم دراسي",
                "nameEn": "Last day",
                "type": "term",
                "start": "2027-07-02",
                "end": "2027-07-02",
                "audience": "students",
                "source": "AE-6;AE-9"
              }
            ],
            "nameEn": "Dubai private schools",
            "inherit": "moe",
            "inheritTypes": [
              "holiday"
            ]
          },
          {
            "id": "sharjah-private",
            "nameAr": "مدارس الشارقة الخاصة",
            "events": [
              {
                "id": "shj-start",
                "nameAr": "بدء الدراسة",
                "nameEn": "First day",
                "type": "term",
                "start": "2026-08-31",
                "end": "2026-08-31",
                "audience": "students",
                "source": "AE-7"
              },
              {
                "id": "shj-winter",
                "nameAr": "العطلة الشتوية",
                "nameEn": "Winter break",
                "type": "break",
                "start": "2026-12-14",
                "end": "2027-01-03",
                "returnDate": "2027-01-04",
                "audience": "students",
                "note": "end استنتاج من موعد العودة",
                "source": "AE-7"
              },
              {
                "id": "shj-spring",
                "nameAr": "العطلة الربيعية",
                "nameEn": "Spring break",
                "type": "break",
                "start": "2027-04-05",
                "end": "2027-04-08",
                "returnDate": "2027-04-12",
                "audience": "students",
                "source": "AE-7"
              },
              {
                "id": "shj-last-day",
                "nameAr": "نهاية العام الدراسي",
                "nameEn": "Last day",
                "type": "term",
                "start": "2027-07-01",
                "end": "2027-07-01",
                "audience": "students",
                "source": "AE-7"
              }
            ],
            "weekend": [
              5,
              6,
              0
            ],
            "nameEn": "Sharjah private schools",
            "inherit": "moe",
            "inheritTypes": [
              "holiday"
            ]
          }
        ],
        "weekend": [
          6,
          0
        ],
        "nextYearStart": "2027-08-30"
      },
      "KW": {
        "year": "2026-2027",
        "semesters": 2,
        "events": [
          {
            "id": "kw-staff-start",
            "nameAr": "بدء دوام جميع العاملين",
            "nameEn": "All staff start",
            "type": "teachers",
            "start": "2026-09-06",
            "end": "2026-09-06",
            "audience": "teachers",
            "source": "KW-1;KW-2"
          },
          {
            "id": "kw-grade1-start",
            "nameAr": "بدء دوام الصف الأول الابتدائي",
            "nameEn": "Grade 1 starts",
            "type": "term",
            "start": "2026-09-13",
            "end": "2026-09-13",
            "audience": "students",
            "source": "KW-1"
          },
          {
            "id": "kw-term1",
            "nameAr": "الفصل الدراسي الأول (باقي الصفوف)",
            "nameEn": "Semester 1 (other grades)",
            "type": "term",
            "start": "2026-09-14",
            "end": "2027-01-21",
            "audience": "students",
            "note": "end = آخر يوم دوام للعاملين؛ ينتهي الطلبة بحسب الصف والاختبارات",
            "source": "KW-1"
          },
          {
            "id": "kw-kg-start",
            "nameAr": "بدء دوام رياض الأطفال",
            "nameEn": "Kindergarten starts",
            "type": "term",
            "start": "2026-09-16",
            "end": "2026-09-16",
            "audience": "students",
            "source": "KW-1"
          },
          {
            "id": "kw-term1-exams",
            "nameAr": "اختبارات نهاية الفصل الأول",
            "nameEn": "Semester 1 final exams",
            "type": "exams",
            "start": "2026-12-20",
            "end": "2027-01-21",
            "audience": "students",
            "note": "4-5 والمتوسط 20-28/12؛ 10-11 حتى 31/12؛ 12 من 10/1 إلى 21/1",
            "source": "KW-1"
          },
          {
            "id": "kw-midyear",
            "nameAr": "إجازة منتصف العام الدراسي",
            "nameEn": "Mid-year break",
            "type": "break",
            "start": "2027-01-24",
            "end": "2027-02-04",
            "returnDate": "2027-02-07",
            "audience": "all",
            "source": "KW-1"
          },
          {
            "id": "kw-term2",
            "nameAr": "الفصل الدراسي الثاني",
            "nameEn": "Semester 2",
            "type": "term",
            "start": "2027-02-07",
            "end": "2027-07-01",
            "audience": "all",
            "note": "end = آخر يوم دوام للعاملين",
            "source": "KW-1"
          },
          {
            "id": "kw-ramadan-leave",
            "nameAr": "إجازة خاصة (آخر شهر رمضان)",
            "nameEn": "Special leave (end of Ramadan)",
            "type": "break",
            "start": "2027-03-01",
            "end": "2027-03-08",
            "audience": "all",
            "note": "النص لجميع العاملين؛ عطلة الطلبة استنتاج؛ عطلة عيد الفطر الرسمية تُعلن لاحقاً",
            "source": "KW-1"
          },
          {
            "id": "kw-term2-exams",
            "nameAr": "اختبارات نهاية الفصل الثاني",
            "nameEn": "Semester 2 final exams",
            "type": "exams",
            "start": "2027-05-23",
            "end": "2027-06-21",
            "audience": "students",
            "note": "4-5 والمتوسط 23-31/5؛ 10-11 حتى 3/6؛ 12 من 31/5 إلى 21/6",
            "source": "KW-1"
          },
          {
            "id": "kw-kg-end",
            "nameAr": "نهاية دوام رياض الأطفال",
            "nameEn": "Kindergarten last day",
            "type": "term",
            "start": "2027-05-27",
            "end": "2027-05-27",
            "audience": "students",
            "source": "KW-1"
          },
          {
            "id": "kw-kg-staff-summer",
            "nameAr": "بدء العطلة الصيفية لهيئة رياض الأطفال",
            "nameEn": "KG staff summer break starts",
            "type": "teachers",
            "start": "2027-06-17",
            "end": "2027-06-17",
            "audience": "teachers",
            "source": "KW-1"
          },
          {
            "id": "kw-staff-summer",
            "nameAr": "العطلة الصيفية للهيئتين التعليمية والإدارية",
            "nameEn": "Teaching/admin staff summer break",
            "type": "teachers",
            "start": "2027-07-01",
            "end": "2027-09-04",
            "audience": "teachers",
            "note": "عدا المكلفين بامتحانات الثانوية؛ end استنتاج من بدء دوام 2027/2028 في 2027-09-05؛ الموجهون من 2027-07-05",
            "source": "KW-1"
          }
        ],
        "weekend": [
          5,
          6
        ]
      },
      "QA": {
        "year": "2026-2027",
        "semesters": 2,
        "events": [
          {
            "id": "qa-staff-start",
            "nameAr": "بدء دوام الموظفين",
            "nameEn": "Staff start",
            "type": "teachers",
            "start": "2026-08-23",
            "end": "2026-08-23",
            "audience": "teachers",
            "source": "QA-2;QA-3"
          },
          {
            "id": "qa-term1",
            "nameAr": "الفصل الدراسي الأول",
            "nameEn": "Semester 1",
            "type": "term",
            "start": "2026-08-30",
            "end": "2026-12-17",
            "audience": "students",
            "note": "end استنتاج (الخميس قبل بدء العطلة 20/12)",
            "source": "QA-2;QA-3;QA-4"
          },
          {
            "id": "qa-midterm-exams-1",
            "nameAr": "اختبارات منتصف الفصل الأول",
            "nameEn": "Semester 1 mid-term exams",
            "type": "exams",
            "start": "2026-10-13",
            "end": "2026-10-22",
            "audience": "students",
            "source": "QA-2"
          },
          {
            "id": "qa-midterm-break",
            "nameAr": "عطلة منتصف الفصل الأول",
            "nameEn": "Semester 1 mid-term break",
            "type": "break",
            "start": "2026-10-25",
            "end": "2026-10-29",
            "returnDate": "2026-11-01",
            "audience": "all",
            "source": "QA-2;QA-3"
          },
          {
            "id": "qa-term1-exams",
            "nameAr": "اختبارات نهاية الفصل الأول",
            "nameEn": "Semester 1 final exams",
            "type": "exams",
            "start": "2026-12-06",
            "end": "2026-12-15",
            "audience": "students",
            "source": "QA-2;QA-3"
          },
          {
            "id": "qa-winter",
            "nameAr": "عطلة منتصف العام",
            "nameEn": "Mid-year (winter) break",
            "type": "break",
            "start": "2026-12-20",
            "end": "2027-01-03",
            "returnDate": "2027-01-04",
            "audience": "students",
            "note": "الموظفون يعودون 2027-01-03",
            "source": "QA-1;QA-2;QA-3"
          },
          {
            "id": "qa-term2",
            "nameAr": "الفصل الدراسي الثاني",
            "nameEn": "Semester 2",
            "type": "term",
            "start": "2027-01-04",
            "end": "2027-06-17",
            "audience": "students",
            "note": "end = آخر اختبار منشور؛ آخر يوم دوام للطلبة غير منشور",
            "source": "QA-2;QA-3"
          },
          {
            "id": "qa-midterm-exams-2",
            "nameAr": "اختبارات منتصف الفصل الثاني",
            "nameEn": "Semester 2 mid-term exams",
            "type": "exams",
            "start": "2027-03-21",
            "end": "2027-03-30",
            "audience": "students",
            "source": "QA-2"
          },
          {
            "id": "qa-long-weekend",
            "nameAr": "عطلة نهاية أسبوع مطولة",
            "nameEn": "Extended weekend",
            "type": "holiday",
            "start": "2027-03-31",
            "end": "2027-04-01",
            "returnDate": "2027-04-04",
            "audience": "all",
            "source": "QA-1;QA-2;QA-3"
          },
          {
            "id": "qa-term2-exams",
            "nameAr": "اختبارات نهاية الفصل الثاني",
            "nameEn": "Semester 2 final exams",
            "type": "exams",
            "start": "2027-06-01",
            "end": "2027-06-17",
            "audience": "students",
            "source": "QA-2;QA-3"
          },
          {
            "id": "qa-staff-leave",
            "nameAr": "إجازة نهاية العام للموظفين",
            "nameEn": "Staff end-of-year leave",
            "type": "teachers",
            "start": "2027-06-27",
            "end": "2027-08-19",
            "returnDate": "2027-08-22",
            "audience": "teachers",
            "source": "QA-2"
          }
        ],
        "weekend": [
          5,
          6
        ]
      },
      "OM": {
        "year": "2026-2027",
        "semesters": 2,
        "events": [
          {
            "id": "om-staff-start",
            "nameAr": "بدء دوام الهيئة التعليمية",
            "nameEn": "Teaching staff start",
            "type": "teachers",
            "start": "2026-08-30",
            "end": "2026-08-30",
            "audience": "teachers",
            "source": "OM-1"
          },
          {
            "id": "om-term1",
            "nameAr": "الفصل الدراسي الأول",
            "nameEn": "Semester 1",
            "type": "term",
            "start": "2026-09-06",
            "end": "2026-12-30",
            "audience": "students",
            "note": "ينتهي 2026-12-17 للصفوف 5-12 و2026-12-30 للصفوف 1-4",
            "source": "OM-1;OM-2;OM-3"
          },
          {
            "id": "om-national-day",
            "nameAr": "عطلة العيد الوطني",
            "nameEn": "National Day holiday",
            "type": "holiday",
            "start": "2026-11-25",
            "end": "2026-11-26",
            "audience": "all",
            "note": "عطلة رسمية عامة؛ انطباقها على المدارس استنتاج",
            "source": "OM-4"
          },
          {
            "id": "om-term1-exams",
            "nameAr": "امتحانات نهاية الفصل الأول (5-11)",
            "nameEn": "Semester 1 final exams (grades 5-11)",
            "type": "exams",
            "start": "2026-12-20",
            "end": "2027-01-21",
            "audience": "students",
            "source": "OM-1"
          },
          {
            "id": "om-midyear",
            "nameAr": "عطلة ما بين الفصلين (تقديرية)",
            "nameEn": "Break between terms (estimated)",
            "type": "break",
            "start": "2027-01-22",
            "end": "2027-01-30",
            "returnDate": "2027-01-31",
            "audience": "all",
            "note": "مستنتجة من انتهاء امتحانات الفصل الأول وبدء الفصل الثاني",
            "source": "OM-1"
          },
          {
            "id": "om-term2",
            "nameAr": "الفصل الدراسي الثاني",
            "nameEn": "Semester 2",
            "type": "term",
            "start": "2027-01-31",
            "end": "2027-07-13",
            "audience": "all",
            "source": "OM-1"
          },
          {
            "id": "om-term2-exams",
            "nameAr": "امتحانات الفصل الثاني ودبلوم التعليم العام",
            "nameEn": "Semester 2 and diploma exams",
            "type": "exams",
            "start": "2027-06-01",
            "end": "2027-07-13",
            "audience": "students",
            "source": "OM-1"
          }
        ],
        "weekend": [
          5,
          6
        ]
      },
      "BH": {
        "year": "2026-2027",
        "semesters": 2,
        "events": [
          {
            "id": "bh-staff-start",
            "nameAr": "عودة الهيئات التعليمية والإدارية",
            "nameEn": "Staff return",
            "type": "teachers",
            "start": "2026-09-01",
            "end": "2026-09-01",
            "audience": "teachers",
            "source": "BH-2"
          },
          {
            "id": "bh-term1",
            "nameAr": "الفصل الدراسي الأول",
            "nameEn": "Semester 1",
            "type": "term",
            "start": "2026-09-03",
            "end": "2027-01-14",
            "audience": "students",
            "note": "تهيئة 2-3/9؛ نهاية الامتحانات 12 أو 14 يناير (تعارض)",
            "source": "BH-1;BH-2;BH-3"
          },
          {
            "id": "bh-term1-exams",
            "nameAr": "امتحانات الفصل الأول",
            "nameEn": "Semester 1 exams",
            "type": "exams",
            "start": "2026-12-21",
            "end": "2027-01-12",
            "audience": "students",
            "note": "مقال يونيو: حتى 2027-01-14",
            "source": "BH-1;BH-2"
          },
          {
            "id": "bh-midyear",
            "nameAr": "إجازة منتصف العام الدراسي",
            "nameEn": "Mid-year break",
            "type": "break",
            "start": "2027-01-17",
            "end": "2027-01-28",
            "returnDate": "2027-01-31",
            "audience": "all",
            "source": "BH-1;BH-5"
          },
          {
            "id": "bh-term2",
            "nameAr": "الفصل الدراسي الثاني",
            "nameEn": "Semester 2",
            "type": "term",
            "start": "2027-01-31",
            "end": "2027-06-30",
            "audience": "students",
            "source": "BH-1;BH-2"
          },
          {
            "id": "bh-eid-fitr",
            "nameAr": "عطلة عيد الفطر (متوقعة)",
            "nameEn": "Eid al-Fitr (expected)",
            "type": "holiday",
            "start": "2027-03-09",
            "end": "2027-03-11",
            "audience": "all",
            "note": "مرتبطة برؤية الهلال",
            "source": "BH-2"
          },
          {
            "id": "bh-term2-exams",
            "nameAr": "امتحانات الفصل الثاني",
            "nameEn": "Semester 2 exams",
            "type": "exams",
            "start": "2027-05-03",
            "end": "2027-05-27",
            "audience": "students",
            "source": "BH-1;BH-2"
          },
          {
            "id": "bh-summer",
            "nameAr": "بداية الإجازة الصيفية للطلبة",
            "nameEn": "Student summer break starts",
            "type": "break",
            "start": "2027-07-01",
            "end": "2027-07-01",
            "audience": "students",
            "note": "تاريخ النهاية غير منشور",
            "source": "BH-1"
          }
        ],
        "weekend": [
          5,
          6
        ]
      }
    }
  },
  "qa": {
    "currency": "QAR",
    "eos": {
      "law": "قانون العمل القطري رقم 14 لسنة 2004، المادة 54 (آخر تعديل للقانون 18/2020 لم يمس المادتين 54 و61)",
      "daysPerYear": 21,
      "minServiceYears": 1,
      "daysPerMonth": 30,
      "wageBasis": "الأجر الأساسي الأخير",
      "forfeitArticle": "61",
      "paymentRule": "قبل نهاية اليوم التالي لانتهاء العقد (المادة 67)"
    },
    "annualLeave": {
      "law": "قانون العمل القطري 14/2004 المواد 8 و72 و79 و80 و81",
      "daysPerYear": 21,
      "daysPerYearAfterFive": 28,
      "afterYears": 5,
      "eligibilityMonths": 12,
      "carryOverMaxFraction": 0.5,
      "daysPerMonth": 30,
      "wageBasis": "basic"
    },
    "sickLeave": {
      "law": "قانون العمل القطري 14/2004 المادتان 82 و72",
      "minServiceMonths": 3,
      "maxDays": 84,
      "tiers": [
        {
          "days": 14,
          "frac": 1
        },
        {
          "days": 28,
          "frac": 0.5
        },
        {
          "days": 42,
          "frac": 0
        }
      ],
      "daysPerMonth": 30,
      "wageBasis": "basic"
    },
    "pension": {
      "law": "قانون التأمينات الاجتماعية (القانون 1/2022، نافذ 3/1/2023) المواد 11 و12 و20 و24 و29 و30 و34 و35 و36 و42 و82 و83، وقرار مجلس الوزراء 11/2024",
      "divisor": 30,
      "salaryCap": 100000,
      "housingCap": 6000,
      "housingMinYears": 15,
      "minYears": 25,
      "minActualYears": 20,
      "resignMinAge": 50,
      "retirementAge": 60,
      "refAgeMale": 60,
      "refAgeFemale": 55,
      "reductionResign": 0.025,
      "reductionDisciplinary": 0.03,
      "privateAvgYears": 3,
      "privateAvgCap": 1.3,
      "minPensionGov": 15000,
      "employeeRate": 0.07,
      "employerRate": 0.14,
      "lumpCapOfEmployeeShare": 1.5,
      "legacyFullFrom": 20,
      "legacyFullYears": 30,
      "legacyPartialFrom": 15,
      "legacyPartialAdd": 10,
      "transitional": [
        [
          1983,
          42,
          12,
          17
        ],
        [
          1984,
          44,
          14,
          19
        ],
        [
          1985,
          46,
          16,
          21
        ],
        [
          1986,
          48,
          18,
          23
        ],
        [
          1987,
          50,
          20,
          25
        ]
      ]
    },
    "overtime": {
      "law": "قانون العمل القطري 14/2004 المواد 73–78",
      "basis": "basic",
      "divisor": 240,
      "divisorAlt": 208,
      "day": 1.25,
      "night": 1.5,
      "nightFrom": 21,
      "nightTo": 3,
      "rest": 2.5,
      "restSwap": true,
      "holiday": 1.25,
      "holidayNight": 1.5,
      "hoursPerDay": 8,
      "hoursPerWeek": 48,
      "maxTotalDaily": 10,
      "ramadanDaily": 6,
      "ramadanWeekly": 36,
      "ramadanAll": true
    },
    "notice": {
      "law": "قانون العمل القطري 14/2004 المادة 49 (معدلة بالقانون 18/2020) والمادة 50",
      "monthsUpTo": 1,
      "monthsOver": 2,
      "thresholdYears": 2,
      "basis": "basic",
      "daysPerMonth": 30
    },
    "overstay": {
      "law": "القانون 21/2015 بشأن دخول وخروج الوافدين وإقامتهم (م10 وم40 وم42)، وتصريح إدارة جوازات المطار (16/6/2026)",
      "lastReview": "2026-11-03",
      "types": {
        "cancelled": {
          "grace": 14,
          "graceBefore": 30,
          "perDay": 10,
          "cap": 0
        },
        "visit": {
          "grace": 0,
          "perDay": 200,
          "cap": 0,
          "capReported": 12000
        },
        "notCompleted": {
          "grace": 30,
          "perDay": 10,
          "cap": 6000
        }
      }
    },
    "holidays": {
      "law": "القانون 14/2004 م74 وم78، وإعلانات وزارة العمل",
      "lastReview": "2026-11-03",
      "items": [
        {
          "id": "sportDay",
          "ar": "اليوم الرياضي للدولة",
          "en": "National Sport Day",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-02-09"
          ],
          "hijri": 0,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "eidAlFitr",
          "ar": "عيد الفطر",
          "en": "Eid al-Fitr",
          "days": 3,
          "d2026": [],
          "d2027": [
            "2027-03-09",
            "2027-03-10",
            "2027-03-11"
          ],
          "alt2027": [
            "2027-03-10",
            "2027-03-11",
            "2027-03-13"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "eidAlAdha",
          "ar": "عيد الأضحى",
          "en": "Eid al-Adha",
          "days": 3,
          "d2026": [],
          "d2027": [
            "2027-05-16",
            "2027-05-17",
            "2027-05-18"
          ],
          "alt2027": [
            "2027-05-17",
            "2027-05-18",
            "2027-05-19"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "nationalDay",
          "ar": "اليوم الوطني",
          "en": "National Day",
          "days": 1,
          "d2026": [
            "2026-12-18"
          ],
          "d2027": [
            "2027-12-18"
          ],
          "hijri": 0,
          "official2026": 1,
          "official2027": 1
        }
      ],
      "workPay": {
        "multiplier": 1.25,
        "nightMultiplier": 1.5,
        "nightFromHour": 21,
        "nightToHour": 3,
        "substituteDay": 0,
        "wageBasis": 1,
        "hourlyDivisor": 240,
        "weekendOverlapCompDay": -1
      },
      "employerSetDays": 3
    },
    "maternity": {
      "law": "قانون العمل 14/2004 المواد 96–98",
      "lastReview": "2026-11-03",
      "days": 50,
      "prenatalMax": 15,
      "postnatalMin": 35,
      "serviceMinMonths": 12,
      "extra": {
        "type": "medical",
        "days": 60
      },
      "nursing": [
        {
          "from": "leaveEnd",
          "months": 12,
          "hours": 1
        }
      ],
      "paternityDays": 0,
      "payer": "employer"
    },
    "contrib": {
      "law": "قانون التأمينات الاجتماعية 1/2022 (نافذ 3/1/2023)",
      "lastReview": "2026-11-03",
      "employee": 0.07,
      "employer": 0.14,
      "housingCap": 6000,
      "max": 100000
    }
  },
  "kw": {
    "currency": "KWD",
    "eos": {
      "law": "القانون رقم 6 لسنة 2010 في شأن العمل في القطاع الأهلي، المواد 51 و52 و53",
      "firstYears": 5,
      "daysFirst": 15,
      "monthsAfter": 1,
      "capMonths": 18,
      "divisor": 26,
      "divisorAlt": 30,
      "wageBasis": "آخر أجر شامل البدلات والعلاوات الدورية (المادتان 55 و62)",
      "resignation": [
        {
          "minYears": 0,
          "maxYears": 3,
          "fraction": 0
        },
        {
          "minYears": 3,
          "maxYears": 5,
          "fraction": 0.5
        },
        {
          "minYears": 5,
          "maxYears": 10,
          "fraction": 0.6666666667
        },
        {
          "minYears": 10,
          "maxYears": null,
          "fraction": 1
        }
      ],
      "marriageWindowMonths": 12,
      "forfeitArticle": "41/أ"
    },
    "annualLeave": {
      "law": "القانون الكويتي 6/2010 المادة 70 (بالقانون 85/2017) والمواد 55 و62 و67 و71–74",
      "daysPerYear": 30,
      "workingDays": true,
      "eligibilityMonths": 6,
      "carryOverMaxYears": 2,
      "daysPerMonth": 26,
      "daysPerMonthAlt": 30,
      "wageBasis": "total"
    },
    "sickLeave": {
      "law": "القانون الكويتي 6/2010 المادة 69",
      "minServiceMonths": 0,
      "maxDays": 75,
      "tiers": [
        {
          "days": 15,
          "frac": 1
        },
        {
          "days": 10,
          "frac": 0.75
        },
        {
          "days": 10,
          "frac": 0.5
        },
        {
          "days": 10,
          "frac": 0.25
        },
        {
          "days": 30,
          "frac": 0
        }
      ],
      "daysPerMonth": 30,
      "daysPerMonthAlt": 26,
      "wageBasis": "total"
    },
    "pension": {
      "law": "قانون التأمينات الاجتماعية 61/1976 وتعديلاته (قانون التقاعد المبكر 2019، وقانون 2022، وقرار وزير المالية 6/2023 بالحد الأدنى)، والقانون 110/2014 (المكافأة المالية)",
      "basicWageCap": 1500,
      "supplementaryBand": 1250,
      "minServiceYears": 15,
      "normalAgeMen": 55,
      "normalAgeWomen": 50,
      "maxEarlyYears": 5,
      "earlyReductionPermanent": [
        0.25,
        0.2,
        0.15,
        0.1,
        0.05
      ],
      "earlyReductionTemporary": [
        0.1,
        0.08,
        0.06,
        0.04,
        0.02
      ],
      "temporaryMinServiceMen": 30,
      "temporaryMinServiceWomen": 25,
      "temporaryEndsAgeMen": 65,
      "temporaryEndsAgeWomen": 60,
      "noReductionServiceMen": 35,
      "noReductionServiceWomen": 30,
      "accrualBase": 0.65,
      "accrualBaseYears": 15,
      "accrualPerYear": 0.02,
      "maxPct": 0.95,
      "maxServiceYears": 30,
      "minPensionSingleOrWoman": 1010,
      "minPensionMarriedNoChildren": 1126,
      "minPensionByChildren": [
        1196,
        1265,
        1335,
        1405,
        1475,
        1545,
        1615
      ],
      "annualIncrease": 20,
      "annualIncreaseMonth": 8,
      "gratuityTierYears": [
        5,
        5,
        5
      ],
      "gratuityTierRates": [
        0.1,
        0.12,
        0.15,
        0.2
      ],
      "remunerationCapYears": [
        18,
        19,
        20,
        21
      ],
      "remunerationMinContribMonths": 24
    },
    "overtime": {
      "law": "قانون العمل الكويتي 6/2010 المواد 64–68 و55",
      "basis": "total",
      "divisor": 208,
      "divisorAlt": 240,
      "day": 1.25,
      "night": null,
      "rest": 1.5,
      "restSubstitute": true,
      "holiday": 2,
      "holidaySubstitute": true,
      "hoursPerDay": 8,
      "hoursPerWeek": 48,
      "maxOtDaily": 2,
      "maxOtDaysWeek": 3,
      "maxOtDaysYear": 90,
      "maxOtHoursYear": 180,
      "ramadanWeekly": 36,
      "ramadanAll": true
    },
    "notice": {
      "law": "قانون العمل الكويتي 6/2010 المادة 44",
      "monthlyMonths": 3,
      "otherMonths": 1,
      "basis": "total",
      "daysPerMonth": 30,
      "jobSearchDaysWeek": 1
    },
    "overstay": {
      "law": "المرسوم بقانون 114/2024 في شأن إقامة الأجانب (نافذ 5/1/2025) ولائحته التنفيذية (نافذة 23/12/2025)",
      "lastReview": "2026-11-03",
      "types": {
        "residence": {
          "grace": 0,
          "tiers": [
            {
              "upTo": 30,
              "perDay": 2
            },
            {
              "upTo": 0,
              "perDay": 4
            }
          ],
          "cap": 1200
        },
        "domestic": {
          "grace": 0,
          "tiers": [
            {
              "upTo": 0,
              "perDay": 2
            }
          ],
          "cap": 600
        },
        "visit": {
          "grace": 0,
          "tiers": [
            {
              "upTo": 0,
              "perDay": 10
            }
          ],
          "cap": 2000
        },
        "temporary": {
          "grace": 0,
          "tiers": [
            {
              "upTo": 30,
              "perDay": 2
            },
            {
              "upTo": 0,
              "perDay": 4
            }
          ],
          "cap": 1200
        },
        "newborn": {
          "graceMonths": 4,
          "tiers": [
            {
              "upTo": 30,
              "perDay": 2
            },
            {
              "upTo": 0,
              "perDay": 4
            }
          ],
          "cap": 2000
        }
      },
      "departureNoticePerMonth": 10,
      "measuresFrom": "2026-02-28"
    },
    "holidays": {
      "law": "القانون 6/2010 م68",
      "lastReview": "2026-11-03",
      "items": [
        {
          "id": "newYear",
          "ar": "رأس السنة الميلادية",
          "en": "New Year's Day",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-01-01"
          ],
          "hijri": 0,
          "official2026": 0,
          "official2027": 1
        },
        {
          "id": "israMiraj",
          "ar": "الإسراء والمعراج",
          "en": "Isra and Mi'raj",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-01-05",
            "2027-12-25"
          ],
          "alt2027": [
            "2027-01-06",
            "2027-12-26"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "nationalDay",
          "ar": "اليوم الوطني",
          "en": "National Day",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-02-25"
          ],
          "hijri": 0,
          "official2026": 0,
          "official2027": 1
        },
        {
          "id": "liberationDay",
          "ar": "يوم التحرير",
          "en": "Liberation Day",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-02-26"
          ],
          "hijri": 0,
          "official2026": 0,
          "official2027": 1
        },
        {
          "id": "eidAlFitr",
          "ar": "عيد الفطر",
          "en": "Eid al-Fitr",
          "days": 3,
          "d2026": [],
          "d2027": [
            "2027-03-09",
            "2027-03-10",
            "2027-03-11"
          ],
          "alt2027": [
            "2027-03-10",
            "2027-03-11",
            "2027-03-12"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "arafat",
          "ar": "وقفة عرفة",
          "en": "Arafat Day",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-05-15"
          ],
          "alt2027": [
            "2027-05-16"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "eidAlAdha",
          "ar": "عيد الأضحى",
          "en": "Eid al-Adha",
          "days": 3,
          "d2026": [],
          "d2027": [
            "2027-05-16",
            "2027-05-17",
            "2027-05-18"
          ],
          "alt2027": [
            "2027-05-17",
            "2027-05-18",
            "2027-05-19"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "hijriNewYear",
          "ar": "رأس السنة الهجرية",
          "en": "Islamic New Year",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-06-06"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "mawlid",
          "ar": "المولد النبوي",
          "en": "Prophet's Birthday",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-08-14"
          ],
          "alt2027": [
            "2027-08-15"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        }
      ],
      "workPay": {
        "multiplier": 2,
        "multiplierAlt": 1,
        "substituteDay": 1,
        "substituteMode": 3,
        "wageBasis": 2,
        "dailyDivisor": 26,
        "dailyDivisorAlt": 30,
        "weekendOverlapCompDay": -1
      }
    },
    "labourSupport": {
      "law": "القانون 19/2000 المعدل بالقانون 32/2003 وقرار مجلس الوزراء 391/2001 وتعديلاته",
      "lastReview": "2026-11-03",
      "fixed": 220,
      "diffPct": 0.25,
      "diffMin": 50,
      "categories": [
        {
          "id": "uniMed",
          "social": [
            190,
            278
          ],
          "qual": 330,
          "total": [
            790,
            898
          ]
        },
        {
          "id": "uniPro",
          "social": [
            190,
            278
          ],
          "qual": 280,
          "total": [
            740,
            848
          ]
        },
        {
          "id": "uniOther",
          "social": [
            190,
            278
          ],
          "qual": 230,
          "total": [
            690,
            798
          ]
        },
        {
          "id": "diploma",
          "social": [
            169,
            250
          ],
          "qual": 190,
          "total": [
            629,
            723
          ]
        },
        {
          "id": "secondaryCourse",
          "social": [
            161,
            242
          ],
          "qual": 140,
          "total": [
            571,
            663
          ]
        },
        {
          "id": "secondary",
          "social": [
            147,
            222
          ],
          "qual": 140,
          "total": [
            557,
            638
          ]
        },
        {
          "id": "intermediateCourse",
          "social": [
            147,
            222
          ],
          "qual": 100,
          "total": [
            517,
            598
          ],
          "disputed": [
            531,
            623
          ]
        },
        {
          "id": "intermediate",
          "social": [
            141,
            216
          ],
          "qual": 100,
          "total": [
            511,
            590
          ]
        },
        {
          "id": "belowIntermediate",
          "social": [
            136,
            211
          ],
          "qual": 50,
          "total": [
            456,
            534
          ],
          "disputed": [
            481,
            573
          ]
        }
      ],
      "perChild": 50,
      "maxChildren": 7,
      "masters": 75,
      "phd": 150,
      "disabilityMild": 50,
      "disabilitySevere": 100,
      "bonusThreshold": 1250,
      "bonusDeduction": 50,
      "payDay": 25
    },
    "maternity": {
      "law": "قانون العمل في القطاع الأهلي 6/2010 المادتان 24 و25",
      "lastReview": "2026-11-03",
      "days": 70,
      "prenatalMax": 69,
      "postnatalMin": 1,
      "serviceMinMonths": 0,
      "extra": {
        "type": "approval",
        "months": 4
      },
      "nursing": [
        {
          "from": "leaveEnd",
          "months": null,
          "hours": 2
        }
      ],
      "paternityDays": 0,
      "payer": "employer"
    },
    "contrib": {
      "law": "قانون التأمينات الاجتماعية 61/1976 والقوانين 128/1992 و101/2013 و110/2014",
      "lastReview": "2026-11-03",
      "basicCap": 1500,
      "totalCap": 2750,
      "privateMin": 230,
      "branches": [
        {
          "id": "basic",
          "employee": 0.05,
          "employer": 0.1,
          "band": "basic"
        },
        {
          "id": "supplementary",
          "employee": 0.05,
          "employer": 0.1,
          "band": "supp"
        },
        {
          "id": "increase",
          "employee": 0.025,
          "employer": 0.01,
          "band": "total"
        },
        {
          "id": "reward",
          "employee": 0.025,
          "employer": 0,
          "band": "basic"
        },
        {
          "id": "unemployment",
          "employee": 0.005,
          "employer": 0.005,
          "band": "total",
          "privateOnly": true
        }
      ]
    }
  },
  "om": {
    "currency": "OMR",
    "eos": {
      "law": "قانون العمل العُماني (المرسوم السلطاني 53/2023) المادة 61، والقانون السابق (35/2003) المادة 39 للمدة قبل 31 يوليو 2023",
      "cutoff": "2023-07-31",
      "legacyFirstYears": 3,
      "legacyMonthsFirst": 0.5,
      "legacyMonthsAfter": 1,
      "currentMonthsPerYear": 1,
      "wageBasis": "الأجر الأساسي الأخير",
      "savingsPct": 0.09,
      "savingsNoLaterThan": "2027-07-19",
      "forfeitArticle": "40"
    },
    "annualLeave": {
      "law": "قانون العمل العماني م.س 53/2023 المواد 1 و78 و79 و81",
      "daysPerYear": 30,
      "eligibilityMonths": 6,
      "carryOverMaxDays": 30,
      "daysPerMonth": 30,
      "wageBasisEnd": "total",
      "wageBasisInService": "basic"
    },
    "sickLeave": {
      "law": "قانون العمل العماني م.س 53/2023 المادة 82، وقانون الحماية الاجتماعية م.س 52/2023",
      "minServiceMonths": 0,
      "maxDays": 182,
      "tiers": [
        {
          "days": 21,
          "frac": 1
        },
        {
          "days": 14,
          "frac": 0.75
        },
        {
          "days": 35,
          "frac": 0.5
        },
        {
          "days": 112,
          "frac": 0.35
        }
      ],
      "daysPerMonth": 30,
      "wageBasis": "total",
      "spfStart": "2026-07-19",
      "spfEmployerDays": 7
    },
    "pension": {
      "law": "قانون الحماية الاجتماعية (المرسوم السلطاني 52/2023، نافذ 1/1/2024) المواد 1 و6 و52 و70 و72–78 و84، وقرار الصندوق ر/1/2025 ور/12/2026",
      "effective": "2024-01-01",
      "accrual": 0.02,
      "wageCap": 3000,
      "growth": {
        "2024": 0.03,
        "2025": 0.03
      },
      "growthDefault": 0.03,
      "oldAge": 60,
      "ageStepEveryYears": 7,
      "ageMax": 65,
      "womanGap": 5,
      "earlyMaxYears": 5,
      "earlyMinServiceYears": 20,
      "anyAgeServiceYears": 30,
      "reductionFirst": 0.05,
      "reductionFirstYears": 5,
      "reductionAfter": 0.01,
      "employeeRate": 0.075,
      "employerRate": 0.11,
      "transitionalPriorYears": 20,
      "seniorBenefit": 115
    },
    "incomeTax": {
      "law": "المرسوم السلطاني 56/2025 بإصدار قانون الضريبة على دخل الأفراد (الجريدة الرسمية 1602، 30/6/2025)",
      "effective": "2028-01-01",
      "firstReturnDue": "2029-06-30",
      "rate": 0.05,
      "threshold": 42000,
      "residencyDays": 183,
      "deemedCostPct": 0.15,
      "donationsCapPct": 0.05,
      "spfEmployeeRate": 0.075,
      "spfWageCapMonthly": 3000,
      "entityWhtThreshold": 20000,
      "entityWhtShareResident": 0.2,
      "lateMonthlyPct": 0.01
    },
    "overtime": {
      "law": "قانون العمل العُماني 53/2023 المواد 70–73 و77 و1",
      "basis": "basic",
      "divisor": 240,
      "divisorAlt": 173.33,
      "day": 1.25,
      "night": 1.5,
      "nightFrom": 21,
      "nightTo": 5,
      "rest": 2,
      "holiday": 2,
      "noConsentDay": 1.5,
      "noConsentNight": 1.75,
      "noConsentRest": 3,
      "noConsentHoliday": 3,
      "noConsentInventoryDays": 15,
      "hoursPerDay": 8,
      "hoursPerWeek": 40,
      "maxTotalDaily": 12,
      "weeklyRestDays": 2,
      "ramadanDaily": 6,
      "ramadanWeekly": 30,
      "ramadanAll": false
    },
    "notice": {
      "law": "قانون العمل العُماني 53/2023 المواد 36–39",
      "monthlyDays": 30,
      "otherDays": 15,
      "basis": "total",
      "jobSearchHoursWeek": 10,
      "daysPerMonth": 30
    },
    "holidays": {
      "law": "قانون العمل (م.س 53/2023) م71 وم72 وم79، والمرسوم السلطاني 88/2022 المعدل بالمرسوم 15/2025",
      "lastReview": "2026-11-03",
      "items": [
        {
          "id": "accessionDay",
          "ar": "يوم تولي السلطان مقاليد الحكم",
          "en": "Accession Day",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-01-11"
          ],
          "hijri": 0,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "israMiraj",
          "ar": "الإسراء والمعراج",
          "en": "Isra and Mi'raj",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-01-05",
            "2027-12-25"
          ],
          "alt2027": [
            "2027-01-06",
            "2027-12-26"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "eidAlFitr",
          "ar": "عيد الفطر",
          "en": "Eid al-Fitr (29 Ramadan to 3 Shawwal)",
          "days": 4,
          "daysMax": 5,
          "d2026": [],
          "d2027": [
            "2027-03-08",
            "2027-03-09",
            "2027-03-10",
            "2027-03-11"
          ],
          "alt2027": [
            "2027-03-08",
            "2027-03-09",
            "2027-03-10",
            "2027-03-11",
            "2027-03-12"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "eidAlAdha",
          "ar": "عيد الأضحى",
          "en": "Eid al-Adha (9 to 12 Dhu al-Hijjah)",
          "days": 4,
          "d2026": [],
          "d2027": [
            "2027-05-15",
            "2027-05-16",
            "2027-05-17",
            "2027-05-18"
          ],
          "alt2027": [
            "2027-05-16",
            "2027-05-17",
            "2027-05-18",
            "2027-05-19"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "hijriNewYear",
          "ar": "رأس السنة الهجرية",
          "en": "Islamic New Year",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-06-06"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "mawlid",
          "ar": "المولد النبوي",
          "en": "Prophet's Birthday",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-08-14"
          ],
          "alt2027": [
            "2027-08-15"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "nationalDay",
          "ar": "العيد الوطني",
          "en": "National Day",
          "days": 2,
          "d2026": [
            "2026-11-25",
            "2026-11-26"
          ],
          "d2027": [
            "2027-11-20",
            "2027-11-21"
          ],
          "hijri": 0,
          "official2026": 1,
          "official2027": 0
        }
      ],
      "workPay": {
        "multiplier": 2,
        "multiplierAlt": 1,
        "multiplierNoConsent": 3,
        "substituteDay": 1,
        "substituteMode": 1,
        "compDaysPerDayNoConsent": 2,
        "wageBasis": 1,
        "weekendOverlapCompDay": 1
      }
    },
    "jobSecurity": {
      "law": "قانون الحماية الاجتماعية (م.س 52/2023) م115–م120، والأوامر السامية المعلنة في 11/1/2026 (سنة بدلاً من 6 أشهر من فبراير 2026)",
      "lastReview": "2026-11-03",
      "schedule": [
        {
          "months": 6,
          "rate": 0.6
        },
        {
          "months": 3,
          "rate": 0.5
        },
        {
          "months": 3,
          "rate": 0.4
        }
      ],
      "minimum": 115,
      "contribEmployee": 0.005,
      "contribEmployer": 0.005,
      "from": "2026-02-01"
    },
    "maternity": {
      "law": "قانون العمل 53/2023 (المواد 76 و83 و84) وقانون الحماية الاجتماعية 52/2023 (المواد 129–134)",
      "lastReview": "2026-11-03",
      "days": 98,
      "prenatalMax": 14,
      "postnatalMin": 84,
      "serviceMinMonths": 0,
      "extra": {
        "type": "childcare",
        "days": 98,
        "withinMonths": 12
      },
      "nursing": [
        {
          "from": "leaveEnd",
          "months": 12,
          "hours": 1
        }
      ],
      "paternityDays": 7,
      "paternityWindowDays": 98,
      "payer": "fund",
      "employerContribution": 0.01,
      "fundFrom": "2024-07-19"
    },
    "contrib": {
      "law": "قانون الحماية الاجتماعية 52/2023 (م52 وم70 وم90 وم116 وم121–128 وم139)",
      "lastReview": "2026-11-03",
      "cap": 3000,
      "employee": {
        "pension": 0.075,
        "jobSecurity": 0.005
      },
      "employer": {
        "pension": 0.11,
        "injury": 0.01,
        "maternity": 0.01,
        "sick": 0.01,
        "jobSecurity": 0.005
      },
      "sickFrom": "2026-07-19",
      "expat": {
        "maternity": 0.01,
        "sick": 0.01,
        "injury": 0.01,
        "injuryBy": "2028-07-19",
        "savings": 0.09,
        "savingsBy": "2027-07-19"
      }
    }
  },
  "bh": {
    "currency": "BHD",
    "eos": {
      "law": "قانون العمل في القطاع الأهلي رقم 36 لسنة 2012 المادة 116، وقرار رئيس مجلس الوزراء رقم 109 لسنة 2023",
      "firstYears": 3,
      "monthsFirst": 0.5,
      "monthsAfter": 1,
      "wageBasis": "الأجر الأخير: الأساسي مع العلاوة الاجتماعية (المادة 47)",
      "sioStart": "2024-03-01",
      "sioRateFirst": 0.042,
      "sioRateAfter": 0.084
    },
    "annualLeave": {
      "law": "قانون العمل البحريني 36/2012 المواد 47 و58 و59",
      "daysPerYear": 30,
      "accrualPerMonth": 2.5,
      "eligibilityMonths": 0,
      "settlementMaxYears": 2,
      "daysPerMonth": 30,
      "wageBasis": "basicPlusSocial"
    },
    "sickLeave": {
      "law": "قانون العمل البحريني 36/2012 المادتان 65 و66",
      "minServiceMonths": 3,
      "maxDays": 55,
      "tiers": [
        {
          "days": 15,
          "frac": 1
        },
        {
          "days": 20,
          "frac": 0.5
        },
        {
          "days": 20,
          "frac": 0
        }
      ],
      "accumulationMaxDays": 240,
      "daysPerMonth": 30,
      "wageBasis": "total"
    },
    "pension": {
      "law": "قانون التأمين الاجتماعي (المرسوم بقانون 24/1976) المواد 33 و34 و39 و43 كما عدّلها القانون 14/2022 (نافذ 19/4/2022)",
      "age": 60,
      "minMonths": 180,
      "earlyMinMonths": 240,
      "divisor": 50,
      "avgYears": 5,
      "maxPct": 0.8,
      "maxPctNote": "سقف 80% من مصادر متخصصة لا من النص الرسمي",
      "wageCap": 4000,
      "minPension": 200,
      "earlyReduction": [
        [
          45,
          0.2
        ],
        [
          50,
          0.15
        ],
        [
          60,
          0.1
        ]
      ],
      "earlyReductionNote": "الجدول رقم 1 كما نشرته مكاتب المحاماة؛ النص الرسمي للجدول غير منشور على الإنترنت",
      "lumpPct": 0.15,
      "refundBelowMonths": 12,
      "employeeRate": 0.07,
      "employerRates": [
        [
          2026,
          0.15
        ],
        [
          2027,
          0.16
        ],
        [
          2028,
          0.17
        ]
      ]
    },
    "overtime": {
      "law": "قانون العمل البحريني 36/2012 المواد 51–57 و64 و1",
      "basis": "total",
      "divisor": 240,
      "divisorAlt": 208,
      "day": 1.25,
      "night": 1.5,
      "nightFrom": 19,
      "nightTo": 7,
      "rest": 2.5,
      "holiday": 2.5,
      "substituteByWorker": true,
      "hoursPerDay": 8,
      "hoursPerWeek": 48,
      "maxTotalDaily": 10,
      "ramadanDaily": 6,
      "ramadanWeekly": 36,
      "ramadanAll": false
    },
    "notice": {
      "law": "قانون العمل البحريني 36/2012 المادتان 99 و47",
      "days": 30,
      "basis": "basicSocial",
      "jobSearchDaysWeek": 1,
      "daysPerMonth": 30
    },
    "holidays": {
      "law": "القانون 36/2012 م64، وقرار مجلس الوزراء 1/2013 بشأن الإجازات الرسمية للقطاع الأهلي",
      "lastReview": "2026-11-03",
      "items": [
        {
          "id": "newYear",
          "ar": "رأس السنة الميلادية",
          "en": "New Year's Day",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-01-01"
          ],
          "hijri": 0,
          "official2026": 0,
          "official2027": 1
        },
        {
          "id": "eidAlFitr",
          "ar": "عيد الفطر",
          "en": "Eid al-Fitr",
          "days": 3,
          "d2026": [],
          "d2027": [
            "2027-03-09",
            "2027-03-10",
            "2027-03-11"
          ],
          "alt2027": [
            "2027-03-10",
            "2027-03-11",
            "2027-03-12"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "labourDay",
          "ar": "عيد العمال",
          "en": "Labour Day",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-05-01"
          ],
          "hijri": 0,
          "official2026": 0,
          "official2027": 1
        },
        {
          "id": "eidAlAdha",
          "ar": "عيد الأضحى",
          "en": "Eid al-Adha",
          "days": 3,
          "d2026": [],
          "d2027": [
            "2027-05-16",
            "2027-05-17",
            "2027-05-18"
          ],
          "alt2027": [
            "2027-05-17",
            "2027-05-18",
            "2027-05-19"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "hijriNewYear",
          "ar": "رأس السنة الهجرية",
          "en": "Islamic New Year",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-06-06"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "ashura",
          "ar": "تاسوعاء وعاشوراء",
          "en": "Ashura (9-10 Muharram)",
          "days": 2,
          "d2026": [],
          "d2027": [
            "2027-06-14",
            "2027-06-15"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "mawlid",
          "ar": "المولد النبوي",
          "en": "Prophet's Birthday",
          "days": 1,
          "d2026": [],
          "d2027": [
            "2027-08-14"
          ],
          "alt2027": [
            "2027-08-15"
          ],
          "hijri": 1,
          "official2026": 0,
          "official2027": 0
        },
        {
          "id": "nationalDay",
          "ar": "العيد الوطني وعيد الجلوس",
          "en": "National Day and Accession Day",
          "days": 2,
          "d2026": [
            "2026-12-16",
            "2026-12-17"
          ],
          "d2027": [
            "2027-12-16",
            "2027-12-17"
          ],
          "hijri": 0,
          "official2026": 1,
          "official2027": 1
        }
      ],
      "workPay": {
        "multiplier": 2.5,
        "multiplierAlt": 1.5,
        "substituteDay": 1,
        "substituteMode": 2,
        "wageBasis": 2,
        "weekendOverlapCompDay": 1
      }
    },
    "unemployment": {
      "law": "المرسوم بقانون 78/2006 بشأن التأمين ضد التعطل المعدل بالقانون 4/2019 (م10–م21)",
      "lastReview": "2026-11-03",
      "compRate": 0.6,
      "compMin": 200,
      "compMax": 1000,
      "compMonths": 9,
      "firstTimeMonths": 12,
      "allowanceGraduate": 200,
      "allowanceOther": 150,
      "allowanceMonths": 9,
      "contribEmployee": 0.01,
      "contribGovernment": 0.01,
      "contribEmployerPaidByLabourFund": 0.01
    },
    "maternity": {
      "law": "قانون العمل في القطاع الأهلي 36/2012 المواد 32–35 و63",
      "lastReview": "2026-11-03",
      "days": 60,
      "prenatalMax": 59,
      "postnatalBanDays": 40,
      "serviceMinMonths": 0,
      "extra": {
        "type": "right",
        "days": 15
      },
      "nursing": [
        {
          "from": "birth",
          "toChildMonths": 6,
          "hours": 2
        },
        {
          "from": "birth",
          "toChildMonths": 12,
          "hours": 1
        }
      ],
      "paternityDays": 1,
      "childcare": {
        "months": 6,
        "times": 3,
        "childMaxAgeYears": 6
      },
      "payer": "employer",
      "prenatalAdvised": 20
    },
    "contrib": {
      "law": "قانون التأمين الاجتماعي 24/1976 المعدل بالقانون 14/2022، والمرسوم بقانون 78/2006، وقرار رئيس الوزراء 109/2023",
      "lastReview": "2026-11-03",
      "employee": 0.07,
      "employerByYear": {
        "2026": 0.15,
        "2027": 0.16,
        "2028": 0.17
      },
      "injury": 0.03,
      "unempEmployee": 0.01,
      "unempGov": 0.01,
      "max": 4000,
      "allowancesCapOfBasic": 1,
      "government": {
        "employee": 0.07,
        "employer": 0.2
      },
      "expat": {
        "injury": 0.03,
        "eosFirst3": 0.042,
        "eosAfter3": 0.084,
        "unempEmployee": 0.01
      }
    }
  },
  "zakat": {
    "law": "ربع العشر (2.5%) فيما بلغ النصاب وحال عليه الحول القمري؛ نصاب الذهب 85 جراماً خالصاً (عيار 24) ونصاب الفضة 595 جراماً",
    "rate": 0.025,
    "nisabGoldGrams": 85,
    "nisabSilverGrams": 595,
    "darIftaKarat": 21,
    "source": "هيئة الزكاة والضريبة والجمارك — الدليل المبسط لزكاة الأفراد؛ دار الإفتاء المصرية؛ الإسلام سؤال وجواب"
  }
};
