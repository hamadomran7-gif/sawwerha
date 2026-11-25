// فحص ما بعد البناء (البند 76): لا تُنسب إلى صفحة وزارة المالية تواريخ تعديل في أي صفحة من emtithali/site.
// ختم «آخر تحديث في …» في تذييل mof.gov.ae عام لموقع الوزارة كله، ووسم article:modified_time لصفحة القائمة يتقدّم وحده
// (2026-11-18 ثم 2026-11-19 ثم 2026-11-25T03:54:31+00:00) والقائمة لم تتغيّر (بصمتها في رأس gen/providers.py).
// فالصفحات تذكر تاريخ قراءتنا وحده («قرأنا القائمة يوم …»)، وتغيّر القائمة يُعرف بالبصمة لا بتاريخ (البند 70 والبند 76).
// التشغيل: cd emtithali && npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SITE = new URL("../site/", import.meta.url).pathname;
const htmlFiles = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? htmlFiles(p) : n.endsWith(".html") ? [p] : [];
});

// العبارات الممنوعة: تاريخ تعديل أو تحديث منسوب إلى صفحة الوزارة أو إلى قائمتها.
const BANNED = [
  "آخر تعديل لصفحتها",
  "تعديل لصفحتها",
  "آخر تحديث للقائمة",
  "page last modified",
  "page last updated",
  "Ministry’s page last",
  "Ministry's page last",
];

test("لا تاريخ تعديل منسوب إلى صفحة وزارة المالية في أي صفحة HTML", () => {
  const files = htmlFiles(SITE);
  assert.ok(files.length > 100, `عدد الصفحات ${files.length}`);
  const hits = [];
  for (const f of files) {
    const s = readFileSync(f, "utf8");
    const low = s.toLowerCase();
    for (const b of BANNED) if (low.includes(b.toLowerCase())) hits.push(`${relative(SITE, f)}: «${b}»`);
  }
  assert.deepEqual(hits, []);
});
