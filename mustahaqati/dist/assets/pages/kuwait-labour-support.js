import { kuwaitLabourSupport, rules } from "../calc.js";
import { bind, money, num, table, big, note, countAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const L = rules.kw.labourSupport;
const m = (x) => money(x, "دينار");
const kidsAr = (n) => countAr(n, "ولد واحد", "ولدان", "أولاد", "ولداً", "ولد");

bind(form, result, (v) => {
  if (v.salary === null || v.salary === undefined) return null;
  const married = v.married === "yes";
  const r = kuwaitLabourSupport({ category: v.category, married, children: v.children, degree: v.degree, disability: v.disability, salary: v.salary });
  const label = form.querySelector(`#category option[value="${r.category}"]`)?.textContent || "";
  let html = big("دعم العمالة الشهري", m(r.total), `${married ? "متزوج" : "أعزب"} · ${label}`);
  const rows = [
    ["العلاوة الاجتماعية", m(r.social)],
    ["الزيادة الثابتة (50 زيادة + 50 مكافأة + 120 غلاء معيشة)", m(r.fixed)],
    ["زيادة المؤهل", m(r.qual)],
    [`فرق 25% من العلاوة الاجتماعية (بحد أدنى ${L.diffMin})`, m(r.diff)],
    ["مبلغ الجدول", m(r.base), { strong: true }],
  ];
  if (r.deduction) rows.push([`خصم المكافأة لتجاوز راتبك ${num(L.bonusThreshold, 0)} ديناراً`, "− " + m(r.deduction)]);
  if (r.childAmt) rows.push([`علاوة الأولاد (${kidsAr(r.kidsCounted)} × ${L.perChild})`, m(r.childAmt)]);
  if (r.degreeAmt) rows.push([v.degree === "phd" ? "الدكتوراه" : "الماجستير", m(r.degreeAmt)]);
  if (r.disabilityAmt) rows.push(["إضافة الإعاقة", m(r.disabilityAmt)]);
  rows.push(["المجموع الشهري", m(r.total), { strong: true }]);
  html += table(rows, "مكونات الدعم");
  if (r.kids > L.maxChildren) html += note(`تُصرف علاوة الأولاد حتى الولد السابع، فاحتُسب ${kidsAr(L.maxChildren)} من ${kidsAr(r.kids)}.`, "info");
  if (r.alt !== null) html += note(`بعض المصادر تذكر لهذه الفئة مبلغ جدول ${m(r.disputedBase)} بدلاً من ${m(r.base)}، فيصبح دعمك ${m(r.alt)}. ويحسم ذلك الجدول الرسمي للهيئة.`, "warn");
  if (Number(v.salary) === L.bonusThreshold) html += note("راتبك 1,250 بالضبط: لم يُحسم هل يُعدّ «تجاوزاً»؛ ولو عُدّ كذلك لخُصم 50 ديناراً.", "info");
  if (married) html += note("فئة «المتزوج» للمرأة العاملة في القطاع الخاص لها شروط لم نتحقق منها؛ ففي الحكومة كانت المتزوجة تُعامَل غالباً بفئة الأعزب.", "info");
  html += note(`يُصرف يوم ${L.payDay} من كل شهر، ويتوقف بترك العمل في الجهة غير الحكومية. الأرقام من الجدول المتداول للهيئة العامة للقوى العاملة.`, "info");
  return html;
});

