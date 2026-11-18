/* امتثالي: مولّد الفاتورة الضريبية وعرض السعر (العربية والإنجليزية). كل شيء في المتصفح: لا يحفظ البيانات ولا يرسلها. */
(function(){
  /*LOGIC-START*/
  function r2(x){ return Math.round((x + Number.EPSILON) * 100) / 100; }
  function calc(items){
    var t = { gross: 0, disc: 0, net: 0, vat: 0, total: 0 }, lines = [];
    items.forEach(function(it){
      var gross = r2(it.qty * it.price), disc = Math.min(r2(it.disc || 0), gross), net = r2(gross - disc), vat = r2(net * it.rate / 100);
      var l = { desc: it.desc, qty: it.qty, price: it.price, rate: it.rate, gross: gross, disc: disc, net: net, vat: vat, total: r2(net + vat) };
      lines.push(l);
      t.gross = r2(t.gross + gross); t.disc = r2(t.disc + disc); t.net = r2(t.net + net); t.vat = r2(t.vat + vat); t.total = r2(t.total + l.total);
    });
    return { lines: lines, t: t };
  }
  function digitsOnly(s){ return /^[0-9]*$/.test(s); }
  function missing(d){
    var m = [], inv = d.type === 'invoice';
    if (!d.s.name) m.push('sName');
    if (inv && !d.s.addr) m.push('sAddr');
    if (inv && !d.s.trn) m.push('sTrn');
    if (d.s.trn && !digitsOnly(d.s.trn)) m.push('sTrnDigits');
    if (inv && !d.b.name) m.push('bName');
    if (inv && !d.b.addr) m.push('bAddr');
    if (d.b.trn && !digitsOnly(d.b.trn)) m.push('bTrnDigits');
    if (inv && !d.no) m.push('no');
    if (!d.date) m.push('date');
    if (!d.items.some(function(it){ return it.desc && it.qty > 0 && it.price >= 0; })) m.push('items');
    if (d.items.some(function(it){ return it.disc > r2(it.qty * it.price); })) m.push('discTooBig');
    return m;
  }
  /*LOGIC-END*/
  var form = document.getElementById('ig-form');
  if (!form) return;
  var EN = document.documentElement.lang === 'en';
  var NL = String.fromCharCode(10);
  var MSG = EN ? {
    head: 'To download this document, complete the following:',
    sName: 'Enter the supplier name.', sAddr: 'Enter the supplier address.', sTrn: 'Enter the supplier TRN.',
    sTrnDigits: 'The supplier TRN takes digits only.', bName: 'Enter the customer name.', bAddr: 'Enter the customer address.',
    bTrnDigits: 'The customer TRN takes digits only.', no: 'Enter the invoice number.', date: 'Choose the issue date.',
    items: 'Add at least one line with a description, a quantity and a price.', discTooBig: 'A discount is larger than its line value.',
    aed: 'AED', busy: 'Preparing…', pdf: 'Download PDF'
  } : {
    head: 'لتنزيل المستند أكمل ما يلي:',
    sName: 'اكتب اسم المورّد.', sAddr: 'اكتب عنوان المورّد.', sTrn: 'اكتب الرقم الضريبي للمورّد.',
    sTrnDigits: 'الرقم الضريبي للمورّد أرقام فقط.', bName: 'اكتب اسم العميل.', bAddr: 'اكتب عنوان العميل.',
    bTrnDigits: 'الرقم الضريبي للعميل أرقام فقط.', no: 'اكتب رقم الفاتورة.', date: 'اختر تاريخ الإصدار.',
    items: 'أضف بنداً واحداً على الأقل بوصف وكمية وسعر.', discTooBig: 'في أحد البنود خصم أكبر من قيمته.',
    aed: 'درهم', busy: 'جارٍ التجهيز…', pdf: 'نزّل PDF'
  };
  var L = {
    invoice: ['فاتورة ضريبية', 'Tax Invoice'], quote: ['عرض سعر', 'Quotation'],
    noInv: ['رقم الفاتورة', 'Invoice No.'], noQuote: ['رقم العرض', 'Quotation No.'],
    date: ['تاريخ الإصدار', 'Issue date'], supply: ['تاريخ التوريد', 'Date of supply'],
    seller: ['المورّد', 'Supplier'], buyer: ['العميل', 'Customer'], trn: ['الرقم الضريبي', 'TRN'],
    idx: ['#', '#'], desc: ['الوصف', 'Description'], qty: ['الكمية', 'Qty'], price: ['سعر الوحدة', 'Unit price'],
    disc: ['الخصم', 'Discount'], rate: ['نسبة الضريبة', 'VAT rate'], vat: ['مبلغ الضريبة', 'VAT amount'], total: ['المبلغ', 'Amount'],
    tGross: ['المجموع', 'Subtotal'], tDisc: ['الخصم', 'Discount'], tNet: ['المبلغ الخاضع للضريبة', 'Taxable amount'],
    tVat: ['ضريبة القيمة المضافة', 'VAT'], tTotal: ['الإجمالي المستحق', 'Total due'],
    aed: ['المبالغ بالدرهم الإماراتي', 'Amounts in UAE dirhams (AED)'], notes: ['ملاحظات', 'Notes'],
    credit: ['أُعدّت عبر مولّد الفواتير في emtithali.com', 'Prepared with the invoice generator at emtithali.com']
  };
  function lab(k, lang){ var v = L[k]; return lang === 'ar' ? [v[0]] : (lang === 'en' ? [v[1]] : [v[0], v[1]]); }
  function $(id){ return document.getElementById(id); }
  function latin(s){ return String(s || '').replace(/[٠-٩]/g, function(c){ return String(c.charCodeAt(0) - 1632); }).replace(/[۰-۹]/g, function(c){ return String(c.charCodeAt(0) - 1776); }); }
  function n(v){ var x = parseFloat(latin(v)); return isFinite(x) ? x : 0; }
  function val(name){ var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function money(x){ return x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function qtyText(x){ return x.toLocaleString('en-US', { maximumFractionDigits: 3 }); }
  function day(s){ var p = String(s || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : ''; }

  function read(){
    var items = [];
    Array.prototype.forEach.call($('ig-items').querySelectorAll('.item'), function(row){
      var g = function(k){ return row.querySelector('[data-k="' + k + '"]').value; };
      items.push({ desc: g('desc').trim(), qty: n(g('qty')), price: n(g('price')), disc: n(g('disc')), rate: n(g('rate')) });
    });
    return {
      type: val('ig-type') || 'invoice', lang: val('ig-lang') || (EN ? 'en' : 'ar'),
      no: $('ig-no').value.trim(), date: $('ig-date').value, supply: $('ig-supply').value,
      s: { name: $('ig-s-name').value.trim(), addr: $('ig-s-addr').value.trim(), trn: latin($('ig-s-trn').value).split(' ').join('') },
      b: { name: $('ig-b-name').value.trim(), addr: $('ig-b-addr').value.trim(), trn: latin($('ig-b-trn').value).split(' ').join('') },
      items: items, notes: $('ig-notes').value.trim(), credit: $('ig-credit').checked
    };
  }

  /* ---------- Drawing: A4 pages on canvas; the browser shapes Arabic and orders mixed text ---------- */
  var W = 794, H = 1123, M = 44, S = 2, FOOT = 46;
  var FONT = 'Alexandria, Tahoma, Arial, sans-serif', INK = '#0f1a38', MUTED = '#535d78', RULE = '#d4dae7';
  function isAr(s){ return /[؀-ۿ]/.test(s); }
  function font(x, size, bold){ x.font = (bold ? '700 ' : '400 ') + size + 'px ' + FONT; }
  var LRM = String.fromCharCode(8206), RLM = String.fromCharCode(8207);
  /* each string keeps its own direction: marks at both ends hold its punctuation in place whatever the page direction */
  function put(x, s, px, py, align, color){ var ar = isAr(s), mk = ar ? RLM : LRM; x.direction = ar ? 'rtl' : 'ltr'; x.textAlign = align; x.fillStyle = color || INK; x.fillText(mk + s + mk, px, py); }
  function wrap(x, s, max){
    var out = [];
    String(s).split(NL).forEach(function(par){
      var cur = '';
      par.split(' ').forEach(function(w){
        var t = cur ? cur + ' ' + w : w;
        if (!cur || x.measureText(t).width <= max) cur = t; else { out.push(cur); cur = w; }
      });
      out.push(cur);
    });
    var res = [];
    out.forEach(function(l){
      while (l.length > 1 && x.measureText(l).width > max) { var k = l.length - 1; while (k > 1 && x.measureText(l.slice(0, k)).width > max) k--; res.push(l.slice(0, k)); l = l.slice(k); }
      res.push(l);
    });
    return res;
  }
  function render(d){
    var lang = d.lang, rtl = lang !== 'en', bi = lang === 'bi';
    var c = calc(d.items.filter(function(it){ return it.desc || it.price || it.qty; }));
    var SX = rtl ? W - M : M, EX = rtl ? M : W - M, AS = rtl ? 'right' : 'left', AE = rtl ? 'left' : 'right', dir = rtl ? -1 : 1;
    var pages = [], x, y;
    function page(){ var cv = document.createElement('canvas'); cv.width = W * S; cv.height = H * S; x = cv.getContext('2d'); x.scale(S, S); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.textBaseline = 'alphabetic'; pages.push(cv); y = M; }
    function labels(k, px, py, align, size, color){ var ls = lab(k, lang); ls.forEach(function(s, i){ font(x, i ? size - 1 : size, !i); put(x, s, px, py + i * (size + 3), align, color || MUTED); }); return ls.length * (size + 3); }
    function line(y1, color){ x.strokeStyle = color || RULE; x.lineWidth = 1; x.beginPath(); x.moveTo(M, y1); x.lineTo(W - M, y1); x.stroke(); }
    page();

    /* header: the supplier at the start side, the document title at the end side */
    var top = y + 22, hy = top;
    font(x, 17, true); wrap(x, d.s.name || '', 380).slice(0, 2).forEach(function(s){ put(x, s, SX, hy, AS); hy += 22; });
    font(x, 11.5); wrap(x, d.s.addr || '', 380).slice(0, 3).forEach(function(s){ put(x, s, SX, hy, AS, MUTED); hy += 16; });
    if (d.s.trn) { hy += 2; font(x, 11.5, true); put(x, lab('trn', lang).join(' / ') + ': ' + d.s.trn, SX, hy, AS); hy += 16; }
    var titles = lab(d.type === 'quote' ? 'quote' : 'invoice', lang), ty = top + 4;
    titles.forEach(function(s, i){ font(x, i ? 17 : 26, true); put(x, s, EX, ty, AE); ty += i ? 22 : 30; });
    y = Math.max(hy, ty) + 8; line(y, INK); y += 26;

    /* customer box at the start side, document details at the end side */
    var by = y; by += labels('buyer', SX, by, AS, 11) + 4;
    font(x, 13.5, true); wrap(x, d.b.name || '', 360).slice(0, 2).forEach(function(s){ put(x, s, SX, by, AS); by += 19; });
    font(x, 11.5); wrap(x, d.b.addr || '', 360).slice(0, 3).forEach(function(s){ put(x, s, SX, by, AS, MUTED); by += 16; });
    if (d.b.trn) { by += 2; font(x, 11.5, true); put(x, lab('trn', lang).join(' / ') + ': ' + d.b.trn, SX, by, AS); by += 16; }
    var my = y, mx = EX - dir * 300;
    [[d.type === 'quote' ? 'noQuote' : 'noInv', d.no], ['date', day(d.date)], ['supply', d.supply && d.supply !== d.date ? day(d.supply) : '']].forEach(function(r){
      if (!r[1]) return;
      var h = labels(r[0], mx, my, AS, 11);
      font(x, 12.5, true); put(x, r[1], EX, my, AE);
      my += Math.max(h, 18) + 6;
    });
    y = Math.max(by, my) + 14;

    /* items table */
    var widths = [24, 0, 46, 74, 64, 68, 76, 84], keys = ['idx', 'desc', 'qty', 'price', 'disc', 'rate', 'vat', 'total'];
    widths[1] = W - 2 * M - widths.reduce(function(a, b){ return a + b; }, 0);
    var cols = [], cx = SX;
    widths.forEach(function(w){ var a = cx, b = cx + dir * w; cols.push({ s: a, e: b, mid: (a + b) / 2, w: w }); cx = b; });
    var headH = bi ? 34 : 24;
    function head(){
      x.fillStyle = INK; x.fillRect(M, y, W - 2 * M, headH);
      keys.forEach(function(k, i){
        var ls = lab(k, lang), col = cols[i];
        ls.forEach(function(s, j){ font(x, j ? 9.5 : 10.5, !j); put(x, s, i === 1 ? col.s + dir * 6 : col.mid, y + 15 + j * 13, i === 1 ? AS : 'center', '#ffffff'); });
      });
      y += headH;
    }
    head();
    var bottom = H - M - FOOT;
    c.lines.forEach(function(l, i){
      font(x, 11);
      var dl = wrap(x, l.desc || '', widths[1] - 12), rh = Math.max(dl.length * 15, 15) + 12;
      if (y + rh > bottom) { page(); head(); }
      var base = y + 18;
      put(x, String(i + 1), cols[0].mid, base, 'center', MUTED);
      dl.forEach(function(s, j){ put(x, s, cols[1].s + dir * 6, base + j * 15, AS); });
      [qtyText(l.qty), money(l.price), money(l.disc), l.rate + '%', money(l.vat), money(l.total)].forEach(function(s, j){ put(x, s, cols[j + 2].mid, base, 'center'); });
      y += rh; line(y);
    });

    /* totals at the end side, notes at the start side */
    var rows = [['tGross', c.t.gross], ['tDisc', c.t.disc], ['tNet', c.t.net], ['tVat', c.t.vat], ['tTotal', c.t.total]].filter(function(r){ return r[0] !== 'tDisc' || r[1] > 0; });
    var rowH = bi ? 30 : 22, totH = rows.length * rowH + 40;
    font(x, 11); var nl = d.notes ? wrap(x, d.notes, 330).slice(0, 14) : [], notesH = nl.length ? nl.length * 16 + 30 : 0;
    if (y + 18 + Math.max(totH, notesH) > bottom) page();
    y += 18;
    var tx0 = EX - dir * 300, ty0 = y;
    rows.forEach(function(r, i){
      var last = i === rows.length - 1;
      if (last) { x.fillStyle = '#ffe14d'; x.fillRect(Math.min(tx0, EX), ty0 - 4, 300, rowH); }
      var ls = lab(r[0], lang);
      ls.forEach(function(s, j){ font(x, j ? 10 : (last ? 12.5 : 11.5), last || !j); put(x, s, tx0 + dir * 8, ty0 + 13 + j * 13, AS, last ? INK : MUTED); });
      font(x, last ? 13.5 : 12, last); put(x, money(r[1]), EX - dir * 8, ty0 + 13, AE);
      ty0 += rowH;
    });
    font(x, 10); put(x, lab('aed', lang).join(' / '), EX, ty0 + 14, AE, MUTED);
    if (nl.length) {
      var ny = y + 12; labels('notes', SX, ny, AS, 11); ny += bi ? 30 : 18;
      font(x, 11); nl.forEach(function(s){ put(x, s, SX, ny, AS); ny += 16; });
    }

    /* footer on every page */
    pages.forEach(function(cv, i){
      x = cv.getContext('2d');
      x.strokeStyle = RULE; x.beginPath(); x.moveTo(M, H - M - 22); x.lineTo(W - M, H - M - 22); x.stroke();
      font(x, 9.5);
      var pn = (lang === 'en' ? 'Page ' : 'صفحة ') + (i + 1) + (lang === 'en' ? ' of ' : ' من ') + pages.length;
      put(x, pn, EX, H - M - 6, AE, MUTED);
      if (d.credit) put(x, lab('credit', lang)[0], SX, H - M - 6, AS, MUTED);
    });
    return { pages: pages, calc: c };
  }

  /* ---------- PDF: one JPEG per A4 page, written by hand (no library, nothing leaves the page) ---------- */
  function jpeg(cv){ return new Promise(function(ok){ cv.toBlob(function(b){ b.arrayBuffer().then(function(a){ ok(new Uint8Array(a)); }); }, 'image/jpeg', 0.92); }); }
  function pdf(imgs){
    var enc = new TextEncoder(), parts = [], off = 0, offs = [], total = 3 + 3 * imgs.length;
    function add(v){ var b = typeof v === 'string' ? enc.encode(v) : v; parts.push(b); off += b.length; }
    function obj(k, body, stream){ offs[k] = off; add(k + ' 0 obj' + NL + body + NL); if (stream) { add('stream' + NL); add(stream); add(NL + 'endstream' + NL); } add('endobj' + NL); }
    add('%PDF-1.4' + NL + '%ÿÿÿÿ' + NL);
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [' + imgs.map(function(_, i){ return (3 + 3 * i) + ' 0 R'; }).join(' ') + '] /Count ' + imgs.length + ' >>');
    imgs.forEach(function(im, i){
      var p = 3 + 3 * i, content = enc.encode('q 595.28 0 0 841.89 0 0 cm /Im' + i + ' Do Q');
      obj(p, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im' + i + ' ' + (p + 2) + ' 0 R >> >> /Contents ' + (p + 1) + ' 0 R >>');
      obj(p + 1, '<< /Length ' + content.length + ' >>', content);
      obj(p + 2, '<< /Type /XObject /Subtype /Image /Width ' + (W * S) + ' /Height ' + (H * S) + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.length + ' >>', im);
    });
    var start = off, xr = 'xref' + NL + '0 ' + total + NL + '0000000000 65535 f ' + NL;
    for (var k = 1; k < total; k++) xr += String(offs[k]).padStart(10, '0') + ' 00000 n ' + NL;
    add(xr + 'trailer' + NL + '<< /Size ' + total + ' /Root 1 0 R >>' + NL + 'startxref' + NL + start + NL + '%%EOF' + NL);
    return new Blob(parts, { type: 'application/pdf' });
  }

  /* ---------- Page wiring ---------- */
  var last = null, timer = 0, fontsReady = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('400 16px Alexandria', 'فاتورة Invoice 0'), document.fonts.load('700 16px Alexandria', 'فاتورة Invoice 0')]).catch(function(){}) : Promise.resolve();
  function totals(c){
    var t = c.t, cells = { 'ig-gross': t.gross, 'ig-disc': t.disc, 'ig-net': t.net, 'ig-vat': t.vat, 'ig-total': t.total };
    Object.keys(cells).forEach(function(id){ $(id).textContent = money(cells[id]); });
  }
  function refresh(){
    var d = read();
    fontsReady.then(function(){
      last = render(d);
      totals(last.calc);
      var box = $('ig-preview'); box.textContent = '';
      last.pages.forEach(function(cv){ box.appendChild(cv); });
    });
  }
  function later(){ clearTimeout(timer); timer = setTimeout(refresh, 200); }
  function problems(){
    var d = read(), m = missing(d), box = $('ig-err');
    box.textContent = '';
    if (!m.length) return d;
    var p = document.createElement('p'); p.textContent = MSG.head; box.appendChild(p);
    var ul = document.createElement('ul'); ul.className = 'bul';
    m.forEach(function(k){ var li = document.createElement('li'); li.textContent = MSG[k]; ul.appendChild(li); });
    box.appendChild(ul);
    return null;
  }
  function addRow(){
    var rows = $('ig-items'), first = rows.querySelector('.item'), row = first.cloneNode(true);
    Array.prototype.forEach.call(row.querySelectorAll('input'), function(i){ i.value = i.getAttribute('data-k') === 'qty' ? '1' : (i.getAttribute('data-k') === 'disc' ? '0' : ''); });
    row.querySelector('select').value = '5';
    rows.appendChild(row); row.querySelector('input').focus(); later();
  }
  $('ig-add').addEventListener('click', addRow);
  $('ig-items').addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('[data-del]') : null;
    if (!b) return;
    var rows = $('ig-items').querySelectorAll('.item');
    if (rows.length > 1) b.closest('.item').remove();
    else Array.prototype.forEach.call(rows[0].querySelectorAll('input'), function(i){ i.value = i.getAttribute('data-k') === 'qty' ? '1' : (i.getAttribute('data-k') === 'disc' ? '0' : ''); });
    later();
  });
  form.addEventListener('input', later);
  form.addEventListener('change', later);
  form.addEventListener('submit', function(e){ e.preventDefault(); });
  $('ig-pdf').addEventListener('click', function(){
    var d = problems(); if (!d) return;
    var btn = $('ig-pdf'); btn.disabled = true; btn.textContent = MSG.busy;
    fontsReady.then(function(){
      var r = render(d);
      return Promise.all(r.pages.map(jpeg));
    }).then(function(imgs){
      var a = document.createElement('a'), url = URL.createObjectURL(pdf(imgs));
      a.href = url; a.download = (d.type === 'quote' ? 'quotation-' : 'invoice-') + ((d.no || d.date).replace(/[^A-Za-z0-9_-]+/g, '-') || 'emtithali') + '.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 60000);
    }).then(function(){ btn.disabled = false; btn.textContent = MSG.pdf; }, function(){ btn.disabled = false; btn.textContent = MSG.pdf; });
  });
  $('ig-print').addEventListener('click', function(){
    var d = problems(); if (!d) return;
    fontsReady.then(function(){
      var r = render(d), box = document.createElement('div');
      box.id = 'ig-print-pages';
      var ims = r.pages.map(function(cv){ var im = document.createElement('img'); im.src = cv.toDataURL('image/png'); im.alt = ''; box.appendChild(im); return im; });
      document.body.appendChild(box); document.body.classList.add('printing');
      return Promise.all(ims.map(function(im){ return im.decode ? im.decode().catch(function(){}) : null; })).then(function(){
        window.print(); document.body.classList.remove('printing'); box.remove();
      });
    });
  });
  if (!$('ig-date').value) { var t = new Date(); $('ig-date').value = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
  window.__ig = { read: read, render: render, pdf: pdf, jpeg: jpeg, missing: missing, calc: calc };
  refresh();
})();
