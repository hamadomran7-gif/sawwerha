#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
امتثالي — البند 3 في «طابور البناء»: دليل مزوّدي خدمات الفوترة الإلكترونية المعتمدين (88 مزوّداً).
أعدّه وكيل البناء في 18 نوفمبر 2026 (نحو 09:00 بتوقيت دبي). بلا اعتماديات: python3 هذا_الملف [مجلد_الإخراج]

يكتب:
  providers.html                 → https://emtithali.com/providers        (فهرس الدليل)
  providers/<slug>.html          → https://emtithali.com/providers/<slug> (88 صفحة)
  sitemap-providers.xml          → 89 عنواناً تُدمج في sitemap.xml
  MANIFEST.txt                   → SHA-256 لكل ملف
إن كان اصطلاح المستودع <slug>/index.html فغيّر write_page() وحدها؛ الروابط الداخلية بلا شرطة أخيرة.

التحقق في هذا التشغيل (18 نوفمبر 2026، من تبويب وكيل البناء في المتصفح المدمج على الجهاز):
- القائمة الرسمية: https://mof.gov.ae/ar/about-us/initiatives/einvoicing/einvoicing-accredited-service-providers-asps/
  (الرابط القديم .../pre-approved-einvoicing-service-providers/ يحوّل إليه). جدول واحد، 88 صفاً، تذييل «آخر تحديث في 17/11/2026 20:27».
  بصمة الأعمدة الأربعة الأولى (# والاسم ورقم الاعتماد والموقع، مسافات مطبّعة، صف لكل مزوّد بفاصل TAB وسطر أخير فارغ):
  SHA-256 = 0c681df77f15a914b1b328b85886edc4e41b585f3d640a18ab323fb625349eac (5,332 بايت) — طابقت نسخة ROWS أدناه بايتاً ببايت.
  مقطع البصمة (يُشغَّل في تبويب على صفحة القائمة قبل النشر؛ إن اختلف الناتج فلا نشر قبل تحديث ROWS):
    const rows=[...document.querySelectorAll('table tr')].slice(1).map(tr=>[...tr.querySelectorAll('td')].slice(0,4).map(c=>c.innerText.replace(/\\s+/g,' ').trim()).join('\\t'));
    const s=rows.join('\\n')+'\\n'; const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));
    [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')
- الأسعار العلنية الأربعة قُرئت نصاً كاملاً في المتصفح في التشغيل نفسه: Azdan وFynamics وAiverix وTronStride (روابطها في PUBLIC).
- الروابط: 88 موقعاً كما طُبعت بـhttps:// فُحصت بطلب no-cors من المتصفح؛ ستة لم تفتح (NOLINK) فتُعرض نصاً بلا رابط.
- «لا سعر علني» و«لم يُقرأ» من مسح حلقة العمل المستمر في 17 و18 نوفمبر 2026 (ملفات data-item3-* في المشروع)، بتاريخ كل فحص.

إعادة التحقق قبل النشر (الوكيل المفوَّض، 18 نوفمبر 2026 بين 19:10 و19:21 دبي، المتصفح المدمج):
- بصمة القائمة: 88 صفاً، 5,332 بايت، SHA-256 نفسها 0c681df7…49eac (تذييلها صار «آخر تحديث في 18/11/2026 13:57»).
- Azdan وFynamics وTronStride: الأرقام كما هي. Aiverix غيّرت صفحة أسعارها بعد قراءة الصباح: الترخيص صار 75 درهماً شهرياً
  بالدفع السنوي (900 سنوياً) أو 90 شهرياً، ويشمل 1,000 معاملة، فحُدّث PUBLIC[54] من الصفحة الحالية. وعرض «حتى 30 نوفمبر»
  (69 بدل 89) اختفى من الصفحة، ولا نص فيها عن عرض مؤقت؛ وعبارة «AED, excluding 5% VAT» ما زالت فيها.
"""
import hashlib, html, json, os, sys

AS_OF = "18 نوفمبر 2026"
AS_OF_ISO = "2026-11-18"
SITE = "https://emtithali.com"
MOF_LIST = "https://mof.gov.ae/ar/about-us/initiatives/einvoicing/einvoicing-accredited-service-providers-asps/"
MOF_EINV = "https://mof.gov.ae/ar/about-ministry/mof-initiatives/einvoicing/"

# (#, الاسم كما في القائمة, رقم الاعتماد, الموقع كما طُبع, slug)
ROWS = [
(1,"Advintek Consulting Services LLC","196766","www.einvoice.advintek.ae","advintek"),
(2,"Amazon Web Services EMEA SARL (Branch)","165787","www.aws.amazon.com","aws"),
(3,"Ardentax IT Solutions - FZCO","189050","www.ardentaxit.tax","ardentax"),
(4,"Avalara Gulf Technologies LLC","134809","www.avalara.com","avalara"),
(5,"Azdan Business Analytics","147900","www.azdan.com","azdan"),
(6,"Azentio Software Orion (Middle East) FZ-LLC","141846","www.azentio.com","azentio"),
(7,"BBIT Accqrate Technology FZCO","101071","www.bbit-accqrate.com/ae/en","accqrate"),
(8,"BDO Digital Solutions FZ-LLC","185520","www.bdo.ae/en-gb/home","bdo"),
(9,"Bee Aura Tech FZ LLC","179804","www.bauratec.com","bee-aura-tech"),
(10,"Casim L.L.C-FZ","178533","www.casim.ae","casim"),
(11,"Chaturvedi Software House L.L.C","104596","www.fincore.solutions","fincore"),
(12,"Citytech Software DMCC","164921","www.citytechme.com","citytech"),
(13,"Cloud Consulting LLC-FZ (DocFlow)","181172","www.docflow.ae","docflow"),
(14,"Comarch Middle East FZ LLC","110668","www.comarch.com/trade-and-services/data-management/e-invoicing","comarch"),
(15,"Complyance Electronics L.L.C","112219","www.complyance.io","complyance"),
(16,"Covoro AI – FZCO","142208","www.covoro.ai/uae","covoro"),
(17,"Cygnet Digital IT Solutions L.L.C","101139","www.cygnet.one","cygnet"),
(18,"Dariba Technologies LLC","158550","www.daribatech.com","dariba"),
(19,"Data Hub Integrated Solutions Moro LLC","129478","www.morohub.com/en","morohub"),
(20,"Defmacro Software DMCC (ClearTax)","163162","www.cleartax.com/ae","cleartax"),
(21,"Deloitte & Touche - M E","123513","www.deloitte.com/middle-east/en.html","deloitte"),
(22,"Dofort Biztech L.L.C","187633","www.doforttech.com","dofort"),
(23,"DP World Digital GCC FZE","117846","www.einvoicing.dpworld.com/home","dp-world"),
(24,"Ecosio Emea Information Technology Services - FZCO","132670","www.ecosio.com","ecosio"),
(25,"EDICOM Middle East Services","102434","www.edicomgroup.com","edicom"),
(26,"ELITE COMPUTER SYSTEMS AND SOFTWARE DESIGNING - L.L.C","125617","www.eliteitdesign.com","elite-computer-systems"),
(27,"EY Consulting LLC","165308","www.ey.com/en_gl/services/tax/e-invoicing-solution","ey"),
(28,"Flick Network L.L.C","138271","www.flick.network/en","flick"),
(29,"Focus Softnet","134577","www.focussoftnet.com","focus-softnet"),
(30,"Fonoa Gulf Technology Services LLC","149104","www.fonoa.com","fonoa"),
(31,"Fyient Line Technology","158998","www.fyient.com","fyient"),
(32,"Fynamics Techno Solutions – FZCO","159905","www.fynamicstax.com/uae","fynamics"),
(33,"Gaambit Global Audit & Advisory Services LLC","104125","www.gaambitglobal.com","gaambit"),
(34,"Global Experts of Information Technology Consultants","160689","www.global-experts.co.uk","global-experts"),
(35,"GSS Management Consultancy","167585","www.gssmcgulf.com","gss"),
(36,"Hamt Information Technology L.L.C (EVATRA)","144576","www.hlbhamt.com","hamt-evatra"),
(37,"Hamwi Computer Software","131375","www.fatorly.com","fatorly"),
(38,"Infinite IT Solutions FZCO","171157","www.infinite-it.com","infinite-it"),
(39,"Infocus Technologies L.L.C-FZ","154195","www.infocustechnologiesllcfz.com","infocus"),
(40,"Information Dynamics LLC","187021","www.infodynamic.net","information-dynamics"),
(41,"InvoiceNow biz - F.Z.C","184465","www.invoicenow.biz","invoicenow"),
(42,"InvoiceQ For Information Technology Limited","114413","www.ae.invoiceq.com","invoiceq"),
(43,"KASA Advisory Services","153288","www.kasaadvisory.com","kasa"),
(44,"KGRN Chartered Accountants","120915","www.kgrnaudit.com","kgrn"),
(45,"KPI Suitetech DMCC","142349","www.kpi.co","kpi-suitetech"),
(46,"LightIdea Information Technology L.L.C","111062","www.lightidea.org","lightidea"),
(47,"Mac & Ross Chartered Accountants LLC","130476","www.macnross.com","mac-ross"),
(48,"Marmin AI Software Design LLC","160945","www.marmin.ai","marmin"),
(49,"McBitss Technologies CO LLC SOC","143578","www.mcbitss.com","mcbitss"),
(50,"Microvista Technologies LLC","157529","www.microvistatech.com/e-invoicing-in-uae","microvista"),
(51,"Moore JFC Consulting LLC","158006","www.moorejfcgroup.com","moore-jfc"),
(52,"Namiri Technology Services L.L.C","104802","www.digitax.tech","namiri"),
(53,"New Age Software Limited","100511","www.newage-global.com","newage"),
(54,"Osmena Information Technology L.L.C","147777","www.aiverix.ae","aiverix"),
(55,"Orchida Soft Computer Systems LLC","194498","www.orchidatax.com/country-compliance/uae/","orchida"),
(56,"Oxinus Holding Limited","198978","www.oxinus.holdings","oxinus"),
(57,"PACT Software Services LLC","129353","www.pactsoft.com","pact"),
(58,"Pagero Gulf FZ-LLC","153759","www.pagero.com","pagero"),
(59,"Platform ACube Technologies LLC (A-Cube)","188961","www.acubeapi.com/en/uae","a-cube"),
(60,"Qvalia Technologies","193458","www.qvalia.com","qvalia"),
(61,"Ravera EInvoicing Services - FZCO","199307","www.ravera.ae","ravera"),
(62,"Resilience Tax Consultant LLC","197640","www.resilienceuae.com","resilience"),
(63,"RTC Novatech Solutions","139410","www.rtcsuite.com","rtc-novatech"),
(64,"SAP Middle East & North Africa LLC","197202","www.sap.com/index.html","sap"),
(65,"Samsotech LLC","192161","www.samsotech-id.com","samsotech"),
(66,"Skill Quotient Technologies","193219","www.skillquotientgroup.com","skill-quotient"),
(67,"SNB Accounting Management & Tax Consultancy LLC","192393","www.snbconsulting.ae","snb"),
(68,"Spendconsole FZ LLC","152306","www.spendconsole.ai","spendconsole"),
(69,"SunTec (Xelerate) Business Solutions DMCC","180240","www.suntecgroup.com/suntec-e-invoicing","suntec-xelerate"),
(70,"Suntech Business Solutions DMCC","106799","www.suntech-global.com","suntech"),
(71,"Tally Software Solutions FZCO","162503","www.tallysolutions.com","tally"),
(72,"TAXILLA FINOPS 360 – FZCO","128546","www.taxilla.com","taxilla"),
(73,"Tax Star L.L.C-FZ","175257","www.taxstar.app","tax-star"),
(74,"Taxlabs.ai","166926","www.taxlab.ai","taxlabs"),
(75,"Techventures Information Technology Services","105700","www.techventuresglobal.com","techventures"),
(76,"TronStride FZC","182493","www.tronstride.com","tronstride"),
(77,"UHY James Advisory LLC","148957","www.uhy-ae.com","uhy-james"),
(78,"Unified SSK Information Technology L.L.C","163006","www.unifiedssk.com","unified-ssk"),
(79,"UTC Information Technology Network Services Co. L.L.C.","185561","www.eand.com/en/etisalat-enterprise.html","utc-information-technology"),
(80,"VATit Consultant Gulf Ltd","106062","www.eezi.io","vatit"),
(81,"Veutel International FZC LLC","149302","www.veutel.com","veutel"),
(82,"Victorian Fin Technology L.L.C","126326","www.victorianuae.com","victorian"),
(83,"Vostok Trading LLC","194753","www.vostok.ae","vostok"),
(84,"Wafeq FZ-LLC","129932","www.wafeq.com/en-ae","wafeq"),
(85,"Webtel Technologies solutions- FZCO","133108","www.webtel.in","webtel"),
(86,"Young Global Technologies L.L.C-FZ","193284","www.youngglobal.co","young-global"),
(87,"Zennovate IT Solutions","116145","www.zennovatesystems.com","zennovate"),
(88,"Zoho Software Trading LLC","121988","www.zoho.com","zoho"),
]

# روابط لم تفتح من المتصفح في 18 نوفمبر 2026 (طلبان متتاليان): تُعرض نصاً كما طُبعت بلا رابط.
NOLINK = {7, 23, 42, 57, 65, 74}

# اسم تجاري يظهر بجانب الاسم الرسمي: من موقع المزوّد المسجّل في القائمة.
BRAND = {54: "Aiverix", 37: "Fatorly"}

# تاريخ فحص حلقة العمل المستمر لكل مزوّد بلا سعر علني (17 أو 18 نوفمبر 2026)
D17, D18 = "17 نوفمبر 2026", "18 نوفمبر 2026"
NONE_17 = {13, 37, 73, 20, 28, 80, 16, 48, 74, 10, 50, 61, 38, 52}
NONE_18 = {1, 9, 11, 17, 18, 22, 26, 29, 31, 34, 36, 39, 40, 41, 45, 55, 56, 57, 59, 62, 63, 65, 66, 67, 68, 69, 72, 75, 81, 82, 83, 85, 86, 87,
           4, 58, 14, 24, 25, 30, 53, 70, 6, 64, 2, 79, 8, 21, 27, 33, 35, 43, 44, 47, 51, 77}
UNREAD = {42: D17, 3: D18, 7: D18, 19: D18, 46: D18, 49: D18, 78: D18, 23: D18}
COMPARE_PRICED = {71, 84, 88}          # أمثلة أسعارهم في #compare بالرئيسية (منقولة 10 نوفمبر 2026)
ON_COMPARE = {71, 84, 88, 20, 37, 28, 42}
KSA_ONLY = {15}
RESTRICTED = {12, 60}

# أسعار علنية قُرئت في المتصفح في 18 نوفمبر 2026. (ملخص الفهرس، فقرات الصفحة، رابط المصدر)
PUBLIC = {
 5: ("مجانية حتى 120 مستنداً سنوياً لحساب واحد؛ 948 درهماً سنوياً لكل حساب لحسابين فأكثر",
     ["الباقة المجانية: حساب واحد في «إمارات تاكس» حتى 120 مستنداً في السنة، بلا بطاقة ائتمان.",
      "لحسابين فأكثر: 948 درهماً في السنة لكل حساب، تشمل 1,200 مستند لكل حساب. وأول حزمة إضافية 600 مستند سنوياً بـ200 درهم.",
      "الاشتراك سنوي، والتأسيس وإعداد الحساب القياسيان بلا رسوم، وبرمجة ERP الخاصة والربط المخصّص تُسعَّر منفصلة.",
      "لا تذكر الصفحة هل الأسعار شاملة ضريبة القيمة المضافة."],
     "https://www.azdan.com/uae-einvoice/pricing"),
 32: ("من 4,500 درهم سنوياً، دون ضريبة القيمة المضافة",
     ["من 4,500 درهم في السنة، بشرائح تتدرّج مع عدد الفواتير، وتُحتسب على مستوى الحساب، دون ضريبة القيمة المضافة.",
      "التسعير سنوي ويسري على كل الباقات، ويُضاف رسم تأسيس لمرة واحدة لا تذكر الصفحة مبلغه، وللمؤسسات «تواصل للسعر»."],
     "https://www.fynamicstax.com/uae"),
 54: ("ترخيص 75 درهماً شهرياً لكل رقم تسجيل ضريبي بالدفع السنوي (900 درهم سنوياً) يشمل 1,000 معاملة، دون ضريبة القيمة المضافة",
     ["الترخيص: 75 درهماً شهرياً لكل رقم تسجيل ضريبي (TRN) بالدفع السنوي، أي 900 درهم في السنة، أو 90 درهماً شهرياً بالدفع الشهري، ويشمل 1,000 معاملة مرسلة ومستلمة في السنة وشركة واحدة (TIN) ومستخدمَين، وكل شركة أو مستخدم إضافي بـ49 درهماً شهرياً.",
      "حزم معاملات إضافية تُدفع سنوياً: 500 بـ140 درهماً، و1,000 بـ250، و2,000 بـ500، و5,000 بـ1,100، و10,000 بـ2,000. وباقة Micro لـ100 معاملة في السنة وشركة واحدة ومستخدم واحد بـ588 درهماً سنوياً، وفوق 10,000 معاملة عرض للمؤسسات من 0.20 درهم للمستند.",
      "التأسيس والتدريب اختياريان بـ200 درهم لكل موقع (لثلاثة مواقع أو أربعة مستخدمين فأكثر)، وربط ERP يُسعَّر منفصلاً، والدعم المميز اختياري بـ150 درهماً شهرياً لكل شركة (TIN).",
      "الأسعار بالدرهم دون ضريبة القيمة المضافة 5%."],
     "https://aiverix.ae/pricing"),
 76: ("مجانية حتى 100 مستند سنوياً، ثم من 1,470 درهماً سنوياً (500 مستند)",
     ["الباقة المجانية: 100 مستند في السنة لكيان واحد (رقم تسجيل ضريبي واحد).",
      "الباقات السنوية: Startup بـ1,470 درهماً (500 مستند)، وEssential بـ2,205 (1,200 مستند)، وBusiness بـ4,410 (3,000)، وBusiness Pro بـ11,025 (12,000)، وEnterprise بـ17,640 (24,000)، وEnterprise Plus بـ26,460 (60,000)، وCorporate بـ39,690 (120,000)، وفوقها باقات للكميات الكبيرة بالتواصل.",
      "التأسيس الذاتي مجاني، والتأسيس مع التدريب 1,500 دولار للكيان و500 دولار لكل كيان إضافي، ورسوم ربط ERP منفصلة. وتعلن الصفحة سعر صرف ثابتاً: الدولار بـ3.675 درهم.",
      "لا تذكر الصفحة هل الأسعار شاملة ضريبة القيمة المضافة."],
     "https://www.tronstride.com/pricing/"),
}

def esc(s): return html.escape(s, quote=True)

def ltr(s): return f'<span dir="ltr">{esc(s)}</span>'

def disp(n, name):
    b = BRAND.get(n)
    return f"{name} ({b})" if b else name

def site_html(n, site):
    if n in NOLINK:
        return f'{ltr(site)} <span class="note">(الرابط كما طُبع في القائمة لم يفتح عند فحصنا في {AS_OF})</span>'
    return f'<a href="https://{esc(site)}" rel="nofollow noopener" dir="ltr">{esc(site)}</a>'

def price_short(n):
    if n in PUBLIC: return esc(PUBLIC[n][0])
    if n in COMPARE_PRICED: return 'أمثلة في <a href="/#compare">المفاضلة</a>'
    if n in KSA_ONLY: return "أسعار منشورة للسعودية وماليزيا لا للإمارات"
    if n in RESTRICTED: return "لا نذكر سعراً"
    if n in UNREAD: return "لم نتمكن من قراءة موقعه"
    return "لا سعر علني"

def price_block(n):
    if n in PUBLIC:
        _, paras, src = PUBLIC[n]
        lis = "\n".join(f"      <li>{esc(p)}</li>" for p in paras)
        return (f'    <p>السعر المنشور على موقع المزوّد، اطّلعنا عليه في {AS_OF}، وقد يتغيّر:</p>\n'
                f'    <ul class="bul">\n{lis}\n    </ul>\n'
                f'    <p class="note">المصدر: <a href="{esc(src)}" rel="nofollow noopener" dir="ltr">{esc(src)}</a>. الأرقام كما تعرضها الصفحة، وما لم تذكره عن الضريبة لم نضفه.</p>')
    if n in COMPARE_PRICED:
        return ('    <p>ينشر المزوّد أسعاره علناً، وتجد أمثلة منها في <a href="/#compare">المفاضلة بالصفحة الرئيسية</a> '
                '(منقولة عن موقعه يوم 10 نوفمبر 2026، وقد تتغير). تحقق من السعر الحالي في موقعه قبل التعاقد.</p>')
    if n in KSA_ONLY:
        return (f'    <p>صفحة الأسعار في موقعه مخصّصة للسعودية وماليزيا، لا للإمارات (اطّلعنا عليها في {D17})، فلا ننقل منها سعراً هنا.</p>')
    if n in RESTRICTED:
        return '    <p>لا نذكر سعراً لهذا المزوّد. اطلب السعر منه مباشرة، أو اطلب عروضاً من عدة مزوّدين معتمدين بالنموذج أدناه.</p>'
    if n in UNREAD:
        return (f'    <p>لم نتمكن من قراءة موقعه آلياً عند فحصنا في {UNREAD[n]}، فلا نذكر عنه سعراً. راجع موقعه مباشرة.</p>')
    d = D17 if n in NONE_17 else D18
    extra = ' وتجد وصفه في <a href="/#compare">المفاضلة بالصفحة الرئيسية</a>.' if n in ON_COMPARE else ''
    return f'    <p>لا يعرض المزوّد سعراً علنياً (اطّلعنا على موقعه في {d}). يُطلب السعر منه أو عبر نموذج عروض الأسعار.{extra}</p>'

def price_faq(n, name):
    if n in PUBLIC:
        _, paras, src = PUBLIC[n]
        return f"بحسب صفحة الأسعار في موقعه كما اطّلعنا عليها في {AS_OF}: " + " ".join(paras)
    if n in COMPARE_PRICED:
        return "ينشر المزوّد أسعاره علناً في موقعه، وأمثلة منها في المفاضلة بالصفحة الرئيسية في امتثالي (منقولة يوم 10 نوفمبر 2026)."
    if n in KSA_ONLY:
        return f"صفحة الأسعار في موقعه للسعودية وماليزيا لا للإمارات (اطّلعنا عليها في {D17})، فيُطلب السعر منه."
    if n in RESTRICTED:
        return "لا نذكر سعراً لهذا المزوّد؛ يُطلب منه مباشرة."
    if n in UNREAD:
        return f"لم نتمكن من قراءة موقعه آلياً عند فحصنا في {UNREAD[n]}، فيُطلب السعر منه مباشرة."
    d = D17 if n in NONE_17 else D18
    return f"لا يعرض المزوّد سعراً علنياً (اطّلعنا على موقعه في {d})، فيُطلب السعر منه أو عبر نموذج عروض الأسعار."

HEAD_COMMON = """<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#0f1a38">
<meta property="og:locale" content="ar_AE">
<meta property="og:site_name" content="امتثالي">
<meta property="og:image" content="https://emtithali.com/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="امتثالي: قارن مزوّدي الفوترة الإلكترونية المعتمدين في الإمارات">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://emtithali.com/og-image.png">
<link rel="preload" href="/alexandria-arabic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/site.css">"""

def header(src):
    return f"""<div class="ribbon" data-nosnippet>نسخة تجريبية قبل الإطلاق.</div>
<header class="top">
  <div class="top-in">
    <a class="brand" href="/"><svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5"/><path d="M6.5 12.5l3.6 3.7L17.5 8"/></svg>امتثالي<small>منصة مستقلة، غير حكومية</small></a>
    <nav class="nav" aria-label="أقسام الموقع">
      <a href="/#compare">المزوّدون</a>
      <a href="/#calc">الموعد والغرامة</a>
      <a href="/#method">المنهجية</a>
      <a href="/#guides">الدليل</a>
      <a href="/#faq">الأسئلة</a>
    </nav>
    <a class="btn sm" href="/?src={src}#quote">اطلب عروض الأسعار</a>
  </div>
</header>"""

def cta(src):
    return f"""  <section class="panel" aria-labelledby="cta-title">
    <h2 id="cta-title">قارن عروض المزوّدين قبل موعدك</h2>
    <p>أدخل بيانات منشأتك مرة واحدة، ونحيل طلبك إلى ما يصل إلى ثلاثة مزوّدين معتمدين يقدّم كلٌّ منهم عرضه لك. الخدمة مجانية لك.</p>
    <div class="cta-row">
      <a class="btn" href="/?src={src}#quote">اطلب عروض الأسعار</a>
      <a class="btn ghost" href="/readiness-check">افحص جاهزيتك للفوترة الإلكترونية</a>
    </div>
  </section>"""

FOOTER = f"""  <footer>
    <p class="note">امتثالي منصة مستقلة غير حكومية. لا تتبع وزارة المالية ولا الهيئة الاتحادية للضرائب، وليست مزوّد خدمة معتمداً. المعلومات هنا إرشادية وليست استشارة ضريبية، فتحقق دائماً من المصدر الرسمي.</p>
    <p class="note">بعض المزوّدين قد يدفع لنا عمولة إذا تعاقدت معه، ولا تدفع أنت شيئاً زائداً، ولا أثر لذلك في إدراج أي مزوّد في هذا الدليل ولا في ترتيبه. <a href="/#privacy">الخصوصية</a></p>
    <h2>المصادر</h2>
    <ul class="links">
      <li><a href="{MOF_LIST}" rel="noopener">قائمة مزوّدي خدمات الفوترة الإلكترونية المعتمدين (ASPs)، وزارة المالية</a> (اطّلعنا عليها في {AS_OF})</li>
      <li><a href="{MOF_EINV}" rel="noopener">صفحة الفوترة الإلكترونية والقرارات، وزارة المالية</a></li>
    </ul>
  </footer>"""

def jsonld(obj):
    return '<script type="application/ld+json">\n' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + '\n</script>'

def provider_page(i):
    n, name, acc, site, slug = ROWS[i]
    dn = disp(n, name)
    url = f"{SITE}/providers/{slug}"
    src = f"provider-{slug}"
    title = f"{dn}: مزوّد فوترة إلكترونية معتمد في الإمارات، رقم الاعتماد {acc}"
    desc = (f"{dn} مدرج في قائمة وزارة المالية لمزوّدي خدمات الفوترة الإلكترونية المعتمدين برقم الاعتماد {acc}، "
            f"كما اطّلعنا عليها في {AS_OF}. موقعه المسجّل، وما ينشره عن السعر، وكيف تتحقق بنفسك.")
    q1 = f"هل {dn} مزوّد خدمات فوترة إلكترونية معتمد في الإمارات؟"
    a1 = (f"نعم بحسب قائمة وزارة المالية لمزوّدي خدمات الفوترة الإلكترونية المعتمدين (ASPs) كما اطّلعنا عليها في {AS_OF}: "
          f"«{name}» برقم الاعتماد {acc}. القائمة تُحدَّث دورياً، فتحقق منها قبل التعاقد.")
    q2 = f"كم سعر {dn} للفوترة الإلكترونية؟"
    a2 = price_faq(n, dn)
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "امتثالي", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "دليل المزوّدين المعتمدين", "item": SITE + "/providers"},
            {"@type": "ListItem", "position": 3, "name": dn, "item": url}]},
        {"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q1, "acceptedAnswer": {"@type": "Answer", "text": a1}},
            {"@type": "Question", "name": q2, "acceptedAnswer": {"@type": "Answer", "text": a2}}]}]}
    prev_r = ROWS[i - 1] if i > 0 else None
    next_r = ROWS[i + 1] if i + 1 < len(ROWS) else None
    nb = []
    if prev_r: nb.append(f'      <li><a href="/providers/{prev_r[4]}"><b dir="ltr">{esc(disp(prev_r[0], prev_r[1]))}</b><span>السابق في القائمة، رقم الاعتماد {prev_r[2]}</span></a></li>')
    if next_r: nb.append(f'      <li><a href="/providers/{next_r[4]}"><b dir="ltr">{esc(disp(next_r[0], next_r[1]))}</b><span>التالي في القائمة، رقم الاعتماد {next_r[2]}</span></a></li>')
    nb.append('      <li><a href="/providers"><b>دليل المزوّدين المعتمدين</b><span>القائمة كاملة: 88 مزوّداً</span></a></li>')
    nb.append('      <li><a href="/choose-provider"><b>كيف تختار مزوّدك؟</b><span>اعتبارات وزارة المالية قبل التعاقد</span></a></li>')
    brand_line = ""
    if n in BRAND:
        brand_line = (f'\n    <p>موقعه المسجّل في القائمة يعرض الخدمة باسم {ltr(BRAND[n])} (اطّلعنا عليه في {AS_OF}).</p>')
    return f"""<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} | امتثالي</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
{HEAD_COMMON}
<meta property="og:type" content="article">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
{jsonld(ld)}
<meta name="google-site-verification" content="fyD6TpguzHdZdrTBret4iJY0QTGLJTJINWPAkpEWC54">
</head>
<body>
{header(src)}

