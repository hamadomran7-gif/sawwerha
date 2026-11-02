#!/usr/bin/env node
/**
 * مولّد موقع «مستحقاتي» — بدون أي اعتماديات خارجية.
 * الاستخدام:  node build.js            → يبني المجلد dist/
 *             node build.js --check    → يبني ويتحقق من الروابط الداخلية
 *
 * كل صفحة في src/pages/<slug>.html تبدأ بكتلة JSON بين السطرين ---json و ---
 * تصف العنوان والوصف والأسئلة الشائعة والمصادر، ثم يأتي محتوى الصفحة (HTML).
 *
 * حقول اختيارية في كتلة JSON:
 *   hub: "ae"            صفحة محورية لدولة: {{hub_list}} يُستبدل بكل صفحاتها
 *   parent: "<slug>"     صفحة سيناريو تابعة لحاسبة (تظهر في «حالات شائعة» داخل الحاسبة الأم)
 *   article: true        مقال/بيانات (يحصل على Article في البيانات المنظمة)
 *   embed: "<slug>"      (في الحاسبة الأم) اسم صفحة التضمين لعرض كود «أضف الحاسبة إلى موقعك»
 *   embedOf: "<slug>"    (في صفحة التضمين) الحاسبة الأصلية؛ تُبنى بقالب مختصر بلا إعلانات
 *   path: "a/b"          مسار مخصص بدلاً من slug
 *
 * أجزاء قابلة لإعادة الاستخدام: {{partial:<name> key=value ...}} من src/partials/<name>.html
 * جداول محسوبة من المعادلات نفسها: {{table:<name> key=value ...}} (انظر TABLES أدناه)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "src");
let DIST = path.join(ROOT, "dist");
const site = JSON.parse(fs.readFileSync(path.join(SRC, "..", "site.json"), "utf8"));
const rules = JSON.parse(fs.readFileSync(path.join(SRC, "rules.json"), "utf8"));
const layout = fs.readFileSync(path.join(SRC, "layout.html"), "utf8");
const layoutEmbed = fs.readFileSync(path.join(SRC, "layout-embed.html"), "utf8");

const COUNTRY_NAMES = { ae: "الإمارات", sa: "السعودية", gcc: "الخليج", qa: "قطر", kw: "الكويت", om: "عُمان", bh: "البحرين", all: "عام" };
const CURRENCY = { ae: "AED", sa: "SAR", qa: "QAR", kw: "KWD", om: "OMR", bh: "BHD", gcc: "AED" };
const CATEGORY_NAMES = {
  eos: "نهاية الخدمة",
  salary: "الراتب والتأمينات",
  leave: "الإجازات والعمل الإضافي",
  finance: "القروض والتمويل",
  property: "العقار",
  tax: "الضرائب",
  tools: "أدوات عامة",
};
const CATEGORY_ORDER = ["eos", "salary", "leave", "finance", "property", "tax", "tools"];

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
    .sort()
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
const pagePath = (meta) => meta.path || meta.slug;
function pageUrl(meta) {
  return meta.slug === "index" ? ix() : `${pagePath(meta)}/${ix()}`;
}
function rootFor(meta) {
  if (meta.slug === "index") return "";
  if (meta.slug === "404") return "/";
  return "../".repeat(pagePath(meta).split("/").length);
}

function render(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : ""));
}

/** صفحة محتوى (تظهر في الروابط والمحاور والبيانات المنظمة) — تُستبعد الصفحات القانونية والتضمين. */
function isContent(m) {
  return !m.noindex && !m.embedOf && m.slug !== "index" && m.slug !== "404" && !!(m.tool || m.parent || m.hub || m.article);
}

/* ------------------------------------------------------------------ */
/* الأجزاء القابلة لإعادة الاستخدام والجداول المحسوبة                  */
/* ------------------------------------------------------------------ */

