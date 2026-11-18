// بصمتا موقع Pages من مجلد محلي، للمقارنة مع النشر الحي دون نسخ الملفات واحداً واحداً.
//   node tools/pages-digest.js emtithali/site
// manifestDigest: SHA-256 لأسطر «/path key» مرتبة، والمفتاح كما يحسبه Wrangler و__pagesKey
//   (blake3(base64(المحتوى) + الامتداد) أول 32 حرفاً). يقابلها manifest في نتيجة __deployPages.
// servedDigest: SHA-256 لأسطر «/path sha256» مرتبة لبايتات كل ملف. يقابلها __served في tools/pages-verify.js
//   على رابط النشر https://<id>.<project>.pages.dev (لا على النطاق المخصص: عامل SEO وإخفاء البريد يغيّران HTML).
// _worker.js و_routes.json و_headers و_redirects ملفات خاصة لا أصول، فلا تدخل في البصمتين.
const fs = require("fs"), path = require("path"), crypto = require("crypto"), vm = require("vm");

// دالة blake3 نفسها من tools/dash-helpers.js، فلا نسخة ثانية منها في المستودع.
const ctx = { location: { pathname: "/" }, TextEncoder };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "dash-helpers.js"), "utf8"), ctx);
const blake3Hex = ctx.__blake3Hex;

const dir = process.argv[2];
if (!dir) { console.error("usage: node tools/pages-digest.js <site-dir>"); process.exit(2); }
const SPECIAL = ["_worker.js", "_routes.json", "_headers", "_redirects"];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(dir).map((f) => "/" + path.relative(dir, f).split(path.sep).join("/"))
  .filter((p) => !SPECIAL.includes(p.slice(1))).sort((a, b) => (a < b ? -1 : 1));
let man = "", served = "";
for (const p of files) {
  const buf = fs.readFileSync(path.join(dir, p));
  const ext = p.includes(".") ? p.split(".").pop() : "";
  man += p + " " + blake3Hex(Buffer.from(buf.toString("base64") + ext, "utf8")).slice(0, 32) + "\n";
  served += p + " " + crypto.createHash("sha256").update(buf).digest("hex") + "\n";
}
const h = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");
console.log(JSON.stringify({ files: files.length, manifestDigest: h(man), servedDigest: h(served) }));