<main class="wrap">
  <section class="hero" aria-labelledby="page-title">
    <p class="crumb"><a href="/">امتثالي</a> / <a href="/providers">دليل المزوّدين المعتمدين</a></p>
    <h1 id="page-title"><span dir="ltr">{esc(dn)}</span>: مزوّد خدمات فوترة إلكترونية معتمد، رقم الاعتماد {acc}</h1>
    <p class="lead">«<span dir="ltr">{esc(name)}</span>» مدرج في قائمة وزارة المالية لمزوّدي خدمات الفوترة الإلكترونية المعتمدين (ASPs) برقم الاعتماد {acc}، وترتيبه {n} من 88 في القائمة المرتبة أبجدياً، كما اطّلعنا عليها في {AS_OF}.</p>
    <p class="note">المصدر: <a href="{MOF_LIST}" rel="noopener">قائمة مزوّدي خدمات الفوترة الإلكترونية المعتمدين، وزارة المالية</a>. آخر مراجعة: {AS_OF}. معلومات إرشادية، وليست توصية بمزوّد ولا استشارة ضريبية.</p>
  </section>

  <section aria-labelledby="s-list">
    <h2 id="s-list">بياناته في القائمة الرسمية</h2>
    <div class="panel"><div class="table-wrap"><table>
      <tbody>
        <tr><th scope="row">الاسم كما في القائمة</th><td dir="ltr">{esc(name)}</td></tr>
        <tr><th scope="row">رقم الاعتماد</th><td class="num">{acc}</td></tr>
        <tr><th scope="row">الموقع المسجّل</th><td>{site_html(n, site)}</td></tr>
        <tr><th scope="row">الترتيب في القائمة</th><td>{n} من 88</td></tr>
      </tbody>
    </table></div></div>{brand_line}
    <p class="note">في القائمة الرسمية أيضاً اسم الموظف المسؤول وبريده وهاتفه، ولا ننقلها هنا؛ تجدها في صفحة الوزارة.</p>
  </section>

  <section aria-labelledby="s-price">
    <h2 id="s-price">ما ينشره عن السعر</h2>
{price_block(n)}
  </section>

  <section aria-labelledby="s-verify">
    <h2 id="s-verify">كيف تتحقق بنفسك؟</h2>
    <ul class="bul">
      <li>افتح <a href="{MOF_LIST}" rel="noopener">قائمة وزارة المالية</a> وابحث عن الاسم أو رقم الاعتماد {acc}.</li>
      <li>تصدر القائمة وفقاً للمادة (13) من القرار الوزاري رقم (168) لسنة 2026، وتقول الوزارة إنها تُحدَّث دورياً بالمعتمدين الجدد وإن ترتيبها أبجدي.</li>
      <li>اطلب أن يُذكر رقم الاعتماد واسم الشركة كما في القائمة في العرض والعقد.</li>
    </ul>
  </section>

