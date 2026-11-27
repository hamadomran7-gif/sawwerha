// فحص عدد المزوّدين (البند 92): كل عدد مكتوب لمزوّدي قائمة وزارة المالية في صفحات امتثالي الإماراتية يساوي عدد صفحات
// الدليل site/providers/*.html، وكل صفحة مزوّد في الخريطة وفي جدولي /providers و/uae-accredited-service-providers.
// الأعداد في صفحات الدليل يولّدها gen/providers.py وgen/asp_en.py من len(ROWS)؛ وفي الصفحات المكتوبة يدوياً (الرئيسية
// و/accredited-service-provider و/choose-provider وبطاقات «دليل المزوّدين المعتمدين» …) يفحصها هذا الملف، فيفشل إن أُضيف
// مزوّد أو حُذفت صفحته ولم يتغيّر العدد في كل موضع. وعبارة «N مزوّداً» بمعنى آخر في صفحة إماراتية تفشله عمداً حتى تُعاد صياغتها.
// صفحات عُمان والسعودية (om* وsa*) خارجه لأن أعدادها لقوائم بلديهما. SITE_DIR يفحص نسخة أخرى من الموقع (تجربة حذف صفحة).
// التشغيل: cd emtithali && npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SITE = process.env.SITE_DIR || new URL("../site/", import.meta.url).pathname;
const htmlFiles = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? htmlFiles(p) : n.endsWith(".html") ? [p] : [];
});
const slugs = readdirSync(join(SITE, "providers")).filter((n) => n.endsWith(".html")).map((n) => n.slice(0, -5)).sort();
const P = slugs.length;

test("صفحات الدليل = عناوين /providers/* في الخريطة = صفوف جدولي /providers و/uae-accredited-service-providers", () => {
  assert.ok(P >= 88, `صفحات الدليل ${P}`);
  const sm = readFileSync(join(SITE, "sitemap.xml"), "utf8");
  const inMap = [...sm.matchAll(/<loc>https:\/\/emtithali\.com\/providers\/([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  assert.deepEqual(inMap, slugs);
  const ar = readFileSync(join(SITE, "providers.html"), "utf8");
  const arRows = [...ar.matchAll(/<tr><td class="num">(\d+)<\/td><td><a href="\/providers\/([^"]+)"/g)];
  assert.deepEqual(arRows.map((m) => m[2]).sort(), slugs);
  assert.deepEqual(arRows.map((m) => Number(m[1])), Array.from({ length: P }, (_, i) => i + 1));
  const en = readFileSync(join(SITE, "uae-accredited-service-providers.html"), "utf8");
  assert.deepEqual([...en.matchAll(/<a href="\/providers\/([^"]+)">Arabic page<\/a>/g)].map((m) => m[1]).sort(), slugs);
});

const PATTERNS = [
  /(\d+) مزوّداً/g,                                   // «90 مزوّداً معتمداً» و«(90 مزوّداً)» و«القائمة كاملة: 90 مزوّداً»
  /<strong>(\d+)<\/strong> (?:مزوّداً|accredited providers)/g,
  /من هم الـ(\d+)/g,
  /(?:ترتيبه \d+|<td>\d+) من (\d+)/g,                 // صفحة كل مزوّد: «ترتيبه 12 من 90» و«12 من 90»
  /\b(\d+) (?:on the Ministry|providers, as we read)/g,
  /\b(?:All|the|has) (\d+) (?:eInvoicing|on the|providers)/g,
];

test("كل عدد مكتوب لمزوّدي القائمة في الصفحات الإماراتية يساوي عدد صفحات الدليل", () => {
  const files = htmlFiles(SITE).filter((f) => !/^(om|sa)([/.]|$)/.test(relative(SITE, f)));
  const bad = [];
  let seen = 0;
  for (const f of files) {
    const s = readFileSync(f, "utf8");
    for (const re of PATTERNS) {
      for (const m of s.matchAll(re)) {
        seen++;
        if (Number(m[1]) !== P) bad.push(`${relative(SITE, f)}: «${m[0]}» ≠ ${P}`);
      }
    }
  }
  assert.ok(seen > 2 * P, `عبارات العدد ${seen}`);
  assert.deepEqual(bad.slice(0, 25), []);
});
