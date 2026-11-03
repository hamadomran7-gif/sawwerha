import { ksaInheritance, ksaEstateNet } from "../calc.js";
import { bind, money, num, pct, table, big, note, countAr } from "../app.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const cur = "ريال";
const COUNTS = ["sons", "daughters", "sonsSons", "sonsDaughters", "fullBrothers", "fullSisters", "patBrothers", "patSisters", "matSiblings", "fullNephews", "patNephews", "fullUncles", "patUncles", "fullCousins", "patCousins"];
const FLAGS = ["father", "mother", "grandfather", "patGrandmother", "matGrandmother"];
// [مفرد، جمع]
const NAME = {
  husband: ["الزوج"], wives: ["الزوجة", "الزوجات"], sons: ["الابن", "الأبناء"], daughters: ["البنت", "البنات"],
  sonsSons: ["ابن الابن", "أبناء الابن"], sonsDaughters: ["بنت الابن", "بنات الابن"], father: ["الأب"], mother: ["الأم"],
  grandfather: ["الجد أبو الأب"], patGrandmother: ["الجدة أم الأب"], matGrandmother: ["الجدة أم الأم"],
  fullBrothers: ["الأخ الشقيق", "الإخوة الأشقاء"], fullSisters: ["الأخت الشقيقة", "الأخوات الشقيقات"],
  patBrothers: ["الأخ لأب", "الإخوة لأب"], patSisters: ["الأخت لأب", "الأخوات لأب"], matSiblings: ["الأخ أو الأخت لأم", "الإخوة لأم"],
  fullNephews: ["ابن الأخ الشقيق", "أبناء الأخ الشقيق"], patNephews: ["ابن الأخ لأب", "أبناء الأخ لأب"],
  fullUncles: ["العم الشقيق", "الأعمام الأشقاء"], patUncles: ["العم لأب", "الأعمام لأب"],
  fullCousins: ["ابن العم الشقيق", "أبناء العم الشقيق"], patCousins: ["ابن العم لأب", "أبناء العم لأب"],
};
const FEM = new Set(["wives", "daughters", "sonsDaughters", "mother", "patGrandmother", "matGrandmother", "fullSisters", "patSisters"]);
const DESC = new Set(["sons", "daughters", "sonsSons", "sonsDaughters"]);
const BY = {
  sons: "بالابن", sonsSons: "بابن الابن", father: "بالأب", grandfather: "بالجد", mother: "بالأم", fullBrothers: "بالأخ الشقيق", patBrothers: "بالأخ لأب",
  fullNephews: "بابن الأخ الشقيق", patNephews: "بابن الأخ لأب", fullUncles: "بالعم الشقيق", patUncles: "بالعم لأب", fullCousins: "بابن العم الشقيق",
};
const PAIR_MALE = { daughters: "الابن", sonsDaughters: "ابن الابن", fullSisters: "الأخ الشقيق", patSisters: "الأخ لأب" };

const fr = (f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
const val = (f) => f.n / f.d;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a * b) / gcd(a, b);
const sahmAr = (n) => countAr(n, "سهم واحد", "سهمان", "أسهم", "سهماً", "سهم");
const name = (h) => (h.count > 1 ? `${(NAME[h.key][1] || NAME[h.key][0])} (${h.count})` : NAME[h.key][0]);
const each = (h) => (FEM.has(h.key) ? "لكل واحدة" : "لكل واحد");

function blocked(h, r) {
  const g = h.count > 1 ? (FEM.has(h.key) ? "محجوبات" : "محجوبون") : FEM.has(h.key) ? "محجوبة" : "محجوب";
  const b = h.excludedBy;
  let by = BY[b];
  if (b === "daughters") by = "باستكمال البنات الثلثين";
  else if (b === "fullSisters") by = r.heirs.find((x) => x.key === "fullSisters")?.basis === "asabaMaGhayr" ? "بالأخت الشقيقة العصبة مع البنات" : "باستكمال الشقيقات الثلثين";
  else if (b === "patSisters") by = "بالأخت لأب العصبة مع البنات";
  else if (h.key === "matSiblings" && DESC.has(b)) by = "بالفرع الوارث";
  return `${g} ${by}`;
}