{cta(src)}

  <section id="faq" aria-labelledby="s-faq">
    <h2 id="s-faq">أسئلة شائعة</h2>
    <div class="qa">
      <div>
        <h3>{esc(q1).replace(esc(dn), f"<bdi>{esc(dn)}</bdi>")}</h3>
        <p>{esc(a1).replace(esc(name), f"<bdi>{esc(name)}</bdi>")}</p>
      </div>
      <div>
        <h3>{esc(q2).replace(esc(dn), f"<bdi>{esc(dn)}</bdi>")}</h3>
        <p>{esc(a2)}</p>
      </div>
    </div>
  </section>

  <section aria-labelledby="more-title">
    <h2 id="more-title">مزوّدون آخرون في القائمة</h2>
    <ul class="more">
{chr(10).join(nb)}
    </ul>
  </section>

{FOOTER}
</main>
</body>
</html>
"""

def index_page():
    url = f"{SITE}/providers"
    src = "providers"
    title = "مزوّدو خدمات الفوترة الإلكترونية المعتمدون في الإمارات: القائمة الكاملة (88 مزوّداً)"
    desc = (f"دليل المزوّدين المعتمدين لدى وزارة المالية للفوترة الإلكترونية في الإمارات: 88 مزوّداً بأسمائهم وأرقام اعتمادهم ومواقعهم، "
            f"وما ينشره كلٌّ منهم عن السعر، كما اطّلعنا عليها في {AS_OF}.")
    rows = []
    for (n, name, acc, site, slug) in ROWS:
        rows.append(f'        <tr><td class="num">{n}</td><td><a href="/providers/{slug}" dir="ltr">{esc(disp(n, name))}</a></td>'
                    f'<td class="num">{acc}</td><td>{site_html(n, site) if n not in NOLINK else ltr(site)}</td><td>{price_short(n)}</td></tr>')
    pub = []
    for n in sorted(PUBLIC):
        r = ROWS[n - 1]
        _, paras, src_url = PUBLIC[n]
        pub.append(f'      <li><a href="/providers/{r[4]}" dir="ltr">{esc(disp(n, r[1]))}</a> (رقم الاعتماد {r[2]}): {esc(paras[0])} '
                   f'<a href="{esc(src_url)}" rel="nofollow noopener">صفحة الأسعار</a>.</li>')
    faqs = [
        ("كم عدد مزوّدي خدمات الفوترة الإلكترونية المعتمدين في الإمارات؟",
         f"88 مزوّداً في قائمة وزارة المالية لمزوّدي خدمات الفوترة الإلكترونية المعتمدين (ASPs) كما اطّلعنا عليها في {AS_OF}. والقائمة تُحدَّث دورياً بالمعتمدين الجدد."),
        ("أين أجد القائمة الرسمية لمزوّدي الفوترة الإلكترونية المعتمدين؟",
         "في موقع وزارة المالية، صفحة «مزودي خدمات الفوترة الإلكترونية المعتمدين (ASPs)»، وفيها لكل مزوّد رقم اعتماده وموقعه وبيانات التواصل معه."),
        ("هل يعني إدراج المزوّد في القائمة أنه يناسب منشأتي؟",
         "لا. الإدراج يعني أن الوزارة اعتمدته مزوّداً للخدمة، أما الملاءمة فتتوقف على طريقة إصدار فواتيرك ونظامك المحاسبي وعدد فواتيرك والسعر والدعم. قارن العروض قبل التعاقد."),
    ]
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "امتثالي", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "دليل المزوّدين المعتمدين", "item": url}]},
        {"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]}]}
    qa = "\n".join(f"      <div>\n        <h3>{esc(q)}</h3>\n        <p>{esc(a)}</p>\n      </div>" for q, a in faqs)
    return f"""<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} | امتثالي</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
{HEAD_COMMON}
<meta property="og:type" content="article">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
{jsonld(ld)}
<meta name="google-site-verification" content="fyD6TpguzHdZdrTBret4iJY0QTGLJTJINWPAkpEWC54">
</head>
<body>
{header(src)}

