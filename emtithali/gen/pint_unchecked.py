#!/usr/bin/env python3
"""يكتب في emtithali/site/pint-ae-validator.html قائمة القواعد التي لا يفحصها المدقق وعدّيها، من pint-ae-rules.json.
الاستعمال: python3 emtithali/gen/pint_unchecked.py  (بعد pint_rules.py ثم pint_rules_mark.cjs)"""
import html, json, pathlib, re
site = pathlib.Path(__file__).resolve().parent.parent / 'site'
rules = json.loads((site / 'pint-ae-rules.json').read_text(encoding='utf-8'))
items = []
for s in rules['sets']:
    for p in s['patterns']:
        for r in p['rules']:
            for a in r['asserts']:
                if not a['checked']:
                    items.append(f'        <li><a href="{a["url"]}" rel="noopener"><code>{a["id"]}</code></a> <span dir="rtl">({html.escape(a["why"])})</span></li>')
page = site / 'pint-ae-validator.html'
t = page.read_text(encoding='utf-8')
t = re.sub(r'<!--UNCHECKED:START-->.*?<!--UNCHECKED:END-->', '<!--UNCHECKED:START-->\n' + '\n'.join(items) + '\n<!--UNCHECKED:END-->', t, flags=re.S)
t = re.sub(r'<span id="n-checked">\d+</span>', f'<span id="n-checked">{rules["source"]["checked"]}</span>', t)
t = re.sub(r'<span id="n-unchecked">\d+</span>', f'<span id="n-unchecked">{len(items)}</span>', t)
page.write_text(t, encoding='utf-8')
print(len(items), 'unchecked;', rules['source']['checked'], 'checked')
