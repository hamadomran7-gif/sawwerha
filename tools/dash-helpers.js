// أدوات النشر من متصفح لوحة Cloudflare (dash.cloudflare.com) — تُلصق في وحدة التحكم أو تُحقن بـ JavaScript.
// تستخدم جلسة اللوحة نفسها (رأس x-atok من window.bootstrap)، فلا مفاتيح API ولا أسرار في هذا الملف.
// الملفات تُجلب من GitHub (المستودع عام) عند commit محدد، فلا يُنشر إلا ما هو في المستودع.
//
// الاستخدام بعد الحقن:
//   await __deployStatic('mustahaqati', 'mustahaqati/dist', '<commit>', { html_handling: 'auto-trailing-slash', not_found_handling: '404-page' })
//   await __deploySawwerha('<commit>')        // يحتفظ بالوسائط (samples/ads) من آخر نشر محفوظ في الذاكرة window.__siteFiles
//   await __deployBot('<commit>')             // ينشر sawwerha-bot ويحدّث AGENT_REV فيتحدث الوكيل على الجهاز تلقائياً
//   await __sql('SELECT ...')                 // استعلام D1
(() => {
  const REPO = "hamadomran7-gif/sawwerha";
  window.__A = window.__A || location.pathname.split("/")[1]; // معرّف الحساب من رابط اللوحة
  window.__DB = window.__DB || "854d7228-abd3-46cd-af60-3c5832981cee"; // قاعدة D1 لبوت صوّرها

  window.__cf = async (p, o = {}) => {
    const h = Object.assign({ "x-atok": (window.bootstrap && window.bootstrap.atok) || "" }, o.headers || {});
    const r = await fetch("/api/v4" + p, { credentials: "include", ...o, headers: h });
    const t = await r.text();
    try { return JSON.parse(t); } catch (e) { return { status: r.status, text: t.slice(0, 500) }; }
  };
  window.__b64 = async (b) => {
    const buf = new Uint8Array(await b.arrayBuffer());
    let s = "";
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return btoa(s);
  };
  window.__hash = async (b) => {
    const d = await crypto.subtle.digest("SHA-256", await b.arrayBuffer());
    return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 32);
  };
  window.__sql = async (sql, params = []) => {
    const j = await __cf(`/accounts/${__A}/d1/database/${__DB}/query`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sql, params }) });
    return j.success ? j.result[0].results : j.errors;
  };

  // رفع أصول ثابتة لعامل Workers (assets) ثم نشر نسخة جديدة
  window.__deploySite = async (script, files, config) => {
    const manifest = {}, byHash = {};
    for (const f of files) { const h = await __hash(f.blob); manifest[f.path] = { hash: h, size: f.blob.size }; byHash[h] = f; }
    const sess = await __cf(`/accounts/${__A}/workers/scripts/${script}/assets-upload-session`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ manifest }) });
    if (!sess.success) return { step: "session", errors: sess.errors };
    let completion = sess.result.jwt;
    const buckets = sess.result.buckets || [];
    for (const bucket of buckets) {
      const fd = new FormData();
      for (const h of bucket) { const f = byHash[h]; fd.append(h, new File([await __b64(f.blob)], h, { type: f.type })); }
      const r = await fetch(`/api/v4/accounts/${__A}/workers/assets/upload?base64=true`, { method: "POST", credentials: "include", headers: { "x-atok": window.bootstrap.atok, Authorization: "Bearer " + sess.result.jwt }, body: fd });
      const t = await r.text();
      let j; try { j = JSON.parse(t); } catch (e) { return { step: "upload", status: r.status, text: t.slice(0, 300) }; }
      if (!j.success) return { step: "upload", status: r.status, errors: j.errors };
      if (j.result && j.result.jwt) completion = j.result.jwt;
    }
    const fd = new FormData();
    fd.append("metadata", new Blob([JSON.stringify({ assets: { jwt: completion, config: config || {} }, compatibility_date: "2026-06-01" })], { type: "application/json" }));
    const put = await __cf(`/accounts/${__A}/workers/scripts/${script}`, { method: "PUT", body: fd });
    return { success: put.success, errors: put.errors, files: Object.keys(manifest).length, uploaded: buckets.flat().length };
  };

  const TYPE = (p) => p.endsWith(".html") ? "text/html" : p.endsWith(".js") ? "application/javascript" : p.endsWith(".css") ? "text/css" : p.endsWith(".svg") ? "image/svg+xml" : p.endsWith(".xml") ? "application/xml" : p.endsWith(".json") ? "application/json" : /\.jpe?g$/.test(p) ? "image/jpeg" : p.endsWith(".png") ? "image/png" : p.endsWith(".webp") ? "image/webp" : p.endsWith(".mp4") ? "video/mp4" : "text/plain";
  async function fetchTree(rev, dir) {
    const tree = await (await fetch(`https://api.github.com/repos/${REPO}/git/trees/${rev}?recursive=1`, { cache: "no-store" })).json();
    if (!tree.tree) throw new Error("tree: " + tree.message);
    const pre = dir + "/";
    const list = tree.tree.filter((t) => t.type === "blob" && t.path.startsWith(pre)).map((t) => t.path.slice(pre.length)).filter((p) => p !== "_headers" && p !== "_redirects");
    const base = `https://raw.githubusercontent.com/${REPO}/${rev}/${pre}`;
    const files = [], bad = [], queue = [...list];
    const worker = async () => { while (queue.length) { const p = queue.shift(); let ok = false; for (let i = 0; i < 3 && !ok; i++) { try { const r = await fetch(base + p, { cache: "no-store" }); if (!r.ok) throw new Error(String(r.status)); const b = await r.blob(); files.push({ path: "/" + p, blob: new Blob([b], { type: TYPE(p) }), type: TYPE(p) }); ok = true; } catch (e) { if (i === 2) bad.push(p + " " + e.message); } } } };
    await Promise.all(Array.from({ length: 8 }, worker));
    if (bad.length) throw new Error("fetch: " + bad.join(", "));
    const hr = await fetch(base + "_headers", { cache: "no-store" });
    return { files, headers: hr.ok ? await hr.text() : null };
  }

  // مستحقاتي: كل ملفات mustahaqati/dist من المستودع
  window.__deployStatic = async (script, dir, rev, config) => {
    const { files, headers } = await fetchTree(rev, dir);
    const cfg = Object.assign({}, config || {});
    if (headers) cfg._headers = headers;
    let res = null;
    for (let i = 0; i < 3; i++) { res = await __deploySite(script, files, cfg); if (res && res.success) break; }
    return { files: files.length, res };
  };

  // صوّرها: ملفات web/ من المستودع + الوسائط الكبيرة (samples/ads) المحفوظة من آخر نشر في الذاكرة
  window.__deploySawwerha = async (rev) => {
    const { files } = await fetchTree(rev, "web");
    const have = new Set(files.map((f) => f.path));
    const media = (window.__siteFiles || []).filter((f) => !have.has(f.path) && /^\/(samples|ads)\/.*\.(jpg|png|mp4)$/.test(f.path));
    if (!media.length) return { step: "media", msg: "لا وسائط في الذاكرة: النشر سيحذف samples وads. حمّلها أولاً في window.__siteFiles." };
    const all = files.concat(media);
    const headers = "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n\n/ads/*\n  X-Robots-Tag: noindex\n";
    const res = await __deploySite("sawwerha-site", all, { html_handling: "auto-trailing-slash", not_found_handling: "none", _headers: headers });
    if (res && res.success) window.__siteFiles = all;
    return { repoFiles: files.length, media: media.length, res };
  };

  // بوت صوّرها: الوحدات من bot/src مع الإبقاء على الأسرار، وتحديث AGENT_REV
  window.__deployBot = async (rev) => {
    const st = (await __cf(`/accounts/${__A}/workers/scripts/sawwerha-bot/settings`)).result;
    const bindings = [];
    for (const b of st.bindings) {
      if (b.type === "secret_text") continue;
      if (b.type === "plain_text" && b.name === "AGENT_REV") { bindings.push({ type: "plain_text", name: "AGENT_REV", text: rev }); continue; }
      bindings.push({ ...b });
    }
    if (!bindings.some((b) => b.name === "AGENT_REV")) bindings.push({ type: "plain_text", name: "AGENT_REV", text: rev });
    const md = { main_module: "index.js", compatibility_date: st.compatibility_date || "2026-06-01", compatibility_flags: st.compatibility_flags || [], bindings, keep_bindings: ["secret_text"] };
    if (st.observability) md.observability = st.observability;
    const fd = new FormData();
    fd.append("metadata", new Blob([JSON.stringify(md)], { type: "application/json" }));
    const base = `https://raw.githubusercontent.com/${REPO}/${rev}/bot/src/`;
    for (const f of ["index.js", "flow.js", "wa.js", "payments.js", "media.js", "db.js", "social.js"]) {
      const r = await fetch(base + f, { cache: "no-store" });
      if (!r.ok) throw new Error(f + " " + r.status);
      fd.append(f, new Blob([await r.text()], { type: "application/javascript+module" }), f);
    }
    const j = await __cf(`/accounts/${__A}/workers/scripts/sawwerha-bot`, { method: "PUT", body: fd });
    return { success: j.success, errors: j.errors, etag: j.result && j.result.etag, bindings: bindings.map((b) => b.type + ":" + b.name) };
  };
  return "dash helpers ready";
})();