<main class="wrap">
  <section class="hero" aria-labelledby="page-title">
    <p class="crumb"><a href="/">امتثالي</a> / <a href="/#guides">الدليل</a></p>
    <h1 id="page-title">مزوّدو خدمات الفوترة الإلكترونية المعتمدون في الإمارات: 88 مزوّداً</h1>
    <p class="lead">تضم قائمة وزارة المالية لمزوّدي خدمات الفوترة الإلكترونية المعتمدين (ASPs) 88 مزوّداً، كما اطّلعنا عليها في {AS_OF}. هنا كل مزوّد باسمه الرسمي ورقم اعتماده وموقعه المسجّل، وما ينشره عن السعر، مع صفحة لكل منهم.</p>
    <ul class="facts">
      <li><strong>88</strong> مزوّداً معتمداً</li>
      <li>القائمة وفقاً للمادة (13) من <strong>القرار الوزاري 168 لسنة 2026</strong></li>
      <li>اطّلعنا على القائمة في <strong>{AS_OF}</strong></li>
    </ul>
    <p class="note">المصدر: <a href="{MOF_LIST}" rel="noopener">قائمة مزوّدي خدمات الفوترة الإلكترونية المعتمدين، وزارة المالية</a>، وتقول الوزارة إنها تُحدَّث دورياً بالمعتمدين الجدد وإن ترتيبها أبجدي. آخر مراجعة: {AS_OF}. لا نقل لأسماء الموظفين ولا لبريدهم ولا لهواتفهم.</p>
  </section>

  <section aria-labelledby="s-all">
    <h2 id="s-all">القائمة كاملة</h2>
    <p>بترتيب القائمة الرسمية. اسم المزوّد يفتح صفحته في الدليل، وعمود السعر مما وجدناه على موقعه عند فحصنا في 17 و18 نوفمبر 2026.</p>
    <div class="panel"><div class="table-wrap"><table style="min-width:760px">
      <thead><tr><th class="num">#</th><th>المزوّد (الاسم كما في القائمة)</th><th class="num">رقم الاعتماد</th><th>الموقع المسجّل</th><th>السعر العلني</th></tr></thead>
      <tbody>
{chr(10).join(rows)}
      </tbody>
    </table></div></div>
  </section>

  <section aria-labelledby="s-public">
    <h2 id="s-public">أسعار منشورة علناً تحققنا منها في {AS_OF}</h2>
    <p>قرأنا في {AS_OF} صفحات الأسعار كاملة لأربعة مزوّدين يعرضون أسعار خدمتهم في الإمارات علناً. وتجد أمثلة لأسعار Tally وWafeq وZoho Books في <a href="/#compare">المفاضلة بالصفحة الرئيسية</a>.</p>
    <ul class="bul">
{chr(10).join(pub)}
    </ul>
    <p class="note">الأسعار كما تعرضها صفحات المزوّدين، وقد تتغيّر، ولا نضيف إليها ما لم تذكره عن الضريبة. التفاصيل في صفحة كل مزوّد.</p>
  </section>

  <section aria-labelledby="s-use">
    <h2 id="s-use">كيف تستخدم القائمة؟</h2>
    <ul class="bul">
      <li>تحقق من أن مزوّدك في القائمة باسمه ورقم اعتماده قبل أن توقّع، واطلب ذكرهما في العرض والعقد.</li>
      <li>الإدراج اعتماد من الوزارة، لا توصية بمنتج بعينه؛ قارن السعر السنوي الكامل وطريقة الربط بنظامك والدعم.</li>
      <li>أغلب المزوّدين لا يعرضون سعراً علنياً، فاطلب عروضاً مكتوبة من أكثر من مزوّد.</li>
    </ul>
  </section>

