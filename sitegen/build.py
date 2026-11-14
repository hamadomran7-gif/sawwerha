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
UPDATED = "2026-11-14"
INDEXNOW_KEY = "ec5ef46e66ec1963d22dd5b18c6f09e4"  # IndexNow (Bing/Yandex): يُنشر ملف <key>.txt في الجذر

MARK = ('<span class="mark" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>'
        '<circle cx="12" cy="12.5" r="3.5"/></svg></span>')
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


def faq_html(meta, ui):
    if not meta.get("faq"):
        return ""
    items = "".join(f"<details><summary>{esc(q['q'])}</summary><p>{esc(q['a'])}</p></details>" for q in meta["faq"])
    return f'<section class="faq" aria-labelledby="faq"><h2 id="faq">{ui["faq"]}</h2>{items}</section>'


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
    body = body.replace("{{wa}}", esc(wa)).replace("{{wa_icon}}", WA_ICON)
    links = []
    for href, label, l in SERVICE_LINKS:
        attrs = ' lang="en"' if l != lang else ""
        if href == "/" + meta["slug"] + "/":
            attrs += ' aria-current="page"'
        links.append(f'<a href="{href}"{attrs}>{esc(label)}</a>')
    services = "".join(links)
    alt_label, alt_href = ui["alt"]
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
<meta property="og:image" content="{DOMAIN}/samples/scene-1.jpg">
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
  <p class="src">{'Last updated' if lang == 'en' else 'آخر تحديث'}: <time datetime="{UPDATED}">{UPDATED}</time></p>
</footer>

<div class="sticky"><a class="cta" href="{esc(wa)}" target="_blank" rel="noopener">{WA_ICON}<span>{ui['sticky']}</span></a></div>
</body>
</html>
"""


def main():
    pages = read_pages()
    urls = [(DOMAIN + "/", "1.0")]
    for meta, body in pages:
        out = WEB / meta["slug"] / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render(meta, body), encoding="utf-8")
        urls.append((f"{DOMAIN}/{meta['slug']}/", "0.8"))
        print("wrote", out.relative_to(ROOT))
    urls += [(DOMAIN + "/terms", "0.3"), (DOMAIN + "/privacy", "0.3")]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sm += "".join(f"  <url><loc>{u}</loc><lastmod>{UPDATED}</lastmod><priority>{p}</priority></url>\n" for u, p in urls)
    sm += "</urlset>\n"
    (WEB / "sitemap.xml").write_text(sm, encoding="utf-8")
    (WEB / f"{INDEXNOW_KEY}.txt").write_text(INDEXNOW_KEY, encoding="utf-8")
    (WEB / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /ads/\nSitemap: {DOMAIN}/sitemap.xml\n", encoding="utf-8")
    print(f"sitemap: {len(urls)} urls")


if __name__ == "__main__":
    main()
