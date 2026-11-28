#!/usr/bin/env python3
"""مولّد صفحات الهبوط لموقع صوّرها (sawwerha.app) — بلا اعتماديات.

كل صفحة في sitegen/pages/<slug>.html تبدأ بكتلة JSON بين ---json و---، ثم محتوى <main>.
يكتب الناتج إلى web/<slug>/index.html ويولّد web/sitemap.xml وweb/robots.txt.
التشغيل: python3 sitegen/build.py
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ROOT / "sitegen" / "pages"
WEB = ROOT / "web"
DOMAIN = "https://sawwerha.app"
WA = "971507241548"
UPDATED = "2026-11-22"
HOME_UPDATED = "2026-11-28"  # lastmod الرئيسية web/index.html (مكتوبة يدوياً): يُحدَّث مع كل تعديل لها
INDEXNOW_KEY = "ec5ef46e66ec1963d22dd5b18c6f09e4"  # IndexNow (Bing/Yandex): يُنشر ملف <key>.txt في الجذر

# لا رقم لشرط منصة بلا مصدر وتاريخ قراءة (البند 98). «85%» نسبة أمازون للصورة الرئيسية، و«هامش 10%» هامش نون.
# كل صفحة في web/ (المولّدة والمكتوبة يدوياً) يظهر فيها أحدهما تحتاج فقرة <p> فيها رابط مصدره و«قرأنا … يوم <تاريخ>»
# (أو «We read … on <date>»). يفحصها check_platform_sources على كل مخرج قبل الكتابة، ويضيف faq_html فقرة PLATFORM_SRC
# تحت كل جواب فيه أحد الرقمين بلا تاريخ قراءة. والتاريخ يوم قراءة الصفحتين فعلاً، فلا يُغيَّر إلا بعد قراءتهما من جديد.
PLATFORM_READ = {"ar": "28 نوفمبر 2026", "en": "28 November 2026"}
NOON_URL = "https://supportagent.noon.partners/portal/en/kb/articles/image-requirements-and-rejection-reasons-for-the-seller-sku-12-3-2024"
AMAZON_URL = "https://sellercentral.amazon.ae/help/hub/reference/external/G1881"
NOON_QUOTE = "If the product is shot vertically then a 10% margin should be left on top and bottom, and if the product is shot horizontally then a 5% margin should be left on both sides."
AMAZON_QUOTE = "Show the product as 85% of the image."
PLATFORM_SRC = {
    "ar": {
        "amazon": (f'<a href="{AMAZON_URL}" rel="nofollow noopener" target="_blank">Amazon Seller Central (الإمارات) — Product image guide</a>، '
                   f'وفيه للصورة الرئيسية: <bdi lang="en">«{AMAZON_QUOTE}»</bdi> (المنتج 85% من الصورة)'),
        "noon": (f'<a href="{NOON_URL}" rel="nofollow noopener" target="_blank">noon Partners — Image requirements and rejection reasons for the seller SKU</a>، '
                 f'وفيه: <bdi lang="en">«{NOON_QUOTE}»</bdi> (هامش 10% أعلى وأسفل إن صُوّر المنتج عمودياً، و5% على الجانبين إن صُوّر أفقياً)'),
        "lead": "المصدر: ", "join": "؛ و",
        "read": (f"قرأنا الصفحة يوم {PLATFORM_READ['ar']}، والمتطلبات قد تتغيّر.", f"قرأنا الصفحتين يوم {PLATFORM_READ['ar']}، والمتطلبات قد تتغيّر."),
    },
    "en": {
        "amazon": f'<a href="{AMAZON_URL}" rel="nofollow noopener" target="_blank">Amazon Seller Central (UAE) — Product image guide</a> (main image: “{AMAZON_QUOTE}”)',
        "noon": f'<a href="{NOON_URL}" rel="nofollow noopener" target="_blank">noon Partners — Image requirements and rejection reasons for the seller SKU</a> (“{NOON_QUOTE}”)',
        "lead": "Source: ", "join": "; and ",
        "read": (f"We read it on {PLATFORM_READ['en']}; requirements may change.", f"We read both pages on {PLATFORM_READ['en']}; requirements may change."),
    },
}
PLATFORM_NUM = {  # بالأرقام العربية والهندية، وبعلامات الاتجاه بين الرقم والنسبة، ولا يُحتسب ترميز URL مثل ‎%D9%85‎
    "amazon": re.compile(r"(?<![\d.%٠-٩])(?:85|٨٥)[\s\u200e\u200f\u061c]*(?:[%٪]|في ?الما?ئة|بالما?ئة|percent)", re.I),
    "noon": re.compile(r"(?:هامش|هوامش)[\w\u064b-\u0652]*\s*(?:10|١٠)[\s\u200e\u200f\u061c]*[%٪]"
                       r"|(?<![\d.%])(?:10|١٠)[\s\u200e\u200f\u061c]*[%٪]\s*(?:\w+\s+){0,3}margins?", re.I),
}
PLATFORM_LINK = {
    "amazon": re.compile(r'href="https://sellercentral\.amazon\.[a-z.]+/help/hub/reference/external/G1881"'),
    "noon": re.compile(r'href="https://(?:supportagent|helpcenter)\.noon\.partners/[^"]*image-requirements-and-rejection-reasons-for-the-seller-sku[^"]*"'),
}
MONTHS_AR = "يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر"
MONTHS_EN = "January|February|March|April|May|June|July|August|September|October|November|December"
READ_ON = re.compile(rf"قرأنا\w*(?:\s+\S+){{0,8}}?\s+يوم\s+\d{{1,2}}\s+(?:{MONTHS_AR})\s+20\d\d"
                     rf"|\b[Ww]e read\b(?:\s+\S+){{0,8}}?\s+on\s+\d{{1,2}}\s+(?:{MONTHS_EN})\s+20\d\d")
PLATFORM_BLOCK = re.compile(r'<p class="src" data-src="platforms">[\s\S]*?</p>')

# العيّنة المجانية معاينة بعلامة مائية (البند 29): كل زر عيّنة مجانية في صفحة مولّدة تجاوره {{sample_note}}،
# ولا تقترن «جاهزة لنون/لأمازون/للرفع» في البطل أو الوصف إلا بجملة عن الباقات المدفوعة. يفحصها check_sample_claims.
SAMPLE_NOTE = {
    "ar": "العيّنة معاينة بعلامة مائية صغيرة، فلا تُرفع على نون ولا أمازون؛ وصور الباقات المدفوعة بدونها وجاهزة للرفع.",
    "en": "The free sample is a preview with a small watermark, so it cannot be uploaded to noon or Amazon; paid package images come without it, ready to upload.",
}
READY = re.compile(r"جاهز(?:ة|ان|تان)?\s+(?:لنون|لأمازون|للرفع)|ready (?:for noon|for amazon|to upload)", re.I)
PAID = re.compile(r"الباقات|المدفوعة|paid|package", re.I)
FREE_CTA = re.compile(r"مجاناً|free", re.I)
WATERMARK = re.compile(r"علامة مائية|\{\{sample_note\}\}|watermark", re.I)

MARK = ('<span class="mark" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>'
        '<circle cx="12" cy="12.5" r="3.5"/></svg></span>')
UP_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>'
WA_ICON = ('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>')

UI = {
    "ar": {"dir": "rtl", "brand": "صوّرها", "home": "الرئيسية", "faq": "أسئلة شائعة", "alt": ("English", "/en/"),
           "services": "خدماتنا", "terms": "الشروط والاسترداد", "privacy": "الخصوصية",
           "legal": "صوّرها — خدمة إماراتية من أم القيوين. نون وأمازون علامتان تجاريتان لمالكيهما، وصوّرها خدمة مستقلة غير تابعة لهما.",
           "sticky": "أرسل صورة منتجك مجاناً"},
    "en": {"dir": "ltr", "brand": "Sawwerha", "home": "Home", "faq": "FAQ", "alt": ("العربية", "/"),
           "services": "Services", "terms": "Terms & refunds", "privacy": "Privacy",
           "legal": "Sawwerha — a UAE service based in Umm Al Quwain. noon and Amazon are trademarks of their owners; Sawwerha is independent and not affiliated with them.",
           "sticky": "Send your product photo — free"},
}
SERVICE_LINKS = [
    ("/noon-product-photos/", "صور منتجات نون", "ar"),
    ("/amazon-product-photos/", "صور منتجات أمازون", "ar"),
    ("/white-background-product-photos/", "صور بخلفية بيضاء", "ar"),
    ("/try/", "جرّبها مجاناً: ارفع صورة منتجك", "ar"),
    ("/perfume-product-photos/", "تصوير العطور والعود", "ar"),
    ("/beauty-product-photos/", "تصوير منتجات التجميل", "ar"),
    ("/jewelry-product-photos/", "تصوير المجوهرات", "ar"),
    ("/abaya-fashion-product-photos/", "تصوير العبايات والأزياء", "ar"),
    ("/home-decor-product-photos/", "تصوير منتجات المنزل", "ar"),
    ("/food-product-photos/", "تصوير الحلويات والأغذية", "ar"),
    ("/kids-product-photos/", "تصوير منتجات الأطفال", "ar"),
    ("/phone-product-photography/", "دليل التصوير بالجوال", "ar"),
    ("/tools/marketplace-image-checker/", "فحص صور نون وأمازون (مجاناً)", "ar"),
    ("/en/", "AI product photos UAE", "en"),
]


def esc(s: str) -> str:
    return html.escape(str(s), quote=True)


def wa_href(msg: str) -> str:
    from urllib.parse import quote
    return f"https://wa.me/{WA}?text={quote(msg)}"


def read_pages():
    out = []
    for f in sorted(PAGES.glob("*.html")):
        raw = f.read_text(encoding="utf-8")
        m = re.match(r"^---json\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$", raw)
        if not m:
            raise SystemExit(f"{f.name}: missing ---json header")
        meta = json.loads(m.group(1))
        meta.setdefault("slug", f.stem)
        out.append((meta, m.group(2)))
    return out


def check_sample_claims(meta, body):
    """مخالفات العيّنة المجانية في صفحة واحدة (قائمة فارغة إن سلمت). تُفحص قبل استبدال القوالب."""
    out = []
    hero = re.search(r'<section class="hero".*?</section>', body, re.S)
    for text in [meta.get("description", "")] + ([hero.group(0)] if hero else []):
        for sent in re.split(r"[.!?؟؛]", re.sub(r"<[^>]+>", " ", text)):
            if READY.search(sent) and not PAID.search(sent):
                out.append(f"«جاهزة» خارج سياق الباقات المدفوعة: {' '.join(sent.split())[:90]}")
    for m in re.finditer(r'<a class="cta"[^>]*>(.*?)</a>', body, re.S):
        label = " ".join(re.sub(r"<[^>]+>|\{\{\w+\}\}", " ", m.group(1)).split())
        if FREE_CTA.search(label) and not WATERMARK.search(body[max(0, m.start() - 400): m.end() + 400]):
            out.append(f"زر «{label}» بلا جملة العلامة المائية بجواره")
    return out


def platform_src(lang, text):
    """فقرة مصدر شروط المنصات لجواب فيه «85%» أو «هامش 10%» بلا تاريخ قراءة (فارغة إن لم يلزم)."""
    kinds = [k for k in ("amazon", "noon") if PLATFORM_NUM[k].search(text)]
    if not kinds or READ_ON.search(text):
        return ""
    s = PLATFORM_SRC[lang]
    return f'<p class="src" data-src="platforms">{s["lead"]}{s["join"].join(s[k] for k in kinds)}. {s["read"][len(kinds) > 1]}</p>'


def faq_html(meta, ui):
    if not meta.get("faq"):
        return ""
    items = "".join(f"<details><summary>{esc(q['q'])}</summary><p>{esc(q['a'])}</p>{platform_src(meta['lang'], q['a'])}</details>"
                    for q in meta["faq"])
    return f'<section class="faq" aria-labelledby="faq"><h2 id="faq">{ui["faq"]}</h2>{items}</section>'


def check_platform_sources(page):
    """«85%» أو «هامش 10%» في نص الصفحة أو وصفها أو نصوص صورها أو سكربتها (كنتائج أداة الفحص) بلا فقرة فيها رابط
    المصدر و«قرأنا … يوم <تاريخ>». JSON-LD والأنماط والتعليقات خارج الفحص."""
    code = " ".join(c for a, c in re.findall(r"<script\b([^>]*)>([\s\S]*?)</script>", page, flags=re.I) if "ld+json" not in a)
    h = re.sub(r"<script\b[\s\S]*?</script>|<style\b[\s\S]*?</style>|<!--[\s\S]*?-->", " ", page, flags=re.I)
    shown = html.unescape(re.sub(r"<[^>]+>", " ", h) + " " + " ".join(re.findall(r'\b(?:content|alt|title|aria-label)="([^"]*)"', h))) + " " + code
    paras = [p for p in re.findall(r"<p\b[^>]*>[\s\S]*?</p>", h) if READ_ON.search(html.unescape(re.sub(r"<[^>]+>", " ", p)))]
    out = []
    for kind, num in PLATFORM_NUM.items():
        m = num.search(shown)
        if m and not any(PLATFORM_LINK[kind].search(p) for p in paras):
            link = "دليل صور Amazon ‏G1881" if kind == "amazon" else "مقالة متطلبات الصور في noon Partners"
            out.append(f"«{m.group(0)}» بلا فقرة فيها رابط {link} و«قرأنا … يوم <تاريخ>»")
    return out


def selftest_platform_sources(rendered):
    """مقياس البند 98: فحص المصادر يُفشل نسخة اختبارية من صفحة فئة حُذفت منها فقرة المصدر، ويقبلها بالفقرة."""
    meta, page = next(((m, p) for m, p in rendered if m["slug"] == "perfume-product-photos"), (None, None))
    if page is None:
        return
    if check_platform_sources(page) or not PLATFORM_BLOCK.search(page) or not check_platform_sources(PLATFORM_BLOCK.sub("", page)):
        raise SystemExit("فحص مصادر شروط المنصات (البند 98) لا يلتقط صفحة عطور بلا فقرة المصدر")


def jsonld(meta, url, ui):
    org = {"@type": "Organization", "@id": DOMAIN + "/#org", "name": "صوّرها", "alternateName": "Sawwerha", "url": DOMAIN + "/", "email": "support@sawwerha.app"}
    if meta.get("app"):
        graph = [org, {
            "@type": "WebApplication",
            "name": meta["service_name"],
            "description": meta["description"],
            "url": url,
            "inLanguage": meta["lang"],
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Any",
            "isAccessibleForFree": True,
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "AED"},
            "publisher": {"@id": DOMAIN + "/#org"},
        }]
    else:
        graph = [org]
    graph += [{
        "@type": "Service",
        "name": meta["service_name"],
        "serviceType": meta.get("service_type", "Product photo editing"),
        "description": meta["description"],
        "url": url,
        "inLanguage": meta["lang"],
        "provider": {"@id": DOMAIN + "/#org"},
        "areaServed": {"@type": "Country", "name": "United Arab Emirates"},
        "offers": {"@type": "AggregateOffer", "priceCurrency": "AED", "lowPrice": "149", "highPrice": "899", "offerCount": "4"},
    }, {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": ui["brand"], "item": DOMAIN + "/"},
            {"@type": "ListItem", "position": 2, "name": meta["crumb"], "item": url},
        ],
    }]
    if meta.get("app"):
        graph = [g for g in graph if g.get("@type") != "Service"]
    if meta.get("faq"):
        graph.append({"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q["q"], "acceptedAnswer": {"@type": "Answer", "text": q["a"]}} for q in meta["faq"]]})
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False).replace("<", "\\u003c")


def render(meta, body):
    lang = meta["lang"]
    ui = UI[lang]
    url = f"{DOMAIN}/{meta['slug']}/"
    wa = wa_href(meta["wa_msg"])
    if lang == "ar":
        # منذ الاختبار الطرفي لقناة الموقع (22 نوفمبر): زر الطلب الأول في الصفحات العربية يفتح /try/ (رفع الصورة)، ويبقى زر واتساب الثاني بديلاً
        body = body.replace(' href="{{wa}}" target="_blank" rel="noopener">{{wa_icon}}', ' href="/try/">' + UP_ICON, 1)
    body = body.replace("{{wa}}", esc(wa)).replace("{{wa_icon}}", WA_ICON).replace("{{sample_note}}", esc(SAMPLE_NOTE[lang]))
    links = []
    for href, label, l in SERVICE_LINKS:
        attrs = ' lang="en"' if l != lang else ""
        if href == "/" + meta["slug"] + "/":
            attrs += ' aria-current="page"'
        links.append(f'<a href="{href}"{attrs}>{esc(label)}</a>')
    services = "".join(links)
    sticky = (f'<a class="cta" href="/try/">{UP_ICON}<span>ارفع صورة منتجك مجاناً</span></a>' if lang == "ar"
              else f'<a class="cta" href="{esc(wa)}" target="_blank" rel="noopener">{WA_ICON}<span>{ui["sticky"]}</span></a>')
    alt_label, alt_href = ui["alt"]
    updated = meta.get("updated", UPDATED)  # تاريخ صفحة بعينها حين تتغيّر وحدها (يُكتب في التذييل وlastmod)
    return f"""<!doctype html>
