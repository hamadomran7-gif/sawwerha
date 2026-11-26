// امتثالي — مدقق PINT AE في المتصفح (‎/pint-ae-validator‎).
// يفحص ملف الفاتورة أو الإشعار الدائن (UBL XML) في المتصفح وحده: لا يُرسَل محتوى الملف ولا اسمه إلى أي خادم.
// القواعد من /pint-ae-rules.json، وهي نص ملفي Schematron الرسميين في resources.zip لمواصفة PINT AE حرفياً
// (يولّده emtithali/gen/pint_rules.py)، ويُقيَّم كل تعبير بمحرك XPath 1.0 المدمج في المتصفح (document.evaluate).
// ما لا يقبله هذا المحرك معلَّم في الملف «لا يُفحص» (checked:false) ويُعرض في الصفحة، ولا يُحسب ناجحاً ولا مخالفاً.
// منطق Schematron: في كل نمط (pattern) تُقيَّم العقدة بأول قاعدة يطابقها سياقها، ثم تُقيَّم تأكيداتها (assert) على تلك العقدة.
(function (global) {
  "use strict";

  var NS = {
    ubl: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    cn: "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2",
    cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
    ext: "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
  };
  var MAX_BYTES = 5 * 1024 * 1024;

  function resolver(prefix) { return NS[prefix] || null; }

  // يعيد {doc} أو {error}: الملف XML سليم البنية وجذره Invoice أو CreditNote بمساحة أسماء UBL 2.1
  function parse(text) {
    if (typeof text !== "string" || !text.trim()) return { error: "empty" };
    if (text.length > MAX_BYTES) return { error: "too_large" };
    var doc = new DOMParser().parseFromString(text.replace(/^﻿/, ""), "application/xml");
    var pe = doc.getElementsByTagName("parsererror");
    if (pe.length || !doc.documentElement || doc.documentElement.localName === "parsererror") {
      return { error: "not_well_formed", detail: (pe[0] || doc.documentElement || {}).textContent || "" };
    }
    var root = doc.documentElement;
    var kind = root.localName === "Invoice" && root.namespaceURI === NS.ubl ? "invoice"
      : root.localName === "CreditNote" && root.namespaceURI === NS.cn ? "creditnote" : null;
    if (!kind) return { error: "not_ubl", root: root.localName, ns: root.namespaceURI || "" };
    return { doc: doc, kind: kind };
  }

  function compile(doc, expr) {
    try { return doc.createExpression(expr, resolver); } catch (e) { return null; }
  }

  // يقيّم القواعد المعلَّمة checked على المستند. يعيد المخالفات بترتيب ورودها في الملف الرسمي.
  function run(doc, rules) {
    var violations = [], failedToRun = [], evaluated = 0, skipped = 0;
    rules.sets.forEach(function (set) {
      set.patterns.forEach(function (pat) {
        var taken = new Set();
        pat.rules.forEach(function (rule) {
          if (!rule.ctxOk) { rule.asserts.forEach(function () { skipped++; }); return; }
          var ce = compile(doc, rule.cx);
          if (!ce) { rule.asserts.forEach(function (a) { if (a.checked) failedToRun.push(a.id); else skipped++; }); return; }
          var snap = ce.evaluate(doc, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          var nodes = [];
          for (var i = 0; i < snap.snapshotLength; i++) {
            var n = snap.snapshotItem(i);
            if (!taken.has(n)) { taken.add(n); nodes.push(n); }
          }
          rule.asserts.forEach(function (a) {
            if (!a.checked) { skipped++; return; }
            var te = compile(doc, a.xt);
            if (!te) { failedToRun.push(a.id); return; }
            evaluated++;
            var bad = 0;
            for (var k = 0; k < nodes.length; k++) {
              var ok;
              try { ok = te.evaluate(nodes[k], XPathResult.BOOLEAN_TYPE, null).booleanValue; } catch (e) { ok = null; }
              if (ok === null) { failedToRun.push(a.id); return; }
              if (!ok) bad++;
            }
            if (bad) violations.push({ id: a.id, flag: a.flag, msg: a.msg, url: a.url, set: set.id, count: bad });
          });
        });
      });
    });
    return { violations: violations, evaluated: evaluated, skipped: skipped, failedToRun: failedToRun };
  }

  function validate(text, rules) {
    var p = parse(text);
    if (p.error) return p;
    var r = run(p.doc, rules);
    r.kind = p.kind;
    return r;
  }

  var api = { NS: NS, parse: parse, run: run, validate: validate, MAX_BYTES: MAX_BYTES };
  global.PintAeValidator = api;
})(typeof window !== "undefined" ? window : globalThis);
