#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
امتثالي — البند 57 في «طابور البناء»: صفحة إنجليزية بقائمة مزوّدي خدمات الفوترة الإلكترونية المعتمدين (88 مزوّداً).
بلا اعتماديات: python3 emtithali/gen/asp_en.py [مجلد_الإخراج]   (الافتراضي emtithali/site)

يكتب: uae-accredited-service-providers.html → https://emtithali.com/uae-accredited-service-providers

المصدر (وكيل البناء، 22 نوفمبر 2026 نحو 16:20 بتوقيت دبي، تبويبه في المتصفح المدمج على الجهاز):
- صفحة وزارة المالية بالإنجليزية MOF_EN أدناه: جدول واحد، 88 صفاً، ونصها: القائمة بموجب المادة 13 من القرار الوزاري
  168 لسنة 2026، وتُحدَّث دورياً، وترتيبها أبجدي.
  (24 نوفمبر 2026، وكيل البناء، البند 70: أُعيدت قراءتها في تبويبه بالمتصفح المدمج: 88 صفاً، ومقطع البصمة يعطي 5,337 بايتاً
  وEN_SHA256 نفسها، فلم يتغيّر شيء في الأعمدة الأربعة، وREAD_ON صار 24 November 2026.)
- تذييل «Last updated on …» في صفحات mof.gov.ae ختم عام لموقع الوزارة كله لا تاريخ القائمة (البند 70): كان «21/11/2026 at 19:10»
  عند كتابة البند 57، و«23/11/2026 at 15:10» يوم 24 نوفمبر في صفحة القائمة وفي الرئيسية العربية (وسم تعديلها 2026-10-13)،
  ووسم article:modified_time لصفحة القائمة نفسها 2026-11-19T11:43:05+00:00. فلا يُنقل التذييل إلى الصفحة تاريخاً للقائمة
  ولا لصفحة الوزارة؛ الصفحة تذكر تاريخ قراءتنا READ_ON وحده، وتغيّر القائمة يُعرف بالبصمة (EN_SHA256 هنا، وبصمة الأعمدة
  الأربعة للقائمة العربية في رأس providers.py) لا بالتذييل.
