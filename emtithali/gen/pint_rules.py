#!/usr/bin/env python3
"""يولّد emtithali/site/pint-ae-rules.json من ملف الموارد الرسمي لمواصفة PINT AE.

المصدر: https://docs.peppol.eu/poac/ae/pint-ae/resources.zip (رابط «Download resources» في
https://docs.peppol.eu/poac/ae/pint-ae/)، وفيه ملفا Schematron الرسميان للفاتورة والإشعار الدائن
(متطابقان بايتاً بين الفاتورة والإشعار): PINT-jurisdiction-aligned-rules.sch و PINT-UBL-validation-preprocessed.sch.

الاستعمال:  python3 emtithali/gen/pint_rules.py <resources.zip> <تاريخ القراءة YYYY-MM-DD> > emtithali/site/pint-ae-rules.json
ثم:        node emtithali/gen/pint_rules_mark.cjs  (يحدد في Chromium ما يُفحص بمحرك XPath 1.0 في المتصفح)

لا يُغيَّر نص أي قاعدة: id وflag وcontext وtest والرسالة كما في الملف حرفياً. ويُضاف لكل قاعدة تعبيران
محوَّلان (cx للسياق وxt للاختبار) بثلاثة تحويلات فقط، كلٌّ منها مكافئ دلالياً لنظيره في XPath 2.0 في حالته المذكورة:
  R1  exists(مسار) ← boolean(مسار)، والمعامل مسار عُقد لا استدعاء دالة.
  R2  مسار = true() ← boolean(مسار[normalize-space(.)='true' or normalize-space(.)='1'])، ومثله false() بـ'false' و'0'
      (في XPath 2.0 تُحوَّل قيمة العقدة غير المنمّطة إلى xs:boolean، وفي XPath 1.0 يُحوَّل المسار نفسه إلى منطقي فيصدق بوجوده).
  R3  مسار/normalize-space(upper-case(cbc:ID)) = 'VAT' (و!=) ← boolean(مسار[normalize-space(translate(cbc:ID, a-z, A-Z)) = 'VAT'])،
      لأن الحروف V وA وT لا يقابلها في Unicode حرف صغير غير لاتيني أساسي يصير إليها بـupper-case.
وأي تعبير لا يقبله محرك XPath 1.0 بعد ذلك يُعلَّم «لا يُفحص» مع سببه، ويُعرض في الصفحة.
"""
import hashlib, json, re, sys, zipfile
import xml.etree.ElementTree as ET

S = '{http://purl.oclc.org/dsdl/schematron}'
BASE = 'https://docs.peppol.eu/poac/ae/pint-ae/trn-invoice/rule/'
SETS = [
    ('ae', 'AE specific PINT rules', 'PINT-jurisdiction-aligned-rules', 'trn-invoice/schematron/PINT-jurisdiction-aligned-rules.sch'),
    ('shared', 'Shared PINT rules', 'PINT-UBL-validation-preprocessed', 'trn-invoice/schematron/PINT-UBL-validation-preprocessed.sch'),
]
LOWER, UPPER = 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'


def split_top(s, sep='|'):
    out, depth, q, cur = [], 0, None, ''
    for c in s:
        if q:
            cur += c
            if c == q:
                q = None
            continue
        if c in '\'"':
            q = c; cur += c; continue
        if c in '[(':
            depth += 1
        elif c in '])':
            depth -= 1
        if depth == 0 and c == sep:
            out.append(cur); cur = ''; continue
        cur += c
    out.append(cur)
    return out


def matching_paren(s, i):
    """s[i] == '(' ؛ يعيد موضع القوس المقابل مع تجاهل ما بين علامات الاقتباس."""
    depth, q = 0, None
    for j in range(i, len(s)):
        c = s[j]
        if q:
            if c == q:
                q = None
            continue
        if c in '\'"':
            q = c
        elif c == '(':
            depth += 1
        elif c == ')':
            depth -= 1
            if depth == 0:
                return j
    return -1


FUNC_START = re.compile(r'^\s*[A-Za-z_][\w.-]*(?::[A-Za-z_][\w.-]*)?\s*\(')