function basis(h, r, ctx) {
  const f = h.fard ? fr(h.fard) : "";
  switch (h.basis) {
    case "excluded":
      return blocked(h, r);
    case "fard":
      if (h.key === "mother" && r.umariyya) return `ثلث الباقي بعد نصيب ${ctx.husband ? "الزوج" : "الزوجة"} (العمرية)`;
      if ((h.key === "patGrandmother" || h.key === "matGrandmother") && ctx.twoGm) return "السدس فرضاً تشترك فيه الجدتان";
      return r.awl ? `فرضاً ${f} قبل العول` : `فرضاً ${f}`;
    case "fardRadd":
      return `فرضاً ${f}، ثم رداً`;
    case "fardAsaba":
      return "السدس فرضاً، والباقي تعصيباً";
    case "asaba": {
      const female = r.heirs.find((x) => x.basis === "asabaBiGhayr");
      if (female) return "تعصيباً، للذكر مثل حظ الأنثيين";
      return ctx.anyFard ? "تعصيباً: الباقي بعد الفروض" : "تعصيباً: التركة كلها";
    }
    case "asabaBiGhayr":
      return `تعصيباً مع ${PAIR_MALE[h.key]}، للذكر مثل حظ الأنثيين`;
    case "asabaMaGhayr":
      return "عصبة مع البنات: الباقي بعد الفروض";
    default:
      return "عصبة لم يبقَ لها شيء بعد الفروض (م227)";
  }
}

