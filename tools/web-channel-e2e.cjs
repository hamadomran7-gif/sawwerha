// اختبار طرفي محلي لقناة الرفع من الموقع: الصفحتان الحقيقيتان (web/try وweb/s) في Chromium،
// والبوت الحقيقي (bot/src) خلف خادم Node بمحاكاة D1 (node:sqlite) وKV، ووكيل إنتاج مُحاكى يرفع صوراً حقيقية.
// التشغيل: node tools/web-channel-e2e.cjs <صورة-منتج.jpg> [مجلد-اللقطات]
// يحتاج playwright وChromium (مثبّتان في بيئة Claude السحابية). لا يلمس الإنتاج ولا يحتاج أي سر.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const IMG = process.argv[2];
const OUT = process.argv[3] || path.join(require("node:os").tmpdir(), "sawwerha-e2e");
if (!IMG || !fs.existsSync(IMG)) {
  console.error("usage: node tools/web-channel-e2e.cjs <product.jpg> [shots-dir]");
  process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });

function makeD1() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(fs.readFileSync(path.join(ROOT, "bot/schema.sql"), "utf8"));
  return {
    prepare(sql) {
      let params = [];
      return {
        bind(...p) { params = p.map((v) => (v === undefined ? null : v)); return this; },
        async first() { return sqlite.prepare(sql).get(...params) ?? null; },
        async run() { const r = sqlite.prepare(sql).run(...params); return { success: true, meta: { changes: r.changes } }; },
        async all() { return { results: sqlite.prepare(sql).all(...params) }; },
      };
    },
  };
}
function makeKV() {
  const store = new Map();
  return {
    async put(k, v, o = {}) { store.set(k, { value: v, metadata: o.metadata, ttl: o.expirationTtl }); },
    async getWithMetadata(k) { const o = store.get(k); return o ? { value: o.value, metadata: o.metadata } : { value: null }; },
    store,
  };
}

