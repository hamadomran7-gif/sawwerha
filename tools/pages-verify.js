// تحقق من بايتات نشر Pages كما تُخدم. يُحقن في تبويب على رابط النشر نفسه https://<id>.<project>.pages.dev
// (لا على النطاق المخصص: أمام emtithali.com عامل يغيّر HTML، وCloudflare يخفي البريد في الصفحات):
//   (0, eval)(await (await fetch('https://raw.githubusercontent.com/hamadomran7-gif/sawwerha/<commit>/tools/pages-verify.js', { cache: 'no-store' })).text())
//   await __served('<commit>', 'emtithali/site')   // → { files, digest, bad }
// digest يساوي servedDigest من `node tools/pages-digest.js <dir>` عند المطابقة التامة، وbad يسرد ما لم يرد 200 مباشرة.
(() => {
  const REPO = "hamadomran7-gif/sawwerha";
  const SPECIAL = new Set(["_worker.js", "_routes.json", "_headers", "_redirects"]);
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  // Pages يخدم x.html على ‎/x‎ وa/index.html على ‎/a/‎
  const pretty = (p) => (p.endsWith("/index.html") ? p.slice(0, -10) : p.endsWith(".html") ? p.slice(0, -5) : p);
  const gh = async (u) => {
    const r = await fetch("https://api.github.com/repos/" + REPO + u, { cache: "no-store" });
    if (!r.ok) throw new Error(u + " " + r.status);
    return r.json();
  };
  window.__served = async function (rev, dir) {
    const parts = dir.split("/"), name = parts.pop();
    const entry = (await gh("/contents/" + parts.join("/") + "?ref=" + rev)).find((e) => e.name === name && e.type === "dir");
    if (!entry) throw new Error("no " + dir + " at " + rev);
    const tree = await gh("/git/trees/" + entry.sha + "?recursive=1");
    if (tree.truncated) throw new Error("tree truncated");
    const paths = tree.tree.filter((e) => e.type === "blob" && !SPECIAL.has(e.path)).map((e) => "/" + e.path).sort((a, b) => (a < b ? -1 : 1));
    const lines = new Array(paths.length), bad = [];
    for (let i = 0; i < paths.length; i += 8) {
      await Promise.all(paths.slice(i, i + 8).map(async (p, j) => {
        const r = await fetch(encodeURI(pretty(p)), { cache: "no-store" });
        if (r.status !== 200 || r.redirected) bad.push(p + " " + r.status + (r.redirected ? " redirected" : ""));
        lines[i + j] = p + " " + hex(await crypto.subtle.digest("SHA-256", await r.arrayBuffer())) + "\n";
      }));
    }
    return { files: paths.length, digest: hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(lines.join("")))), bad };
  };
})();