<html lang="{lang}" dir="{ui['dir']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(meta['title'])}</title>
<meta name="description" content="{esc(meta['description'])}">
<link rel="canonical" href="{url}">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{esc(meta.get('og_title', meta['title']))}">
<meta property="og:description" content="{esc(meta['description'])}">
<meta property="og:type" content="website">
<meta property="og:image" content="{DOMAIN}{meta.get('og_image', '/samples/scene-1.jpg')}">
<meta name="theme-color" content="#2b2140">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;800&family=IBM+Plex+Sans+Arabic:wght@400;500;700&display=swap">
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">{jsonld(meta, url, ui)}</script>
</head>
<body data-lang="{lang}">
<header class="wrap top">
  <a class="brand" href="/">{MARK}<span>{ui['brand']}</span></a>
  <a class="lang" href="{alt_href}" lang="{'en' if lang == 'ar' else 'ar'}">{alt_label}</a>
</header>

<main class="wrap">
  <nav class="crumbs" aria-label="{'Breadcrumb' if lang == 'en' else 'مسار التنقل'}"><a href="/">{ui['home']}</a><span>›</span><span aria-current="page">{esc(meta['crumb'])}</span></nav>
{body.rstrip()}
{faq_html(meta, ui)}
</main>

<footer class="wrap">
  <nav class="links" aria-label="{ui['services']}">{services}</nav>
  <nav class="links" aria-label="policies" style="margin-top:8px"><a href="/terms">{ui['terms']}</a><a href="/privacy">{ui['privacy']}</a><a href="mailto:support@sawwerha.app">support@sawwerha.app</a></nav>
  <p style="margin-top:10px">{esc(ui['legal'])}</p>
  <p class="src">{'Last updated' if lang == 'en' else 'آخر تحديث'}: <time datetime="{updated}">{updated}</time></p>
