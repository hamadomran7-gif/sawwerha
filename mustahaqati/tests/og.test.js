// صور المعاينة (البند 88): لكل صفحة مفهرسة صورة في src/assets/og، وبصمة نصها في manifest.json مطابقة لنصها الحالي.
// يفشل حين يتغيّر العنوان أو السطر الثاني (short) أو الشارة بلا رسم صورتها، ولا يحتاج خطوطاً ولا متصفحاً.
// الإصلاح عند الفشل: FONT_DIR=<google/fonts/ofl> node tools/og.mjs --only=<المعرّفات>
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { OUT, ogPages, fingerprint, readManifest } from "../tools/og-text.mjs";

test("لكل صفحة مفهرسة صورة معاينة مرسومة من نصها الحالي", () => {
  const manifest = readManifest();
  const missing = [];
  const stale = [];
  for (const meta of ogPages()) {
    if (!fs.existsSync(path.join(OUT, `${meta.slug}.jpg`))) missing.push(meta.slug);
    else if (manifest[meta.slug] !== fingerprint(meta)) stale.push(meta.slug);
  }
  assert.deepEqual(missing, [], `صفحات بلا صورة معاينة: ${missing.join(" ")} — node tools/og.mjs --only=${missing.join(",")}`);
  assert.deepEqual(stale, [], `صور معاينة أقدم من نصوص صفحاتها: ${stale.join(" ")} — node tools/og.mjs --only=${stale.join(",")}`);
});

test("البصمة من نص الصورة وحده: لا يغيّرها مسار الخطوط، ويغيّرها السطر الثاني والشارة واللغة", () => {
  const meta = { slug: "x", h1: "عنوان", short: "سطر", country: "ae" };
  const before = fingerprint(meta);
  const saved = process.env.FONT_DIR;
  process.env.FONT_DIR = "/another/machine/fonts/ofl";
  assert.equal(fingerprint(meta), before);
  if (saved === undefined) delete process.env.FONT_DIR;
  else process.env.FONT_DIR = saved;
  assert.notEqual(fingerprint({ ...meta, short: "سطر آخر" }), before);
  assert.notEqual(fingerprint({ ...meta, country: "sa" }), before);
  assert.notEqual(fingerprint({ ...meta, lang: "en" }), before);
});
