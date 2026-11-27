#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
امتثالي — البند 3 في «طابور البناء»: دليل مزوّدي خدمات الفوترة الإلكترونية المعتمدين (N = len(ROWS) مزوّداً؛ 90 منذ البند 92).
أعدّه وكيل البناء في 18 نوفمبر 2026 (نحو 09:00 بتوقيت دبي). بلا اعتماديات: python3 هذا_الملف [مجلد_الإخراج]

يكتب:
  providers.html                 → https://emtithali.com/providers        (فهرس الدليل)
  providers/<slug>.html          → https://emtithali.com/providers/<slug> (N صفحة)
  sitemap-providers.xml          → N + 1 عنواناً تُدمج في sitemap.xml
  MANIFEST.txt                   → SHA-256 لكل ملف
إن كان اصطلاح المستودع <slug>/index.html فغيّر write_page() وحدها؛ الروابط الداخلية بلا شرطة أخيرة.

التحقق في هذا التشغيل (18 نوفمبر 2026، من تبويب وكيل البناء في المتصفح المدمج على الجهاز):
- القائمة الرسمية: https://mof.gov.ae/ar/about-us/initiatives/einvoicing/einvoicing-accredited-service-providers-asps/
  (الرابط القديم .../pre-approved-einvoicing-service-providers/ يحوّل إليه). جدول واحد، 88 صفاً، تذييل «آخر تحديث في 17/11/2026 20:27».
  بصمة الأعمدة الأربعة الأولى (# والاسم ورقم الاعتماد والموقع، مسافات مطبّعة، صف لكل مزوّد بفاصل TAB وسطر أخير فارغ):
  SHA-256 = 524a6f8939c0604ec18b7a2a502cf80868370bf1232aec57a5eaba8bd09b0691 (5,331 بايت، 88 صفاً، 23 نوفمبر 2026)؛ والبصمة الحالية LIST_SHA256 أدناه (البند 92).
  (وفي 18 نوفمبر 2026: 0c681df77f15a914b1b328b85886edc4e41b585f3d640a18ab323fb625349eac، 5,332 بايت؛ الفرق اسم الصف 17، انظر «إعادة المطابقة» أدناه.)
  مقطع البصمة (يُشغَّل في تبويب على صفحة القائمة قبل النشر؛ إن اختلف الناتج فلا نشر قبل تحديث ROWS):
    const rows=[...document.querySelectorAll('table tr')].slice(1).map(tr=>[...tr.querySelectorAll('td')].slice(0,4).map(c=>c.innerText.replace(/\\s+/g,' ').trim()).join('\\t'));
    const s=rows.join('\\n')+'\\n'; const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));
    [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')
  تنبيه (البند 70، 24 نوفمبر 2026): «آخر تحديث في …» في تذييل صفحات mof.gov.ae ختم عام لموقع الوزارة كله لا تاريخ القائمة
  (يوم 24 نوفمبر كان «23/11/2026 15:10» في صفحة القائمة وفي الرئيسية العربية معاً، ووسم article:modified_time لصفحة القائمة
  2026-11-19T11:44:33+00:00)، فالتذييلات المذكورة أدناه سجلّ قراءة لا تاريخ للقائمة، ولا يُنقل أيٌّ منها إلى صفحة؛ وتغيّر القائمة
  يُعرف بهذه البصمة وحدها (بقيت 524a6f89…0691 بـ5,331 بايتاً و88 صفاً يوم 24 نوفمبر 2026، تبويب وكيل البناء).
- الأسعار العلنية الأربعة قُرئت نصاً كاملاً في المتصفح في التشغيل نفسه: Azdan وFynamics وAiverix وTronStride (روابطها في PUBLIC).
- الروابط: 88 موقعاً كما طُبعت بـhttps:// فُحصت بطلب no-cors من المتصفح؛ ستة لم تفتح (NOLINK) فتُعرض نصاً بلا رابط.
- «لا سعر علني» و«لم يُقرأ» من مسح حلقة العمل المستمر في 17 و18 نوفمبر 2026 (ملفات data-item3-* في المشروع)، بتاريخ كل فحص.

إعادة التحقق قبل النشر (الوكيل المفوَّض، 18 نوفمبر 2026 بين 19:10 و19:21 دبي، المتصفح المدمج):
- بصمة القائمة: 88 صفاً، 5,332 بايت، SHA-256 نفسها 0c681df7…49eac (تذييلها صار «آخر تحديث في 18/11/2026 13:57»).
- Azdan وFynamics وTronStride: الأرقام كما هي. Aiverix غيّرت صفحة أسعارها بعد قراءة الصباح: الترخيص صار 75 درهماً شهرياً
  بالدفع السنوي (900 سنوياً) أو 90 شهرياً، ويشمل 1,000 معاملة، فحُدّث PUBLIC[54] من الصفحة الحالية. وعرض «حتى 30 نوفمبر»
  (69 بدل 89) اختفى من الصفحة، ولا نص فيها عن عرض مؤقت؛ وعبارة «AED, excluding 5% VAT» ما زالت فيها.

إعادة المطابقة (وكيل البناء، 23 نوفمبر 2026 نحو 13:55 دبي، تبويب في المتصفح المدمج؛ البند 65 في «طابور البناء»):
- MOF_LIST: جدول واحد، 88 صفاً، تذييل «آخر تحديث في 21/11/2026 19:10»، ونصها «وفقاً للمادة (13) من القرار الوزاري رقم (168) لسنة 2026».
- بصمة الأعمدة الأربعة بالمقطع أعلاه: 5,331 بايت، SHA-256 = 524a6f89…0691. والفرق الوحيد عن ROWS السابقة الصف 17:
  «Cygnet Digital IT Solution L.L.C» وكان «Cygnet Digital IT Solutions L.L.C»، ورقم الاعتماد 101139 والموقع كما هما؛ فحُدّث ROWS[17]
  فطابقت ROWS البصمة بايتاً ببايت. وتواريخ القائمة في الفهرس وفي صفحة الصف 17 صارت LIST_AS_OF، وبقيت الأسعار والروابط بتواريخ فحصها.

البند 92 (وكيل البناء، 27 نوفمبر 2026 نحو 13:56 دبي، تبويبه في المتصفح المدمج على الجهاز): صارت القائمة 90 صفاً.
- MOF_LIST: جدول واحد، 90 صفاً (قراءة 09:56:06Z)؛ ومقطع البصمة يعطي 5,438 بايتاً وSHA-256 = 1d51908f…aa55 (LIST_SHA256)، وROWS أدناه
  تطابقها بايتاً ببايت. الجديد صفّان: 1 «Abcore Technology - L.L.C - S.P.C» (127761، www.abcore.ae) و86 «Web Masters LLC» (169664،
  www.webmasterstech.com)، ولا تغيير في اسم أو رقم أو موقع أي صف آخر؛ فزاد ترتيب 84 صفاً واحداً وأربعة (Webtel وYoung Global وZennovate
  وZoho) اثنين. وتذييل الصفحة «آخر تحديث في 27/11/2026 13:20» ختم عام (البند 70) لا تاريخ إضافة، فلا يُكتب متى أضافتهما الوزارة.
- رابطا الجديدين فتحا بطلب no-cors من المتصفح (09:58:42Z)، فلا يدخلان NOLINK؛ ولم نراجع موقعيهما بحثاً عن سعر (NEW_UNREVIEWED).
- المجموعات (NOLINK وBRAND وNONE_* وUNREAD وPUBLIC وSHEET …) صارت بالـslug عبر by_slug، والعدد N = len(ROWS) في كل نص مولّد،
  وتاريخ القائمة LIST_AS_OF لكل الصفحات لأن ترتيب كل صف وعدد القائمة تغيّرا. والعدد في الصفحات المكتوبة يدوياً يفحصه
  tests/provider-count.test.mjs ضمن npm test مقابل عدد ملفات site/providers/*.html.

البند 77 (مصنع الوكلاء، 25 نوفمبر 2026): أسعار Casim Studio للصف 10 من ورقة أرسلها المزوّد وأذن بعرضها كما هي (SHEET أدناه)،
فتغيّر ناتج providers/casim.html وproviders.html وحدهما (الصفحات الـ87 الأخرى مطابقة بايتاً لما قبله)، وlastmod الاثنتين 2026-11-25.
"""
import hashlib, html, json, os, sys

AS_OF = "18 نوفمبر 2026"
AS_OF_ISO = "2026-11-18"
LIST_AS_OF = "27 نوفمبر 2026"  # آخر قراءة ومطابقة للأعمدة الأربعة للقائمة كلها (البند 92، وقبله 23 نوفمبر للبند 65): تاريخ القائمة في كل الصفحات
LIST_AS_OF_ISO = "2026-11-27"  # lastmod صفحات الدليل في الخريطة (تغيّر ترتيب كل صف وعدد القائمة)
# بصمة الأعمدة الأربعة للقائمة يوم LIST_AS_OF بمقطع البصمة أعلاه (90 صفاً، 5,438 بايتاً)؛ main() تتوقف إن لم تطابقها ROWS
LIST_SHA256 = "1d51908fa39b59e6dbd6de1d9a22e7702b6569c5c032d8ba04a512ca72f3aa55"
SITE = "https://emtithali.com"
MOF_LIST = "https://mof.gov.ae/ar/about-us/initiatives/einvoicing/einvoicing-accredited-service-providers-asps/"
MOF_EINV = "https://mof.gov.ae/ar/about-ministry/mof-initiatives/einvoicing/"

# (#, الاسم كما في القائمة, رقم الاعتماد, الموقع كما طُبع, slug)
ROWS = [
(1,"Abcore Technology - L.L.C - S.P.C","127761","www.abcore.ae","abcore"),
(2,"Advintek Consulting Services LLC","196766","www.einvoice.advintek.ae","advintek"),
(3,"Amazon Web Services EMEA SARL (Branch)","165787","www.aws.amazon.com","aws"),
(4,"Ardentax IT Solutions - FZCO","189050","www.ardentaxit.tax","ardentax"),
(5,"Avalara Gulf Technologies LLC","134809","www.avalara.com","avalara"),
(6,"Azdan Business Analytics","147900","www.azdan.com","azdan"),
(7,"Azentio Software Orion (Middle East) FZ-LLC","141846","www.azentio.com","azentio"),
(8,"BBIT Accqrate Technology FZCO","101071","www.bbit-accqrate.com/ae/en","accqrate"),
(9,"BDO Digital Solutions FZ-LLC","185520","www.bdo.ae/en-gb/home","bdo"),
(10,"Bee Aura Tech FZ LLC","179804","www.bauratec.com","bee-aura-tech"),
(11,"Casim L.L.C-FZ","178533","www.casim.ae","casim"),
(12,"Chaturvedi Software House L.L.C","104596","www.fincore.solutions","fincore"),
(13,"Citytech Software DMCC","164921","www.citytechme.com","citytech"),
(14,"Cloud Consulting LLC-FZ (DocFlow)","181172","www.docflow.ae","docflow"),
(15,"Comarch Middle East FZ LLC","110668","www.comarch.com/trade-and-services/data-management/e-invoicing","comarch"),
(16,"Complyance Electronics L.L.C","112219","www.complyance.io","complyance"),
(17,"Covoro AI – FZCO","142208","www.covoro.ai/uae","covoro"),
(18,"Cygnet Digital IT Solution L.L.C","101139","www.cygnet.one","cygnet"),
(19,"Dariba Technologies LLC","158550","www.daribatech.com","dariba"),
(20,"Data Hub Integrated Solutions Moro LLC","129478","www.morohub.com/en","morohub"),
(21,"Defmacro Software DMCC (ClearTax)","163162","www.cleartax.com/ae","cleartax"),
(22,"Deloitte & Touche - M E","123513","www.deloitte.com/middle-east/en.html","deloitte"),
(23,"Dofort Biztech L.L.C","187633","www.doforttech.com","dofort"),
(24,"DP World Digital GCC FZE","117846","www.einvoicing.dpworld.com/home","dp-world"),
(25,"Ecosio Emea Information Technology Services - FZCO","132670","www.ecosio.com","ecosio"),
(26,"EDICOM Middle East Services","102434","www.edicomgroup.com","edicom"),
(27,"ELITE COMPUTER SYSTEMS AND SOFTWARE DESIGNING - L.L.C","125617","www.eliteitdesign.com","elite-computer-systems"),
(28,"EY Consulting LLC","165308","www.ey.com/en_gl/services/tax/e-invoicing-solution","ey"),
(29,"Flick Network L.L.C","138271","www.flick.network/en","flick"),
(30,"Focus Softnet","134577","www.focussoftnet.com","focus-softnet"),
(31,"Fonoa Gulf Technology Services LLC","149104","www.fonoa.com","fonoa"),
(32,"Fyient Line Technology","158998","www.fyient.com","fyient"),
(33,"Fynamics Techno Solutions – FZCO","159905","www.fynamicstax.com/uae","fynamics"),
(34,"Gaambit Global Audit & Advisory Services LLC","104125","www.gaambitglobal.com","gaambit"),
(35,"Global Experts of Information Technology Consultants","160689","www.global-experts.co.uk","global-experts"),
(36,"GSS Management Consultancy","167585","www.gssmcgulf.com","gss"),
(37,"Hamt Information Technology L.L.C (EVATRA)","144576","www.hlbhamt.com","hamt-evatra"),
(38,"Hamwi Computer Software","131375","www.fatorly.com","fatorly"),
(39,"Infinite IT Solutions FZCO","171157","www.infinite-it.com","infinite-it"),
(40,"Infocus Technologies L.L.C-FZ","154195","www.infocustechnologiesllcfz.com","infocus"),
(41,"Information Dynamics LLC","187021","www.infodynamic.net","information-dynamics"),
(42,"InvoiceNow biz - F.Z.C","184465","www.invoicenow.biz","invoicenow"),
(43,"InvoiceQ For Information Technology Limited","114413","www.ae.invoiceq.com","invoiceq"),
(44,"KASA Advisory Services","153288","www.kasaadvisory.com","kasa"),
(45,"KGRN Chartered Accountants","120915","www.kgrnaudit.com","kgrn"),
(46,"KPI Suitetech DMCC","142349","www.kpi.co","kpi-suitetech"),
(47,"LightIdea Information Technology L.L.C","111062","www.lightidea.org","lightidea"),
(48,"Mac & Ross Chartered Accountants LLC","130476","www.macnross.com","mac-ross"),
(49,"Marmin AI Software Design LLC","160945","www.marmin.ai","marmin"),
(50,"McBitss Technologies CO LLC SOC","143578","www.mcbitss.com","mcbitss"),
(51,"Microvista Technologies LLC","157529","www.microvistatech.com/e-invoicing-in-uae","microvista"),
(52,"Moore JFC Consulting LLC","158006","www.moorejfcgroup.com","moore-jfc"),
(53,"Namiri Technology Services L.L.C","104802","www.digitax.tech","namiri"),
(54,"New Age Software Limited","100511","www.newage-global.com","newage"),
(55,"Osmena Information Technology L.L.C","147777","www.aiverix.ae","aiverix"),
(56,"Orchida Soft Computer Systems LLC","194498","www.orchidatax.com/country-compliance/uae/","orchida"),
(57,"Oxinus Holding Limited","198978","www.oxinus.holdings","oxinus"),
(58,"PACT Software Services LLC","129353","www.pactsoft.com","pact"),
(59,"Pagero Gulf FZ-LLC","153759","www.pagero.com","pagero"),
(60,"Platform ACube Technologies LLC (A-Cube)","188961","www.acubeapi.com/en/uae","a-cube"),
(61,"Qvalia Technologies","193458","www.qvalia.com","qvalia"),
(62,"Ravera EInvoicing Services - FZCO","199307","www.ravera.ae","ravera"),
(63,"Resilience Tax Consultant LLC","197640","www.resilienceuae.com","resilience"),
(64,"RTC Novatech Solutions","139410","www.rtcsuite.com","rtc-novatech"),
(65,"SAP Middle East & North Africa LLC","197202","www.sap.com/index.html","sap"),
(66,"Samsotech LLC","192161","www.samsotech-id.com","samsotech"),
(67,"Skill Quotient Technologies","193219","www.skillquotientgroup.com","skill-quotient"),
(68,"SNB Accounting Management & Tax Consultancy LLC","192393","www.snbconsulting.ae","snb"),
(69,"Spendconsole FZ LLC","152306","www.spendconsole.ai","spendconsole"),
(70,"SunTec (Xelerate) Business Solutions DMCC","180240","www.suntecgroup.com/suntec-e-invoicing","suntec-xelerate"),
(71,"Suntech Business Solutions DMCC","106799","www.suntech-global.com","suntech"),
(72,"Tally Software Solutions FZCO","162503","www.tallysolutions.com","tally"),
(73,"TAXILLA FINOPS 360 – FZCO","128546","www.taxilla.com","taxilla"),
(74,"Tax Star L.L.C-FZ","175257","www.taxstar.app","tax-star"),
(75,"Taxlabs.ai","166926","www.taxlab.ai","taxlabs"),
(76,"Techventures Information Technology Services","105700","www.techventuresglobal.com","techventures"),
(77,"TronStride FZC","182493","www.tronstride.com","tronstride"),
(78,"UHY James Advisory LLC","148957","www.uhy-ae.com","uhy-james"),
(79,"Unified SSK Information Technology L.L.C","163006","www.unifiedssk.com","unified-ssk"),
(80,"UTC Information Technology Network Services Co. L.L.C.","185561","www.eand.com/en/etisalat-enterprise.html","utc-information-technology"),
(81,"VATit Consultant Gulf Ltd","106062","www.eezi.io","vatit"),
(82,"Veutel International FZC LLC","149302","www.veutel.com","veutel"),
(83,"Victorian Fin Technology L.L.C","126326","www.victorianuae.com","victorian"),
(84,"Vostok Trading LLC","194753","www.vostok.ae","vostok"),
(85,"Wafeq FZ-LLC","129932","www.wafeq.com/en-ae","wafeq"),
(86,"Web Masters LLC","169664","www.webmasterstech.com","web-masters"),
(87,"Webtel Technologies solutions- FZCO","133108","www.webtel.in","webtel"),
(88,"Young Global Technologies L.L.C-FZ","193284","www.youngglobal.co","young-global"),
(89,"Zennovate IT Solutions","116145","www.zennovatesystems.com","zennovate"),
(90,"Zoho Software Trading LLC","121988","www.zoho.com","zoho"),
]

N = len(ROWS)  # عدد المزوّدين في القائمة يوم LIST_AS_OF؛ منه وحده كل «N مزوّداً» و«من N» في الصفحات المولّدة (البند 92)
NUM = {r[4]: r[0] for r in ROWS}  # الترتيب في القائمة لكل slug؛ المجموعات أدناه بالـslug فلا يفسدها إدراج مزوّد جديد


def by_slug(*slugs):
    return {NUM[x] for x in slugs}

# روابط لم تفتح من المتصفح في 18 نوفمبر 2026 (طلبان متتاليان): تُعرض نصاً كما طُبعت بلا رابط.
NOLINK = by_slug("accqrate", "dp-world", "invoiceq", "pact", "samsotech", "taxlabs")

# اسم تجاري يظهر بجانب الاسم الرسمي: من موقع المزوّد المسجّل في القائمة.
BRAND = {NUM["aiverix"]: "Aiverix", NUM["fatorly"]: "Fatorly"}

# تاريخ فحص حلقة العمل المستمر لكل مزوّد بلا سعر علني (17 أو 18 نوفمبر 2026)
D17, D18 = "17 نوفمبر 2026", "18 نوفمبر 2026"
D168 = "https://mof.gov.ae/wp-content/uploads/2026/10/Ministerial-Decision-No-168-of-2026-on-Eligibility-criteria-and-Accreditation-Procedure-AR-FINAL.pdf"  # البند 40: رابط القرار 168 في فهرس الدليل
# InvoiceQ (42): صفحة الباقات https://ae.invoiceq.com/packages/ قُرئت 20 نوفمبر 2026 (البند 39): باقتان «Custom Pricing» بلا سعر منشور
D20 = "20 نوفمبر 2026"
NONE_20 = by_slug("invoiceq")
NONE_17 = by_slug("docflow", "fatorly", "tax-star", "cleartax", "flick", "vatit", "covoro", "marmin", "taxlabs", "microvista", "ravera", "infinite-it", "namiri")  # casim انتقل إلى SHEET في البند 77
NONE_18 = by_slug("advintek", "bee-aura-tech", "fincore", "cygnet", "dariba", "dofort", "elite-computer-systems", "focus-softnet", "fyient", "global-experts", "hamt-evatra", "infocus", "information-dynamics", "invoicenow", "kpi-suitetech", "orchida", "oxinus", "pact", "a-cube", "resilience", "rtc-novatech", "samsotech", "skill-quotient", "snb", "spendconsole", "suntec-xelerate", "taxilla", "techventures", "veutel", "victorian", "vostok", "webtel", "young-global", "zennovate", "avalara", "pagero", "comarch", "ecosio", "edicom", "fonoa", "newage", "suntech", "azentio", "sap", "aws", "utc-information-technology", "bdo", "deloitte", "ey", "gaambit", "gss", "kasa", "kgrn", "mac-ross", "moore-jfc", "uhy-james")
UNREAD = {n: D18 for n in by_slug("ardentax", "accqrate", "morohub", "lightidea", "mcbitss", "unified-ssk", "dp-world")}
# البند 92: مزوّدان أضفناهما إلى الدليل يوم قراءة القائمة LIST_AS_OF، ولم نراجع موقعيهما بحثاً عن سعر منشور
NEW_UNREVIEWED = by_slug("abcore", "web-masters")
COMPARE_PRICED = by_slug("tally", "wafeq", "zoho")          # أمثلة أسعارهم في #compare بالرئيسية (منقولة 10 نوفمبر 2026)
ON_COMPARE = by_slug("tally", "wafeq", "zoho", "cleartax", "fatorly", "flick", "invoiceq")
KSA_ONLY = by_slug("complyance")
RESTRICTED = by_slug("citytech", "qvalia")

# أسعار علنية قُرئت في المتصفح في 18 نوفمبر 2026. (ملخص الفهرس، فقرات الصفحة، رابط المصدر)
PUBLIC = {
 NUM["azdan"]: ("مجانية حتى 120 مستنداً سنوياً لحساب واحد؛ 948 درهماً سنوياً لكل حساب لحسابين فأكثر",
     ["الباقة المجانية: حساب واحد في «إمارات تاكس» حتى 120 مستنداً في السنة، بلا بطاقة ائتمان.",
      "لحسابين فأكثر: 948 درهماً في السنة لكل حساب، تشمل 1,200 مستند لكل حساب. وأول حزمة إضافية 600 مستند سنوياً بـ200 درهم.",
      "الاشتراك سنوي، والتأسيس وإعداد الحساب القياسيان بلا رسوم، وبرمجة ERP الخاصة والربط المخصّص تُسعَّر منفصلة.",
      "لا تذكر الصفحة هل الأسعار شاملة ضريبة القيمة المضافة."],
     "https://www.azdan.com/uae-einvoice/pricing"),
 NUM["fynamics"]: ("من 4,500 درهم سنوياً، دون ضريبة القيمة المضافة",
     ["من 4,500 درهم في السنة، بشرائح تتدرّج مع عدد الفواتير، وتُحتسب على مستوى الحساب، دون ضريبة القيمة المضافة.",
      "التسعير سنوي ويسري على كل الباقات، ويُضاف رسم تأسيس لمرة واحدة لا تذكر الصفحة مبلغه، وللمؤسسات «تواصل للسعر»."],
     "https://www.fynamicstax.com/uae"),
 NUM["aiverix"]: ("ترخيص 75 درهماً شهرياً لكل رقم تسجيل ضريبي بالدفع السنوي (900 درهم سنوياً) يشمل 1,000 معاملة، دون ضريبة القيمة المضافة",
     ["الترخيص: 75 درهماً شهرياً لكل رقم تسجيل ضريبي (TRN) بالدفع السنوي، أي 900 درهم في السنة، أو 90 درهماً شهرياً بالدفع الشهري، ويشمل 1,000 معاملة مرسلة ومستلمة في السنة وشركة واحدة (TIN) ومستخدمَين، وكل شركة أو مستخدم إضافي بـ49 درهماً شهرياً.",
      "حزم معاملات إضافية تُدفع سنوياً: 500 بـ140 درهماً، و1,000 بـ250، و2,000 بـ500، و5,000 بـ1,100، و10,000 بـ2,000. وباقة Micro لـ100 معاملة في السنة وشركة واحدة ومستخدم واحد بـ588 درهماً سنوياً، وفوق 10,000 معاملة عرض للمؤسسات من 0.20 درهم للمستند.",
      "التأسيس والتدريب اختياريان بـ200 درهم لكل موقع (لثلاثة مواقع أو أربعة مستخدمين فأكثر)، وربط ERP يُسعَّر منفصلاً، والدعم المميز اختياري بـ150 درهماً شهرياً لكل شركة (TIN).",
      "الأسعار بالدرهم دون ضريبة القيمة المضافة 5%."],
     "https://aiverix.ae/pricing"),
 NUM["tronstride"]: ("مجانية حتى 100 مستند سنوياً، ثم من 1,470 درهماً سنوياً (500 مستند)",
     ["الباقة المجانية: 100 مستند في السنة لكيان واحد (رقم تسجيل ضريبي واحد).",
      "الباقات السنوية: Startup بـ1,470 درهماً (500 مستند)، وEssential بـ2,205 (1,200 مستند)، وBusiness بـ4,410 (3,000)، وBusiness Pro بـ11,025 (12,000)، وEnterprise بـ17,640 (24,000)، وEnterprise Plus بـ26,460 (60,000)، وCorporate بـ39,690 (120,000)، وفوقها باقات للكميات الكبيرة بالتواصل.",
      "التأسيس الذاتي مجاني، والتأسيس مع التدريب 1,500 دولار للكيان و500 دولار لكل كيان إضافي، ورسوم ربط ERP منفصلة. وتعلن الصفحة سعر صرف ثابتاً: الدولار بـ3.675 درهم.",
      "لا تذكر الصفحة هل الأسعار شاملة ضريبة القيمة المضافة."],
     "https://www.tronstride.com/pricing/"),
}

# البند 77 (مصنع الوكلاء، 25 نوفمبر 2026): أسعار من ورقة أرسلها المزوّد إلينا وأذن كتابةً بعرضها كما هي. ليست أسعاراً علنية (موقعه
# لا يعرضها)، فلا يدخل صاحبها قسم «أسعار منشورة علناً» ويبقى عدّه أربعة. Casim (10): الورقة «Casim - eInvoicing Pricing Studio.pdf»
# المرجع CAS-PRC-STU-V1.3 (3 صفحات) في رسالته 25 نوفمبر 2026 12:04 دبي، والإذن في رسالته 11:10 دبي («you may show our standard
# Casim Studio prices … taken from our current pricing sheet without changes»)، وموقعه casim.ae بلا أسعار عند فحصنا 25 نوفمبر 2026؛
# والنص الحرفي في مستند المشروع claude/build-queue/verified-casim-studio-pricing-2026-11-25.md. لا يوصف «شريكاً» ولا يُعرض شعاره.
# وخصم السنة الأولى 10% لا يُعرض: هو لعملاء الإحالة باتفاقية لم توقَّع ولم نبدأ الإحالة؛ يُضاف بعد التوقيع على الاشتراك لا التأسيس.
D25 = "25 نوفمبر 2026"
CASIM_REF = "CAS-PRC-STU-V1.3"
# (الباقة، المستندات في السنة، الاشتراك السنوي، التأسيس لمرة واحدة لكيان واحد) بالدرهم دون ضريبة القيمة المضافة، من الورقة
CASIM_PLANS = [
    ("Studio Free", None, 0, 1000),
    ("Studio 250", 250, 850, 1000),
    ("Studio 500", 500, 1450, 1000),
    ("Studio 1,000", 1000, 2250, 1000),
    ("Studio 1,500", 1500, 2900, 1500),
    ("Studio 2,500", 2500, 3600, 1500),
    ("Studio 5,000", 5000, 5200, 1500),
    ("Studio 10,000", 10000, 8200, 1500),
]
REVIEWED = {}  # «آخر مراجعة» لصفحة تغيّر فيها غير بيانات القائمة بعد آخر قراءة لها؛ كان casim ‏25 نوفمبر، وأُعيدت قراءة القائمة كلها بعده (البند 92)

def fmt(x): return f"{x:,}"

def casim_short():
    paid = min(s for _, d, s, _ in CASIM_PLANS if s)
    setup = min(t for *_, t in CASIM_PLANS)
    return (f'لا سعر علني في موقعه؛ ورقة أسعار أرسلها إلينا وأذن بعرضها ({D25}): <bdi>Studio Free</bdi> بلا اشتراك، '
            f'وباقات من {fmt(paid)} درهماً سنوياً، وتأسيس من {fmt(setup)} درهم، دون ضريبة القيمة المضافة '
            f'(<a href="/providers/casim#s-price">التفاصيل</a>)')

def casim_block():
    trs = []
    for p, d, s, t in CASIM_PLANS:
        dc = '<td>100 مجاناً لكل كيان</td>' if d is None else f'<td class="num">{fmt(d)}</td>'
        sc = '<td>بلا اشتراك</td>' if s == 0 else f'<td class="num">{fmt(s)}</td>'
        trs.append(f'        <tr><td><bdi>{p}</bdi></td>{dc}{sc}<td class="num">{fmt(s + t)}</td></tr>')
    return f"""    <p>لا يعرض المزوّد سعراً علنياً في موقعه (اطّلعنا عليه في {D25})، لكنه أرسل إلينا ورقة أسعار خدمة <bdi>Casim Studio</bdi> وأذن كتابةً بعرضها كما هي (المرجع <bdi>{CASIM_REF}</bdi>، وصلتنا في {D25}). والأسعار أدناه منها، بالدرهم دون ضريبة القيمة المضافة، وقد تتغيّر.</p>
    <p>وتصف الورقة <bdi>Casim Studio</bdi> بأنها بوابة لإصدار الفواتير الإلكترونية يدوياً أو رفعها دفعةً واحدة، فيها لوحات وتقارير وأرشيف، ترسل الفواتير وتستلمها عبر شبكة Peppol وتبلّغ بها الهيئة الاتحادية للضرائب، بلا ربط بنظامك ولا مشروع تنفيذ، ومعها دعم في ساعات العمل.</p>
    <div class="panel"><div class="table-wrap"><table>
      <thead><tr><th>الباقة</th><th>المستندات في السنة</th><th>الاشتراك السنوي</th><th>أول سنة مع التأسيس</th></tr></thead>
      <tbody>
{chr(10).join(trs)}
      </tbody>
    </table></div></div>
    <ul class="bul">
      <li>المستند: كل فاتورة أو إشعار دائن أو مدين يُرسل أو يُستلم.</li>
      <li><bdi>Studio Free</bdi> بلا رسوم سنوية: لكل كيان 100 مستند مجاناً في السنة، تُحتسب ضمن حصة الباقة في الباقات الأخرى؛ فإن لم تتجاوزها فرسوم التأسيس كل ما تدفعه، وبعد استنفادها تنتقل إلى <bdi>Studio 250</bdi> بالتناسب.</li>
      <li><bdi>Studio 250</bdi> و500 و1,000 لكيان واحد، و<bdi>Studio 1,500</bdi> فما فوق حتى ثلاثة كيانات؛ وكل كيان إضافي بـ600 درهم في السنة ومعه حصته المجانية.</li>
      <li>رسوم التأسيس لمرة واحدة: 1,000 درهم لكيان واحد على <bdi>Studio Free</bdi> أو 250 أو 500 أو 1,000، و1,500 درهم لكيانين أو ثلاثة أو على <bdi>Studio 1,500</bdi> فما فوق، وتغطي حتى ثلاثة كيانات.</li>
      <li>الفوترة سنوية مقدّماً، والانتقال إلى باقة أعلى وإضافة كيان خلال السنة بالتناسب.</li>
      <li>لا تتوقف الخدمة عند بلوغ الحصة: في <bdi>Studio Free</bdi> و250 و500 و1,000 تنتقل إلى الباقة التالية من يومها بالتناسب، ومن <bdi>Studio 1,500</bdi> فما فوق تُحسب المستندات الإضافية كتلاً من 100 مستند بسعر باقتك (70 درهماً للكتلة في 1,500، و65 في 2,500، و60 في 5,000، و40 في 10,000)، تُعدّ كل ربع سنة وتُفوتر بعده.</li>
      <li>فوق 10,000 مستند في السنة: 0.40 درهم للمستند حتى 100,000 مستند، وما فوقها بالتواصل مع المزوّد.</li>
      <li>لا تشمل <bdi>Studio</bdi> ربطاً بنظامك؛ وللربط بنفسك (<bdi>Casim API</bdi>) أو للتكامل الذي يبنيه المزوّد ويديره (<bdi>Casim Enterprise</bdi>) ورقتا أسعار أخريان لم تصلنا، فلا نذكر أسعارهما.</li>
    </ul>
    <p class="note">المصدر: ورقة أسعار <bdi>Casim Studio</bdi> (المرجع <bdi>{CASIM_REF}</bdi>) كما وصلتنا من المزوّد في {D25}، لا موقعه. الأرقام كما في الورقة، وعمود «أول سنة مع التأسيس» حسابنا منها: الاشتراك السنوي مضافاً إليه رسوم التأسيس (1,000 درهم حتى <bdi>Studio 1,000</bdi>، و1,500 من <bdi>Studio 1,500</bdi> فما فوق)، دون كيانات أو مستندات إضافية. والقرار الوزاري رقم 168 لسنة 2026 يُلزم المزوّد بتقديم 100 خدمة مجانية في السنة لكل مستخدم نهائي (<a href="/accredited-service-provider">ما مزوّد الخدمة المعتمد؟</a>). اطلب السعر في عرض مكتوب قبل التعاقد.</p>"""

def casim_faq():
    paid = "، و".join(f"{p} بـ{fmt(s)}" for p, d, s, _ in CASIM_PLANS if s)
    return (f"لا يعرض المزوّد سعراً علنياً في موقعه (اطّلعنا عليه في {D25}). وبحسب ورقة أسعار Casim Studio التي أرسلها إلينا وأذن بعرضها كما هي "
            f"(المرجع {CASIM_REF}، وصلتنا في {D25}): Studio Free بلا اشتراك سنوي ومعها 100 مستند مجاناً في السنة لكل كيان، "
            f"والاشتراك السنوي بالدرهم: {paid}؛ ورسوم التأسيس لمرة واحدة 1,000 درهم لكيان واحد حتى Studio 1,000، "
            f"و1,500 درهم لكيانين أو ثلاثة أو من Studio 1,500 فما فوق؛ والأسعار دون ضريبة القيمة المضافة، وقد تتغيّر.")

SHEET = {
 NUM["casim"]: {"short": casim_short, "block": casim_block, "faq": casim_faq,
      "h2": "أسعار Casim Studio من ورقة المزوّد",
      "desc": "وأسعار Casim Studio من ورقة أرسلها إلينا وأذن بعرضها",
      "source": (f'<li>ورقة أسعار <bdi>Casim Studio</bdi>، المرجع <bdi>{CASIM_REF}</bdi> (ثلاث صفحات)، أرسلها المزوّد إلينا بالبريد ووصلتنا في {D25} '
                 f'مع إذن كتابي بعرض أسعارها كما هي؛ لا رابط عاماً لها.</li>')},
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
    if n in SHEET: return SHEET[n]["short"]()
    if n in PUBLIC: return f'{esc(PUBLIC[n][0])} (<a href="{esc(PUBLIC[n][2])}" rel="nofollow noopener">المصدر</a>)'
    if n in COMPARE_PRICED: return 'أمثلة في <a href="/#compare">المفاضلة</a>'
    if n in KSA_ONLY: return "أسعار منشورة للسعودية وماليزيا لا للإمارات"
    if n in RESTRICTED: return "لا نذكر سعراً"
    if n in UNREAD: return "لم نتمكن من قراءة موقعه"
    if n in NEW_UNREVIEWED: return "لم نراجع موقعه بعد"
    return "لا سعر علني"

def price_block(n):
    if n in SHEET: return SHEET[n]["block"]()
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
    if n in NEW_UNREVIEWED:
        return (f'    <p>أضفنا هذا المزوّد إلى الدليل يوم قراءتنا القائمة في {LIST_AS_OF}، ولم نراجع موقعه بعدُ بحثاً عن سعر منشور، فلا نذكر عنه سعراً. '
                'اطلب السعر منه مباشرة، أو اطلب عروضاً من عدة مزوّدين معتمدين بالنموذج أدناه.</p>')
    d = D17 if n in NONE_17 else (D20 if n in NONE_20 else D18)
    extra = ' وتجد وصفه في <a href="/#compare">المفاضلة بالصفحة الرئيسية</a>.' if n in ON_COMPARE else ''
    return f'    <p>لا يعرض المزوّد سعراً علنياً (اطّلعنا على موقعه في {d}). يُطلب السعر منه أو عبر نموذج عروض الأسعار.{extra}</p>'

def price_faq(n, name):
    if n in SHEET: return SHEET[n]["faq"]()
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
    if n in NEW_UNREVIEWED:
        return (f"أضفناه إلى الدليل يوم قراءتنا القائمة في {LIST_AS_OF}، ولم نراجع موقعه بعدُ بحثاً عن سعر منشور، "
                "فيُطلب السعر منه مباشرة أو عبر نموذج عروض الأسعار.")
    d = D17 if n in NONE_17 else (D20 if n in NONE_20 else D18)
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

def footer(ao=AS_OF, extra=""):
    extra = f"\n      {extra}" if extra else ""
    return f"""  <footer>
    <p class="note">امتثالي منصة مستقلة غير حكومية. لا تتبع وزارة المالية ولا الهيئة الاتحادية للضرائب، وليست مزوّد خدمة معتمداً. المعلومات هنا إرشادية وليست استشارة ضريبية، فتحقق دائماً من المصدر الرسمي.</p>
    <p class="note">بعض المزوّدين قد يدفع لنا عمولة إذا تعاقدت معه، ولا تدفع أنت شيئاً زائداً، ولا أثر لذلك في إدراج أي مزوّد في هذا الدليل ولا في ترتيبه. <a href="/#privacy">الخصوصية</a></p>
    <h2>المصادر</h2>
    <ul class="links">
      <li><a href="{MOF_LIST}" rel="noopener">قائمة مزوّدي خدمات الفوترة الإلكترونية المعتمدين (ASPs)، وزارة المالية</a> (اطّلعنا عليها في {ao})</li>
      <li><a href="{MOF_EINV}" rel="noopener">صفحة الفوترة الإلكترونية والقرارات، وزارة المالية</a></li>{extra}
    </ul>
  </footer>"""

def jsonld(obj):
    return '<script type="application/ld+json">\n' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + '\n</script>'

def provider_page(i):
    n, name, acc, site, slug = ROWS[i]
    dn = disp(n, name)
    url = f"{SITE}/providers/{slug}"
    src = f"provider-{slug}"
    ao = LIST_AS_OF  # تاريخ القائمة: قُرئت كلها وطابقت ROWS يوم LIST_AS_OF (البند 92)
    title = f"{dn}: مزوّد فوترة إلكترونية معتمد في الإمارات، رقم الاعتماد {acc}"
    sh = SHEET.get(n, {})
    desc = (f"{dn} مدرج في قائمة وزارة المالية لمزوّدي خدمات الفوترة الإلكترونية المعتمدين برقم الاعتماد {acc}، "
            f"كما اطّلعنا عليها في {ao}. موقعه المسجّل، {sh.get('desc', 'وما ينشره عن السعر')}، وكيف تتحقق بنفسك.")
    q1 = f"هل {dn} مزوّد خدمات فوترة إلكترونية معتمد في الإمارات؟"
    a1 = (f"نعم بحسب قائمة وزارة المالية لمزوّدي خدمات الفوترة الإلكترونية المعتمدين (ASPs) كما اطّلعنا عليها في {ao}: "
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
    nb.append(f'      <li><a href="/providers"><b>دليل المزوّدين المعتمدين</b><span>القائمة كاملة: {N} مزوّداً</span></a></li>')
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
    <p class="lead">«<span dir="ltr">{esc(name)}</span>» مدرج في قائمة وزارة المالية لمزوّدي خدمات الفوترة الإلكترونية المعتمدين (ASPs) برقم الاعتماد {acc}، وترتيبه {n} من {N} في القائمة المرتبة أبجدياً، كما اطّلعنا عليها في {ao}.</p>
    <p class="note">المصدر: <a href="{MOF_LIST}" rel="noopener">قائمة مزوّدي خدمات الفوترة الإلكترونية المعتمدين، وزارة المالية</a>. آخر مراجعة: {REVIEWED.get(n, ao)}. معلومات إرشادية، وليست توصية بمزوّد ولا استشارة ضريبية.</p>
  </section>

  <section aria-labelledby="s-list">
    <h2 id="s-list">بياناته في القائمة الرسمية</h2>
    <div class="panel"><div class="table-wrap"><table>
      <tbody>
        <tr><th scope="row">الاسم كما في القائمة</th><td dir="ltr">{esc(name)}</td></tr>
        <tr><th scope="row">رقم الاعتماد</th><td class="num">{acc}</td></tr>
        <tr><th scope="row">الموقع المسجّل</th><td>{site_html(n, site)}</td></tr>
        <tr><th scope="row">الترتيب في القائمة</th><td>{n} من {N}</td></tr>
      </tbody>
    </table></div></div>{brand_line}
    <p class="note">في القائمة الرسمية أيضاً اسم الموظف المسؤول وبريده وهاتفه، ولا ننقلها هنا؛ تجدها في صفحة الوزارة.</p>
  </section>

  <section aria-labelledby="s-price">
    <h2 id="s-price">{sh.get('h2', 'ما ينشره عن السعر')}</h2>
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

{footer(ao, sh.get('source', ''))}
</main>
</body>
</html>
"""

def index_page():
    url = f"{SITE}/providers"
    src = "providers"
    title = f"مزوّدو خدمات الفوترة الإلكترونية المعتمدون في الإمارات: القائمة الكاملة ({N} مزوّداً)"
    desc = (f"دليل المزوّدين المعتمدين لدى وزارة المالية للفوترة الإلكترونية في الإمارات: {N} مزوّداً بأسمائهم وأرقام اعتمادهم ومواقعهم "
            f"كما في القائمة يوم {LIST_AS_OF}، وما ينشره كلٌّ منهم عن السعر.")
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
         f"{N} مزوّداً في قائمة وزارة المالية لمزوّدي خدمات الفوترة الإلكترونية المعتمدين (ASPs) كما اطّلعنا عليها في {LIST_AS_OF}. والقائمة تُحدَّث دورياً بالمعتمدين الجدد."),
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
    <h1 id="page-title">مزوّدو خدمات الفوترة الإلكترونية المعتمدون في الإمارات: {N} مزوّداً</h1>
    <p class="lead">تضم قائمة وزارة المالية لمزوّدي خدمات الفوترة الإلكترونية المعتمدين (ASPs) {N} مزوّداً، كما اطّلعنا عليها في {LIST_AS_OF}. هنا كل مزوّد باسمه الرسمي ورقم اعتماده وموقعه المسجّل، وما ينشره عن السعر، مع صفحة لكل منهم.</p>
    <ul class="facts">
      <li><strong>{N}</strong> مزوّداً معتمداً</li>
      <li>القائمة وفقاً للمادة (13) من <a href="{D168}" rel="noopener"><strong>القرار الوزاري 168 لسنة 2026</strong></a></li>
      <li>اطّلعنا على القائمة في <strong>{LIST_AS_OF}</strong></li>
    </ul>
    <p class="note">المصدر: <a href="{MOF_LIST}" rel="noopener">قائمة مزوّدي خدمات الفوترة الإلكترونية المعتمدين، وزارة المالية</a>، وتقول الوزارة إنها تُحدَّث دورياً بالمعتمدين الجدد وإن ترتيبها أبجدي. آخر مراجعة: {LIST_AS_OF}. لا نقل لأسماء الموظفين ولا لبريدهم ولا لهواتفهم.</p>
    <p class="note">القائمة بالإنجليزية: <a href="/uae-accredited-service-providers" hreflang="en" lang="en" dir="ltr">UAE eInvoicing Accredited Service Providers (ASPs)</a></p>
  </section>

  <section aria-labelledby="s-all">
    <h2 id="s-all">القائمة كاملة</h2>
    <p>بترتيب القائمة الرسمية. اسم المزوّد يفتح صفحته في الدليل، وعمود السعر مما وجدناه على موقعه عند فحصنا في 17 و18 نوفمبر 2026، إلا ما ذكرنا أنه من ورقة أسعار أرسلها المزوّد إلينا، ومزوّدَين أضفناهما إلى الدليل يوم قراءتنا القائمة في {LIST_AS_OF} ولم نراجع موقعيهما بعد.</p>
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
      <li>تقول <a href="https://mof.gov.ae/ar/about-us/initiatives/einvoicing/" rel="noopener">صفحة الفوترة الإلكترونية في وزارة المالية</a>: «يرجى العلم بأنه تم تحديث حالة مزودي الخدمات المعتمدين إلى حالة الاعتماد الكامل.» وفيها بطاقة لتقديم الشكوى على المزوّد المعتمد عنوانها «171 تواصل – تقديم شكوى بشأن مزود خدمات الفوترة الإلكترونية المعتمد»، تحيل إلى منصة <a href="https://171.ae/ar/" rel="noopener">«تواصل 171»</a> الحكومية. قرأنا الصفحتين في 26 نوفمبر 2026.</li>
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

{footer(LIST_AS_OF)}
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
    assert [r[0] for r in ROWS] == list(range(1, N + 1))
    assert len({r[4] for r in ROWS}) == N and len({r[2] for r in ROWS}) == N
    four = "".join("\t".join(str(x) for x in r[:4]) + "\n" for r in ROWS).encode("utf-8")
    assert hashlib.sha256(four).hexdigest() == LIST_SHA256, "ROWS لا تطابق بصمة القائمة LIST_SHA256: لا نشر قبل تحديثهما معاً"
    assert len(NEW_UNREVIEWED) == 2  # نص «ومزوّدَين أضفناهما…» في الفهرس بصيغة المثنى
    cover = NONE_17 | NONE_18 | NONE_20 | set(UNREAD) | COMPARE_PRICED | KSA_ONLY | RESTRICTED | set(PUBLIC) | set(SHEET) | NEW_UNREVIEWED
    assert not (set(SHEET) & (NONE_17 | NONE_18 | NONE_20 | set(UNREAD) | COMPARE_PRICED | KSA_ONLY | RESTRICTED | set(PUBLIC) | NEW_UNREVIEWED))
    assert cover == set(range(1, N + 1)), sorted(set(range(1, N + 1)) - cover)
    files = {"providers.html": index_page()}
    for i in range(len(ROWS)):
        files[f"providers/{ROWS[i][4]}.html"] = provider_page(i)
    urls = [f"{SITE}/providers"] + [f"{SITE}/providers/{r[4]}" for r in ROWS]
    files["sitemap-providers.xml"] = (f"<!-- {N + 1} عنواناً تُدمج في sitemap.xml -->\n" +
        "\n".join(f"  <url><loc>{u}</loc><lastmod>{LIST_AS_OF_ISO}</lastmod></url>" for u in urls) + "\n")
    man = []
    for rel, text in files.items():
        write_page(out, rel, text)
        man.append(f"{hashlib.sha256(text.encode('utf-8')).hexdigest()}  {rel}")
    write_page(out, "MANIFEST.txt", "\n".join(man) + "\n")
    print(f"wrote {len(files)} files to {out}")

if __name__ == "__main__":
    main()