{cta(src)}

  <section id="faq" aria-labelledby="s-faq">
    <h2 id="s-faq">أسئلة شائعة</h2>
    <div class="qa">
{qa}
    </div>
  </section>

  <section aria-labelledby="more-title">
    <h2 id="more-title">اقرأ أيضاً</h2>
    <ul class="more">
      <li><a href="/accredited-service-provider"><b>ما مزوّد الخدمة المعتمد؟</b><span>وهل تستطيع الربط من دونه؟</span></a></li>
      <li><a href="/choose-provider"><b>كيف تختار مزوّدك؟</b><span>اعتبارات وزارة المالية قبل التعاقد</span></a></li>
      <li><a href="/appoint-asp"><b>تعيين المزوّد</b><span>الخطوات والموعد</span></a></li>
      <li><a href="/readiness-check"><b>مدقق الجاهزية</b><span>هل منشأتك جاهزة للفوترة الإلكترونية؟</span></a></li>
    </ul>
  </section>

{FOOTER}
</main>
</body>
</html>
"""

def write_page(out, rel, text):
    p = os.path.join(out, rel)
    os.makedirs(os.path.dirname(p) or out, exist_ok=True)
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    return p

def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "out"
    assert len(ROWS) == 88 and [r[0] for r in ROWS] == list(range(1, 89))
    assert len({r[4] for r in ROWS}) == 88 and len({r[2] for r in ROWS}) == 88
    cover = NONE_17 | NONE_18 | set(UNREAD) | COMPARE_PRICED | KSA_ONLY | RESTRICTED | set(PUBLIC)
    assert cover == set(range(1, 89)), sorted(set(range(1, 89)) - cover)
    files = {"providers.html": index_page()}
    for i in range(len(ROWS)):
        files[f"providers/{ROWS[i][4]}.html"] = provider_page(i)
    urls = [f"{SITE}/providers"] + [f"{SITE}/providers/{r[4]}" for r in ROWS]
    files["sitemap-providers.xml"] = ("<!-- 89 عنواناً تُدمج في sitemap.xml -->\n" +
        "\n".join(f"  <url><loc>{u}</loc><lastmod>{AS_OF_ISO}</lastmod></url>" for u in urls) + "\n")
    man = []
    for rel, text in files.items():
        write_page(out, rel, text)
        man.append(f"{hashlib.sha256(text.encode('utf-8')).hexdigest()}  {rel}")
    write_page(out, "MANIFEST.txt", "\n".join(man) + "\n")
    print(f"wrote {len(files)} files to {out}")

if __name__ == "__main__":
    main()
