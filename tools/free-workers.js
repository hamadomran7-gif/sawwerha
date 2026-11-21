// «العمّال المجانيون»: يوزّع مهمة كبيرة على نماذج مفتوحة في Cloudflare Workers AI، عامل لكل جزء،
// ثم يتحقق Claude من كل مخرَج قبل اعتماده (العامل يكشف، وClaude يحكم ويصلح).
// يعمل من متصفح لوحة Cloudflare بجلسة اللوحة (رأس x-atok) مثل dash-helpers.js؛ لا مفاتيح ولا أسرار في هذا الملف.
//
// حماية التكلفة (لا يُدفع شيء):
// - الافتراضي حساب بلا اشتراك Workers Paid: حصته المجانية 10,000 وحدة (Neuron) يومياً، وما فوقها يفشل ولا يُحسب.
// - الحساب المدفوع لا يُستخدم إلا بـ allowPaid، وبسقف لا يتجاوز 8,500 وحدة يُحسب من استهلاك اليوم الفعلي (GraphQL)
//   زائد ما صُرف في الدفعة وما هو قيد التنفيذ، فيبقى داخل الحصة المجانية.
// - تتصفّر الحصة 00:00 UTC (04:00 بتوقيت الإمارات).
//
// اختبار المفاضلة (21/11/2026، نص عربي فيه ستة أخطاء مزروعة):
//   gemma-4-26b بلا تفكير 6/6 بنحو 12 وحدة و8 ثوانٍ وتصحيحاته أدق؛ gpt-oss-120b بجهد تفكير منخفض 6/6 بنحو 40 وحدة و8 ثوانٍ؛
//   mistral-small-3.1 وllama-4-scout ‏4/6؛ gpt-oss-20b ‏2/6؛ llama-3.3-70b ‏1/6؛ glm-4.7-flash وqwen3.8 استنفدا الحد في التفكير.
//   التدقيق يشغّل الأولين معاً على كل جزء، ويُقدَّم ما اتفقا عليه: على صفحات حقيقية يكثر بلاغ العامل الواحد الخاطئ.
//
// الاستخدام بعد الحقن:
//   (0, eval)(await (await fetch('https://raw.githubusercontent.com/hamadomran7-gif/sawwerha/<commit>/tools/free-workers.js', { cache: 'no-store' })).text())
//   await __fw.accounts()                                     // الحسابات وخطتها وما استُهلك اليوم
//   await __fw.ask('سؤال', { system, model })                  // طلب واحد
//   __fw.start(jobs, opts); __fw.status()                     // دفعة في الخلفية (javascript_tool يتوقف عند ~45 ثانية)
//     jobs: [{ id, prompt, system?, model?, max_tokens? }]
//     opts: { model, system, concurrency: 6, cap, account, allowPaid: false, json: false, extra: {} }
//   __fw.resume({ allowPaid: true })                          // إكمال ما أوقفه السقف على حساب آخر
//   __fw.retryFailed({ max_tokens: 8000 })                    // إعادة ما فشل أو لم يُرجع JSON
//   const pages = await __fw.pagesFromRepo('<commit>', 'emtithali/site')
//   __fw.proofread(pages); __fw.status(); __fw.report()        // تدقيق لغوي: صفحة (أو جزء منها) لكل عامل
//   await __fw.prepublish('<المنشور>', '<الجديد>'); __fw.report({ minAgree: 2 })   // فحص ما قبل النشر (المصنع)
(() => {
  const REPO = "hamadomran7-gif/sawwerha";
  const DEFAULT_MODEL = "@cf/openai/gpt-oss-120b";
  // وحدات لكل مليون رمز [مدخلات، مخرجات] من صفحة الأسعار؛ للتقدير المسبق فقط، والاستهلاك الفعلي يأتي في usage.neurons
  const RATES = {
    "@cf/openai/gpt-oss-120b": [31818, 68182],
    "@cf/openai/gpt-oss-20b": [18182, 27273],
    "@cf/google/gemma-4-26b-a4b-it": [9091, 27273],
    "@cf/mistralai/mistral-small-3.1-24b-instruct": [31876, 50488],
    "@cf/meta/llama-4-scout-17b-16e-instruct": [24545, 77273],
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast": [26668, 204805],
    "@cf/zai-org/glm-4.7-flash": [5500, 36400],
  };
  // gemma-4 بلا تفكير: 6/6 بنحو 12 وحدة و8 ثوانٍ؛ وبالتفكير استنفد 4,000 رمز على صفحات حقيقية فلم يُرجع شيئاً
  const EXTRA = {
    "@cf/openai/gpt-oss-120b": { reasoning_effort: "low" },
    "@cf/openai/gpt-oss-20b": { reasoning_effort: "low" },
    "@cf/google/gemma-4-26b-a4b-it": { chat_template_kwargs: { enable_thinking: false } },
  };
  const PROOF_MODELS = ["@cf/google/gemma-4-26b-a4b-it", "@cf/openai/gpt-oss-120b"];
  const FREE_LIMIT = 10000, FREE_CAP = 9700, PAID_CAP_MAX = 8500;

  const fw = (window.__fw = window.__fw || {});
  fw.results = fw.results || [];

  const api = async (p, o = {}) => {
    const headers = Object.assign({ "x-atok": (window.bootstrap && window.bootstrap.atok) || "" }, o.body ? { "content-type": "application/json" } : {}, o.headers || {});
    const r = await fetch("/api/v4" + p, { credentials: "include", ...o, headers });
    const t = await r.text();
    try { const j = JSON.parse(t); j._status = r.status; return j; } catch (e) { return { success: false, _status: r.status, errors: [{ message: t.slice(0, 300) }] }; }
  };
  const today = () => new Date().toISOString().slice(0, 10);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ما صرفته هذه الأداة اليوم لكل حساب. GraphQL يتأخر دقائق عن الاستهلاك، فالأساس هو الأكبر من الاثنين
  // (21/11/2026: بعد دفعة 8,369 وحدة بقي GraphQL يعرض 1,080).
  const SPENT_KEY = "__fw_spent";
  const spentBook = () => {
    let s = fw._spent;
    if (!s) { try { s = JSON.parse(localStorage.getItem(SPENT_KEY) || "null"); } catch (e) { s = null; } }
    if (!s || s.date !== today()) s = { date: today(), by: {} };
    return (fw._spent = s);
  };
  const addSpent = (acc, n) => {
    const s = spentBook();
    s.by[acc] = (s.by[acc] || 0) + (n || 0);
    try { localStorage.setItem(SPENT_KEY, JSON.stringify(s)); } catch (e) {}
  };
  const used = async (acc) => Math.round(Math.max(await fw.usedToday(acc), spentBook().by[acc] || 0));

  fw.usedToday = async (acc) => {
    const query = `{ viewer { accounts(filter:{accountTag:"${acc}"}) { aiInferenceAdaptiveGroups(limit:100, filter:{date_geq:"${today()}"}) { sum { totalNeurons } } } } }`;
    const j = await api("/graphql", { method: "POST", body: JSON.stringify({ query }) });
    const a = j && j.data && j.data.viewer && j.data.viewer.accounts && j.data.viewer.accounts[0];
    if (!a) throw new Error("usage: " + JSON.stringify(j.errors || j).slice(0, 200));
    return a.aiInferenceAdaptiveGroups.reduce((s, x) => s + ((x.sum && x.sum.totalNeurons) || 0), 0);
  };

  // الخطة من الاشتراكات؛ إن تعذّرت قراءتها عُدّ الحساب مدفوعاً احتياطاً
  fw.accounts = async () => {
    const j = await api("/accounts?per_page=50");
    const out = [];
    for (const a of j.result || []) {
      const s = await api(`/accounts/${a.id}/subscriptions`);
      const paid = !s.success || (s.result || []).some((x) => x.rate_plan && /workers_paid/.test(String(x.rate_plan.id || "")));
      let u = null;
      try { u = await used(a.id); } catch (e) {}
      out.push({ id: a.id, name: a.name, plan: paid ? "paid" : "free", usedToday: u, cap: paid ? PAID_CAP_MAX : FREE_CAP });
    }
    fw._accounts = out;
    return out.map((a) => Object.assign({}, a, { id: a.id.slice(0, 4) + "…" + a.id.slice(-3) }));
  };

  const pickAccount = async (opts) => {
    if (!fw._accounts) await fw.accounts();
    let c = fw._accounts.filter((a) => !opts.account || a.id === opts.account || a.id.startsWith(opts.account));
    if (!opts.allowPaid) c = c.filter((a) => a.plan === "free");
    if (!c.length) throw new Error("لا حساب مناسب؛ الحساب المدفوع يحتاج allowPaid: true");
    for (const a of c) a.usedToday = await used(a.id);
    // الحساب المجاني أولاً ما دام فيه متسع، ثم الأكثر متسعاً
    const room = (a) => a.cap - a.usedToday;
    c.sort((x, y) => ((y.plan === "free" && room(y) >= 300) - (x.plan === "free" && room(x) >= 300)) || room(y) - room(x));
    return c[0];
  };

  const textOf = (r) => {
    if (!r) return "";
    if (r.choices && r.choices[0]) return (r.choices[0].message && r.choices[0].message.content) || r.choices[0].text || "";
    if (typeof r.response === "string") return r.response;
    if (r.response && typeof r.response === "object") return JSON.stringify(r.response);
    if (Array.isArray(r.output)) return r.output.filter((o) => o.type === "message").flatMap((o) => (o.content || []).map((c) => c.text || "")).join("");
    return "";
  };

  // أول كائن JSON متوازن الأقواس في النص (النماذج تحيطه أحياناً بـ ``` أو بنص)
  fw.parseJSON = (t) => {
    const s = String(t || "");
    for (let i = s.indexOf("{"); i >= 0; i = s.indexOf("{", i + 1)) {
      let d = 0, str = false, esc = false;
      for (let k = i; k < s.length; k++) {
        const ch = s[k];
        if (str) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') str = false; continue; }
        if (ch === '"') str = true;
        else if (ch === "{") d++;
        else if (ch === "}" && --d === 0) { try { return JSON.parse(s.slice(i, k + 1)); } catch (e) { break; } }
      }
    }
    return null;
  };

  const modelOf = (job, opts) => job.model || opts.model || DEFAULT_MODEL;
  const estimate = (job, opts) => {
    const [ri, ro] = RATES[modelOf(job, opts)] || [60000, 300000];
    const tin = ((job.system || opts.system || "").length + String(job.prompt).length) / 2.4;
    const tout = Math.min(job.max_tokens || opts.max_tokens || 4000, opts.expectOut || 1500);
    return (tin * ri + tout * ro) / 1e6;
  };

  const runOne = async (acc, job, opts) => {
    const model = modelOf(job, opts);
    const messages = [];
    const system = job.system || opts.system;
    if (system) messages.push({ role: "system", content: system });
    messages.push({ role: "user", content: String(job.prompt) });
    const body = Object.assign({ messages, max_tokens: job.max_tokens || opts.max_tokens || 4000, temperature: 0 }, EXTRA[model] || {}, opts.extra || {});
    const t0 = Date.now();
    let j;
    for (let i = 0; i < 3; i++) {
      j = await api(`/accounts/${acc.id}/ai/run/${model}`, { method: "POST", body: JSON.stringify(body) });
      if (j.success || ![429, 500, 502, 503, 504].includes(j._status)) break;
      await sleep(2000 * (i + 1));
    }
    const res = j.result || {};
    const u = res.usage || {};
    addSpent(acc.id, u.neurons);
    const fin = res.choices && res.choices[0] && res.choices[0].finish_reason;
    const text = textOf(res);
    const err = j.success ? (text ? undefined : "empty:" + fin) : JSON.stringify(j.errors || j._status).slice(0, 300);
    return { id: job.id, model, ok: !!j.success && !!text, fin, text, json: opts.json ? fw.parseJSON(text) : undefined, neurons: u.neurons || 0, tin: u.prompt_tokens || 0, tout: u.completion_tokens || 0, ms: Date.now() - t0, err };
  };

  fw.ask = async (prompt, opts = {}) => {
    const acc = await pickAccount(opts);
    const job = { id: "ask", prompt };
    const cap = acc.plan === "paid" ? PAID_CAP_MAX : FREE_CAP;
    if (acc.usedToday + estimate(job, opts) > cap) return { ok: false, err: "cap", usedToday: acc.usedToday };
    return runOne(acc, job, opts);
  };

  fw.start = (jobs, opts = {}) => {
    if (fw.state && !fw.state.done) return "دفعة قيد التشغيل؛ __fw.status()";
    const st = (fw.state = { done: false, total: jobs.length, finished: 0, failed: 0, neurons: 0, opts, startedAt: new Date().toISOString(), stopReason: null, remainingJobs: [] });
    fw._jobs = fw._jobs || new Map();
    for (const j of jobs) fw._jobs.set(j.id, j);
    (async () => {
      try {
        const acc = await pickAccount(opts);
        const cap = acc.plan === "paid" ? Math.min(opts.cap || PAID_CAP_MAX, PAID_CAP_MAX) : Math.min(opts.cap || FREE_CAP, FREE_LIMIT);
        Object.assign(st, { account: acc.id.slice(0, 4) + "…", plan: acc.plan, cap, base: acc.usedToday });
        const queue = jobs.slice();
        let inflight = 0;
        const worker = async () => {
          while (queue.length && !st.stopReason) {
            const est = estimate(queue[0], opts);
            if (st.base + st.neurons + inflight + est > cap) { st.stopReason = "cap"; break; }
            const job = queue.shift();
            inflight += est;
            const r = await runOne(acc, job, opts).catch((e) => ({ id: job.id, model: modelOf(job, opts), ok: false, err: String(e), neurons: 0 }));
            inflight -= est;
            st.neurons += r.neurons || 0;
            if (!r.ok && /4006|allocation|daily|exceeded|quota/i.test(r.err || "")) { st.stopReason = "limit: " + r.err.slice(0, 120); queue.unshift(job); continue; }
            st.finished++;
            if (!r.ok) st.failed++;
            fw.results.push(r);
          }
        };
        await Promise.all(Array.from({ length: opts.concurrency || 6 }, worker));
        st.remainingJobs = queue;
      } catch (e) { st.stopReason = "error: " + e.message; st.remainingJobs = jobs.slice(st.finished); }
      st.done = true;
      st.endedAt = new Date().toISOString();
    })();
    return "بدأت: " + jobs.length + " مهمة؛ __fw.status()";
  };

  fw.resume = (opts = {}) => {
    const s = fw.state;
    if (!s || !s.done || !s.remainingJobs.length) return "لا شيء متبقٍ";
    return fw.start(s.remainingJobs, Object.assign({}, s.opts, opts));
  };

  // إعادة المهام الفاشلة (مثل نفاد الحد في التفكير) بحد أعلى أو بنموذج آخر: __fw.retryFailed({ max_tokens: 8000 })
  fw.retryFailed = (opts = {}) => {
    if (fw.state && !fw.state.done) return "دفعة قيد التشغيل";
    const bad = fw.results.filter((r) => !r.ok || (fw.state && fw.state.opts.json && !r.json));
    if (!bad.length) return "لا إخفاقات";
    const ids = new Set(bad.map((r) => r.id));
    fw.results = fw.results.filter((r) => !ids.has(r.id));
    return fw.start([...ids].map((id) => fw._jobs.get(id)).filter(Boolean), Object.assign({}, fw.state && fw.state.opts, opts));
  };

  fw.status = () => {
    const s = fw.state;
    if (!s) return null;
    return { done: s.done, total: s.total, finished: s.finished, failed: s.failed, remaining: s.remainingJobs.length, neurons: Math.round(s.neurons), plan: s.plan, cap: s.cap, base: s.base, stopReason: s.stopReason, totalResults: fw.results.length };
  };

  fw.reset = () => { fw.results = []; fw.state = null; fw._pages = null; fw._jobs = null; return "ok"; };

  // نص الصفحة المرئي: المحتوى الرئيس بلا تنقل ولا تذييل ولا شيفرة. مسافة بعد كل عنصر سطري، لأن البطاقات
  // (<a><strong>العنوان</strong><span>الوصف</span></a>) تلتصق كلماتها في textContent فيعدّها العامل خطأ إملائياً
  // (21/11/2026: نحو 140 من 184 بلاغاً في امتثالي كانت من هذا الالتصاق).
  fw.htmlText = (html) => {
    const d = new DOMParser().parseFromString(html, "text/html");
    d.querySelectorAll("script,style,noscript,svg,nav,footer,form,template,body > header").forEach((e) => e.remove());
    const root = d.querySelector("main") || d.body;
    root.querySelectorAll("a > strong, a > b, a > span, a > small").forEach((e) => e.after("\n"));
    root.querySelectorAll("a,strong,b,em,i,span,small,label,button,code,abbr,time,mark,sup,sub,img").forEach((e) => e.after(" "));
    root.querySelectorAll("p,li,h1,h2,h3,h4,h5,h6,td,th,tr,div,br,dt,dd,summary,figcaption,blockquote,section,article").forEach((e) => e.after("\n"));
    return root.textContent
      .replace(/[ \t ]+/g, " ")
      .replace(/ +([،,.؛;:!؟?)\]»])/g, "$1")
      .replace(/([(\[«]) +/g, "$1")
      .replace(/ *\n\s*/g, "\n")
      .trim();
  };

  fw.pagesFromRepo = async (rev, dir, filter = /\.html$/) => {
    const tree = await (await fetch(`https://api.github.com/repos/${REPO}/git/trees/${rev}?recursive=1`, { cache: "no-store" })).json();
    if (!tree.tree) throw new Error("tree: " + tree.message);
    const pre = dir + "/";
    const q = tree.tree.filter((t) => t.type === "blob" && t.path.startsWith(pre) && filter.test(t.path)).map((t) => t.path.slice(pre.length));
    const base = `https://raw.githubusercontent.com/${REPO}/${rev}/${pre}`;
    const out = [];
    await Promise.all(Array.from({ length: 8 }, async () => {
      while (q.length) {
        const p = q.shift();
        const r = await fetch(base + p, { cache: "no-store" });
        out.push(r.ok ? { id: "/" + p, text: fw.htmlText(await r.text()) } : { id: "/" + p, text: "", err: r.status });
      }
    }));
    return out.sort((a, b) => a.id.localeCompare(b.id));
  };

  fw.chunks = (text, max = 6000) => {
    if (text.length <= max) return [text];
    const out = [];
    let cur = "";
    for (const l of text.split("\n")) {
      if (cur && cur.length + l.length + 1 > max) { out.push(cur); cur = ""; }
      cur += (cur ? "\n" : "") + l;
    }
    if (cur) out.push(cur);
    return out;
  };

  // التاريخ في التعليمات: بدونه عدّ gemma-4 كل تاريخ في 2026 «مستقبلياً» خطأً (21/11/2026: 25 من 31 بلاغاً له)
  const proofSys = () => 'أنت مدقق لغوي عربي صارم. تاريخ اليوم ' + today() + '، فالتواريخ والقرارات المذكورة بسنواتها ليست أخطاء لأنها حديثة أو مقبلة. اقرأ نص صفحة ويب واذكر الأخطاء المؤكدة فقط: خطأ إملائي، كلمة مكررة، خطأ تذكير وتأنيث أو إفراد وجمع، جملة ناقصة أو مبتورة، تناقض في رقم أو تاريخ داخل النص نفسه. لا تقترح تحسينات أسلوبية، ولا تعدّ المصطلحات الإنجليزية أو الرموز أو أسماء الجهات والأنظمة أخطاء، ولا تعدّ تكرار عنوان في زر أو بطاقة تكراراً، ولا العناوين القصيرة جملاً ناقصة. أعد JSON فقط بهذا الشكل: {"issues":[{"quote":"اقتباس حرفي قصير من النص","type":"spelling|repeat|agreement|incomplete|inconsistency","fix":"التصحيح"}]} وإن لم توجد أخطاء فأعد {"issues":[]}.';

  // عاملان مستقلان على كل جزء افتراضياً (gemma-4 ثم gpt-oss-120b)، ثم يرفع report() ما اتفقا عليه أولاً (agree)؛
  // opts.models لتغييرهما، أو opts.model لعامل واحد
  fw.proofread = (pages, opts = {}) => {
    const models = opts.models || (opts.model ? [opts.model] : PROOF_MODELS);
    const jobs = [];
    for (const p of pages) {
      if (!p.text || p.text.length < 40) continue;
      const parts = fw.chunks(p.text, opts.chunk || 6000);
      parts.forEach((c, i) => {
        const id = parts.length > 1 ? p.id + "#" + (i + 1) : p.id;
        for (const m of models) jobs.push({ id: models.length > 1 ? id + "@" + m.split("/").pop() : id, prompt: c, model: m });
      });
    }
    fw._pages = new Map(pages.map((p) => [p.id, p.text]));
    return fw.start(jobs, Object.assign({ system: proofSys(), json: true, expectOut: 900 }, opts));
  };

  // المطابقة تتجاهل التشكيل والتطويل والمسافات؛ الاقتباس الذي لا يوجد في الصفحة يُسقط آلياً (اختلاق)
  const norm = (s) => String(s || "").replace(/[ً-ْٰـ]/g, "").replace(/\s+/g, " ").trim();
  // report({ minAgree: 2 }) يعيد ما اتفق عليه عاملان فأكثر فقط
  fw.report = (opts = {}) => {
    const pages = fw._pages || new Map();
    const issues = [], dropped = [], failed = [];
    for (const r of fw.results) {
      if (!r.ok) { failed.push(r.id + " " + r.err); continue; }
      const part = String(r.id).split("@")[0];
      const page = norm(pages.get(part.split("#")[0]) || "");
      const list = r.json && Array.isArray(r.json.issues) ? r.json.issues : null;
      if (!list) { failed.push(r.id + " json"); continue; }
      for (const it of list) {
        const parts = String(it.quote || "").split(/\.\.\.|…/).map(norm).filter(Boolean);
        const found = parts.length > 0 && parts.every((q) => page.includes(q));
        const row = { page: part, type: it.type, quote: it.quote, fix: it.fix, model: String(r.model).split("/").pop(), q: parts.join(" ") };
        (found && norm(it.fix) !== norm(it.quote) ? issues : dropped).push(row);
      }
    }
    // اتفاق العمّال: عدد النماذج المختلفة التي أشارت إلى اقتباس متداخل في الجزء نفسه
    for (const a of issues) {
      const ms = new Set(issues.filter((b) => b.page === a.page && (a.q.includes(b.q) || b.q.includes(a.q))).map((b) => b.model));
      a.agree = ms.size;
    }
    issues.sort((x, y) => y.agree - x.agree);
    issues.forEach((x) => delete x.q);
    const neurons = Math.round(fw.results.reduce((s, r) => s + (r.neurons || 0), 0));
    const kept = issues.filter((x) => x.agree >= (opts.minAgree || 1));
    return { checked: fw.results.filter((r) => r.ok).length, failed, issues: kept, below: issues.length - kept.length, dropped: dropped.length, neurons };
  };

  // فحص ما قبل النشر: الصفحات العربية التي تغيّرت بين commit منشور وcommit جديد، بعاملين، ثم report({ minAgree: 2 })
  //   await __fw.prepublish('<المنشور>', '<الجديد>')   // ثم __fw.status() حتى done، ثم __fw.report({ minAgree: 2 })
  fw.prepublish = async (base, head, opts = {}) => {
    const cmp = await (await fetch(`https://api.github.com/repos/${REPO}/compare/${base}...${head}`, { cache: "no-store" })).json();
    if (!cmp.files) throw new Error("compare: " + (cmp.message || "no files"));
    const dirs = opts.dirs || ["emtithali/site/", "web/", "mustahaqati/dist/"];
    const names = cmp.files
      .filter((f) => f.status !== "removed" && /\.html$/.test(f.filename) && dirs.some((d) => f.filename.startsWith(d)) && !/\/en\//.test(f.filename))
      .map((f) => f.filename);
    if (cmp.files.length >= 300) throw new Error("compare: أكثر من 300 ملف، فقسّم المدى");
    const pages = [];
    for (const n of names) {
      const r = await fetch(`https://raw.githubusercontent.com/${REPO}/${head}/${n}`, { cache: "no-store" });
      if (r.ok) pages.push({ id: "/" + n, text: fw.htmlText(await r.text()) });
    }
    if (!pages.length) return { pages: 0, msg: "لا صفحات عربية متغيّرة" };
    fw.reset();
    return { pages: pages.length, msg: fw.proofread(pages, Object.assign({ allowPaid: true }, opts)) };
  };
})();
