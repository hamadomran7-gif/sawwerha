#!/usr/bin/env node
/**
 * مولّد موقع «مستحقاتي» — بدون أي اعتماديات خارجية.
 * الاستخدام:  node build.js            → يبني المجلد dist/
 *             node build.js --check    → يبني ويتحقق من الروابط الداخلية
 *
 * كل صفحة في src/pages/<slug>.html تبدأ بكتلة JSON بين السطرين ---json و ---
 * تصف العنوان والوصف والأسئلة الشائعة والمصادر، ثم يأتي محتوى الصفحة (HTML).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "src");
let DIST = path.join(ROOT, "dist");
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "site.json"), "utf8"));
const rules = JSON.parse(fs.readFileSync(path.join(SRC, "rules.json"), "utf8"));
const layout = fs.readFileSync(path.join(SRC, "layout.html"), "utf8");

const COUNTRY_NAMES = { ae: "الإمارات", sa: "السعودية", gcc: "الخليج", all: "عام" };
const CATEGORY_NAMES = {
  eos: "نهاية الخدمة",
  salary: "الراتب والتأمينات",
  leave: "الإجازات والعمل الإضافي",
  finance: "القروض والتمويل",
  property: "العقار",
  tax: "الضرائب",
  tools: "أدوات عامة",
};

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readPages() {
  const dir = path.join(SRC, "pages");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".html"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const m = raw.match(/^---json\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
      if (!m) throw new Error(`الصفحة ${f} بلا كتلة JSON في بدايتها`);
      const meta = JSON.parse(m[1]);
      meta.slug = meta.slug || f.replace(/\.html$/, "");
      meta.updated = meta.updated || site.lastReview;
      return { meta, body: m[2] };
    });
}

// في وضع المعاينة (--preview) تُكتب الروابط صريحة إلى index.html لأن مضيف المعاينة لا يخدم الفهارس تلقائياً
let PREVIEW = false;
const ix = () => (PREVIEW ? "index.html" : "");
function pageUrl(meta) {
  return meta.slug === "index" ? ix() : `${meta.slug}/${ix()}`;
}

function render(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : ""));
}

function faqJsonLd(meta) {
  if (!meta.faq || !meta.faq.length) return "";
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: meta.faq.map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a },
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function breadcrumbJsonLd(meta, abs) {
  const items = [{ "@type": "ListItem", position: 1, name: site.name, item: site.domain + "/" }];
  if (meta.slug !== "index") items.push({ "@type": "ListItem", position: 2, name: meta.h1 || meta.title, item: abs });
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  })}</script>`;
}

function faqHtml(meta) {
  if (!meta.faq || !meta.faq.length) return "";
  return `<section class="faq" aria-labelledby="faq-h"><h2 id="faq-h">أسئلة شائعة</h2>${meta.faq
    .map((q) => `<details><summary>${esc(q.q)}</summary><div class="faq-a"><p>${esc(q.a)}</p></div></details>`)
    .join("")}</section>`;
}

function sourcesHtml(meta) {
  if (!meta.sources || !meta.sources.length) return "";
  return `<section class="sources" aria-labelledby="src-h"><h2 id="src-h">المصادر</h2><ul>${meta.sources
    .map((s) => `<li><a href="${esc(s.u)}" rel="noopener nofollow" target="_blank">${esc(s.t)}</a>${s.d ? ` <span class="muted">(${esc(s.d)})</span>` : ""}</li>`)
    .join("")}</ul><p class="muted small">آخر مراجعة للأرقام والمعادلات في هذه الصفحة: ${esc(meta.updated)}.</p></section>`;
}

function relatedHtml(meta, pages, root) {
  if (!meta.related || !meta.related.length) return "";
  const items = meta.related
    .map((slug) => pages.find((p) => p.meta.slug === slug))
    .filter(Boolean)
    .map((p) => `<li><a href="${root}${pageUrl(p.meta)}">${esc(p.meta.h1 || p.meta.title)}</a></li>`)
    .join("");
  return `<section class="related" aria-labelledby="rel-h"><h2 id="rel-h">حاسبات ذات صلة</h2><ul>${items}</ul></section>`;
}

function toolCards(pages, root, filter) {
  const tools = pages.filter((p) => p.meta.tool && filter(p.meta));
  return tools
    .map(
      (p) => `<a class="card" href="${root}${pageUrl(p.meta)}">
  <span class="chip chip-${p.meta.country || "gcc"}">${COUNTRY_NAMES[p.meta.country] || "الخليج"}</span>
  <strong>${esc(p.meta.h1 || p.meta.title)}</strong>
  <span class="muted">${esc(p.meta.short || p.meta.description)}</span>
</a>`
    )
    .join("\n");
}

function homeSections(pages, root) {
  const order = ["eos", "salary", "leave", "finance", "property", "tax", "tools"];
  return order
    .map((cat) => {
      const cards = toolCards(pages, root, (m) => m.category === cat);
      if (!cards) return "";
      return `<section class="group" aria-labelledby="g-${cat}"><h2 id="g-${cat}">${CATEGORY_NAMES[cat]}</h2><div class="cards">${cards}</div></section>`;
    })
    .join("\n");
}

function build({ check = false, preview = false } = {}) {
  PREVIEW = preview;
  DIST = preview ? path.join(ROOT, "dist-preview") : path.join(ROOT, "dist");
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  // الأصول: نولّد rules.js من rules.json حتى تستورده الحاسبات مباشرة
  fs.writeFileSync(
    path.join(SRC, "assets", "rules.js"),
    `// ملف مولّد آلياً من src/rules.json — لا تعدّله يدوياً\nexport default ${JSON.stringify(rules, null, 2)};\n`
  );
  fs.cpSync(path.join(SRC, "assets"), path.join(DIST, "assets"), { recursive: true });

  const pages = readPages();
  const urls = [];

  for (const p of pages) {
    const { meta } = p;
    const isHome = meta.slug === "index";
    const isNotFound = meta.slug === "404";
    // صفحة 404 تُقدَّم من أي مسار، فروابطها مطلقة
    const root = isHome ? "" : isNotFound ? "/" : "../";
    const abs = site.domain + "/" + pageUrl(meta);
    let body = p.body;

    // أقسام يولّدها البناء
    body = body
      .replace("{{home_sections}}", isHome ? homeSections(pages, root) : "")
      .replace(/\{\{root\}\}/g, root)
      .replace(/\{\{ix\}\}/g, ix())
      .replace(/\{\{email\}\}/g, site.contactEmail)
      .replace(/\{\{domain\}\}/g, site.domain);

    const main = isHome
      ? body
      : `${body}${faqHtml(meta)}${sourcesHtml(meta)}${relatedHtml(meta, pages, root)}`;

    const html = render(layout, {
      lang: site.lang,
      title: esc(meta.title),
      description: esc(meta.description),
      canonical: abs,
      root,
      home: root + ix() || "./",
      ix: ix(),
      siteName: esc(site.name),
      tagline: esc(site.tagline),
      h1: esc(meta.h1 || meta.title),
      lead: meta.lead ? `<p class="lead">${esc(meta.lead)}</p>` : "",
      breadcrumb: isHome
        ? ""
        : `<nav class="crumbs" aria-label="مسار التنقل"><a href="${root}${ix()}">الرئيسية</a><span>›</span><span>${esc(
            COUNTRY_NAMES[meta.country] || "الخليج"
          )}</span><span>›</span><span aria-current="page">${esc(meta.h1 || meta.title)}</span></nav>`,
      main,
      jsonld: faqJsonLd(meta) + breadcrumbJsonLd(meta, abs),
      year: String(new Date().getFullYear()),
      updated: esc(meta.updated),
      bodyClass: isHome ? "home" : `page page-${meta.slug}`,
      pageScript: meta.script ? `<script type="module" src="${root}assets/pages/${meta.script}"></script>` : "",
      noindex: meta.noindex ? '<meta name="robots" content="noindex">' : "",
    });

    if (isNotFound) {
      fs.writeFileSync(path.join(DIST, "404.html"), html);
      continue;
    }
    const outDir = isHome ? DIST : path.join(DIST, meta.slug);
    fs.mkdirSync(outDir, { recursive: true });
    let out = html;
    if (isHome && preview) {
      // صفحة المعاينة الرئيسية تُغلَّف بهيكل المضيف، فنكتفي بمحتوى الرأس والجسم
      const head = html.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/<meta charset[^>]*>|<meta name="viewport"[^>]*>|<title>[\s\S]*?<\/title>/g, "");
      const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)[1];
      out = `<title>${esc(site.name)}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${head}\n<div dir="rtl" lang="ar" class="home">${body}</div>`;
    }
    fs.writeFileSync(path.join(outDir, "index.html"), out);
    if (!meta.noindex) urls.push({ loc: abs, lastmod: meta.updated, priority: isHome ? "1.0" : meta.tool ? "0.8" : "0.3" });
  }

  // sitemap + robots + 404
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`)
    .join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap);
  fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`);
  fs.writeFileSync(path.join(DIST, "_headers"), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n`);

  if (check) checkLinks(pages);
  console.log(`تم البناء: ${pages.length} صفحة → ${path.relative(ROOT, DIST)}/`);
}

function checkLinks(pages) {
  const slugs = new Set(pages.map((p) => p.meta.slug));
  let bad = 0;
  for (const p of pages) {
    const file = p.meta.slug === "404" ? path.join(DIST, "404.html") : path.join(DIST, p.meta.slug === "index" ? "" : p.meta.slug, "index.html");
    const html = fs.readFileSync(file, "utf8");
    const re = /href="(\.\.\/|\.\/)?([a-z0-9-]+)\/"/g;
    let m;
    while ((m = re.exec(html))) {
      if (m[2] === "assets") continue;
      if (!slugs.has(m[2])) {
        console.error(`رابط داخلي مكسور في ${p.meta.slug}: ${m[0]}`);
        bad++;
      }
    }
  }
  if (bad) {
    console.error(`${bad} رابط مكسور`);
    process.exit(1);
  }
  console.log("كل الروابط الداخلية سليمة.");
}

build({ check: process.argv.includes("--check"), preview: process.argv.includes("--preview") });