def r1_exists(e):
    out, i = '', 0
    while True:
        m = re.search(r'(?<![\w:.-])exists\s*\(', e[i:])
        if not m:
            return out + e[i:]
        a = i + m.start(); p = i + m.end() - 1
        q = matching_paren(e, p)
        arg = e[p + 1:q]
        if q < 0 or FUNC_START.match(arg) or arg.strip().startswith('('):
            out += e[i:p + 1]; i = p + 1; continue
        out += e[i:a] + 'boolean(' + r1_exists(arg) + ')'
        i = q + 1


PATH = r'(?:\.\./)*(?:cac|cbc):\w+(?:/(?:cac|cbc):\w+)*'


def r2_bool(e):
    def rep(m):
        p, v = m.group(1), m.group(2)
        lit = ("'true' or normalize-space(.)='1'" if v == 'true' else "'false' or normalize-space(.)='0'")
        return f"boolean({p}[normalize-space(.)={lit}])"
    return re.sub(r'(?<![\w:/.@-])(' + PATH + r')\s*=\s*(true|false)\(\)', rep, e)


def r3_vat(e):
    up = f"translate(cbc:ID,'{LOWER}','{UPPER}')"
    e = re.sub(r'(?<![\w:/.@-])(' + PATH + r')/normalize-space\(upper-case\(cbc:ID\)\)\s*(!=|=)\s*([\'"])VAT\3',
               lambda m: f"boolean({m.group(1)}[normalize-space({up}) {m.group(2)} 'VAT'])", e)
    e = re.sub(r'(?<![\w:/.@-])(' + PATH + r')/upper-case\(cbc:ID\)\s*(!=|=)\s*([\'"])VAT\3',
               lambda m: f"boolean({m.group(1)}[{up} {m.group(2)} 'VAT'])", e)
    return e


def to_root(ctx):
    return ' | '.join(b if b.startswith('/') else '//' + b for b in (x.strip() for x in split_top(ctx)))


def transform(e):
    t = r3_vat(r2_bool(r1_exists(e)))
    return t


def main():
    zpath, read_date = sys.argv[1], sys.argv[2]
    raw = open(zpath, 'rb').read()
    z = zipfile.ZipFile(zpath)
    out = {
        'about': 'قواعد PINT AE الرسمية كما في ملفي Schematron داخل resources.zip، حرفياً، مع تعبيرين محوَّلين لمحرك XPath 1.0 في المتصفح (cx وxt). يولّده emtithali/gen/pint_rules.py.',
        'source': {
            'zip': 'https://docs.peppol.eu/poac/ae/pint-ae/resources.zip',
            'zip_sha256': hashlib.sha256(raw).hexdigest(),
            'zip_bytes': len(raw),
            'spec': 'PINT AE Billing version 1.0.4',
            'read': read_date,
        },
        'sets': [],
    }
    for key, title, page, path in SETS:
        data = z.read(path)
        cn = z.read(path.replace('trn-invoice', 'trn-creditnote'))
        assert data == cn, path + ' differs between invoice and credit note'
        root = ET.fromstring(data)
        st = {'id': key, 'title': title, 'url': BASE + page + '/', 'file': path.split('/')[-1],
              'sha256': hashlib.sha256(data).hexdigest(), 'patterns': []}
        for pat in root.iter(S + 'pattern'):
            P = {'id': pat.get('id'), 'rules': []}
            for ru in pat.findall(S + 'rule'):
                assert not ru.findall(S + 'let') and not ru.findall(S + 'report')
                ctx = ru.get('context')
                R = {'context': ctx, 'cx': transform(to_root(ctx)), 'asserts': []}
                for a in ru.findall(S + 'assert'):
                    msg = re.sub(r'\s+', ' ', ''.join(a.itertext())).strip()
                    m = re.match(r'^\[([^\]]+)\]\s*-\s*(.*)$', msg)
                    assert m and m.group(1) == a.get('id'), msg
                    aid = a.get('id')
                    R['asserts'].append({'id': aid.upper(), 'flag': a.get('flag'), 'test': a.get('test'),
                                         'xt': transform(a.get('test')), 'msg': m.group(2), 'url': BASE + aid + '/'})
                P['rules'].append(R)
            st['patterns'].append(P)
        out['sets'].append(st)
    json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
    sys.stdout.write('\n')


if __name__ == '__main__':
    main()
