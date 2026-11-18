/* امتثالي: مدقق جاهزية الفوترة الإلكترونية (العربية والإنجليزية). يعمل في المتصفح فقط: لا يحفظ الإجابات ولا يرسلها. */
(function(){
  var EN = document.documentElement.lang === 'en';
  /*LOGIC-START*/
  var FEE = 5000, CAP = 50000;
  var PLANS = {
    sme:   { asp: [2027, 3, 31],  live: [2027, 7, 1] },
    large: { asp: [2026, 10, 30], live: [2027, 1, 1] },
    gov:   { asp: [2027, 3, 31],  live: [2027, 10, 1] }
  };
  var LISTED = { zoho: ['Zoho Books', '121988'], tally: ['TallyPrime', '162503'] };
  function mk(a){ return new Date(a[0], a[1] - 1, a[2]); }
  function sod(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function dayDiff(a, b){ return Math.round((sod(b) - sod(a)) / 86400000); }
  function monthsLate(last, today){
    var d = sod(last), t = sod(today);
    if (t <= d) return 0;
    var m = (t.getFullYear() - d.getFullYear()) * 12 + (t.getMonth() - d.getMonth());
    if (t.getDate() > d.getDate()) m += 1;
    return Math.max(1, m);
  }
  function fine(m){ return m <= 0 ? 0 : Math.min(CAP, FEE * m); }
  function assess(a, today){
    var p = PLANS[a.cat];
    var r = { cat: a.cat, asp: mk(p.asp), live: mk(p.live) };
    r.inScope = !!(a.b2b || a.b2g);
    r.aspDays = dayDiff(today, r.asp);
    r.liveDays = dayDiff(today, r.live);
    r.appointed = a.asp === 'yes';
    r.unsure = a.asp === 'unsure';
    r.late = r.inScope && !r.appointed ? monthsLate(r.asp, today) : 0;
    r.fineNow = fine(r.late);
    r.solution = !a.system ? '' : (a.system === 'manual' ? 'suite' : 'connect');
    r.api = a.volume === '500-5000' || a.volume === 'gt5000';
    r.listed = LISTED[a.system] || null;
    return r;
  }
  /*LOGIC-END*/
  if (!document.getElementById('rc-form')) return;

  var MAR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  var MEN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function fmt(d){ return d.getDate() + ' ' + (EN ? MEN : MAR)[d.getMonth()] + ' ' + d.getFullYear(); }
  function num(n){ return n.toLocaleString('en-US'); }
  function plural(n, one, two, few, many){
    if (n === 1) return one;
    if (n === 2) return two;
    var m100 = n % 100;
    if (m100 >= 3 && m100 <= 10) return n + ' ' + few;
    return n + ' ' + many;
  }
  function days(n){ return EN ? n + (n === 1 ? ' day' : ' days') : plural(n, 'يوم واحد', 'يومان', 'أيام', 'يوماً'); }
  function months(n){ return EN ? n + (n === 1 ? ' month' : ' months') : plural(n, 'شهر واحد', 'شهران', 'أشهر', 'شهراً'); }
  var T = EN ? {
    inScope: 'In scope', outScope: 'Not in scope for now',
    phase: { sme: 'Businesses with revenue below AED 50 million', large: 'Businesses with revenue of AED 50 million or more', gov: 'Government entities' },
    whyOut: 'Sales to individuals only, until a Ministerial Decision says otherwise',
    left: function(n){ return n > 0 ? days(n) + ' left' : (n === 0 ? 'Today is the deadline' : 'Passed ' + days(-n) + ' ago'); },
    done: '✓ Provider appointed',
    fineSoon: 'If you miss the appointment deadline: AED 5,000, then AED 5,000 for each further month or part of a month, up to AED 50,000 in any 12 consecutive months.',
    fineLate: function(r){ return 'Your appointment deadline passed ' + days(-r.aspDays) + ' ago. Estimated fine so far: AED ' + num(r.fineNow) + ' (' + months(r.late) + '). It grows by AED 5,000 a month, up to AED 50,000 in any 12 consecutive months.'; },
    fineLive: function(r){ return 'The same fines apply if you do not go live by ' + fmt(r.live) + ': AED 5,000, then AED 5,000 a month, up to AED 50,000 in any 12 consecutive months.'; },
    fineOut: 'No fine applies to sales to individuals for now.',
    stampEst: 'Estimate', stampDue: 'Due now', stampNone: 'No fine now',
    steps: {
      outA: ['You do not need a provider now while all your sales are to individuals. ', ['Read why', '/b2c']],
      outB: 'If you start invoicing a business or a government entity, those transactions are in scope: run the check again.',
      unsure: 'First check your EmaraTax account, or ask your software provider, whether an Accredited Service Provider is appointed for your business.',
      suite: 'With manual or Excel invoices, accounting software that includes e-invoicing usually fits: it issues the invoice in the required format, sends it and reports it.',
      connect: 'With an existing system, a platform that connects it to an Accredited Service Provider usually fits, or your own software’s e-invoicing if it is on the Ministry of Finance list.',
      listed: function(l){ return l[0] + ' is on the Ministry of Finance list (accreditation number ' + l[1] + ').'; },
      api: 'At this volume, ask providers about an automatic connection (API) instead of manual entry.',
      compare: ['Compare accredited providers and request quotes, then sign the contract. ', ['Compare providers (Arabic)', '/#compare']],
      appoint: function(r){ return ['Appoint the provider from your EmaraTax account by ' + fmt(r.asp) + '. ', ['Steps (Arabic)', '/appoint-asp']]; },
      trn: ['Have your tax number ready: your TRN, or a Tax Identification Number if you are not VAT-registered. ', ['Details (Arabic)', '/vat-unregistered']],
      test: function(r){ return 'Agree with the provider how your data will be sent, and test the exchange before ' + fmt(r.live) + '.'; },
      fields: ['Check that your invoices carry every mandatory field. ', ['Details (Arabic)', '/accounting-software']],
      golive: function(r){ return 'Start issuing through the provider by ' + fmt(r.live) + ', and tell it about any change to your registered details.'; }
    }
  } : {
    inScope: 'خاضع للنظام', outScope: 'غير خاضع حالياً',
    phase: { sme: 'المنشآت التي يقل إيرادها عن 50 مليون درهم', large: 'المنشآت التي يبلغ إيرادها 50 مليون درهم أو أكثر', gov: 'الجهات الحكومية' },
    whyOut: 'مبيعاتك لأفراد فقط، إلى أن يصدر قرار من الوزير',
    left: function(n){ return n > 0 ? 'باقٍ ' + days(n) : (n === 0 ? 'الموعد اليوم' : 'مضى الموعد منذ ' + days(-n)); },
    done: '✓ عيّنت المزوّد',
    fineSoon: 'إن فاتك موعد التعيين: 5,000 درهم، ثم 5,000 درهم عن كل شهر أو جزء منه يستمر فيه التأخير، بحد أقصى 50,000 درهم خلال أي 12 شهراً متتالية.',
    fineLate: function(r){ return 'مضى موعد التعيين منذ ' + days(-r.aspDays) + '. الغرامة التقديرية حتى اليوم ' + num(r.fineNow) + ' درهم (' + months(r.late) + ')، وتزيد 5,000 درهم كل شهر حتى 50,000 درهم خلال أي 12 شهراً متتالية.'; },
    fineLive: function(r){ return 'الغرامة نفسها تسري إن لم تطبّق النظام في موعد أقصاه ' + fmt(r.live) + ': 5,000 درهم، ثم 5,000 درهم كل شهر، بحد أقصى 50,000 درهم خلال أي 12 شهراً متتالية.'; },
    fineOut: 'لا غرامة على البيع للأفراد حالياً.',
    stampEst: 'تقدير', stampDue: 'مستحق الآن', stampNone: 'لا غرامة الآن',
    steps: {
      outA: ['لا يلزمك تعيين مزوّد الآن ما دامت مبيعاتك كلها لأفراد. ', ['اقرأ السبب', '/b2c']],
      outB: 'إن بدأت تصدر فاتورة لشركة أو جهة حكومية فأنت مشمول في تلك المعاملات، فأعد الفحص.',
      unsure: 'تحقق أولاً من حسابك في «إمارات تاكس»، أو اسأل مزوّد برنامجك، هل عُيّن مزوّد خدمة معتمد لمنشأتك.',
      suite: 'من يصدر فواتيره يدوياً أو من Excel يناسبه غالباً برنامج محاسبة يتضمن الفوترة الإلكترونية: يصدر الفاتورة بالصيغة المعتمدة ويرسلها ويبلّغ بها.',
      connect: 'من لديه نظام قائم تناسبه غالباً منصة تربط نظامه بمزوّد معتمد، أو حل برنامجه نفسه إن كان مدرجاً في قائمة وزارة المالية.',
      listed: function(l){ return l[0] + ' مدرج في قائمة وزارة المالية برقم الاعتماد ' + l[1] + '.'; },
      api: 'مع هذا العدد من الفواتير اسأل المزوّدين عن الربط الآلي عبر واجهة برمجية (API) بدل الإدخال اليدوي.',
      compare: ['قارن المزوّدين المعتمدين واطلب عروض الأسعار، ثم وقّع العقد. ', ['قارن المزوّدين', '/#compare']],
      appoint: function(r){ return ['عيّن المزوّد من حسابك في «إمارات تاكس» في موعد أقصاه ' + fmt(r.asp) + '. ', ['الخطوات', '/appoint-asp']]; },
      trn: ['جهّز رقمك الضريبي: رقم التسجيل، أو رقم تعريف ضريبي إن لم تكن مسجلاً. ', ['التفاصيل', '/vat-unregistered']],
      test: function(r){ return 'اتفق مع المزوّد على طريقة إرسال البيانات، واختبرا التبادل قبل ' + fmt(r.live) + '.'; },
      fields: ['راجع أن فواتيرك تستخرج كل الحقول الإلزامية. ', ['التفاصيل', '/accounting-software']],
      golive: function(r){ return 'ابدأ الإصدار عبر المزوّد في موعد أقصاه ' + fmt(r.live) + '، وأبلغه بأي تغيير في بياناتك المسجلة لدى الهيئة.'; }
    }
  };

  function $(id){ return document.getElementById(id); }
  function val(name){ var el = document.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function setPill(el, card, kind, text){
    el.className = 'pill' + (kind ? ' ' + kind : '');
    el.textContent = text;
    card.className = 'card' + (kind ? ' is-' + kind : '');
  }
  function step(list, part){
    var li = document.createElement('li');
    (typeof part === 'string' ? [part] : part).forEach(function(x){
      if (typeof x === 'string') { li.appendChild(document.createTextNode(x)); return; }
      var a = document.createElement('a'); a.href = x[1]; a.textContent = x[0]; li.appendChild(a);
    });
    list.appendChild(li);
  }
  function show(){
    var a = { cat: val('rc-cat') || 'sme', b2b: $('rc-b2b').checked, b2g: $('rc-b2g').checked, b2c: $('rc-b2c').checked,
              volume: $('rc-volume').value, system: $('rc-system').value, asp: val('rc-asp') || 'no' };
    var r = assess(a, new Date());
    var s = T.steps, list = $('rc-steps');
    $('rc-status').textContent = r.inScope ? T.inScope : T.outScope;
    $('rc-phase').textContent = r.inScope ? T.phase[r.cat] : T.whyOut;
    $('rc-c-asp').hidden = !r.inScope;
    $('rc-c-live').hidden = !r.inScope;
    $('rc-asp').textContent = fmt(r.asp);
    $('rc-live').textContent = fmt(r.live);
    if (r.appointed) setPill($('rc-asp-left'), $('rc-c-asp'), 'ok', T.done);
    else setPill($('rc-asp-left'), $('rc-c-asp'), r.aspDays < 0 ? 'late' : (r.aspDays <= 60 ? 'warn' : ''), T.left(r.aspDays));
    setPill($('rc-live-left'), $('rc-c-live'), r.liveDays < 0 ? 'late' : (r.liveDays <= 60 ? 'warn' : ''), T.left(r.liveDays));

    var stamp = $('rc-stamp');
    if (!r.inScope) { $('rc-fine').textContent = T.fineOut; stamp.className = 'stamp ok'; stamp.textContent = T.stampNone; }
    else if (r.appointed) { $('rc-fine').textContent = T.fineLive(r); stamp.className = 'stamp'; stamp.textContent = T.stampEst; }
    else if (r.late > 0) { $('rc-fine').textContent = T.fineLate(r); stamp.className = 'stamp late'; stamp.textContent = T.stampDue; }
    else { $('rc-fine').textContent = T.fineSoon; stamp.className = 'stamp'; stamp.textContent = T.stampEst; }

    list.textContent = '';
    if (!r.inScope) { step(list, s.outA); step(list, s.outB); return; }
    if (r.unsure) step(list, s.unsure);
    if (!r.appointed) {
      if (r.solution) step(list, s[r.solution] + (r.listed ? ' ' + s.listed(r.listed) : '') + (r.api ? ' ' + s.api : ''));
      step(list, s.compare);
      step(list, s.appoint(r));
      step(list, s.trn);
      step(list, s.test(r));
    } else {
      step(list, s.test(r));
      step(list, s.fields);
    }
    step(list, s.golive(r));
  }
  $('rc-form').addEventListener('change', show);
  $('rc-form').addEventListener('submit', function(e){ e.preventDefault(); });
  show();
})();