bind(form, result, (v) => {
  const input = { arham: !!v.arham };
  for (const k of COUNTS) input[k] = Math.max(0, Math.floor(v[k] || 0));
  for (const k of FLAGS) input[k] = v[k] ? 1 : 0;
  if (v.spouse === "husband") input.husband = 1;
  else if (/^w[1-4]$/.test(v.spouse)) input.wives = Number(v.spouse.slice(1));
  const e = ksaEstateNet({ estate: v.estate || 0, debts: v.debts || 0, bequest: v.bequest || 0 });
  const r = ksaInheritance(input);
  if (r.error) return note("لا يجتمع زوج وزوجة في مسألة واحدة: اختر أحدهما بحسب جنس المتوفى.", "warn");

  const net = e.net;
  const amt = (f) => Math.round((net * 100 * f.n) / f.d) / 100;
  const ctx = { husband: input.husband, anyFard: r.heirs.some((h) => h.fard), twoGm: r.heirs.filter((h) => (h.key === "patGrandmother" || h.key === "matGrandmother") && h.fard).length === 2 };
  const heirs = r.heirs.filter((h) => h.basis !== "excluded");
  const out = r.heirs.filter((h) => h.basis === "excluded");

  let html = big("صافي التركة للقسمة على الورثة", money(net, cur), e.debts || e.bequest ? `من تركة ${money(e.estate, cur)}` : "");
  if (e.debts || e.bequest || e.overCap) {
    html += table(
      [
        ["قيمة التركة", money(e.estate, cur)],
        e.debts ? ["الديون وتكاليف التجهيز", `− ${money(e.debts, cur)}`] : null,
        e.bequest ? [`الوصية (بحد الثلث: ${money(e.bequestCap, cur)})`, `− ${money(e.bequest, cur)}`] : null,
        ["الصافي للورثة", money(net, cur), { strong: true }],
      ],
      "من التركة إلى الصافي (م198)"
    );
  }

  const rows = [];
  for (const h of heirs) {
    const multi = h.count > 1;
    rows.push(
      `<tr><th scope="row">${name(h)}<small>${basis(h, r, ctx)}</small></th>` +
        `<td>${fr(h.share)}<small>${pct(val(h.share) * 100, 2)}${multi ? ` · ${each(h)} ${fr(h.each)}` : ""}</small></td>` +
        `<td>${money(amt(h.share), cur)}${multi ? `<small>${each(h)} ${money(amt(h.each), cur)}</small>` : ""}</td></tr>`
    );
  }
  if (r.toArham.n) rows.push(`<tr><th scope="row">ذوو الأرحام<small>الباقي بعد الفروض، يُقسم بينهم بالتنزيل</small></th><td>${fr(r.toArham)}<small>${pct(val(r.toArham) * 100, 2)}</small></td><td>${money(amt(r.toArham), cur)}</td></tr>`);
  if (r.toTreasury.n) rows.push(`<tr><th scope="row">بلا وارث في المدخلات<small>لذوي الأرحام إن وُجدوا، وإلا لبيت المال</small></th><td>${fr(r.toTreasury)}<small>${pct(val(r.toTreasury) * 100, 2)}</small></td><td>${money(amt(r.toTreasury), cur)}</td></tr>`);
  for (const h of out) rows.push(`<tr class="out"><th scope="row">${name(h)}<small>${blocked(h, r)}</small></th><td>0</td><td>—</td></tr>`);
  html += `<div class="table-scroll"><table class="shares"><caption>أنصبة الورثة</caption><thead><tr><th scope="col">الوارث</th><th scope="col">النصيب</th><th scope="col">المبلغ</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;

  if (r.awl) {
    const dens = r.heirs.filter((h) => h.fard).map((h) => (ctx.twoGm && (h.key === "patGrandmother" || h.key === "matGrandmother") ? 6 : h.fard.d));
    const asl = dens.reduce(lcm, 1);
    html += note(`عالت المسألة: مجموع الفروض ${fr(r.awl)} من التركة، فصار أصلها ${num((asl * r.awl.n) / r.awl.d, 0)} بدل ${num(asl, 0)}، ونقص كل نصيب بنسبة فرضه (م230).`, "info");
  }
  if (r.radd) html += note("بقي من التركة شيء بعد الفروض ولا عاصب، فرُدّ الباقي على أصحاب الفروض غير الزوجين بنسبة فروضهم (م231/1).", "info");
  if (r.raddSpouse) html += note(`لا صاحب فرض غير ${input.husband ? "الزوج" : "الزوجة"} ولا عاصب ولا ذو رحم، فرُدّ الباقي عليه (م231/2). وإن وُجد ذو رحم فالباقي له: فعّل خيار ذوي الأرحام.`, "info");
  if (r.toArham.n) html += note("الباقي لذوي الأرحام قبل الرد على أحد الزوجين (م231/2)، ويُقسم بينهم بتنزيلهم منزلة من أدلوا به، ولا تحسب الحاسبة قسمتهم.", "info");
  if (r.toTreasury.n) html += note("لا عاصب ولا صاحب فرض يستغرق التركة: إن وُجد ذو رحم (كولد البنت أو الخال) ففعّل خياره، وإلا آل الباقي في الفقه إلى بيت المال، ولم نقف على مادة صريحة لذلك في النظام.", "warn");
  if (r.umariyya) html += note("مسألة عمرية: انحصر الإرث في الأبوين وأحد الزوجين، فللأم ثلث الباقي لا ثلث التركة (م213).", "info");
  if (out.some((h) => h.excludedBy === "grandfather" && h.key !== "matSiblings")) html += note("في النظام السعودي ميراث الجد مثل ميراث الأب ويحجب الإخوة، فلا مقاسمة بينهم (م212).", "info");
  if (input.father && input.patGrandmother && !input.mother) html += note("الأب لا يحجب أمه: ترث الجدة أم الأب السدس مع الأب (م214).", "info");
  if (r.heirs.some((h) => h.basis === "none")) html += note("استغرقت الفروض التركة فسقط العاصب، ولا تشريك في المسألة المشتركة في النظام السعودي (م227).", "info");
  if (e.overCap) html += note(`الوصية تتجاوز ثلث ما بعد الديون، فحُسب منها ${money(e.bequestCap, cur)} فقط. والزائد موقوف على إجازة الورثة، ويصح لمن لا وارث له (م190–191).`, "warn");

  if (heirs.length && r.base > 1 && r.base <= 100000) {
    const parts = heirs.map((h) => `${name(h)}: ${num((r.base * h.each.n) / h.each.d, 0)}${h.count > 1 ? ` ${each(h)}` : ""}`);
    if (r.toArham.n) parts.push(`ذوو الأرحام: ${num((r.base * r.toArham.n) / r.toArham.d, 0)}`);
    if (r.toTreasury.n) parts.push(`الباقي: ${num((r.base * r.toTreasury.n) / r.toTreasury.d, 0)}`);
    html += note(`تصح المسألة من ${sahmAr(r.base)}: ${parts.join("، ")}.`, "info");
  }
  html += note("للتوضيح فقط، ولا تغني عن صك حصر الورثة وقسمة المحكمة. لا تُدخل القاتل عمداً ولا المخالف في الدين (م200 وم202).", "info");
  return html;
});