function parseArgs(s) {
  const out = {};
  for (const m of String(s || "").matchAll(/([\w-]+)=("[^"]*"|\S+)/g)) out[m[1]] = m[2].replace(/^"|"$/g, "");
  return out;
}

function renderPartial(name, params) {
  const file = path.join(SRC, "partials", `${name}.html`);
  let raw = fs.readFileSync(file, "utf8");
  let defaults = {};
  const dm = raw.match(/^<!--defaults\s+(\{[\s\S]*?\})\s*-->\s*\n?/);
  if (dm) {
    defaults = JSON.parse(dm[1]);
    raw = raw.slice(dm[0].length);
  }
  const vals = { ...defaults, ...params };
  return raw
    .replace(/\{\{(\w+)=([\w-]+)\}\}/g, (_, k, v) => (String(vals[k]) === v ? " selected" : ""))
    .replace(/\{\{(\w+)\}\}/g, (all, k) => (k in vals ? esc(vals[k]) : all));
}

const fmt0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const yearsLabel = (y) => {
  const whole = Math.floor(y + 1e-9);
  const months = Math.round((y - whole) * 12);
  const ys = whole === 0 ? "" : whole === 1 ? "سنة" : whole === 2 ? "سنتان" : whole <= 10 ? `${whole} سنوات` : `${whole} سنة`;
  const ms = months === 0 ? "" : months === 1 ? "شهر" : months === 2 ? "شهران" : months <= 10 ? `${months} أشهر` : `${months} شهراً`;
  return [ys, ms].filter(Boolean).join(" و") || "0";
};
const listNums = (s, fallback) => (s ? String(s).split(",").map(Number) : fallback);
const tableWrap = (caption, head, rows) =>
  `<div class="table-scroll"><table class="data">${caption ? `<caption>${caption}</caption>` : ""}<thead><tr>${head
    .map((h) => `<th scope="col">${h}</th>`)
    .join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`).join("")}</tbody></table></div>`;

let calc = null;
const TABLES = {
  /** مكافأة الإمارات: صفوف = سنوات الخدمة، أعمدة = الراتب الأساسي */
  "uae-gratuity-grid"(a) {
    const salaries = listNums(a.salaries, [3000, 5000, 8000, 10000, 15000, 20000, 30000]);
    const years = listNums(a.years, [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30]);
    const rows = years.map((y) => [yearsLabel(y), ...salaries.map((s) => fmt0.format(calc.uaeGratuity({ basicSalary: s, years: y }).total))]);
    return tableWrap(a.caption || "المكافأة بالدرهم (مقرّبة لأقرب درهم)", ["مدة الخدمة", ...salaries.map((s) => `أساسي ${fmt0.format(s)}`)], rows);
  },
  /** مكافأة الإمارات لراتب واحد عبر عدة مدد */
  "uae-gratuity-years"(a) {
    const basic = Number(a.basic || 8000);
    const years = listNums(a.years, [1, 2, 3, 4, 5, 7, 10]);
    const rows = years.map((y) => {
      const g = calc.uaeGratuity({ basicSalary: basic, years: y });
      return [yearsLabel(y), fmt0.format(g.firstDays + g.secondDays), fmt0.format(g.total)];
    });
    return tableWrap(a.caption || `راتب أساسي ${fmt0.format(basic)} درهم`, ["مدة الخدمة", "أيام الأجر المستحقة", "المكافأة (درهم)"], rows);
  },
  /** أثر أيام الإجازة بدون راتب على المكافأة الإماراتية */
  "uae-unpaid-impact"(a) {
    const basic = Number(a.basic || 6000);
    const start = a.start || "2021-01-01";
    const end = a.end || "2025-12-31";
    const days = listNums(a.days, [0, 30, 60, 90, 180, 365]);
    const rows = days.map((u) => {
      const d = calc.serviceDuration(start, end, u);
      const g = calc.uaeGratuity({ basicSalary: basic, years: d.decimalYears });
      return [fmt0.format(u), `${d.years} س ${d.months} ش ${d.days} ي`, g.eligible ? fmt0.format(g.total) : "لا تُستحق"];
    });
    return tableWrap(a.caption || "", ["أيام بدون راتب", "مدة الخدمة المحتسبة", "المكافأة (درهم)"], rows);
  },
  /** السعودية: المكافأة الكاملة مقابل مكافأة الاستقالة */
  "ksa-resignation-grid"(a) {
    const wage = Number(a.wage || 10000);
    const years = listNums(a.years, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
    const rows = years.map((y) => {
      const full = calc.ksaEndOfService({ wage, years: y, reason: "contract_end" });
      const res = calc.ksaEndOfService({ wage, years: y, reason: "resignation" });
      const frac = res.fraction === 1 ? "كاملة" : res.fraction === 0 ? "لا شيء" : res.fraction > 0.5 ? "الثلثان" : "الثلث";
      return [yearsLabel(y), fmt0.format(full.total), frac, fmt0.format(res.total), fmt0.format(full.total - res.total)];
    });
    return tableWrap(a.caption || `أجر فعلي أخير ${fmt0.format(wage)} ريال`, ["مدة الخدمة", "المكافأة الكاملة", "نسبة الاستقالة", "مكافأة الاستقالة", "الفرق"], rows);
  },
  /** السعودية: اللحظات الفاصلة في الاستقالة */
  "ksa-resignation-thresholds"(a) {
    const wage = Number(a.wage || 10000);
    const pairs = [
      [1 + 11 / 12, 2],
      [5, 5 + 1 / 12],
      [9 + 11 / 12, 10],
    ];
    const rows = pairs.map(([y1, y2]) => {
      const r1 = calc.ksaEndOfService({ wage, years: y1, reason: "resignation" }).total;
      const r2 = calc.ksaEndOfService({ wage, years: y2, reason: "resignation" }).total;
      return [`${yearsLabel(y1)} ← ${yearsLabel(y2)}`, fmt0.format(r1), fmt0.format(r2), `+${fmt0.format(r2 - r1)}`];
    });
    return tableWrap(a.caption || `أجر ${fmt0.format(wage)} ريال`, ["الانتقال", "قبل", "بعد", "الزيادة"], rows);
  },
  /** مقارنة دول الخليج الست لأجر 10,000 بالعملة المحلية */
  "gcc-compare"(a) {
    const w = Number(a.wage || 10000);
    const years = listNums(a.years, [1, 3.5, 5, 12, 25]);
    const om = (y) => w * y * rules.om.eos.currentMonthsPerYear;
    const bh = (y) => w * (Math.min(y, rules.bh.eos.firstYears) * rules.bh.eos.monthsFirst + Math.max(0, y - rules.bh.eos.firstYears) * rules.bh.eos.monthsAfter);
    const rowsFor = (reason) =>
      years.map((y) => [
        yearsLabel(y),
        fmt0.format(calc.uaeGratuity({ basicSalary: w, years: y }).total),
        fmt0.format(calc.ksaEndOfService({ wage: w, years: y, reason: reason === "resignation" ? "resignation" : "contract_end" }).total),
        fmt0.format(calc.qatarGratuity({ basicSalary: w, years: y }).total),
        fmt0.format(calc.kuwaitIndemnity({ wage: w, years: y, reason }).total),
        fmt0.format(om(y)),
        fmt0.format(bh(y)),
      ]);
    const head = ["مدة الخدمة", "الإمارات", "السعودية", "قطر", "الكويت", "عُمان", "البحرين"];
    return (
      tableWrap(`إنهاء من صاحب العمل أو انتهاء العقد — أجر ${fmt0.format(w)} بالعملة المحلية`, head, rowsFor("employer")) +
      tableWrap(`استقالة العامل — أجر ${fmt0.format(w)} بالعملة المحلية`, head, rowsFor("resignation"))
    );
  },
  /** السعودية: استقالة عادية مقابل استثناء المادة 87 */
  "ksa-art87-compare"(a) {
    const wage = Number(a.wage || 8000);
    const years = listNums(a.years, [1, 2, 3, 4, 6, 8]);
    const rows = years.map((y) => {
      const res = calc.ksaEndOfService({ wage, years: y, reason: "resignation" }).total;
      const a87 = calc.ksaEndOfService({ wage, years: y, reason: "resignation_marriage" }).total;
      return [yearsLabel(y), fmt0.format(res), fmt0.format(a87), `+${fmt0.format(a87 - res)}`];
    });
    return tableWrap(a.caption || `أجر فعلي ${fmt0.format(wage)} ريال`, ["مدة الخدمة", "استقالة عادية (م85)", "زواج أو وضع (م87)", "الفرق"], rows);
  },
};

function expandBlocks(body) {
  return body
    .replace(/\{\{partial:([\w-]+)([^}]*)\}\}/g, (_, name, args) => renderPartial(name, parseArgs(args)))
    .replace(/\{\{table:([\w-]+)([^}]*)\}\}/g, (_, name, args) => {
      if (!TABLES[name]) throw new Error(`جدول غير معروف: ${name}`);
      return TABLES[name](parseArgs(args));
    });
}

/* ------------------------------------------------------------------ */
/* التنقل: مسار التنقل، المحاور، الصفحات ذات الصلة                     */
/* ------------------------------------------------------------------ */

function crumbsFor(meta, pages) {
  const items = [{ name: "الرئيسية", page: pages.find((p) => p.meta.slug === "index").meta }];
  const hub = pages.find((p) => p.meta.hub && p.meta.hub === meta.country);
  if (meta.hub) {
    // المحور نفسه
  } else if (hub) items.push({ name: COUNTRY_NAMES[meta.country], page: hub.meta });
  else items.push({ name: COUNTRY_NAMES[meta.country] || "الخليج" });
  const parent = meta.parent && pages.find((p) => p.meta.slug === meta.parent);
  if (parent) items.push({ name: parent.meta.h1 || parent.meta.title, page: parent.meta });
  items.push({ name: meta.h1 || meta.title, current: true });
  return items;
}

function crumbsHtml(items, root) {
  return `<nav class="crumbs" aria-label="مسار التنقل">${items
    .map((it) =>
      it.current
        ? `<span aria-current="page">${esc(it.name)}</span>`
        : it.page
        ? `<a href="${root}${pageUrl(it.page)}">${esc(it.name)}</a>`
        : `<span>${esc(it.name)}</span>`
    )
    .join("<span>›</span>")}</nav>`;
}

function relatedFor(meta, pages) {
  const by = new Map(pages.map((p) => [p.meta.slug, p.meta]));
  const out = [];
  const add = (slug) => {
    const m = by.get(slug);
    if (!m || slug === meta.slug || out.includes(slug) || !isContent(m) || m.hub) return;
    out.push(slug);
  };
  if (meta.parent) {
    add(meta.parent);
    pages.filter((p) => p.meta.parent === meta.parent).forEach((p) => add(p.meta.slug));
  }
  (meta.related || []).forEach(add);
  pages.filter((p) => p.meta.tool && p.meta.country === meta.country && p.meta.category === meta.category).forEach((p) => add(p.meta.slug));
  return out.slice(0, 6).map((s) => by.get(s));
}

function relatedHtml(meta, pages, root) {
  const list = relatedFor(meta, pages);
  const hub = pages.find((p) => p.meta.hub && p.meta.hub === meta.country && !meta.hub);
  if (!list.length && !hub) return "";
  const items = list.map((m) => `<li><a href="${root}${pageUrl(m)}">${esc(m.h1 || m.title)}</a></li>`).join("");
  const hubLink = hub ? `<p class="hub-link"><a href="${root}${pageUrl(hub.meta)}">كل حاسبات ${esc(COUNTRY_NAMES[meta.country])} وحقوق الموظف فيها ←</a></p>` : "";
  return `<section class="related" aria-labelledby="rel-h"><h2 id="rel-h">حاسبات وصفحات ذات صلة</h2>${items ? `<ul>${items}</ul>` : ""}${hubLink}</section>`;
}

function scenariosHtml(meta, pages, root) {
  const kids = pages.filter((p) => p.meta.parent === meta.slug && isContent(p.meta));
  if (!kids.length) return "";
  return `<section class="scenarios" aria-labelledby="sc-h"><h2 id="sc-h">حالات شائعة بالتفصيل</h2><div class="cards">${kids
    .map((p) => `<a class="card" href="${root}${pageUrl(p.meta)}"><strong>${esc(p.meta.h1 || p.meta.title)}</strong><span class="muted">${esc(p.meta.short || p.meta.description)}</span></a>`)
    .join("")}</div></section>`;
}

function card(m, root) {
  return `<a class="card" href="${root}${pageUrl(m)}">
  <span class="chip chip-${m.country || "gcc"}">${COUNTRY_NAMES[m.country] || "الخليج"}</span>
  <strong>${esc(m.h1 || m.title)}</strong>
  <span class="muted">${esc(m.short || m.description)}</span>