- mof-asp-en.tsv بجانب هذا الملف = الأعمدة الأربعة الأولى (# والاسم ورقم الاعتماد والموقع) كما يخرجها مقطع البصمة
  في رأس providers.py حرفياً على الصفحة الإنجليزية: 5,337 بايتاً، SHA-256 = EN_SHA256. لا تُنقل أعمدة الاسم والبريد والهاتف.
  الفرق عن ROWS (المبنية من الصفحة العربية) أربعة صفوف: 14 و70 شرطة مائلة في آخر الموقع، و17 «Solution»، و31 «LLC».
  (23 نوفمبر 2026: صار ROWS[17] «Solution» كالقائمة العربية، فبقي الفرق ثلاثة صفوف: 14 و70 و31.)
- موعد من إيرادهم دون 50 مليون درهم: المادة 5 (1) (ب) من القرار الوزاري 244 لسنة 2025 (D244_EN)، قُرئت في التشغيل نفسه:
  التعيين حتى 31 مارس 2027 والتطبيق حتى 1 يوليو 2027. (القرار 66 لسنة 2026 يستبدل الفقرة (أ) وحدها.)
- حقول النموذج ونص الموافقة والملاحظة التجريبية من site/index.html ‏(#lead-form، و CONFIG.staging = true)،
  والإفصاح من «كيف نكسب؟» في الرئيسية ومن تذييل /providers.

التحديث: الصق ناتج مقطع البصمة من الصفحة الإنجليزية في mof-asp-en.tsv، وحدّث EN_SHA256 وREAD_ON (تاريخ قراءتنا)،
ثم شغّل هذا الملف. لا يُكتب تاريخ تذييل mof.gov.ae في أي موضع. لا نشر إن لم تطابق الأرقام والترتيب ROWS في providers.py (يتوقف بخطأ).
"""
import hashlib, html, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from providers import ROWS, NOLINK, D168  # noqa: E402

SITE = "https://emtithali.com"
PATH = "/uae-accredited-service-providers"
URL = SITE + PATH
MOF_EN = "https://mof.gov.ae/en/about-us/initiatives/einvoicing/einvoicing-accredited-service-providers-asps/"
D244_EN = "https://mof.gov.ae/wp-content/uploads/2025/09/Ministerial-Decision-No.-244-of-2025-on-the-Implementation-of-the-Electronic-Invoicing-System.pdf"
EN_SHA256 = "60a00023be5c39eb7a5776f94715827cb6f80aa6529ddbfb8603cb01e34cfd74"
READ_ON = "24 November 2026"  # تاريخ قراءتنا للقائمة (البند 70)؛ لا تاريخ تذييل mof.gov.ae
NOLINK_ON = "18 November 2026"  # تاريخ فحص الروابط الستة في providers.py
SRC = "asp-en"


def esc(s):
    return html.escape(s, quote=True)


def load_rows():
    raw = open(os.path.join(HERE, "mof-asp-en.tsv"), "rb").read()
    got = hashlib.sha256(raw).hexdigest()
    if got != EN_SHA256:
        sys.exit(f"mof-asp-en.tsv: SHA-256 {got} لا يطابق EN_SHA256")
    rows = [line.split("\t") for line in raw.decode("utf-8").splitlines()]
    assert len(rows) == 88 == len(ROWS), len(rows)
    for (n, name, acc, site), r in zip(rows, ROWS):
        if int(n) != r[0] or acc != r[2]:
            sys.exit(f"الصف {n}: الرقم أو رقم الاعتماد لا يطابق ROWS ({r[0]}, {r[2]})")
        assert name and site, n
    return [(int(n), name, acc, site, r[4]) for (n, name, acc, site), r in zip(rows, ROWS)]


def site_cell(n, site):
    if n in NOLINK:
        return (f'<span dir="ltr">{esc(site)}</span> <span class="note">(as printed; it did not open when we checked on '
                f'{NOLINK_ON})</span>')
    return f'<a href="https://{esc(site)}" rel="nofollow noopener">{esc(site)}</a>'


FIELDS = [
    ("اسمك", "Your name", "Yes"),
    ("اسم الشركة", "Company name", "Yes"),
    ("رقم الجوال أو واتساب", "Mobile or WhatsApp number", "Yes"),
    ("البريد الإلكتروني (اختياري)", "Email (optional)", "No"),
    ("كم فاتورة تصدر شهرياً للشركات والجهات الحكومية؟",
     "How many invoices do you issue each month to businesses and government entities?", "Yes"),
    ("بماذا تصدر فواتيرك الآن؟", "What do you issue your invoices with now?", "Yes"),
]
CONSENT_AR = "أوافق على إرسال بياناتي أعلاه إلى ما يصل إلى ثلاثة مزوّدي خدمة معتمدين ليتواصلوا معي بعروض أسعار."
CONSENT_EN = "I agree to send my details above to up to three accredited service providers to contact me with quotes."


def page():
    rows = load_rows()
    title = "UAE eInvoicing Accredited Service Providers (ASPs): the 88 on the Ministry of Finance list"
    desc = ("All 88 eInvoicing Accredited Service Providers on the UAE Ministry of Finance list, with their accreditation "
            f"numbers and websites as the Ministry shows them. Read on {READ_ON}.")
    faqs = [
        ("How many eInvoicing Accredited Service Providers are there in the UAE?",
         f"88 on the Ministry of Finance list, as we read it on {READ_ON}. The Ministry says it updates the list "
         "periodically to include newly accredited providers."),
        ("When must a business with revenue below AED 50 million appoint an Accredited Service Provider?",
         "By 31 March 2027, and it must implement the Electronic Invoicing System by 1 July 2027, under Article 5(1)(b) "
         "of Ministerial Decision 244 of 2025."),
        ("Is Emtithali part of the Ministry of Finance, or an Accredited Service Provider?",
         "No. Emtithali is an independent, non-government platform in Arabic. It is not part of the Ministry of Finance "
         "or the Federal Tax Authority, and it is not an Accredited Service Provider."),
    ]
    ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]}
    trs = "\n".join(
        f'        <tr><td class="num">{n}</td><td>{esc(name)}</td><td class="num">{acc}</td>'
        f'<td>{site_cell(n, site)}</td><td><a href="/providers/{slug}">Arabic page</a></td></tr>'
        for (n, name, acc, site, slug) in rows)
    fields = "\n".join(
        f'        <tr><td lang="ar" dir="rtl">{esc(ar)}</td><td>{esc(en)}</td><td>{req}</td></tr>'
        for (ar, en, req) in FIELDS)
    qa = "\n".join(f"      <div>\n        <h3>{esc(q)}</h3>\n        <p>{esc(a)}</p>\n      </div>" for q, a in faqs)
    return f"""<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} | Emtithali</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{URL}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#0f1a38">
<meta property="og:type" content="article">
<meta property="og:locale" content="en_AE">
<meta property="og:site_name" content="امتثالي">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{URL}">
<meta property="og:image" content="https://emtithali.com/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Emtithali: compare UAE accredited e-invoicing providers">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://emtithali.com/og-image.png">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(",", ":"))}</script>
<link rel="preload" href="/alexandria-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/site.css">
<style>.asp td:last-child{{white-space:nowrap}}</style>
</head>
<body>
<div class="ribbon" data-nosnippet>Pre-launch trial version: we have not started passing requests to providers yet.</div>
<header class="top">
  <div class="top-in">
    <a class="brand" href="/"><svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5"/><path d="M6.5 12.5l3.6 3.7L17.5 8"/></svg>Emtithali<small>Independent, non-government</small></a>
    <nav class="nav" aria-label="Site">
      <a href="/#compare">Providers</a>
      <a href="/#calc">Deadlines</a>
      <a href="/providers" lang="ar">العربية</a>
    </nav>
    <a class="btn sm" href="/?src={SRC}#quote">Request quotes</a>
  </div>
</header>

<main class="wrap">
  <section class="hero" aria-labelledby="page-title">
    <p class="crumb"><a href="/">Emtithali</a> / In English</p>
    <h1 id="page-title">{esc(title)}</h1>
    <p class="lead">The Ministry of Finance list of eInvoicing Accredited Service Providers (ASPs) has 88 providers, as we read it on {READ_ON}. Below, each provider’s name, accreditation number and website are copied as the Ministry’s English page shows them, with a link to the provider’s page in our Arabic directory.</p>
    <ul class="facts">
      <li><strong>88</strong> accredited providers</li>
      <li>Listed under Article 13 of <a href="{D168}" rel="noopener"><strong>Ministerial Decision 168 of 2026</strong></a></li>
      <li>We read the Ministry’s list on <strong>{READ_ON}</strong></li>
    </ul>
    <p class="note">Source: <a href="{MOF_EN}" rel="noopener">eInvoicing Accredited Service Providers (ASPs), Ministry of Finance</a>. The Ministry says the list is updated periodically to include newly accredited providers, and that it is in alphabetical order. We do not copy the contact persons, emails or phone numbers it shows. Last reviewed: {READ_ON}. Guidance only, not tax advice.</p>
    <p class="note"><a href="/providers" lang="ar">دليل المزوّدين المعتمدين بالعربية</a></p>
  </section>

  <section aria-labelledby="s-list">
    <h2 id="s-list">The full list</h2>
    <p>In the Ministry’s order. “Arabic page” opens the provider’s page in our directory, which also shows what the provider publishes about its prices.</p>
    <div class="panel"><div class="table-wrap"><table class="asp" style="min-width:760px">
      <thead><tr><th class="num">#</th><th>Company name (as on the Ministry’s list)</th><th class="num">Accreditation number</th><th>Company website</th><th>In our directory</th></tr></thead>
      <tbody>
{trs}
      </tbody>
    </table></div></div>
  </section>

  <section aria-labelledby="s-about">
    <h2 id="s-about">What Emtithali is</h2>
    <p>Emtithali is an independent, Arabic-language platform in a pre-launch trial. It is not part of the Ministry of Finance or the Federal Tax Authority, and it is not an Accredited Service Provider.</p>
    <p>It helps businesses with revenue below AED 50 million compare accredited providers before their deadline. Under Article 5(1)(b) of <a href="{D244_EN}" rel="noopener">Ministerial Decision 244 of 2025</a>, these businesses must appoint an Accredited Service Provider by 31 March 2027 and implement the Electronic Invoicing System by 1 July 2027.</p>
  </section>

  <section aria-labelledby="s-quote">
    <h2 id="s-quote">Requesting quotes</h2>
    <p>A business requests quotes through one form on our homepage, in Arabic. These are its fields:</p>
    <div class="panel"><div class="table-wrap"><table>
      <thead><tr><th>On the form (Arabic)</th><th>In English</th><th>Required</th></tr></thead>
      <tbody>
{fields}
      </tbody>
    </table></div></div>
    <p>To send the form, the business must tick this consent: “{esc(CONSENT_EN)}”</p>
    <p class="note" lang="ar" dir="rtl">{esc(CONSENT_AR)}</p>
    <p>The service is in a pre-launch trial, and we have not started passing requests to providers. A request sent now is kept, and we contact the business when the service starts, before sending it to any provider.</p>
    <div class="cta-row">
      <a class="btn" href="/?src={SRC}#quote">Request quotes (Arabic form)</a>
    </div>
  </section>

  <section aria-labelledby="s-earn">
    <h2 id="s-earn">How Emtithali earns</h2>
    <p>The service is free for businesses. Some providers may pay us a commission if a business signs with them, and the business pays nothing extra. This has no effect on whether a provider is listed here or on its position: the table follows the Ministry’s order.</p>
  </section>

  <section aria-labelledby="s-listed">
    <h2 id="s-listed">For listed providers</h2>
    <p>If anything about your company here differs from the Ministry’s list, reply to the message you received from Emtithali, or write to the contact address at the bottom of our homepage, and we will correct it. We copy only the company name, accreditation number and website from the Ministry’s list.</p>
  </section>

  <section aria-labelledby="s-faq">
    <h2 id="s-faq">Frequently asked questions</h2>
    <div class="qa">
{qa}
    </div>
  </section>

  <section aria-labelledby="more-title">
    <h2 id="more-title">Read also</h2>
    <ul class="more">
      <li><a href="/e-invoicing-readiness-checker"><b>E-invoicing readiness checker</b><span>Your phase, deadline and next steps in five questions</span></a></li>
      <li><a href="/uae-tax-invoice-generator"><b>Tax invoice generator</b><span>A VAT invoice or quotation as a PDF, in Arabic and English</span></a></li>
    </ul>
  </section>

  <footer>
    <p class="note">Emtithali is an independent, non-government platform. It is not part of the Ministry of Finance or the Federal Tax Authority, and it is not an Accredited Service Provider. This is guidance, not tax advice: always check the official source.</p>
    <p class="note">Some providers may pay us a commission if you sign with them; you pay nothing extra. <a href="/#privacy">Privacy (Arabic)</a></p>
    <h2>Sources</h2>
    <ul class="links">
      <li><a href="{MOF_EN}" rel="noopener">eInvoicing Accredited Service Providers (ASPs), Ministry of Finance</a> (read on {READ_ON})</li>
      <li><a href="{D168}" rel="noopener">Ministerial Decision 168 of 2026 on the eligibility criteria and accreditation procedure for service providers, Ministry of Finance (Arabic)</a></li>
      <li><a href="{D244_EN}" rel="noopener">Ministerial Decision 244 of 2025 on the Implementation of the Electronic Invoicing System, Ministry of Finance</a></li>
    </ul>
  </footer>
</main>
</body>
</html>
"""


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "site")
    text = page()
    path = os.path.join(out, PATH.lstrip("/") + ".html")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print(path, hashlib.sha256(text.encode()).hexdigest())


if __name__ == "__main__":
    main()
