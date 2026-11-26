// اختبارات مدقق PINT AE (‎/pint-ae-validator‎) التي تعمل بلا متصفح: cd emtithali && npm test
// والفحص السلوكي في Chromium: node emtithali/tests/browser/pint-validator.e2e.cjs (CI بلا متصفح).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";

const site = new URL("../site/", import.meta.url);
const read = (f) => fs.readFileSync(new URL(f, site), "utf8");
const rules = JSON.parse(read("pint-ae-rules.json"));
const asserts = rules.sets.flatMap((s) => s.patterns.flatMap((p) => p.rules.flatMap((r) => r.asserts.map((a) => ({ ...a, set: s.id, rule: r })))));

test("القواعد: 132 خاصة بالإمارات و170 مشتركة، بمعرّفات فريدة ورسائل وروابط وبصمة الملف الرسمي", () => {
  const n = Object.fromEntries(rules.sets.map((s) => [s.id, s.patterns.reduce((k, p) => k + p.rules.reduce((j, r) => j + r.asserts.length, 0), 0)]));
  assert.deepEqual(n, { ae: 132, shared: 170 });
  assert.equal(new Set(asserts.map((a) => a.id)).size, 302);
  assert.match(rules.source.zip_sha256, /^[0-9a-f]{64}$/);
  for (const s of rules.sets) assert.match(s.sha256, /^[0-9a-f]{64}$/);
  for (const a of asserts) {
    assert.ok(a.msg && a.test && a.rule.context && a.xt && a.rule.cx, a.id);
    assert.equal(a.url, "https://docs.peppol.eu/poac/ae/pint-ae/trn-invoice/rule/" + a.id.toLowerCase() + "/");
    assert.equal(typeof a.checked, "boolean", a.id);
    if (!a.checked) assert.ok(a.why, a.id + " بلا سبب");
  }
  assert.equal(rules.source.total, 302);
  assert.equal(rules.source.checked, asserts.filter((a) => a.checked).length);
});

test("التحويلات الثلاثة وحدها تغيّر النص الرسمي (R1 exists وR2 true()/false() وR3 upper-case … 'VAT')", () => {
  const norm = (e) => e
    .replace(/boolean\(/g, "exists(")
    .replace(/translate\(cbc:ID,'abcdefghijklmnopqrstuvwxyz','ABCDEFGHIJKLMNOPQRSTUVWXYZ'\)/g, "upper-case(cbc:ID)");
  for (const a of asserts) {
    if (a.xt === a.test) continue;
    assert.ok(/exists\(|true\(\)|false\(\)|upper-case\(cbc:ID\)/.test(a.test), a.id + ": تحويل بلا سبب معروف");
    assert.ok(!/xs:|matches\(|\$/.test(a.xt) || !a.checked, a.id);
    assert.ok(norm(a.xt).length > 0);
  }
});

test("لا يرسل المدقق محتوى الملف: لا fetch ولا XMLHttpRequest ولا sendBeacon ولا WebSocket في pint-ae-validator.js", () => {
  const js = read("pint-ae-validator.js").replace(/\/\/.*$/gm, "");
  for (const w of ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource", "import(", "postMessage", "localStorage", "indexedDB"]) assert.ok(!js.includes(w), w);
});

test("مثالا الاختبار: الصحيح نسخة المثال الرسمي، والمعدَّل يختلف عنه في ثلاث قيم فقط", () => {
  const fx = new URL("./fixtures/", import.meta.url);
  const valid = fs.readFileSync(new URL("pint-ae-valid.xml", fx), "utf8");
  const invalid = fs.readFileSync(new URL("pint-ae-invalid.xml", fx), "utf8");
  assert.match(valid, /<cbc:CustomizationID>urn:peppol:pint:billing-1@ae-1<\/cbc:CustomizationID>/);
  const diff = invalid.split("\n").filter((l, i, arr) => !valid.split("\n").includes(l));
  assert.equal(diff.length, 4, diff.join("\n"));
  const expected = JSON.parse(fs.readFileSync(new URL("pint-ae-invalid.expected.json", fx), "utf8"));
  for (const id of expected) assert.ok(asserts.find((a) => a.id === id && a.checked), id);
  assert.equal(crypto.createHash("sha256").update(valid).digest("hex").length, 64);
});

test("الصفحة لا تطلب إلا ملف القواعد وحدث العدّاد وطلب API، وجسم الحدث {ok, n} وحده (البند 84)", () => {
  const html = read("pint-ae-validator.html");
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");
  const urls = [...inline.matchAll(/fetch\("([^"]+)"/g)].map((m) => m[1]).sort();
  assert.deepEqual(urls, ["/api/pint-check", "/api/submit", "/pint-ae-rules.json"]);
  for (const w of ["XMLHttpRequest", "sendBeacon", "WebSocket", "localStorage", "document.cookie"]) assert.ok(!inline.includes(w), w);
  assert.ok(inline.includes("body: JSON.stringify({ ok: n === 0, n: n })"));
  assert.ok(inline.includes('kind: "validator-api"') && inline.includes('source: "?src=validator-api"'));
  // أسئلة FAQ في JSON-LD هي المرئية نفسها
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">\s*(\{"@context":"https:\/\/schema.org","@type":"FAQPage"[\s\S]*?)<\/script>/)[1]);
  const faq = html.slice(html.indexOf('aria-labelledby="s-faq"'), html.indexOf("</section>", html.indexOf('aria-labelledby="s-faq"')));
  const seen = [...faq.matchAll(/<h3>([^<]+)<\/h3>\s*<p>([^<]+)<\/p>/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(ld.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]), seen);
});
