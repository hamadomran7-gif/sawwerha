#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
امتثالي (emtithali.com): صورة المعاينة عند مشاركة الروابط (og:image وtwitter:image)، 1200×630.
تُرسم من خطّي الموقع (Alexandria) وألوانه في site.css، فلا ملف تصميم خارجي ولا شعار طرف آخر.
    python3 emtithali/gen/og_image.py              يكتب emtithali/site/og-image.png
    python3 emtithali/gen/og_image.py <مسار>        يكتب إلى المسار المعطى
يحتاج Pillow بدعم raqm (لتشكيل الحروف العربية). النص عام بلا تواريخ ولا أرقام، فلا يحتاج تحديثاً عند تغيّر المواعيد.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont, features

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, '..', 'site')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(SITE, 'og-image.png')
W, H = 1200, 630

# من site.css (الوضع الفاتح): --band و--on-band و--on-band-muted و--mark و--accent
BAND, ON_BAND, MUTED, MARK, ACCENT = '#0f1a38', '#eef1f8', '#aeb7cf', '#ffe14d', '#1b3bb3'
PANEL = '#16224a'

if not features.check('raqm'):
    sys.exit('Pillow بلا raqm: الحروف العربية لن تتشكّل صحيحة.')


def font(name, size, weight):
    f = ImageFont.truetype(os.path.join(SITE, name), size, layout_engine=ImageFont.Layout.RAQM)
    f.set_variation_by_axes([weight])
    return f


AR = lambda size, weight: font('alexandria-arabic.woff2', size, weight)
LA = lambda size, weight: font('alexandria-latin.woff2', size, weight)

im = Image.new('RGB', (W, H), BAND)
d = ImageDraw.Draw(im)
R = W - 84  # الحافة اليمنى للنص (الصفحة من اليمين إلى اليسار)


def ar(xy, text, f, fill):
    d.text(xy, text, font=f, fill=fill, direction='rtl', language='ar', anchor='rs')


# لوحة خلفية خفيفة وشريط سفلي بلون التمييز
d.rounded_rectangle((48, 48, W - 48, H - 72), radius=28, fill=PANEL)
d.rectangle((0, H - 14, W, H), fill=MARK)

# العلامة: مربع بلون التمييز وعلامة صح كما في favicon.svg
s, x0, y0 = 92, R - 92, 92
d.rounded_rectangle((x0, y0, x0 + s, y0 + s), radius=20, fill=MARK)
k = s / 24
pts = [(x0 + 6.5 * k, y0 + 12.5 * k), (x0 + 10.1 * k, y0 + 16.2 * k), (x0 + 17.5 * k, y0 + 8 * k)]
d.line(pts, fill=BAND, width=round(2.6 * k), joint='curve')
for px, py in (pts[0], pts[-1]):
    r = 1.3 * k
    d.ellipse((px - r, py - r, px + r, py + r), fill=BAND)

ar((x0 - 28, y0 + 70), 'امتثالي', AR(66, 800), ON_BAND)

# العنوان: سطران، وتحت السطر الثاني خط بلون التمييز
ar((R, 330), 'قارن مزوّدي الفوترة الإلكترونية', AR(60, 700), '#ffffff')
ar((R, 418), 'المعتمدين في الإمارات', AR(60, 700), '#ffffff')
w2 = d.textlength('المعتمدين في الإمارات', font=AR(60, 700), direction='rtl', language='ar')
d.rectangle((R - w2, 436, R, 444), fill=MARK)

ar((R, 500), 'منصة مستقلة، الأسعار والمواعيد وأدوات مجانية', AR(32, 400), MUTED)

# النطاق بالحروف اللاتينية أعلى اليسار، مقابل العلامة (خط الحروف العربية لا يضم علامات الترقيم اللاتينية)
d.text((100, 146), 'emtithali.com', font=LA(34, 600), fill=ON_BAND, anchor='ls')
d.text((100, 186), 'UAE e-invoicing, compared', font=LA(24, 400), fill=MUTED, anchor='ls')

pal = im.quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
pal.save(OUT, optimize=True)
print(OUT, os.path.getsize(OUT), 'بايت', pal.size)
