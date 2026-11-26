// يعلّم في emtithali/site/pint-ae-rules.json ما يقيّمه محرك XPath 1.0 في المتصفح (Chromium عبر Playwright):
//   rule.ctxOk: يُقيَّم سياق القاعدة؛ assert.checked: يُقيَّم الاختبار؛ assert.why: سبب عدم الفحص.
// وقاعدة لاحقة في النمط نفسه يمكن أن تطابق عقدةً كان سياقٌ سابق لا يُقيَّم سيأخذها أولاً تُعلَّم «لا يُفحص» (shadowed)،
// لأن Schematron يقيّم العقدة بأول قاعدة تطابقها في النمط.
// الاستعمال: node emtithali/gen/pint_rules_mark.cjs emtithali/site/pint-ae-rules.json  (يكتب الملف نفسه)
const fs = require("node:fs");
const { chromium } = require("playwright");
const file = process.argv[2];
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const XP1 = new Set(["last", "position", "count", "id", "local-name", "namespace-uri", "name", "string", "concat", "starts-with", "contains", "substring-before", "substring-after", "substring", "string-length", "normalize-space", "translate", "boolean", "not", "true", "false", "lang", "number", "sum", "floor", "ceiling", "round", "text", "node", "comment", "processing-instruction"]);
function why(expr) {
  const f = [...expr.matchAll(/([A-Za-z_][\w.-]*(?::[A-Za-z_][\w.-]*)?)\s*\(/g)].map((m) => m[1]).filter((n) => !XP1.has(n) && !["and", "or", "div", "mod"].includes(n));
  const parts = [];
  if (/\$[A-Za-z_]/.test(expr)) parts.push("متغيّر");
  if (/\bif\s*\(/.test(expr)) parts.push("if");
  if (/\b(some|every)\s+\$/.test(expr)) parts.push("some/every");
  for (const n of f) if (!parts.includes(n) && n !== "if") parts.push(n);
  return parts.length ? parts.join("، ") : "صيغة XPath 2.0";
}
// مقارنة ترتيب (< أو <= أو > أو >=) بين قيمتين غير عدديتين: XPath 1.0 يحوّل الطرفين إلى رقمين، وXPath 2.0 يقارن
// قيمتي العقدتين غير المنمّطتين نصّاً (مثل تاريخين 2025-01-30 < 2025-02-06)، فلا تُقيَّم إلا إن كان أحد الطرفين عددياً.
const NUMFN = /^(count|sum|number|string-length|round|floor|ceiling|position|last)\s*\(/;
function unsafeRelational(expr) {
  const re = /(<=|>=|<|>)/g;
  let m;
  while ((m = re.exec(expr))) {
    const right = expr.slice(m.index + m[0].length).trimStart();
    const left = expr.slice(0, m.index).trimEnd();
    if (/^[-+]?\d/.test(right) || NUMFN.test(right)) continue;
    if (/[-+]?\d+(\.\d+)?$/.test(left) && !/[\w:.-]$/.test(left.replace(/[-+]?\d+(\.\d+)?$/, ""))) continue;
    // الطرف الأيسر ناتج دالة عددية: يُرجَع إلى القوس المقابل
    if (left.endsWith(")")) {
      let d = 0, i = left.length - 1;
      for (; i >= 0; i--) { if (left[i] === ")") d++; else if (left[i] === "(") { d--; if (d === 0) break; } }
      const before = left.slice(0, i).match(/([A-Za-z-]+)\s*$/);
      if (before && NUMFN.test(before[1] + "(")) continue;
    }
    return true;
  }
  return false;
}
function lastNames(ctx) {
  // أسماء العنصر الأخير في كل فرع من فروع النمط، أو "*" إن لم يكن اسماً صريحاً
  const out = [];
  let depth = 0, q = null, cur = "";
  const branches = [];
  for (const c of ctx) { if (q) { cur += c; if (c === q) q = null; continue; } if (c === "'" || c === '"') { q = c; cur += c; continue; } if (c === "[" || c === "(") depth++; if (c === "]" || c === ")") depth--; if (depth === 0 && c === "|") { branches.push(cur); cur = ""; continue; } cur += c; }
  branches.push(cur);
  for (let b of branches) {
    let d = 0, s = "";
    for (const c of b) { if (c === "[") d++; if (d === 0) s += c; if (c === "]") d--; }
    const steps = s.trim().split("/").filter(Boolean);
    const last = (steps[steps.length - 1] || "*").trim();
    out.push(/^[a-z]+:[A-Za-z]+$/.test(last) ? last : "*");
  }
  return out;
}
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent("<html><body></body></html>");
  const result = await page.evaluate((sets) => {
    const NS = { ubl: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2", cn: "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2", cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2", cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2", ext: "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" };
    const doc = new DOMParser().parseFromString('<Invoice xmlns="' + NS.ubl + '"/>', "application/xml");
    const ok = (e) => { try { doc.createExpression(e, (p) => NS[p] || null); return true; } catch (x) { return false; } };
    return sets.map((s) => s.patterns.map((p) => p.rules.map((r) => ({ c: ok(r.cx), a: r.asserts.map((a) => ok(a.xt)) }))));
  }, data.sets);
  await browser.close();
  let total = 0, checked = 0;
  data.sets.forEach((s, si) => s.patterns.forEach((p, pi) => {
    const unknown = new Set();
    p.rules.forEach((r, ri) => {
      const res = result[si][pi][ri];
      const names = lastNames(r.context);
      const shadowed = names.some((n) => unknown.has(n) || unknown.has("*") || (n === "*" && unknown.size));
      r.ctxOk = res.c && !shadowed && !unsafeRelational(r.cx);
      if (!res.c) names.forEach((n) => unknown.add(n));
      r.asserts.forEach((a, ai) => {
        total++;
        delete a.why;
        if (!res.c) { a.checked = false; a.why = "السياق: " + why(r.context); }
        else if (shadowed) { a.checked = false; a.why = "السياق: قاعدة سابقة في النمط نفسه لا تُقيَّم"; }
        else if (!res.a[ai]) { a.checked = false; a.why = why(a.test); }
        else if (unsafeRelational(a.xt)) { a.checked = false; a.why = "مقارنة ترتيب بين قيمتين نصيتين"; }
        else { a.checked = true; checked++; }
      });
    });
  }));
  data.source.checked = checked;
  data.source.total = total;
  fs.writeFileSync(file, JSON.stringify(data, null, 1) + "\n");
  console.log(JSON.stringify({ total, checked, unchecked: total - checked }));
})();
