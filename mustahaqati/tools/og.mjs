// يولّد صور المعاينة (Open Graph) لكل صفحة: 1200×630 JPEG في src/assets/og/<slug>.jpg
// الاستخدام: FONT_DIR=/path/to/google-fonts/ofl node tools/og.mjs [--force]
// يعيد التوليد فقط للصفحات التي تغيّر عنوانها أو وصفها (manifest.json).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PAGES = path.join(ROOT, "src", "pages");
const OUT = path.join(ROOT, "src", "assets", "og");
const FONT_DIR = process.env.FONT_DIR;
const FORCE = process.argv.includes("--force");
const VERSION = "v2";
const COUNTRY = { ae: "الإمارات", sa: "السعودية", qa: "قطر", kw: "الكويت", om: "عُمان", bh: "البحرين", gcc: "الخليج", all: "عام" };

if (!FONT_DIR || !fs.existsSync(path.join(FONT_DIR, "ibmplexsansarabic"))) {
  console.error("FONT_DIR يجب أن يشير إلى مجلد ofl من google/fonts (فيه ibmplexsansarabic وnotokufiarabic)");
  process.exit(1);
}
const font = (p) => pathToFileURL(path.join(FONT_DIR, p)).href;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function readMeta(file) {
  const raw = fs.readFileSync(path.join(PAGES, file), "utf8");
  const m = raw.match(/^---json\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) return null;
  const meta = JSON.parse(m[1]);
  meta.slug = meta.slug || file.replace(/\.html$/, "");
  return meta;
}

function html(meta) {
  const title = meta.h1 || meta.title;
  const sub = meta.short || "";
  const chip = meta.hub ? COUNTRY[meta.hub] : COUNTRY[meta.country] || "";
  const size = title.length > 60 ? 54 : title.length > 42 ? 62 : 72;
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:Plex;font-weight:500;src:url("${font("ibmplexsansarabic/IBMPlexSansArabic-Medium.ttf")}")}
@font-face{font-family:Plex;font-weight:700;src:url("${font("ibmplexsansarabic/IBMPlexSansArabic-Bold.ttf")}")}
@font-face{font-family:Kufi;font-weight:100 900;src:url("${font("notokufiarabic/NotoKufiArabic[wght].ttf")}")}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden}
body{font-family:Plex,sans-serif;color:#fff;background:linear-gradient(135deg,#0f6b5c 0%,#0b5246 60%,#093f37 100%);position:relative;overflow:hidden}
.bg{position:absolute;inset:0;overflow:hidden}
.c1,.c2{position:absolute;border-radius:50%;background:rgba(255,255,255,.06)}
.c1{width:520px;height:520px;left:-160px;bottom:-220px}
.c2{width:300px;height:300px;left:140px;top:-150px;background:rgba(255,255,255,.04)}
.wrap{position:absolute;inset:56px 72px;display:flex;flex-direction:column}
.top{display:flex;align-items:center;gap:16px}
.brand{font-family:Kufi;font-weight:800;font-size:44px;letter-spacing:0}
.logo{width:56px;height:56px}
.chip{margin-inline-start:auto;font-weight:700;font-size:26px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:6px 22px}
h1{margin-top:auto;font-weight:700;font-size:${size}px;line-height:1.28;max-width:1056px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.sub{margin-top:18px;font-weight:500;font-size:30px;line-height:1.45;color:#d6efe7;max-width:1000px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.foot{margin-top:28px;display:flex;align-items:center;justify-content:space-between;font-size:24px;color:#bfe3d8}
.dom{direction:ltr;font-weight:700;color:#fff;font-size:26px}
</style></head><body><div class="bg"><div class="c1"></div><div class="c2"></div></div><div class="wrap">
<div class="top"><svg class="logo" viewBox="0 0 32 32"><rect x="3" y="5" width="26" height="22" rx="5" fill="#fff" opacity=".18"/><path d="M9 13h14M9 18h10M9 23h6" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg><span class="brand">مستحقاتي</span>${chip ? `<span class="chip">${esc(chip)}</span>` : ""}</div>
<h1>${esc(title)}</h1>
${sub ? `<p class="sub">${esc(sub)}</p>` : ""}
<div class="foot"><span>حاسبة مجانية · كل رقم بمادته القانونية</span><span class="dom">mustahaqati.org</span></div>
</div></body></html>`;
}

const manifestPath = path.join(OUT, "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
const todo = [];
for (const f of fs.readdirSync(PAGES).filter((x) => x.endsWith(".html"))) {
  const meta = readMeta(f);
  if (!meta || meta.noindex || meta.embedOf || meta.slug === "404") continue;
  const page = html(meta);
  const hash = crypto.createHash("sha1").update(VERSION + page).digest("hex").slice(0, 16);
  const out = path.join(OUT, `${meta.slug}.jpg`);
  if (!FORCE && manifest[meta.slug] === hash && fs.existsSync(out)) continue;
  todo.push({ meta, page, hash, out });
}
if (!todo.length) {
  console.log("صور المعاينة محدثة.");
  process.exit(0);
}
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const tab = await ctx.newPage();
for (const t of todo) {
  await tab.setContent(t.page, { waitUntil: "load" });
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: t.out, type: "jpeg", quality: 86 });
  manifest[t.meta.slug] = t.hash;
  console.log("✓", t.meta.slug);
}
await browser.close();
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + "\n");
console.log(`تم توليد ${todo.length} صورة.`);