</footer>

<div class="sticky">{sticky}</div>
</body>
</html>
"""


def check_gallery_files(meta, body):
    """صور المعرض (‎/gallery/…‎) وصورة المشاركة يجب أن تكون ملفات في web/ حتى لا تُنشر صفحة بصورة مكسورة."""
    refs = set(re.findall(r'(?:src|href)="(/gallery/[^"]+)"', body))
    if meta.get("og_image"):
        refs.add(meta["og_image"])
    return [f"صورة غير موجودة: {r}" for r in sorted(refs) if r.startswith("/gallery/") and not (WEB / r.lstrip("/")).is_file()]


def main():
    pages = read_pages()
    bad = [f"{meta['slug']}: {p}" for meta, body in pages for p in check_sample_claims(meta, body)]
    if bad:
        raise SystemExit("ادعاءات العيّنة المجانية (البند 29):\n" + "\n".join(bad))
    missing = [f"{meta['slug']}: {p}" for meta, body in pages for p in check_gallery_files(meta, body)]
    if missing:
        raise SystemExit("صور المعرض:\n" + "\n".join(missing))
    rendered = [(meta, render(meta, body)) for meta, body in pages]
    outputs = {WEB / meta["slug"] / "index.html": page for meta, page in rendered}
    others = {f: f.read_text(encoding="utf-8") for f in sorted(WEB.rglob("*.html")) if f not in outputs}
    unsourced = [f"{f.relative_to(WEB)}: {p}" for f, page in [*outputs.items(), *others.items()] for p in check_platform_sources(page)]
    if unsourced:
        raise SystemExit("شروط المنصات بلا مصدر وتاريخ قراءة (البند 98):\n" + "\n".join(unsourced))
    selftest_platform_sources(rendered)
    urls = [(DOMAIN + "/", "1.0", HOME_UPDATED)]
    for meta, page in rendered:
        out = WEB / meta["slug"] / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page, encoding="utf-8")
        urls.append((f"{DOMAIN}/{meta['slug']}/", "0.8", meta.get("updated", UPDATED)))
        print("wrote", out.relative_to(ROOT))
    urls += [(DOMAIN + "/try/", "0.9", UPDATED), (DOMAIN + "/terms", "0.3", UPDATED), (DOMAIN + "/privacy", "0.3", UPDATED)]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sm += "".join(f"  <url><loc>{u}</loc><lastmod>{d}</lastmod><priority>{p}</priority></url>\n" for u, p, d in urls)
    sm += "</urlset>\n"
    (WEB / "sitemap.xml").write_text(sm, encoding="utf-8")
    (WEB / f"{INDEXNOW_KEY}.txt").write_text(INDEXNOW_KEY, encoding="utf-8")
    (WEB / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /ads/\nDisallow: /s/\nSitemap: {DOMAIN}/sitemap.xml\n", encoding="utf-8")
    print(f"sitemap: {len(urls)} urls")


if __name__ == "__main__":
    main()
