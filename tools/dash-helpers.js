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
  // الوسائط الكبيرة ليست في المستودع؛ تُؤخذ من الذاكرة أو من الموقع الحي (مسموح CORS لها)
  const SAWWERHA_MEDIA = ["/samples/before.jpg", "/samples/scene-1.jpg", "/samples/scene-2.jpg", "/samples/white.jpg", "/ads/reel-a-outcome.mp4", "/ads/reel-b-price.mp4", "/ads/reel-c-marketplace.mp4", "/ads/reel-d-fidelity.mp4", "/ads/reel-e-noon-rejected.mp4", "/ads/reel-f-phone-to-amazon.mp4", "/ads/reel-g-three-steps.mp4", "/ads/reel-h-studio-vs-phone.mp4", "/ads/static-a-outcome.jpg", "/ads/static-c-marketplace.jpg"];
  window.__deploySawwerha = async (rev) => {
    const { files } = await fetchTree(rev, "web");
    const have = new Set(files.map((f) => f.path));
    const mem = new Map((window.__siteFiles || []).map((f) => [f.path, f]));
    const media = [], missing = [];
    for (const p of SAWWERHA_MEDIA) {
      if (have.has(p)) continue;
      if (mem.has(p)) { media.push(mem.get(p)); continue; }
      try {
        const r = await fetch("https://sawwerha.app" + p, { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const b = await r.blob();
        media.push({ path: p, blob: new Blob([b], { type: TYPE(p) }), type: TYPE(p) });
      } catch (e) { missing.push(p + " " + e.message); }
    }
    if (missing.length) return { step: "media", msg: "تعذّر جلب وسائط؛ لن يُنشر حتى لا تُحذف", missing };
    const all = files.concat(media);
    const headers = "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n\n/samples/*\n  Access-Control-Allow-Origin: *\n\n/ads/*\n  X-Robots-Tag: noindex\n  Access-Control-Allow-Origin: *\n";
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
    for (const f of ["index.js", "flow.js", "wa.js", "payments.js", "media.js", "db.js", "social.js", "web.js"]) {
      const r = await fetch(base + f, { cache: "no-store" });
      if (!r.ok) throw new Error(f + " " + r.status);
      fd.append(f, new Blob([await r.text()], { type: "application/javascript+module" }), f);
    }
    const j = await __cf(`/accounts/${__A}/workers/scripts/sawwerha-bot`, { method: "PUT", body: fd });
    return { success: j.success, errors: j.errors, etag: j.result && j.result.etag, bindings: bindings.map((b) => b.type + ":" + b.name) };
  };
  // امتثالي: مشروع Pages ‏dalilalfawtara في حساب Cloudflare غير حساب مستحقاتي وصوّرها؛ يُعرف الحساب من نطاق المشروع (opts.domain).
  // رفع مباشر بطريقة Wrangler: مفتاح كل أصل = blake3(base64(المحتوى) + الامتداد) أول 32 حرفاً،
  // و_worker.js و_routes.json و_headers و_redirects تُرسل ملفات خاصة في طلب النشر لا أصولاً.
  window.__blake3Hex = function (bytes) {
    const IV = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const PERM = [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8];
    const CHUNK_START = 1, CHUNK_END = 2, PARENT = 4, ROOT = 8;
    const rotr = (x, n) => ((x >>> n) | (x << (32 - n))) >>> 0;
    function compress(cv, m, counter, blockLen, flags) {
      const s = new Uint32Array(16);
      for (let i = 0; i < 8; i++) s[i] = cv[i];
      s[8] = IV[0]; s[9] = IV[1]; s[10] = IV[2]; s[11] = IV[3];
      s[12] = counter >>> 0; s[13] = Math.floor(counter / 4294967296) >>> 0; s[14] = blockLen; s[15] = flags;
      let w = Uint32Array.from(m);
      const g = (a, b, c, d, x, y) => {
        s[a] = s[a] + s[b] + x; s[d] = rotr(s[d] ^ s[a], 16);
        s[c] = s[c] + s[d]; s[b] = rotr(s[b] ^ s[c], 12);
        s[a] = s[a] + s[b] + y; s[d] = rotr(s[d] ^ s[a], 8);
        s[c] = s[c] + s[d]; s[b] = rotr(s[b] ^ s[c], 7);
      };
      for (let r = 0; r < 7; r++) {
        g(0, 4, 8, 12, w[0], w[1]); g(1, 5, 9, 13, w[2], w[3]); g(2, 6, 10, 14, w[4], w[5]); g(3, 7, 11, 15, w[6], w[7]);
        g(0, 5, 10, 15, w[8], w[9]); g(1, 6, 11, 12, w[10], w[11]); g(2, 7, 8, 13, w[12], w[13]); g(3, 4, 9, 14, w[14], w[15]);
        if (r < 6) { const p = new Uint32Array(16); for (let i = 0; i < 16; i++) p[i] = w[PERM[i]]; w = p; }
      }
      for (let i = 0; i < 8; i++) { s[i] ^= s[i + 8]; s[i + 8] ^= cv[i]; }
      return s;
    }
    function words(off, len) {
      const w = new Uint32Array(16);
      for (let i = 0; i < len; i++) w[i >> 2] |= bytes[off + i] << ((i & 3) * 8);
      return w;
    }
    function chunkOutput(start, end, counter) {
      let cv = Uint32Array.from(IV);
      const nBlocks = Math.max(1, Math.ceil((end - start) / 64));
      for (let b = 0; b < nBlocks - 1; b++) cv = compress(cv, words(start + b * 64, 64), counter, 64, b === 0 ? CHUNK_START : 0).slice(0, 8);
      const off = start + (nBlocks - 1) * 64;
      return { cv, block: words(off, end - off), counter, blockLen: end - off, flags: (nBlocks === 1 ? CHUNK_START : 0) | CHUNK_END };
    }
    const outCV = (o) => compress(o.cv, o.block, o.counter, o.blockLen, o.flags).slice(0, 8);
    const parent = (l, r) => { const block = new Uint32Array(16); block.set(l, 0); block.set(r, 8); return { cv: Uint32Array.from(IV), block, counter: 0, blockLen: 64, flags: PARENT }; };
    const n = bytes.length, nChunks = Math.max(1, Math.ceil(n / 1024)), stack = [];
    for (let c = 0; c < nChunks - 1; c++) {
      let cv = outCV(chunkOutput(c * 1024, c * 1024 + 1024, c));
      let total = c + 1;
      while ((total & 1) === 0) { cv = outCV(parent(stack.pop(), cv)); total >>= 1; }
      stack.push(cv);
    }
    let out = chunkOutput((nChunks - 1) * 1024, n, nChunks - 1);
    while (stack.length) out = parent(stack.pop(), outCV(out));
    const s = compress(out.cv, out.block, 0, out.blockLen, out.flags | ROOT);
    let hex = "";
    for (let i = 0; i < 8; i++) for (let k = 0; k < 4; k++) hex += ((s[i] >>> (8 * k)) & 255).toString(16).padStart(2, "0");
    return hex;
  };
  const PAGES_SPECIAL = ["_worker.js", "_routes.json", "_headers", "_redirects"];
  const PTYPE = (p) => (p.endsWith(".woff2") ? "font/woff2" : TYPE(p));
  window.__pagesKey = async (blob, path) => {
    const b64 = await __b64(blob);
    const ext = path.includes(".") ? path.split(".").pop() : "";
    return { key: __blake3Hex(new TextEncoder().encode(b64 + ext)).slice(0, 32), b64 };
  };
  // يجد الحساب الذي فيه مشروع Pages بهذا الاسم وهذا النطاق، فلا يُكتب معرّف الحساب في المستودع العام
  window.__pagesAccount = async (project, domain) => {
    const acc = await __cf("/accounts?per_page=50");
    for (const a of acc.result || []) {
      const p = await __cf(`/accounts/${a.id}/pages/projects/${project}`);
      if (p.success && p.result && (p.result.domains || []).includes(domain)) return a.id;
    }
    return null;
  };
  // await __deployPages('dalilalfawtara', 'emtithali/site', '<commit>', { domain: 'emtithali.com', branch: 'main' })
  // branch 'main' = الإنتاج؛ أي فرع آخر (مثل claude-preview) = نسخة معاينة على dalilalfawtara-9ru.pages.dev
  window.__deployPages = async (project, dir, rev, opts = {}) => {
    const A = opts.account || (opts.domain ? await __pagesAccount(project, opts.domain) : null);
    if (!A) return { step: "account", msg: "لم يُعثر على حساب فيه المشروع والنطاق" };
    const tree = await (await fetch(`https://api.github.com/repos/${REPO}/git/trees/${rev}?recursive=1`, { cache: "no-store" })).json();
    if (!tree.tree) throw new Error("tree: " + tree.message);
    const pre = dir + "/";
    const list = tree.tree.filter((t) => t.type === "blob" && t.path.startsWith(pre)).map((t) => t.path.slice(pre.length));
    const base = `https://raw.githubusercontent.com/${REPO}/${rev}/${pre}`;
    const get = async (p) => {
      for (let i = 0; i < 3; i++) { try { const r = await fetch(base + p, { cache: "no-store" }); if (r.ok) return await r.blob(); } catch (e) { /* retry */ } }
      throw new Error("fetch: " + p);
    };
    const special = {}, assets = [];
    for (const p of list) { const blob = await get(p); if (PAGES_SPECIAL.includes(p)) special[p] = blob; else assets.push({ path: "/" + p, blob }); }
    const manifest = {}, payload = {};
    for (const f of assets) { const { key, b64 } = await __pagesKey(f.blob, f.path); manifest[f.path] = key; payload[key] = { b64, type: PTYPE(f.path) }; }
    const tok = await __cf(`/accounts/${A}/pages/projects/${project}/upload-token`);
    if (!tok.success) return { step: "token", errors: tok.errors };
    const jwt = tok.result.jwt;
    const api = async (p, body) => {
      const r = await fetch("/api/v4" + p, { method: "POST", credentials: "include", headers: { "x-atok": window.bootstrap.atok, Authorization: "Bearer " + jwt, "content-type": "application/json" }, body: JSON.stringify(body) });
      const t = await r.text();
      try { return JSON.parse(t); } catch (e) { return { success: false, status: r.status, text: t.slice(0, 300) }; }
    };
    const hashes = Object.keys(payload);
    const miss = await api("/pages/assets/check-missing", { hashes });
    if (!miss.success) return { step: "check-missing", errors: miss.errors || miss.text };
    const missing = miss.result || [];
    for (let i = 0; i < missing.length; i += 50) {
      const batch = missing.slice(i, i + 50).map((h) => ({ key: h, value: payload[h].b64, metadata: { contentType: payload[h].type }, base64: true }));
      const up = await api("/pages/assets/upload", batch);
      if (!up.success) return { step: "upload", errors: up.errors || up.text };
    }
    const ups = await api("/pages/assets/upsert-hashes", { hashes });
    if (!ups.success) return { step: "upsert-hashes", errors: ups.errors || ups.text };
    const fd = new FormData();
    fd.append("manifest", JSON.stringify(manifest));
    if (opts.branch) fd.append("branch", opts.branch);
    fd.append("commit_hash", rev);
    fd.append("commit_message", opts.message || rev);
    fd.append("commit_dirty", "false");
    for (const [name, blob] of Object.entries(special)) fd.append(name, new File([blob], name));
    const dep = await __cf(`/accounts/${A}/pages/projects/${project}/deployments`, { method: "POST", body: fd });
    return { account: A.slice(0, 6) + "…", success: dep.success, errors: dep.errors, id: dep.result && dep.result.id, url: dep.result && dep.result.url, env: dep.result && dep.result.environment, aliases: dep.result && dep.result.aliases, files: assets.length, uploaded: missing.length, special: Object.keys(special), manifest };
  };

  return "dash helpers ready";
})();