</a>`;
}

function toolCards(pages, root, filter) {
  return pages
    .filter((p) => p.meta.tool && filter(p.meta))
    .map((p) => card(p.meta, root))
    .join("\n");
}

function homeSections(pages, root) {
  return CATEGORY_ORDER.map((cat) => {
    const cards = toolCards(pages, root, (m) => m.category === cat);
    if (!cards) return "";
    return `<section class="group" aria-labelledby="g-${cat}"><h2 id="g-${cat}">${CATEGORY_NAMES[cat]}</h2><div class="cards">${cards}</div></section>`;
  }).join("\n");
}

function homeHubs(pages, root) {
  const hubs = pages.filter((p) => p.meta.hub);
  if (!hubs.length) return "";
  return `<section class="group hubs" aria-labelledby="g-hubs"><h2 id="g-hubs">ابدأ من دولتك</h2><div class="cards">${hubs
    .map((p) => `<a class="card card-hub" href="${root}${pageUrl(p.meta)}"><span class="chip chip-${p.meta.hub}">${esc(COUNTRY_NAMES[p.meta.hub])}</span><strong>${esc(p.meta.h1)}</strong><span class="muted">${esc(p.meta.short || "")}</span></a>`)
    .join("")}</div></section>`;
}

function hubList(meta, pages, root) {
  const c = meta.hub;
  const mine = pages.filter((p) => isContent(p.meta) && !p.meta.hub && (p.meta.country === c || (p.meta.country === "gcc" && p.meta.tool)));
  return CATEGORY_ORDER.map((cat) => {
    const inCat = mine.filter((p) => p.meta.category === cat);
    if (!inCat.length) return "";
    // الحاسبة أولاً ثم سيناريوهاتها
    const ordered = [];
    inCat.filter((p) => !p.meta.parent).forEach((p) => {
      ordered.push(p);
      inCat.filter((k) => k.meta.parent === p.meta.slug).forEach((k) => ordered.push(k));
    });
    inCat.filter((p) => p.meta.parent && !ordered.includes(p)).forEach((p) => ordered.push(p));
    return `<section class="group" aria-labelledby="h-${cat}"><h2 id="h-${cat}">${CATEGORY_NAMES[cat]}</h2><div class="cards">${ordered.map((p) => card(p.meta, root)).join("")}</div></section>`;
  }).join("\n");
}

function embedBox(meta, pages) {
  if (!meta.embed) return "";
  const e = pages.find((p) => p.meta.slug === meta.embed);
  if (!e) return "";
  const src = `${site.domain}/${pagePath(e.meta)}/`;
  const page = `${site.domain}/${pagePath(meta)}/`;
  const code = `<iframe src="${src}" title="${esc(meta.h1)} — ${esc(site.name)}" width="100%" height="980" style="border:0;max-width:760px" loading="lazy"></iframe>\n<p style="font-size:13px">المصدر: <a href="${page}">${esc(meta.h1)} من ${esc(site.name)}</a></p>`;
  return `<section class="embed-box" aria-labelledby="emb-h"><h2 id="emb-h">أضف هذه الحاسبة إلى موقعك</h2><p>مجانية وبلا إعلانات داخلها، وتتحدّث تلقائياً عند أي تعديل قانوني. انسخ الكود والصقه في صفحتك أو مدوّنتك:</p><textarea id="embed-code" class="code" rows="4" readonly dir="ltr">${esc(code)}</textarea><div class="actions"><button class="btn secondary" type="button" data-copy="#embed-code">نسخ الكود</button></div></section>`;
}

/* ------------------------------------------------------------------ */
/* البيانات المنظمة (JSON-LD)                                         */
/* ------------------------------------------------------------------ */

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

function jsonLd(meta, abs, crumbs) {
  const orgId = site.domain + "/#org";
  const org = {
    "@type": "Organization",
    "@id": orgId,
    name: site.name,
    url: site.domain + "/",
    logo: site.domain + "/assets/favicon.svg",
    email: site.contactEmail,
  };
  const graph = [org];
  const isHome = meta.slug === "index";
  if (isHome) {
    graph.push({ "@type": "WebSite", "@id": site.domain + "/#website", url: site.domain + "/", name: site.name, description: site.tagline, inLanguage: "ar", publisher: { "@id": orgId } });
  }
  if (meta.script && !meta.embedOf) {
    graph.push({
      "@type": "WebApplication",
      name: meta.h1 || meta.title,
      url: abs,
      description: meta.description,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      inLanguage: "ar",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: CURRENCY[meta.country] || "AED" },
      publisher: { "@id": orgId },
      dateModified: meta.updated,
    });
  }
  if (isContent(meta)) {
    if (meta.hub) {
      graph.push({ "@type": "CollectionPage", name: meta.h1, url: abs, description: meta.description, inLanguage: "ar", publisher: { "@id": orgId }, dateModified: meta.updated });
    } else {
      graph.push({
        "@type": "Article",
        headline: String(meta.h1 || meta.title).slice(0, 110),
        description: meta.description,
        inLanguage: "ar",
        mainEntityOfPage: abs,
        author: { "@type": "Organization", name: `فريق ${site.name}`, url: site.domain + "/about/" },
        publisher: { "@id": orgId },
        datePublished: meta.published || meta.updated,
        dateModified: meta.updated,
      });
    }
  }
  if (!isHome && crumbs) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: crumbs
        .filter((c) => c.page || c.current)
        .map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.page && c.page.slug === "index" ? site.name : c.name,
          item: c.current ? abs : site.domain + "/" + (c.page.slug === "index" ? "" : pagePath(c.page) + "/"),
        })),
    });
  }
  if (meta.faq && meta.faq.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: meta.faq.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })),
    });
  }
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

/* ------------------------------------------------------------------ */
/* البناء                                                             */
/* ------------------------------------------------------------------ */

async function build({ check = false, preview = false } = {}) {
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
  calc = await import(pathToFileURL(path.join(SRC, "assets", "calc.js")).href);

  const pages = readPages();
  const slugs = new Set(pages.map((p) => p.meta.slug));
  for (const p of pages) {
    for (const k of ["parent", "embed", "embedOf"]) if (p.meta[k] && !slugs.has(p.meta[k])) throw new Error(`${p.meta.slug}: ${k} يشير إلى صفحة غير موجودة (${p.meta[k]})`);
  }
  const urls = [];

  for (const p of pages) {
    const { meta } = p;
    const isHome = meta.slug === "index";
    const isNotFound = meta.slug === "404";
    // صفحة 404 تُقدَّم من أي مسار، فروابطها مطلقة
    const root = rootFor(meta);
    const abs = site.domain + "/" + (isHome ? "" : pagePath(meta) + "/");
    let body = expandBlocks(p.body);

    // أقسام يولّدها البناء
    body = body
      .replace("{{home_hubs}}", isHome ? homeHubs(pages, root) : "")
      .replace("{{home_sections}}", isHome ? homeSections(pages, root) : "")
      .replace("{{hub_list}}", meta.hub ? hubList(meta, pages, root) : "")
      .replace(/\{\{root\}\}/g, root)
      .replace(/\{\{ix\}\}/g, ix())
      .replace(/\{\{email\}\}/g, site.contactEmail)
      .replace(/\{\{domain\}\}/g, site.domain);

    if (meta.embedOf) {
      const parent = pages.find((x) => x.meta.slug === meta.embedOf).meta;
      const html = render(layoutEmbed, {
        lang: site.lang,
        title: esc(meta.title),
        root,
        siteName: esc(site.name),
        main: body,
        parentUrl: site.domain + "/" + pagePath(parent) + "/",
        parentTitle: esc(parent.h1 || parent.title),
        pageScript: meta.script ? `<script type="module" src="${root}assets/pages/${meta.script}"></script>` : "",
      });
      const outDir = path.join(DIST, pagePath(meta));
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "index.html"), html);
      continue;
    }

    const crumbs = isHome || isNotFound ? null : crumbsFor(meta, pages);
    const main = isHome || isNotFound ? body : `${body}${scenariosHtml(meta, pages, root)}${faqHtml(meta)}${embedBox(meta, pages)}${sourcesHtml(meta)}${relatedHtml(meta, pages, root)}`;

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
      byline: isContent(meta)
        ? `<p class="byline">إعداد ومراجعة: <a href="${root}about/${ix()}">فريق ${esc(site.name)}</a> · آخر تحديث: <time datetime="${esc(meta.updated)}">${esc(meta.updated)}</time></p>`
        : "",
      breadcrumb: crumbs ? crumbsHtml(crumbs, root) : "",
      main,
      jsonld: jsonLd(meta, abs, crumbs),
      year: String(new Date().getFullYear()),
      updated: esc(meta.updated),
      bodyClass: isHome ? "home" : `page page-${meta.slug}`,
      pageScript: meta.script ? `<script type="module" src="${root}assets/pages/${meta.script}"></script>` : "",
      noindex: meta.noindex ? '<meta name="robots" content="noindex">' : "",
      adsense: site.adsense
        ? `<meta name="google-adsense-account" content="${site.adsense}">\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${site.adsense}" crossorigin="anonymous"></script>`
        : "",
    });

    if (isNotFound) {
      fs.writeFileSync(path.join(DIST, "404.html"), html);
      continue;
    }
    const outDir = isHome ? DIST : path.join(DIST, pagePath(meta));
    fs.mkdirSync(outDir, { recursive: true });
    let out = html;
    if (isHome && preview) {
      // صفحة المعاينة الرئيسية تُغلَّف بهيكل المضيف، فنكتفي بمحتوى الرأس والجسم
      const head = html.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/<meta charset[^>]*>|<meta name="viewport"[^>]*>|<title>[\s\S]*?<\/title>/g, "");
      const bodyHtml = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)[1];
      out = `<title>${esc(site.name)}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${head}\n<div dir="rtl" lang="ar" class="home">${bodyHtml}</div>`;
    }
    fs.writeFileSync(path.join(outDir, "index.html"), out);
    if (!meta.noindex) {
      const priority = isHome ? "1.0" : meta.tool || meta.hub ? "0.8" : isContent(meta) ? "0.7" : "0.3";
      urls.push({ loc: abs, lastmod: meta.updated, priority });
    }
  }

  // sitemap + robots + 404
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`)
    .join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap);
  fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`);
  // ملفات إثبات الملكية (Google Search Console وغيره) من site.json → verification: ["googleXXXX.html", ...]
  for (const v of site.verification || []) fs.writeFileSync(path.join(DIST, v), `google-site-verification: ${v}`);
  // مفتاح IndexNow (Bing وYandex وغيرهما): ملف نصي باسم المفتاح في الجذر
  if (site.indexnow) fs.writeFileSync(path.join(DIST, `${site.indexnow}.txt`), site.indexnow);
  // ads.txt لـ Google AdSense (يُعرَّف الناشر من site.json → adsense: "ca-pub-…")
  if (site.adsense) fs.writeFileSync(path.join(DIST, "ads.txt"), `google.com, ${site.adsense.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`);
  // صفحات /embed/ تُعرض داخل مواقع أخرى، فتُستثنى من منع الإطارات
  fs.writeFileSync(
    path.join(DIST, "_headers"),
    `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n\n/embed/*\n  ! X-Frame-Options\n  Content-Security-Policy: frame-ancestors *\n  X-Robots-Tag: noindex\n`
  );

  if (check) checkLinks(pages);
  console.log(`تم البناء: ${pages.length} صفحة (${urls.length} في خريطة الموقع) → ${path.relative(ROOT, DIST)}/`);
}

