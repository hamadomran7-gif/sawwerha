/* امتثالي: مدقق جاهزية الفوترة الإلكترونية في السعودية (/sa/readiness-check). يعمل في المتصفح فقط: لا يحفظ الإجابات ولا يرسلها.
   المصادر (اطُّلع عليها 18 نوفمبر 2026): إعلان الموجة 25 من هيئة الزكاة والضريبة والجمارك، وصفحة «مراحل التطبيق»، وصفحة «كيف تستعد للمرحلة الأولى». */
(function(){
  var form = document.getElementById('sa-rc-form');
  if (!form) return;
  var WAVE25 = new Date(2027, 1, 1); /* «ابتداءً من 1 فبراير 2027م» */

  function val(name){ var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function sod(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function daysTo(d){ return Math.round((sod(d) - sod(new Date())) / 86400000); }
  function daysAr(n){
    if (n === 1) return 'يوم واحد';
    if (n === 2) return 'يومان';
    if (n >= 3 && n <= 10) return n + ' أيام';
    return n.toLocaleString('en-US') + ' يوماً';
  }
  function card(id, tone, date, pill){
    var c = document.getElementById(id);
    if (!c) return;
    c.className = 'card' + (tone ? ' is-' + tone : '');
    c.querySelector('.date').textContent = date;
    var p = c.querySelector('.pill');
    p.className = 'pill' + (tone ? ' ' + tone : '');
    p.textContent = pill;
  }

  function render(){
    var vat = val('sa-vat'), rev = val('sa-rev'), notice = val('sa-notice'), how = val('sa-how');

    if (vat === 'no') card('sa-c-p1', 'warn', 'راجع وضعك مع الهيئة', 'المرحلة الأولى للخاضعين للائحة الفوترة الإلكترونية');
    else if (how === 'manual') card('sa-c-p1', 'late', 'مطبّقة منذ 4 ديسمبر 2021', 'فواتيرك الحالية لا تعد إلكترونية');
    else card('sa-c-p1', 'ok', 'مطبّقة منذ 4 ديسمبر 2021', 'تصدر فواتير إلكترونية');

    if (vat === 'no') card('sa-c-p2', 'warn', 'اسأل الهيئة عن وضعك', 'الموجات تُحدَّد بالإيرادات الخاضعة للضريبة');
    else if (notice === 'yes') card('sa-c-p2', 'warn', 'الموعد الذي في إشعار الهيئة', 'الإشعار هو المرجع لا هذا المدقق');
    else if (rev === 'yes') {
      var n = daysTo(WAVE25);
      card('sa-c-p2', n < 0 ? 'late' : 'warn', '1 فبراير 2027',
        n > 0 ? 'باقٍ ' + daysAr(n) + ' على الموعد المعلن' : (n === 0 ? 'الموعد المعلن اليوم' : 'مضى الموعد المعلن'));
    }
    else if (rev === 'no') card('sa-c-p2', '', 'دون عتبة الموجة 25', 'تابع إشعار الهيئة بالموجات التالية');
    else card('sa-c-p2', 'warn', 'قارن إيراداتك بـ187,500 ريال', 'لكل عام من 2022 إلى 2025');

    if (how === 'manual') card('sa-c-sw', 'late', 'يلزمك برنامج فوترة إلكترونية', 'قارن البرامج وباقات الربط');
    else if (how === 'einv') card('sa-c-sw', 'warn', 'اسأل مزوّدك عن الربط', 'كتابةً، وفي باقتك تحديداً');
    else card('sa-c-sw', 'ok', 'تحقق من باقة الربط', 'الربط ليس في كل باقة');

    var steps = [];
    if (how === 'manual') steps.push('أوقف الفواتير المكتوبة بخط اليد أو ببرامج كتابة النصوص: تقول الهيئة إنها لا تعد فواتير إلكترونية. <a href="/sa">قارن برامج الفوترة</a>');
    if (vat === 'no') steps.push('اسأل الهيئة هل تخضع منشأتك للائحة الفوترة الإلكترونية، فالموجات تُحدَّد بالإيرادات الخاضعة لضريبة القيمة المضافة.');
    else if (notice === 'yes') steps.push('اعمل بالموعد والإجراءات التي في إشعار الهيئة، فهو المرجع.');
    else if (rev === 'yes') steps.push('تابع إشعار الهيئة: تقول إنها ستشعر المنشآت المستهدفة في الموجة 25 تمهيداً لربطها مع «فاتورة» ابتداءً من 1 فبراير 2027. وإن تجاوزت إيراداتك عتبة موجة سابقة أعلى فقد يكون موعدك أسبق. <a href="/sa/fatoora-waves">الموجات ومواعيدها</a>');
    else if (rev === 'no') steps.push('تابع إشعار الهيئة: تقول إنها تبلغ المجموعات المتبقية قبل موعد ربطها بستة أشهر على الأقل.');
    else steps.push('راجع إيراداتك الخاضعة لضريبة القيمة المضافة لكل عام من 2022 إلى 2025، وقارنها بعتبة الموجة 25 (187,500 ريال). <a href="/sa/fatoora-waves">الموجات ومواعيدها</a>');
    if (how !== 'manual') steps.push('اسأل مزوّد برنامجك كتابةً: هل يربط مع «فاتورة» في باقتك، وكم السعر بعد الضريبة؟ <a href="/sa">باقات الربط في 9 برامج</a>');
    var ol = document.getElementById('sa-rc-steps');
    if (ol) ol.innerHTML = '<li>' + steps.join('</li><li>') + '</li>';
  }

  form.addEventListener('change', render);
  form.addEventListener('submit', function(e){ e.preventDefault(); render(); });
  render();
})();
