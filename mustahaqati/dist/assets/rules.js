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
      "paternityWithinDays": 7
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
    }
  }
};
