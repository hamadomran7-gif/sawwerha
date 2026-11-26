// فحص سلوكي لمدقق PINT AE في Chromium (Playwright)، خارج npm test لأن CI بلا متصفح:
//   node emtithali/tests/browser/pint-validator.e2e.cjs [مجلد أمثلة إضافي]
// (1) مثالا الاختبار في tests/fixtures: الصحيح بلا مخالفة، والمعدَّل بمخالفاته المتوقعة بالضبط.
// (2) إن مُرِّر مجلد (مثل res/ بعد فك resources.zip الرسمي) يُفحص كل XML فيه ويُطبع ما وُجد.
// (3) لا طلب شبكة أثناء الفحص: يُسجَّل كل طلب بعد تحميل القواعد ويجب أن يكون صفراً.
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
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
