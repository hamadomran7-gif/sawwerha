/* صوّرها — مولّد ريلز إعلانات ميتا (9:16) وصور ثابتة (4:5) داخل المتصفح.
 * يرسم الإطارات على canvas، ويرمّزها H.264 عبر WebCodecs، ويجمعها في ملف MP4 بمُجمِّع صغير مكتوب هنا
 * (بلا مكتبات خارجية). لا يحتاج خادماً ولا npm.
 *
 * الاستخدام:
 *   await window.SawwerhaReels.init()                         // يحمّل الخطوط ويتحقق من دعم H.264
 *   const out = await window.SawwerhaReels.renderAll(images)  // images: {before, scene1, scene2, white} كـ ImageBitmap
 *   // out: [{ name, type, blob }]
 */
(function () {
  "use strict";
  const W = 1080, H = 1920, FPS = 30;
  const C = {
    cream: "#fbf7f1", fg: "#221b2c", primary: "#2b2140", primary2: "#47336e",
    accent: "#e39b00", accentSoft: "#f0b43a", wa: "#1fae55", white: "#ffffff", strike: "#ff5a5f",
  };
  const DISCLOSURE = "صور معدّلة بالذكاء الاصطناعي · المنتج الحقيقي دون تغيير";
  const FONT_CSS = "https://fonts.googleapis.com/css2?family=Cairo:wght@700;800&family=IBM+Plex+Sans+Arabic:wght@500;700&display=swap";

  // ------------------------------------------------------------ أدوات عامة
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const lerp = (a, b, x) => a + (b - a) * x;

  async function loadFonts() {
    const css = await (await fetch(FONT_CSS)).text();
    const re = /@font-face\s*{([^}]*)}/g;
    const loads = [];
    let m;
    while ((m = re.exec(css))) {
      const b = m[1];
      const fam = /font-family:\s*'([^']+)'/.exec(b)[1];
      const wt = /font-weight:\s*(\d+)/.exec(b)[1];
      const url = /url\(([^)]+)\)/.exec(b)[1];
      const ur = (/unicode-range:\s*([^;]+);/.exec(b) || [])[1];
      const ff = new FontFace(fam, `url(${url})`, { weight: wt, unicodeRange: ur || "U+0-10FFFF" });
      loads.push(ff.load().then((f) => document.fonts.add(f)));
    }
    await Promise.all(loads);
    await document.fonts.ready;
    if (!document.fonts.check('800 40px "Cairo"', "صوّرها")) throw new Error("Cairo font not available");
  }

  // ------------------------------------------------------------ مُجمِّع MP4 صغير (مسار فيديو H.264 واحد، Fast Start)
  const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const u16 = (n) => [(n >>> 8) & 255, n & 255];
  const str4 = (t) => [...t].map((c) => c.charCodeAt(0));
  function concat(parts) {
    let n = 0;
    for (const p of parts) n += p.length;
    const out = new Uint8Array(n);
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  }
  function box(type, ...parts) {
    const payload = concat(parts);
    const out = new Uint8Array(8 + payload.length);
    out.set(u32(out.length), 0);
    out.set(str4(type), 4);
    out.set(payload, 8);
    return out;
  }
  const fullbox = (type, version, flags, ...parts) => box(type, [version, (flags >>> 16) & 255, (flags >>> 8) & 255, flags & 255], ...parts);
  const MATRIX = [].concat(u32(0x00010000), u32(0), u32(0), u32(0), u32(0x00010000), u32(0), u32(0), u32(0), u32(0x40000000));

  class MiniMp4 {
    constructor(width, height, fps) {
      this.w = width; this.h = height; this.fps = fps; this.ts = 90000;
      this.samples = []; this.avcC = null; this.lastPts = -Infinity;
    }
    add(chunk, meta) {
      const d = meta && meta.decoderConfig && meta.decoderConfig.description;
      if (d && !this.avcC) this.avcC = ArrayBuffer.isView(d) ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength).slice() : new Uint8Array(d).slice();
      if (chunk.timestamp < this.lastPts) throw new Error("encoder reordered frames (B-frames) — unsupported");
      this.lastPts = chunk.timestamp;
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      this.samples.push({ data, key: chunk.type === "key" });
    }
    moov(offset) {
      const n = this.samples.length, delta = Math.round(this.ts / this.fps);
      const mediaDur = n * delta, movieDur = Math.round((n * 1000) / this.fps);
      const keys = [];
      this.samples.forEach((smp, i) => { if (smp.key) keys.push(i + 1); });
      const avc1 = box("avc1", [0, 0, 0, 0, 0, 0], u16(1), u16(0), u16(0), u32(0), u32(0), u32(0), u16(this.w), u16(this.h),
        u32(0x00480000), u32(0x00480000), u32(0), u16(1), new Uint8Array(32), u16(0x0018), [0xff, 0xff], box("avcC", this.avcC));
      const stbl = box("stbl",
        fullbox("stsd", 0, 0, u32(1), avc1),
        fullbox("stts", 0, 0, u32(1), u32(n), u32(delta)),
        fullbox("stss", 0, 0, u32(keys.length), ...keys.map(u32)),
        fullbox("stsc", 0, 0, u32(1), u32(1), u32(n), u32(1)),
        fullbox("stsz", 0, 0, u32(0), u32(n), ...this.samples.map((x) => u32(x.data.length))),
        fullbox("stco", 0, 0, u32(1), u32(offset)));
      const minf = box("minf", fullbox("vmhd", 0, 1, u16(0), u16(0), u16(0), u16(0)),
        box("dinf", fullbox("dref", 0, 0, u32(1), fullbox("url ", 0, 1))), stbl);
      const mdia = box("mdia",
        fullbox("mdhd", 0, 0, u32(0), u32(0), u32(this.ts), u32(mediaDur), u16(0x55c4), u16(0)),
        fullbox("hdlr", 0, 0, u32(0), str4("vide"), u32(0), u32(0), u32(0), str4("VideoHandler"), [0]),
        minf);
      const tkhd = fullbox("tkhd", 0, 3, u32(0), u32(0), u32(1), u32(0), u32(movieDur), u32(0), u32(0), u16(0), u16(0), u16(0), u16(0),
        MATRIX, u32(this.w * 65536), u32(this.h * 65536));
      const mvhd = fullbox("mvhd", 0, 0, u32(0), u32(0), u32(1000), u32(movieDur), u32(0x00010000), u16(0x0100), u16(0), u32(0), u32(0),
        MATRIX, new Uint8Array(24), u32(2));
      return box("moov", mvhd, box("trak", tkhd, mdia));
    }
    finalize() {
      if (!this.avcC) throw new Error("missing avcC (decoder description)");
      const ftyp = box("ftyp", str4("isom"), u32(0x200), str4("isom"), str4("iso2"), str4("avc1"), str4("mp41"));
      const dataLen = this.samples.reduce((a, x) => a + x.data.length, 0);
      const probe = this.moov(0);
      const offset = ftyp.length + probe.length + 8;
      const moov = this.moov(offset);
      const mdatHead = new Uint8Array([...u32(8 + dataLen), ...str4("mdat")]);
      return new Blob([ftyp, moov, mdatHead, ...this.samples.map((x) => x.data)], { type: "video/mp4" });
    }
  }

  function wrap(ctx, str, maxW) {
    const out = [];
    for (const para of String(str).split("\n")) {
      let cur = "";
      for (const w of para.split(" ")) {
        const t = cur ? cur + " " + w : w;
        if (cur && ctx.measureText(t).width > maxW) { out.push(cur); cur = w; } else cur = t;
      }
      out.push(cur);
    }
    return out;
  }

  function text(ctx, str, x, y, o = {}) {
    const { size = 80, weight = 800, family = "Cairo", color = C.white, align = "center", maxW = 920, lh = 1.28, alpha = 1, shadow = true, dy = 0 } = o;
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.direction = "rtl";
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px "${family}"`;
    if (shadow) { ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 22; ctx.shadowOffsetY = 4; }
    const lines = wrap(ctx, str, maxW);
    const step = size * lh;
    const top = y - ((lines.length - 1) * step) / 2 + dy;
    lines.forEach((ln, i) => ctx.fillText(ln, x, top + i * step));
    ctx.restore();
  }

  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function chip(ctx, str, x, y, o = {}) {
    const { size = 40, bg = "rgba(20,14,30,.72)", color = C.white, alpha = 1, anchor = "right", family = "IBM Plex Sans Arabic", weight = 700 } = o;
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = `${weight} ${size}px "${family}"`;
    ctx.direction = "rtl";
    const tw = ctx.measureText(str).width;
    const pw = tw + size * 1.3, ph = size * 1.75;
    const left = anchor === "right" ? x - pw : anchor === "left" ? x : x - pw / 2;
    rrect(ctx, left, y - ph / 2, pw, ph, ph / 2);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(str, left + pw / 2, y + 1);
    ctx.restore();
  }

  function cover(ctx, img, x, y, w, h, zoom = 1, fx = 0.5, fy = 0.5) {
    const s = Math.max(w / img.width, h / img.height) * zoom;
    const dw = img.width * s, dh = img.height * s;
    ctx.drawImage(img, x + (w - dw) * fx, y + (h - dh) * fy, dw, dh);
  }

  function blurredBg(ctx, img, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.filter = "blur(46px) brightness(0.5) saturate(1.15)";
    cover(ctx, img, -80, -80, W + 160, H + 160, 1.05);
    ctx.restore();
  }

  function gradientBg(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.primary);
    g.addColorStop(1, C.primary2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // بطاقة الصورة الرئيسية في منتصف الإطار
  const CARD = { x: 90, y: 560, w: 900, h: 900, r: 40 };

  function cardFrame(ctx, drawInside, o = {}) {
    const { x, y, w, h, r } = Object.assign({}, CARD, o);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.45)";
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 18;
    rrect(ctx, x, y, w, h, r);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();
    ctx.save();
    rrect(ctx, x, y, w, h, r);
    ctx.clip();
    drawInside(x, y, w, h);
    ctx.restore();
  }

  function photo(ctx, img, x, y, w, h, zoom, fy) {
    cover(ctx, img, x, y, w, h, zoom, 0.5, fy == null ? 0.45 : fy);
  }

  // شريط «قبل/بعد» ينكشف من اليمين إلى اليسار
  function slider(ctx, before, after, p, zoomA, zoomB) {
    cardFrame(ctx, (x, y, w, h) => {
      photo(ctx, before, x, y, w, h, zoomA);
      const dx = x + w * (1 - p);
      ctx.save();
      ctx.beginPath();
      ctx.rect(dx, y, x + w - dx, h);
      ctx.clip();
      photo(ctx, after, x, y, w, h, zoomB);
      ctx.restore();
      if (p > 0 && p < 1) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(dx - 3, y, 6, h);
        ctx.beginPath();
        ctx.arc(dx, y + h / 2, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.primary;
        ctx.font = '800 34px "Cairo"';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("‹ ›", dx, y + h / 2 + 2);
      }
    });
    chip(ctx, "قبل", CARD.x + 28, CARD.y + 52, { anchor: "left", alpha: 1 - prog(p, 0.75, 1) });
    chip(ctx, "بعد", CARD.x + CARD.w - 28, CARD.y + 52, { bg: C.accent, color: "#1d1500", alpha: prog(p, 0.05, 0.25) });
  }

  function crossfade(ctx, a, b, p, zoomA, zoomB, label) {
    cardFrame(ctx, (x, y, w, h) => {
      photo(ctx, a, x, y, w, h, zoomA);
      ctx.save();
      ctx.globalAlpha = ease(p);
      photo(ctx, b, x, y, w, h, zoomB);
      ctx.restore();
    });
    if (label) chip(ctx, label, CARD.x + CARD.w - 28, CARD.y + 52, { bg: C.accent, color: "#1d1500" });
  }

  function single(ctx, img, zoom, label, labelStyle) {
    cardFrame(ctx, (x, y, w, h) => photo(ctx, img, x, y, w, h, zoom));
    if (label) chip(ctx, label, CARD.x + CARD.w - 28, CARD.y + 52, labelStyle || { bg: C.accent, color: "#1d1500" });
  }

  function brand(ctx, alpha = 1) {
    text(ctx, "صوّرها", W / 2, 250, { size: 46, color: C.accentSoft, alpha, shadow: true });
  }

  function disclosure(ctx, alpha = 1, y = 1530) {
    text(ctx, DISCLOSURE, W / 2, y, { size: 30, weight: 500, family: "IBM Plex Sans Arabic", color: "rgba(255,255,255,.82)", alpha, maxW: 960 });
  }

  // عناوين تتبدّل بانزلاق خفيف
  function headline(ctx, t, items) {
    for (const it of items) {
      const a = prog(t, it.from, it.from + 0.35) * (1 - prog(t, it.to - 0.25, it.to));
      if (a <= 0) continue;
      const dy = (1 - easeOut(prog(t, it.from, it.from + 0.35))) * 26;
      text(ctx, it.text, W / 2, it.y || 400, { size: it.size || 82, color: it.color || C.white, alpha: a, dy, maxW: it.maxW || 940 });
    }
  }

  // بطاقة النهاية: الدعوة لإرسال صورة على واتساب
  function endCard(ctx, t, start, opts = {}) {
    const p = easeOut(prog(t, start, start + 0.5));
    if (p <= 0) return;
    ctx.save();
    ctx.translate(0, (1 - p) * H * 0.35);
    ctx.globalAlpha = p;
    gradientBg(ctx);
    const s = (k) => prog(t, start + 0.15 + k * 0.12, start + 0.5 + k * 0.12);
    text(ctx, "صوّرها", W / 2, 430, { size: 66, color: C.accentSoft, alpha: s(0) });
    text(ctx, opts.l1 || "3 صور احترافية", W / 2, 650, { size: 112, alpha: s(1) });
    text(ctx, opts.l2 || "لمنتجك مجاناً", W / 2, 790, { size: 112, color: C.accentSoft, alpha: s(1) });
    text(ctx, opts.sub || "أرسل صورة منتجك على واتساب\nوتصلك النتيجة خلال ساعات", W / 2, 990, { size: 46, weight: 500, family: "IBM Plex Sans Arabic", color: "rgba(255,255,255,.9)", alpha: s(2) });
    const pulse = 1 + 0.035 * Math.sin((t - start) * 6.2) * prog(t, start + 0.9, start + 1.1);
    ctx.save();
    ctx.globalAlpha *= s(3);
    ctx.translate(W / 2, 1200);
    ctx.scale(pulse, pulse);
    rrect(ctx, -360, -70, 720, 140, 70);
    ctx.fillStyle = C.wa;
    ctx.shadowColor = "rgba(31,174,85,.55)";
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.restore();
    text(ctx, opts.cta || "ابدأ على واتساب ←", W / 2, 1200, { size: 58, alpha: s(3), shadow: false });
    disclosure(ctx, s(4), 1360);
    ctx.restore();
  }

  // ------------------------------------------------------------ الريلز الأربعة
  function reelA(I) { // النتيجة
    const dur = 9.4;
    return { name: "reel-a-outcome", dur, draw(ctx, t) {
      const z = (a, b) => 1 + 0.06 * prog(t, a, b);
      const img = t < 2.2 ? I.before : t < 4.8 ? I.scene1 : t < 6.4 ? I.scene2 : I.white;
      blurredBg(ctx, img);
      brand(ctx);
      if (t < 3.4) slider(ctx, I.before, I.scene1, ease(prog(t, 2.2, 3.4)), z(0, 2.2), z(2.2, 4.8));
      else if (t < 4.8) single(ctx, I.scene1, z(2.2, 4.8), "بعد");
      else if (t < 6.4) crossfade(ctx, I.scene1, I.scene2, prog(t, 4.8, 5.3), z(2.2, 5.3), z(4.8, 6.4), "بعد");
      else crossfade(ctx, I.scene2, I.white, prog(t, 6.4, 6.9), z(4.8, 6.9), z(6.4, 7.6), "خلفية بيضاء");
      headline(ctx, t, [
        { text: "صورة منتجك من الجوال…", from: 0.15, to: 2.6 },
        { text: "تصير صورة تبيع", from: 2.6, to: 4.9, color: C.accentSoft, size: 92 },
        { text: "مشاهد فاخرة لمنتجك نفسه", from: 4.9, to: 6.5 },
        { text: "وصورة بيضاء لنون وأمازون", from: 6.5, to: 7.5 },
      ]);
      disclosure(ctx, prog(t, 2.8, 3.2));
      endCard(ctx, t, 7.4);
    } };
  }

  function reelB(I) { // المقارنة بالسعر
    const dur = 9.0;
    return { name: "reel-b-price", dur, draw(ctx, t) {
      gradientBg(ctx);
      brand(ctx);
      const a1 = 1 - prog(t, 2.4, 2.7);
      if (a1 > 0) {
        text(ctx, "صورة واحدة في استوديو", W / 2, 640, { size: 78, alpha: a1 * prog(t, 0.1, 0.45) });
        text(ctx, "من 150 إلى 350 درهماً", W / 2, 860, { size: 86, color: C.accentSoft, alpha: a1 * prog(t, 0.4, 0.75), maxW: 1040 });
        text(ctx, "للصورة الواحدة", W / 2, 1030, { size: 48, weight: 500, family: "IBM Plex Sans Arabic", alpha: a1 * prog(t, 0.6, 0.9) });
        const sp = ease(prog(t, 1.4, 2.0));
        if (sp > 0) {
          ctx.save();
          ctx.globalAlpha = a1;
          ctx.strokeStyle = C.strike;
          ctx.lineWidth = 14;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(W - 70, 890);
          ctx.lineTo(W - 70 - (W - 140) * sp, 835);
          ctx.stroke();
          ctx.restore();
        }
      }
      if (t >= 2.5) {
        headline(ctx, t, [
          { text: "عندنا 6 صور لمنتجك", from: 2.6, to: 6.7, y: 360 },
          { text: "بـ 149 درهماً فقط", from: 2.9, to: 6.7, y: 470, color: C.accentSoft, size: 90 },
        ]);
        const cells = [
          { img: I.before, x: 560, y: 600, label: "قبل", style: {} },
          { img: I.scene1, x: 90, y: 600, label: "بعد" },
          { img: I.scene2, x: 560, y: 1070, label: "بعد" },
          { img: I.white, x: 90, y: 1070, label: "بعد" },
        ];
        cells.forEach((c, i) => {
          const p = easeOut(prog(t, 2.8 + i * 0.22, 3.25 + i * 0.22)) * (1 - prog(t, 6.6, 6.8));
          if (p <= 0) return;
          const s = 0.86 + 0.14 * p, sz = 430;
          ctx.save();
          ctx.globalAlpha = p;
          ctx.translate(c.x + sz / 2, c.y + sz / 2);
          ctx.scale(s, s);
          ctx.translate(-(c.x + sz / 2), -(c.y + sz / 2));
          cardFrame(ctx, (x, y, w, h) => photo(ctx, c.img, x, y, w, h, 1 + 0.04 * prog(t, 3, 6.6)), { x: c.x, y: c.y, w: sz, h: sz, r: 28 });
          const isBefore = c.label === "قبل";
          chip(ctx, c.label, c.x + sz - 18, c.y + 40, { size: 30, bg: isBefore ? "rgba(20,14,30,.72)" : C.accent, color: isBefore ? "#fff" : "#1d1500" });
          ctx.restore();
        });
        disclosure(ctx, prog(t, 3.4, 3.8) * (1 - prog(t, 6.6, 6.8)));
      }
      endCard(ctx, t, 6.6);
    } };
  }

  function reelC(I) { // بائعو نون وأمازون
    const dur = 9.3;
    return { name: "reel-c-marketplace", dur, draw(ctx, t) {
      const z = (a, b) => 1 + 0.05 * prog(t, a, b);
      const img = t < 2.0 ? I.before : t < 5.6 ? I.white : t < 6.2 ? I.scene1 : I.scene2;
      blurredBg(ctx, img);
      brand(ctx, 1 - prog(t, 3.0, 3.2) * (1 - prog(t, 5.4, 5.6)));
      if (t < 3.1) slider(ctx, I.before, I.white, ease(prog(t, 2.0, 3.1)), z(0, 2.0), 1);
      else if (t < 5.6) {
        single(ctx, I.white, 1, "بعد");
        const fp = ease(prog(t, 3.8, 4.5));
        if (fp > 0) {
          const inset = CARD.w * 0.075;
          ctx.save();
          ctx.globalAlpha = fp * (1 - prog(t, 5.3, 5.6));
          ctx.strokeStyle = C.accent;
          ctx.lineWidth = 6;
          ctx.setLineDash([22, 14]);
          ctx.lineDashOffset = -t * 40;
          ctx.strokeRect(CARD.x + inset, CARD.y + inset, CARD.w - inset * 2, CARD.h - inset * 2);
          ctx.restore();
          chip(ctx, "85%", CARD.x + CARD.w / 2, CARD.y + CARD.h - inset, { anchor: "center", bg: C.accent, color: "#1d1500", alpha: ctx.globalAlpha * fp * (1 - prog(t, 5.3, 5.6)) });
        }
      } else crossfade(ctx, I.scene1, I.scene2, prog(t, 6.0, 6.4), z(5.6, 6.4), z(6.0, 7.0), "للإعلانات");
      headline(ctx, t, [{ text: "تبيع على نون أو أمازون؟", from: 0.15, to: 3.1 }]);
      const checks = ["✓ خلفية بيضاء نقية", "✓ المنتج 85% من الإطار", "✓ مقاس 2000×2000"];
      checks.forEach((c, i) => {
        const a = prog(t, 3.2 + i * 0.45, 3.5 + i * 0.45) * (1 - prog(t, 5.4, 5.6));
        text(ctx, c, W / 2, 335 + i * 80, { size: 54, weight: 700, alpha: a, dy: (1 - a) * 14 });
      });
      headline(ctx, t, [{ text: "ومشاهد جاهزة لإعلاناتك", from: 5.6, to: 7.0 }]);
      disclosure(ctx, prog(t, 3.0, 3.4));
      endCard(ctx, t, 6.9, { sub: "صورة رئيسية مطابقة لشروط المنصّتين\nمن صورة جوالك، خلال ساعات" });
    } };
  }

  function reelD(I) { // الثقة: «هل سيتغيّر منتجي؟»
    const dur = 8.8;
    return { name: "reel-d-fidelity", dur, draw(ctx, t) {
      const z = (a, b) => 1 + 0.06 * prog(t, a, b);
      const img = t < 2.2 ? I.before : t < 5.0 ? I.scene1 : I.scene2;
      blurredBg(ctx, img);
      brand(ctx);
      if (t < 3.4) slider(ctx, I.before, I.scene1, ease(prog(t, 2.2, 3.4)), z(0, 2.2), z(2.2, 5.0));
      else if (t < 5.0) single(ctx, I.scene1, z(2.2, 5.0), "بعد");
      else crossfade(ctx, I.scene1, I.scene2, prog(t, 5.0, 5.5), z(2.2, 5.5), z(5.0, 6.6), "بعد");
      headline(ctx, t, [
        { text: "هل سيتغيّر شكل منتجي؟", from: 0.15, to: 2.4 },
        { text: "لا. نقصّ منتجك الحقيقي\nمن صورتك", from: 2.4, to: 4.0, size: 78 },
        { text: "ونبني المشهد حوله فقط", from: 4.0, to: 5.2 },
        { text: "الشكل واللون والنقش\nكما هي تماماً", from: 5.2, to: 6.5, color: C.accentSoft },
      ]);
      disclosure(ctx, prog(t, 2.8, 3.2));
      endCard(ctx, t, 6.4, { l1: "جرّب على منتجك", l2: "3 صور مجاناً" });
    } };
  }

  // ------------------------------------------------------------ صور ثابتة 4:5
  function staticA(I) {
    const w = 1080, h = 1350;
    return { name: "static-a-outcome", w, h, draw(ctx) {
      ctx.fillStyle = C.cream;
      ctx.fillRect(0, 0, w, h);
      text(ctx, "من صورة جوال… إلى صورة تبيع", w / 2, 135, { size: 66, color: C.fg, shadow: false });
      const sz = 470, y = 230;
      cardFrame(ctx, (x, yy, ww, hh) => photo(ctx, I.before, x, yy, ww, hh, 1), { x: 560, y, w: sz, h: sz, r: 32 });
      cardFrame(ctx, (x, yy, ww, hh) => photo(ctx, I.scene1, x, yy, ww, hh, 1), { x: 50, y, w: sz, h: sz, r: 32 });
      chip(ctx, "قبل", 560 + sz - 18, y + 42, { size: 32 });
      chip(ctx, "بعد", 50 + sz - 18, y + 42, { size: 32, bg: C.accent, color: "#1d1500" });
      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, y + sz / 2, 46, 0, Math.PI * 2);
      ctx.fillStyle = C.accent;
      ctx.fill();
      ctx.restore();
      text(ctx, "←", w / 2, y + sz / 2 + 2, { size: 64, color: "#1d1500", shadow: false });
      const t2 = 300, y2 = 745;
      cardFrame(ctx, (x, yy, ww, hh) => photo(ctx, I.scene2, x, yy, ww, hh, 1), { x: 555, y: y2, w: t2, h: t2, r: 26 });
      cardFrame(ctx, (x, yy, ww, hh) => photo(ctx, I.white, x, yy, ww, hh, 1), { x: 225, y: y2, w: t2, h: t2, r: 26 });
      text(ctx, "مشاهد فاخرة + صورة بيضاء لنون وأمازون", w / 2, 1095, { size: 38, weight: 700, family: "IBM Plex Sans Arabic", color: C.fg, shadow: false });
      rrect(ctx, 140, 1150, 800, 116, 58);
      ctx.fillStyle = C.wa;
      ctx.fill();
      text(ctx, "3 صور مجاناً على واتساب ←", w / 2, 1208, { size: 50, shadow: false });
      text(ctx, DISCLOSURE, w / 2, 1305, { size: 26, weight: 500, family: "IBM Plex Sans Arabic", color: "#6a6174", shadow: false, maxW: 1000 });
    } };
  }

  function staticC(I) {
    const w = 1080, h = 1350;
    return { name: "static-c-marketplace", w, h, draw(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, C.primary);
      g.addColorStop(1, C.primary2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      text(ctx, "صورة رئيسية مطابقة لنون وأمازون", w / 2, 120, { size: 60 });
      cardFrame(ctx, (x, y, ww, hh) => photo(ctx, I.white, x, y, ww, hh, 1), { x: 240, y: 210, w: 600, h: 600, r: 32 });
      ["✓ خلفية بيضاء نقية", "✓ المنتج 85% من الإطار", "✓ مقاس 2000×2000", "✓ من صورة جوالك خلال ساعات"].forEach((c, i) => {
        text(ctx, c, w / 2, 885 + i * 66, { size: 44, weight: 700, color: i === 3 ? C.accentSoft : C.white });
      });
      rrect(ctx, 140, 1170, 800, 110, 55);
      ctx.fillStyle = C.wa;
      ctx.fill();
      text(ctx, "جرّبها مجاناً على واتساب ←", w / 2, 1225, { size: 48, shadow: false });
      text(ctx, DISCLOSURE, w / 2, 1315, { size: 24, weight: 500, family: "IBM Plex Sans Arabic", color: "rgba(255,255,255,.8)", shadow: false, maxW: 1000 });
    } };
  }

  // ------------------------------------------------------------ الترميز
  async function encodeReel(spec, opts = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { alpha: false });
    const mux = new MiniMp4(W, H, FPS);
    let failure = null;
    const enc = new VideoEncoder({ output: (chunk, meta) => { try { mux.add(chunk, meta); } catch (e) { failure = e; } }, error: (e) => { failure = e; } });
    enc.configure({ codec: "avc1.640028", width: W, height: H, bitrate: opts.bitrate || 10_000_000, framerate: FPS, latencyMode: "realtime", avc: { format: "avc" } });
    const n = Math.round(spec.dur * FPS);
    const posters = [];
    for (let i = 0; i < n; i++) {
      const t = i / FPS;
      ctx.save();
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      spec.draw(ctx, t);
      ctx.restore();
      const vf = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
      enc.encode(vf, { keyFrame: i % (FPS * 2) === 0 });
      vf.close();
      if (opts.posterAt && opts.posterAt.some((pt) => Math.round(pt * FPS) === i)) posters.push(await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.86)));
      while (enc.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 4));
      if (failure) throw failure;
    }
    await enc.flush();
    enc.close();
    if (failure) throw failure;
    return { video: mux.finalize(), posters };
  }

  async function renderStatic(spec) {
    const canvas = document.createElement("canvas");
    canvas.width = spec.w;
    canvas.height = spec.h;
    const ctx = canvas.getContext("2d", { alpha: false });
    spec.draw(ctx);
    return await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.9));
  }

  window.SawwerhaReels = {
    W, H, FPS,
    async init(o = {}) {
      if (o.fonts !== false) await loadFonts();
      const ok = await VideoEncoder.isConfigSupported({ codec: "avc1.640028", width: W, height: H, bitrate: 10_000_000, framerate: FPS, latencyMode: "realtime" });
      if (!ok.supported) throw new Error("H.264 1080x1920 encoding not supported here");
      return true;
    },
    specs: (I) => [reelA(I), reelB(I), reelC(I), reelD(I)],
    statics: (I) => [staticA(I), staticC(I)],
    encodeReel,
    MiniMp4,
    renderStatic,
    async renderAll(I, onProgress) {
      const out = [];
      for (const spec of this.specs(I)) {
        const r = await encodeReel(spec, { posterAt: [1.0, 3.6, spec.dur - 0.6] });
        out.push({ name: spec.name + ".mp4", type: "video/mp4", blob: r.video, posters: r.posters, dur: spec.dur });
        if (onProgress) onProgress(spec.name);
      }
      for (const spec of this.statics(I)) out.push({ name: spec.name + ".jpg", type: "image/jpeg", blob: await renderStatic(spec) });
      return out;
    },
  };
})();