function checkLinks(pages) {
  const known = new Set(pages.map((p) => pagePath(p.meta)));
  let bad = 0;
  const files = [];
  const walk = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, f.name);
      if (f.isDirectory()) walk(full);
      else if (f.name.endsWith(".html")) files.push(full);
    }
  };
  walk(DIST);
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const rel = path.relative(DIST, path.dirname(file));
    for (const m of html.matchAll(/href="((?:\.\.\/)*|\.\/|\/)?([a-z0-9-]+(?:\/[a-z0-9-]+)*)\/(?:index\.html)?(?:#[\w-]*)?"/g)) {
      const prefix = m[1] || "";
      if (m[2].startsWith("assets")) continue;
      let target;
      if (prefix === "/") target = m[2];
      else {
        const up = (prefix.match(/\.\.\//g) || []).length;
        const base = rel === "" ? [] : rel.split(path.sep);
        target = [...base.slice(0, Math.max(0, base.length - up)), m[2]].join("/");
      }
      if (!known.has(target)) {
        console.error(`رابط داخلي مكسور في ${path.relative(DIST, file)}: ${m[0]}`);
        bad++;
      }
    }
    // كل JSON-LD يجب أن يكون JSON صالحاً
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        JSON.parse(m[1]);
      } catch (e) {
        console.error(`JSON-LD غير صالح في ${path.relative(DIST, file)}: ${e.message}`);
        bad++;
      }
    }
    if (/\{\{[\w:-]+/.test(html)) {
      console.error(`عنصر نائب لم يُستبدل في ${path.relative(DIST, file)}: ${html.match(/\{\{[^}]*\}\}/)[0]}`);
      bad++;
    }
  }
  if (bad) {
    console.error(`${bad} مشكلة`);
    process.exit(1);
  }
  console.log(`كل الروابط الداخلية والبيانات المنظمة سليمة (${files.length} ملف).`);
}

await build({ check: process.argv.includes("--check"), preview: process.argv.includes("--preview") });