async function main() {
  const worker = (await import(path.join(ROOT, "bot/src/index.js"))).default;
  const SITE_PORT = 8789, API_PORT = 8788;
  const SITE = `http://127.0.0.1:${SITE_PORT}`, API = `http://127.0.0.1:${API_PORT}`;
  const env = { DB: makeD1(), MEDIA: makeKV(), AGENT_TOKEN: "e2e", PRICE_SINGLE: "149", PRICE_LAUNCH: "499", PRICE_SUB_LITE: "499", PRICE_SUB_CONTENT: "899", ZIINA_LINK_SINGLE: "https://pay.ziina.com/example/149", WEB_ORIGINS: SITE, PUBLIC_URL: SITE };
  const ctx = { waitUntil() {} };

  const api = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const headers = { ...req.headers, "cf-connecting-ip": "127.0.0.1" };
    const r = await worker.fetch(new Request(API + req.url, { method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : body }), env, ctx);
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
  }).listen(API_PORT);

  const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript" };
  const site = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, SITE).pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = path.join(ROOT, "web", p);
    if (!f.startsWith(path.join(ROOT, "web")) || !fs.existsSync(f)) { res.writeHead(404); res.end("nf"); return; }
    let data = fs.readFileSync(f);
    if (f.endsWith(".html")) data = Buffer.from(data.toString("utf8").replaceAll("https://api.sawwerha.app", API));
    res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
    res.end(data);
  }).listen(SITE_PORT);

  const agentCall = (p, init = {}) => worker.fetch(new Request(API + p, { ...init, headers: { Authorization: "Bearer e2e", ...(init.headers || {}) } }), env, ctx);
  const results = [];
  const check = (name, ok, extra = "") => { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`); };

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
    await page.route("https://fonts.gstatic.com/**", (r) => r.abort());

    // 1) صفحة الرفع
    await page.goto(SITE + "/try/");
    await page.setInputFiles("#file", IMG);
    await page.waitForSelector("#preview:not([hidden])", { timeout: 10000 });
    await page.click("#go");
    check("بلا موافقة لا يُرسل", (await page.textContent("#msg")).includes("وافق"));
    await page.check("#consent");
    await page.screenshot({ path: path.join(OUT, "1-try.png"), fullPage: true });
    await Promise.all([page.waitForURL(/\/s\/#[0-9a-f-]{36}$/, { timeout: 15000 }), page.click("#go")]);
    const token = page.url().split("#")[1];
    check("الرفع يفتح الصفحة الخاصة", /^[0-9a-f-]{36}$/.test(token), token);
    await page.waitForSelector("text=في الطابور", { timeout: 10000 });
    await page.screenshot({ path: path.join(OUT, "2-queued.png"), fullPage: true });
    const input = [...env.MEDIA.store.keys()].find((k) => k.startsWith(`web/${token}/in/`));
    const stored = env.MEDIA.store.get(input);
    check("الصورة المرفوعة محفوظة بانتهاء 90 يوماً", stored && stored.ttl === 90 * 86400, `${input} ${stored && stored.value.byteLength} bytes`);

    // 2) وكيل الإنتاج المُحاكى: يلتقط العيّنة ويرفع 3 صور حقيقية
    const job = (await (await agentCall("/api/jobs/next")).json()).job;
    check("الوكيل يلتقط طلب الموقع", job && job.kind === "sample" && job.outputs_per_product === 3, JSON.stringify(job && { id: job.id, category: job.category }));
    const img = fs.readFileSync(IMG);
    const names = ["p1_white_1.jpg", "p1_life_1.jpg", "p1_life_2.jpg"];
    for (const n of names) await agentCall(`/api/jobs/${job.id}/outputs/${n}`, { method: "PUT", body: img, headers: { "Content-Type": "image/jpeg" } });
    const done = await (await agentCall(`/api/jobs/${job.id}/complete`, { method: "POST", body: JSON.stringify({ outputs: names.map((n) => `orders/${job.id}/out/${n}`) }) })).json();
    check("الإكمال بلا واتساب", done.ok === true && done.test === true);

    // 3) الصفحة تعرض الصور والباقات
    await page.reload();
    await page.waitForSelector("text=صورك المجانية جاهزة", { timeout: 10000 });
    await page.waitForFunction(() => [...document.querySelectorAll(".gallery img")].filter((i) => i.complete && i.naturalWidth > 0).length === 3, null, { timeout: 10000 });
    check("3 صور ظاهرة ومحمّلة", true);
    await page.screenshot({ path: path.join(OUT, "3-delivered.png"), fullPage: true });

    // 4) طلب حزمة 149 ← رابط الدفع ورمز الطلب
    await page.click("text=اطلبها بـ149 درهماً");
    await page.waitForSelector("text=ادفع 149 درهماً عبر Ziina", { timeout: 10000 });
    const payHref = await page.getAttribute("text=ادفع 149 درهماً عبر Ziina", "href");
    check("رابط الدفع الثابت يظهر", payHref === env.ZIINA_LINK_SINGLE, payHref);
    await page.screenshot({ path: path.join(OUT, "4-pay.png"), fullPage: true });

    // 5) تأكيد الدفع (كما يفعله المالك) ← الطابور ← تسليم الحزمة في الصفحة نفسها
    const { markPaid } = await import(path.join(ROOT, "bot/src/index.js"));
    const pkg = await env.DB.prepare("SELECT * FROM orders WHERE kind = 'package' AND phone = ?").bind("web:" + token).first();
    await markPaid(env, pkg);
    const job2 = (await (await agentCall("/api/jobs/next")).json()).job;
    check("الحزمة المدفوعة تدخل الطابور بالصورة نفسها", job2 && job2.id === pkg.id && job2.outputs_per_product === 6 && job2.inputs[0] === input);
    const six = ["p1_white_1.jpg", "p1_white_noon.jpg", "p1_life_1.jpg", "p1_life_2.jpg", "p1_life_3.jpg", "p1_life_4.jpg"];
    for (const n of six) await agentCall(`/api/jobs/${job2.id}/outputs/${n}`, { method: "PUT", body: img, headers: { "Content-Type": "image/jpeg" } });
    await agentCall(`/api/jobs/${job2.id}/complete`, { method: "POST", body: JSON.stringify({ outputs: six.map((n) => `orders/${job2.id}/out/${n}`) }) });
    await page.reload();
    await page.waitForSelector("text=صور حزمتك جاهزة", { timeout: 10000 });
    const total = await page.$$eval(".gallery img", (a) => a.length);
    check("الصفحة تعرض العيّنة والحزمة (3 + 6)", total === 9, String(total));
    await page.screenshot({ path: path.join(OUT, "5-package.png"), fullPage: true });

    // 6) تخطيط الجوال وأخطاء الصفحة
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("لا تمرير أفقي على 375 بكسل", overflow <= 0, String(overflow));
    await page.goto(SITE + "/try/");
    const overflowTry = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("صفحة الرفع بلا تمرير أفقي", overflowTry <= 0, String(overflowTry));
    const notFound = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await notFound.route("https://fonts.googleapis.com/**", (r) => r.abort());
    await notFound.goto(SITE + "/s/#00000000-0000-4000-8000-000000000000");
    await notFound.waitForSelector("text=لم نجد هذا الطلب", { timeout: 10000 });
    check("رمز غير موجود يعرض «لم نجد هذا الطلب»", true);
    const real = errors.filter((e) => !/fonts\.g|ERR_FAILED|net::/.test(e));
    check("لا أخطاء JavaScript", real.length === 0, real.join(" | "));
  } finally {
    await browser.close();
    api.close();
    site.close();
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed; screenshots in ${OUT}`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
