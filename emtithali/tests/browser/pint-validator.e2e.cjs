// فحص سلوكي لمدقق PINT AE في Chromium (Playwright)، خارج npm test لأن CI بلا متصفح:
//   node emtithali/tests/browser/pint-validator.e2e.cjs [مجلد أمثلة إضافي]
// (1) مثالا الاختبار في tests/fixtures: الصحيح بلا مخالفة، والمعدَّل بمخالفاته المتوقعة بالضبط.
// (2) إن مُرِّر مجلد (مثل res/ بعد فك resources.zip الرسمي) يُفحص كل XML فيه ويُطبع ما وُجد.
// (3) لا طلب شبكة أثناء الفحص بالمحرك وحده: يُسجَّل كل طلب بعد تحميل القواعد ويجب أن يكون صفراً.
// (4) الصفحة نفسها على أصل وهمي تخدمه page.route من site/: بعد كل فحص طلب واحد إلى ‎/api/pint-check‎ جسمه {ok, n} حرفياً،
//     ولا طلب يحمل شيئاً من الملف؛ ونموذج «أريد المدقق كواجهة API» يرسل إلى ‎/api/submit‎ الحقول السبعة المتوقعة وحدها.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const site = path.join(__dirname, "..", "..", "site");
const fx = path.join(__dirname, "..", "fixtures");
const extra = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent("<html><body></body></html>");
  await page.addScriptTag({ content: fs.readFileSync(path.join(site, "pint-ae-validator.js"), "utf8") });
  const rules = JSON.parse(fs.readFileSync(path.join(site, "pint-ae-rules.json"), "utf8"));
  await page.evaluate((r) => { window.__rules = r; }, rules);
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  const check = (xml) => page.evaluate((x) => window.PintAeValidator.validate(x, window.__rules), xml);
  let fail = 0;
  const valid = await check(fs.readFileSync(path.join(fx, "pint-ae-valid.xml"), "utf8"));
  const invalid = await check(fs.readFileSync(path.join(fx, "pint-ae-invalid.xml"), "utf8"));
  const expected = JSON.parse(fs.readFileSync(path.join(fx, "pint-ae-invalid.expected.json"), "utf8"));
  const got = invalid.violations.map((v) => v.id).sort();
  if (valid.error || valid.violations.length || valid.failedToRun.length) { fail++; console.log("FAIL valid", JSON.stringify(valid)); }
  else console.log("ok valid: 0 violations,", valid.evaluated, "checked");
  if (JSON.stringify(got) !== JSON.stringify([...expected].sort())) { fail++; console.log("FAIL invalid: got", got, "expected", expected); }
  else console.log("ok invalid:", got.join(" "));
  const nw = await check("<Invoice><x></Invoice>");
  if (nw.error !== "not_well_formed") { fail++; console.log("FAIL not well-formed", nw); } else console.log("ok not well-formed");
  const nu = await check('<Invoice xmlns="urn:example"/>');
  if (nu.error !== "not_ubl") { fail++; console.log("FAIL not ubl", nu); } else console.log("ok not ubl");
  // تصحيحا المدقق المستقل (26 نوفمبر): قسم CDATA يندمج مع النص المجاور كما في XDM، و+ قبل المبلغ صيغة xsd:decimal صحيحة؛
  // ويبقى الخطأ الحقيقي داخل CDATA مخالفة.
  const v0 = fs.readFileSync(path.join(fx, "pint-ae-valid.xml"), "utf8");
  const CID = "<cbc:CustomizationID>urn:peppol:pint:billing-1@ae-1</cbc:CustomizationID>", PRICE = '<cbc:PriceAmount currencyID="AED">4.9</cbc:PriceAmount>';
  if (!v0.includes(CID) || !v0.includes(PRICE)) { fail++; console.log("FAIL fixture markers missing"); }
  const ids = (r) => (r.violations || []).map((v) => v.id).join(" ") + (r.error || "");
  const cd = await check(v0.replace(CID, "<cbc:CustomizationID><![CDATA[urn:peppol:pint:]]>billing-1@ae-1</cbc:CustomizationID>"));
  const cdBad = await check(v0.replace(CID, "<cbc:CustomizationID><![CDATA[urn:peppol:pint:]]>billing-2@ae-1</cbc:CustomizationID>"));
  const pl = await check(v0.replace(PRICE, '<cbc:PriceAmount currencyID="AED">+4.9</cbc:PriceAmount>'));
  const neg = await check(v0.replace(PRICE, '<cbc:PriceAmount currencyID="AED">-4.9</cbc:PriceAmount>'));
  if (ids(cd) || ids(pl)) { fail++; console.log("FAIL cdata/plus:", ids(cd), "|", ids(pl)); } else console.log("ok CDATA merged and leading + accepted: 0 violations");
  if (!/ALIGNED-IBRP-001-AE/.test(ids(cdBad)) || !/IBR-027/.test(ids(neg))) { fail++; console.log("FAIL real errors hidden:", ids(cdBad), "|", ids(neg)); } else console.log("ok real errors still caught:", ids(cdBad), "|", ids(neg));
  if (extra) {
    const files = [];
    (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith(".xml")) files.push(p); } })(extra);
    for (const f of files.sort()) {
      const r = await check(fs.readFileSync(f, "utf8"));
      const ids = (r.violations || []).map((v) => v.id + (v.count > 1 ? "×" + v.count : ""));
      console.log((ids.length ? "VIOL " : "ok   ") + path.relative(extra, f) + " " + (r.error || "") + " " + ids.join(" ") + (r.failedToRun && r.failedToRun.length ? " failedToRun:" + r.failedToRun.join(",") : ""));
    }
  }
  if (requests.length) { fail++; console.log("FAIL network requests during validation:", requests); } else console.log("ok no network requests");

  // (4) الصفحة كاملة
  const ORIGIN = "https://emtithali.test";
  const sent = [];
  const page2 = await browser.newPage({ viewport: { width: 375, height: 800 } });
  const errors = [];
  page2.on("pageerror", (e) => errors.push(String(e)));
  await page2.route(ORIGIN + "/**", async (route) => {
    const req = route.request(), u = new URL(req.url());
    if (u.pathname.startsWith("/api/")) {
      sent.push({ path: u.pathname, method: req.method(), body: req.postData() || "" });
      if (u.pathname === "/api/pint-check") return route.fulfill({ status: 204, body: "" });
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' });
    }
    const f = path.join(site, u.pathname === "/" ? "index.html" : u.pathname.replace(/^\//, ""));
    const file = fs.existsSync(f) ? f : f + ".html";
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: "" });
    const type = file.endsWith(".html") ? "text/html" : file.endsWith(".js") ? "text/javascript" : file.endsWith(".json") ? "application/json" : file.endsWith(".css") ? "text/css" : "application/octet-stream";
    return route.fulfill({ status: 200, contentType: type, body: fs.readFileSync(file) });
  });
  await page2.goto(ORIGIN + "/pint-ae-validator");
  await page2.waitForFunction(() => !document.getElementById("vrun").disabled);
  const validXml = fs.readFileSync(path.join(fx, "pint-ae-valid.xml"), "utf8");
  const invalidXml = fs.readFileSync(path.join(fx, "pint-ae-invalid.xml"), "utf8");
  for (const xml of [validXml, invalidXml, "<Invoice><x></Invoice>"]) {
    await page2.fill("#vtext", xml);
    await page2.click("#vrun");
    await page2.waitForTimeout(400);
  }
  const events = sent.filter((x) => x.path === "/api/pint-check");
  const want = [JSON.stringify({ ok: true, n: 0 }), JSON.stringify({ ok: false, n: expected.length })];
  if (JSON.stringify(events.map((e) => e.body)) !== JSON.stringify(want) || events.some((e) => e.method !== "POST")) { fail++; console.log("FAIL check events", events, "want", want); }
  else console.log("ok check events:", events.map((e) => e.body).join(" "));
  // لا طلب يحمل شيئاً من الملفين: قيم مميِّزة منهما
  const marks = [...new Set([...validXml.matchAll(/<cbc:(?:ID|EndpointID|CompanyID)[^>]*>([^<]{4,})</g)].map((m) => m[1]))];
  const leaked = sent.filter((x) => marks.some((m) => x.body.includes(m)) || /Invoice|xmlns|urn:/.test(x.body));
  if (!marks.length || leaked.length) { fail++; console.log("FAIL leaked file content", marks.length, leaked); } else console.log("ok no file content in", sent.length, "requests (" + marks.length + " marks)");
  // نموذج «أريد المدقق كواجهة API»
  await page2.click("#api-open");
  await page2.click("#api-submit");
  const errShown = await page2.evaluate(() => ["company", "email", "volume", "consent"].map((k) => document.getElementById("err-api-" + k).textContent).filter(Boolean).length);
  if (errShown !== 4 || sent.some((x) => x.path === "/api/submit")) { fail++; console.log("FAIL empty api form", errShown); } else console.log("ok empty api form: 4 errors, nothing sent");
  await page2.fill("#api-company", "شركة اختبار");
  await page2.fill("#api-email", "api@example.com");
  await page2.selectOption("#api-volume", "50-500");
  await page2.check("#api-consent");
  await page2.click("#api-submit");
  await page2.waitForSelector("#api-done", { state: "visible" });
  const subs = sent.filter((x) => x.path === "/api/submit");
  const sub = subs.length === 1 ? JSON.parse(subs[0].body) : {};
  const keys = Object.keys(sub).join(",");
  const okSub = subs.length === 1 && keys === "company,email,invoices_per_month,consent,source,sent_at,kind"
    && sub.kind === "validator-api" && sub.source === "?src=validator-api" && sub.invoices_per_month === "من 50 إلى 500" && /بلا إحالة/.test(sub.consent);
  if (!okSub) { fail++; console.log("FAIL api submit", subs); } else console.log("ok api submit:", keys);
  const wide = await page2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (wide > 0) { fail++; console.log("FAIL horizontal overflow at 375px:", wide); } else console.log("ok no horizontal overflow at 375px");
  if (errors.length) { fail++; console.log("FAIL page errors", errors); } else console.log("ok no page errors");
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
