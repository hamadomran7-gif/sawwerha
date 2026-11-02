// أدوات مشتركة لصفحات الحاسبات: قراءة النموذج، التنسيق، الحفظ المحلي، عرض النتائج.

const nf = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function money(n, cur = "") {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return `${nf.format(n)}${cur ? " " + cur : ""}`;
}
export function num(n, digits = 2) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return digits === 0 ? nf0.format(n) : new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(n);
}
const dfmt = new Intl.DateTimeFormat("ar-u-nu-latn", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
/** تاريخ ISO (YYYY-MM-DD) بصيغة عربية مقروءة، مثل «4 مايو 2026». */
export function arDate(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00Z`);
  return isNaN(d) ? "—" : dfmt.format(d);
}
/** عدّ عربي سليم: 1 يوم واحد، 2 يومان، 3–10 أيام، 11+ يوماً. الكسور بصيغة المفرد. */
function countAr(n, one, two, few, many, single) {
  const v = Number(n) || 0;
  if (!Number.isInteger(v)) return `${num(v, 1)} ${single}`;
  if (v === 0) return `0 ${single}`;
  if (v === 1) return one;
  if (v === 2) return two;
  if (v % 100 >= 3 && v % 100 <= 10) return `${num(v, 0)} ${few}`;
  return `${num(v, 0)} ${many}`;
}
export const daysAr = (n) => countAr(n, "يوم واحد", "يومان", "أيام", "يوماً", "يوم");
export const hoursAr = (n) => countAr(n, "ساعة واحدة", "ساعتان", "ساعات", "ساعة", "ساعة");
export function pct(n, digits = 2) {
  return `${num(n, digits)}%`;
}

/** يقرأ كل حقول النموذج ككائن {name: value} مع تحويل الأرقام. */
export function readForm(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === "checkbox") out[el.name] = el.checked;
    else if (el.type === "radio") {
      if (el.checked) out[el.name] = el.value;
    } else if (el.type === "number" || el.inputMode === "decimal") {
      const v = String(el.value).replace(/[^\d.-]/g, "");
      out[el.name] = v === "" ? null : Number(v);
    } else out[el.name] = el.value;
  }
  return out;
}

const KEY = (form) => `mustahaqati:${location.pathname}:${form.id || "form"}`;

export function persist(form) {
  try {
    const data = readForm(form);
    localStorage.setItem(KEY(form), JSON.stringify(data));
  } catch {}
}

export function restore(form) {
  try {
    const raw = localStorage.getItem(KEY(form));
    if (!raw) return false;
    const data = JSON.parse(raw);
    for (const el of form.elements) {
      if (!el.name || !(el.name in data)) continue;
      if (el.type === "checkbox") el.checked = !!data[el.name];
      else if (el.type === "radio") el.checked = el.value === data[el.name];
      else if (data[el.name] !== null && data[el.name] !== undefined) el.value = data[el.name];
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * يربط النموذج بدالة الحساب: يُعاد الحساب عند كل تغيير، وتُحفظ القيم محلياً.
 * compute(values) → يجب أن يُعيد HTML للنتيجة أو null (نقص في المدخلات).
 */
export function bind(form, resultEl, compute, { save = true } = {}) {
  const run = () => {
    const values = readForm(form);
    let html;
    try {
      html = compute(values);
    } catch (e) {
      html = `<p class="warn">تعذّر الحساب: ${String(e.message || e)}</p>`;
    }
    if (html) {
      resultEl.innerHTML = html;
      resultEl.hidden = false;
    } else {
      resultEl.innerHTML = `<p class="muted">أكمل الحقول المطلوبة لعرض النتيجة.</p>`;
    }
    if (save) persist(form);
  };
  form.addEventListener("input", run);
  form.addEventListener("change", run);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    run();
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  if (save) restore(form);
  run();
  return run;
}

/** صفوف جدول التفصيل. rows = [[label, value, {strong, muted}]] */
export function table(rows, caption = "") {
  const body = rows
    .filter(Boolean)
    .map(([k, v, o = {}]) => `<tr class="${o.strong ? "strong" : ""} ${o.muted ? "muted" : ""}"><th scope="row">${k}</th><td>${v}</td></tr>`)
    .join("");
  return `<table class="breakdown">${caption ? `<caption>${caption}</caption>` : ""}<tbody>${body}</tbody></table>`;
}

export function big(label, value, sub = "") {
  return `<div class="big"><span class="big-label">${label}</span><span class="big-value">${value}</span>${sub ? `<span class="big-sub">${sub}</span>` : ""}</div>`;
}

export function note(text, kind = "info") {
  return `<p class="note note-${kind}">${text}</p>`;
}

export function dateInputToday(el, offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  el.value = d.toISOString().slice(0, 10);
}

export function duration(d) {
  if (!d) return "—";
  const parts = [];
  if (d.years) parts.push(`${d.years} ${d.years === 1 ? "سنة" : d.years === 2 ? "سنتان" : d.years <= 10 ? "سنوات" : "سنة"}`);
  if (d.months) parts.push(`${d.months} ${d.months === 1 ? "شهر" : d.months === 2 ? "شهران" : d.months <= 10 ? "أشهر" : "شهراً"}`);
  if (d.days) parts.push(`${d.days} ${d.days === 1 ? "يوم" : d.days === 2 ? "يومان" : d.days <= 10 ? "أيام" : "يوماً"}`);
  return parts.length ? parts.join(" و") : "أقل من يوم";
}

// زر النسخ للنتيجة
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-copy]");
  if (!btn) return;
  const target = document.querySelector(btn.dataset.copy);
  if (!target) return;
  const text = ("value" in target ? target.value : target.innerText).trim();
  const label = btn.dataset.label || (btn.dataset.label = btn.textContent);
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = "تم النسخ";
  } catch {
    const range = document.createRange();
    range.selectNodeContents(target);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    btn.textContent = "حدّد النص وانسخه";
  }
  setTimeout(() => (btn.textContent = label), 2000);
});
