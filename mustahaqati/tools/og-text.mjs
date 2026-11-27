// نص صورة المعاينة (Open Graph) لكل صفحة وبصمته، بلا خطوط ولا متصفح (البند 88).
// يستعمله tools/og.mjs للرسم، وtests/og.test.js ليفشل حين يتغيّر نص صفحة عمّا رُسمت منه صورتها.
// البصمة من النص الظاهر في الصورة وحده (العنوان والسطر الثاني والشارة واللغة) ورقم القالب،
// لا من HTML القالب ولا من مسار الخطوط، فتتطابق على أي جهاز.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const PAGES = path.join(ROOT, "src", "pages");
export const OUT = path.join(ROOT, "src", "assets", "og");
export const MANIFEST = path.join(OUT, "manifest.json");
// يُرفع رقم القالب عند أي تغيير في شكل الصورة في og.mjs، فتُعاد كل الصور
export const VERSION = "v3";
export const COUNTRY = { ae: "الإمارات", sa: "السعودية", qa: "قطر", kw: "الكويت", om: "عُمان", bh: "البحرين", gcc: "الخليج", all: "عام" };
export const COUNTRY_EN = { ae: "UAE", sa: "Saudi Arabia", qa: "Qatar", kw: "Kuwait", om: "Oman", bh: "Bahrain", gcc: "GCC", all: "General" };

export function readMeta(file) {
  const raw = fs.readFileSync(path.join(PAGES, file), "utf8");
  const m = raw.match(/^---json\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) return null;
  const meta = JSON.parse(m[1]);
  meta.slug = meta.slug || file.replace(/\.html$/, "");
  return meta;
}

// الصفحات التي لها صورة: كل صفحة مفهرسة عدا التضمين و404
export function ogPages() {
  const out = [];
  for (const f of fs.readdirSync(PAGES).filter((x) => x.endsWith(".html")).sort()) {
    const meta = readMeta(f);
    if (!meta || meta.noindex || meta.embedOf || meta.slug === "404") continue;
    out.push(meta);
  }
  return out;
}

export function ogText(meta) {
  const en = meta.lang === "en";
  const C = en ? COUNTRY_EN : COUNTRY;
  return {
    title: meta.h1 || meta.title,
    sub: meta.short || "",
    chip: meta.hub ? C[meta.hub] : C[meta.country] || "",
    en,
  };
}

export function fingerprint(meta) {
  const t = ogText(meta);
  return crypto.createHash("sha1").update(JSON.stringify([VERSION, t.en ? "en" : "ar", t.title, t.sub, t.chip])).digest("hex").slice(0, 16);
}

export function readManifest() {
  return fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
}
