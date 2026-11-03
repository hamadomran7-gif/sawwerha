// واجهة حاسبة المواريث العامة لدول الخليج: تأخذ ملف القواعد وأرقام المواد ونصوص كل دولة.
import { gccInheritance, inheritanceWithWajiba, ksaEstateNet } from "../calc.js";
import { bind, money, num, pct, table, big, note, countAr } from "../app.js";

const COUNTS = ["sons", "daughters", "sonsSons", "sonsDaughters", "fullBrothers", "fullSisters", "patBrothers", "patSisters", "matSiblings", "fullNephews", "patNephews", "fullUncles", "patUncles", "fullCousins", "patCousins"];
const FLAGS = ["father", "mother", "grandfather", "patGrandmother", "matGrandmother"];
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
const JADD = {
  muqasama: "تعصيباً بمقاسمة الإخوة كأنه أخ (الأحظ له)",
  third: "ثلث التركة (أحظ له من المقاسمة)",
  thirdRemainder: "ثلث الباقي بعد الفروض (الأحظ له)",
  sixth: "السدس فرضاً (الأحظ له)، ولم يبقَ للإخوة شيء",
  malikiyya: "الباقي كله (المسألة المالكية)",
};

const fr = (f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
const val = (f) => f.n / f.d;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a * b) / gcd(a, b);
const sahmAr = (n) => countAr(n, "سهم واحد", "سهمان", "أسهم", "سهماً", "سهم");
const name = (h) => (h.count > 1 ? `${NAME[h.key][1] || NAME[h.key][0]} (${h.count})` : NAME[h.key][0]);
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

/**
 * cfg: { profile, cur, art: {awl, radd, raddSpouse, umariyya, grandfather, fatherGm, mushtaraka, bequest, killer, order},
 *        wajiba: bool, noHeirs: نص المآل عند انعدام الوارث, disclaimer }
 */
export function mountInheritance(cfg) {
  const form = document.getElementById("calc");
  const result = document.getElementById("result");
  const cur = cfg.cur;
  const A = cfg.art || {};
  const ref = (k) => (A[k] ? ` (${A[k]})` : "");

  function basis(h, r, ctx) {
    const f = h.fard ? fr(h.fard) : "";
    if (h.basis.startsWith("jadd:")) return JADD[h.basis.slice(5)] || "تعصيباً";
    switch (h.basis) {
      case "excluded":
        return blocked(h, r);
      case "jaddSibling":
        return "تعصيباً مع الجد بالمقاسمة، للذكر مثل حظ الأنثيين";
      case "akdariyya":
        return "المسألة الأكدرية: يُجمع نصيب الجد والأخت ويُقسم للذكر مثل حظ الأنثيين";
      case "mushtaraka":
        return "المشتركة: يشترك الأشقاء مع الإخوة لأم في الثلث بالتساوي";
      case "fard":
        if (h.key === "mother" && r.umariyya) return `ثلث الباقي بعد نصيب ${ctx.husband ? "الزوج" : "الزوجة"} (العمرية)`;
        if ((h.key === "patGrandmother" || h.key === "matGrandmother") && ctx.twoGm) return "السدس فرضاً تشترك فيه الجدتان";
        return r.awl ? `فرضاً ${f} قبل العول` : `فرضاً ${f}`;
      case "fardRadd":
        return `فرضاً ${f}، ثم رداً`;
      case "fardAsaba":
        return "السدس فرضاً، والباقي تعصيباً";
      case "asaba":
        if (r.heirs.some((x) => x.basis === "asabaBiGhayr")) return "تعصيباً، للذكر مثل حظ الأنثيين";
        return ctx.anyFard ? "تعصيباً: الباقي بعد الفروض" : "تعصيباً: التركة كلها";
      case "asabaBiGhayr":
        return `تعصيباً مع ${PAIR_MALE[h.key]}، للذكر مثل حظ الأنثيين`;
      case "asabaMaGhayr":
        return "عصبة مع البنات: الباقي بعد الفروض";
      default:
        return `عصبة لم يبقَ لها شيء بعد الفروض${ref("mushtaraka")}`;
    }
  }

  bind(form, result, (v) => {
    const input = { arham: !!v.arham };
    for (const k of COUNTS) input[k] = Math.max(0, Math.floor(v[k] || 0));
    for (const k of FLAGS) input[k] = v[k] ? 1 : 0;
    if (v.spouse === "husband") input.husband = 1;
    else if (/^w[1-4]$/.test(v.spouse)) input.wives = Number(v.spouse.slice(1));
    const e = ksaEstateNet({ estate: v.estate || 0, debts: v.debts || 0, bequest: v.bequest || 0 });
    const r = cfg.wajiba ? inheritanceWithWajiba(input, cfg.profile, { deadSons: v.deadSons || 0, deadDaughters: v.deadDaughters || 0 }) : gccInheritance(input, cfg.profile);
    if (r.error) return note("لا يجتمع زوج وزوجة في مسألة واحدة: اختر أحدهما بحسب جنس المتوفى.", "warn");

    const net = e.net;
    const amt = (f) => Math.round((net * 100 * f.n) / f.d) / 100;
    const ctx = { husband: input.husband, anyFard: r.heirs.some((h) => h.fard), twoGm: r.heirs.filter((h) => (h.key === "patGrandmother" || h.key === "matGrandmother") && h.fard).length === 2 };
    const heirs = r.heirs.filter((h) => h.basis !== "excluded");
    const out = r.heirs.filter((h) => h.basis === "excluded");

    let html = big("صافي التركة للقسمة", money(net, cur), e.debts || e.bequest ? `من تركة ${money(e.estate, cur)}` : "");
    if (e.debts || e.bequest || e.overCap) {
      html += table(
        [
          ["قيمة التركة", money(e.estate, cur)],
          e.debts ? ["الديون وتكاليف التجهيز", `− ${money(e.debts, cur)}`] : null,
          e.bequest ? [`الوصية الاختيارية (بحد الثلث: ${money(e.bequestCap, cur)})`, `− ${money(e.bequest, cur)}`] : null,
          ["الصافي للورثة", money(net, cur), { strong: true }],
        ],
        `من التركة إلى الصافي${ref("order")}`
      );
    }

    const rows = [];
    const W = r.wajiba;
    if (W) {
      if (W.sonBranch) rows.push(`<tr><th scope="row">أولاد الابن المتوفى قبله (${W.deadSons})<small>وصية واجبة: نصيب أبيهم لو كان حياً${W.capped ? "، بحد الثلث" : ""}</small></th><td>${fr(W.sonBranch)}<small>${pct(val(W.sonBranch) * 100, 2)} لكل فرع</small></td><td>${money(amt(W.sonBranch), cur)}<small>لكل فرع، للذكر مثل حظ الأنثيين</small></td></tr>`);
      if (W.daughterBranch) rows.push(`<tr><th scope="row">أولاد البنت المتوفاة قبله (${W.deadDaughters})<small>وصية واجبة: نصيب أمهم لو كانت حية${W.capped ? "، بحد الثلث" : ""}</small></th><td>${fr(W.daughterBranch)}<small>${pct(val(W.daughterBranch) * 100, 2)} لكل فرع</small></td><td>${money(amt(W.daughterBranch), cur)}<small>لكل فرع، للذكر مثل حظ الأنثيين</small></td></tr>`);
    }
    for (const h of heirs) {
      const multi = h.count > 1;
      rows.push(
        `<tr><th scope="row">${name(h)}<small>${basis(h, r, ctx)}</small></th>` +
          `<td>${fr(h.share)}<small>${pct(val(h.share) * 100, 2)}${multi ? ` · ${each(h)} ${fr(h.each)}` : ""}</small></td>` +
          `<td>${money(amt(h.share), cur)}${multi ? `<small>${each(h)} ${money(amt(h.each), cur)}</small>` : ""}</td></tr>`
      );
    }
    if (r.toArham.n) rows.push(`<tr><th scope="row">ذوو الأرحام<small>الباقي بعد الفروض، يُقسم بينهم بطريقة القانون</small></th><td>${fr(r.toArham)}<small>${pct(val(r.toArham) * 100, 2)}</small></td><td>${money(amt(r.toArham), cur)}</td></tr>`);
    if (r.toTreasury.n) rows.push(`<tr><th scope="row">بلا وارث في المدخلات<small>${cfg.noHeirsShort}</small></th><td>${fr(r.toTreasury)}<small>${pct(val(r.toTreasury) * 100, 2)}</small></td><td>${money(amt(r.toTreasury), cur)}</td></tr>`);
    for (const h of out) rows.push(`<tr class="out"><th scope="row">${name(h)}<small>${blocked(h, r)}</small></th><td>0</td><td>—</td></tr>`);
    html += `<div class="table-scroll"><table class="shares"><caption>أنصبة الورثة</caption><thead><tr><th scope="col">الوارث</th><th scope="col">النصيب</th><th scope="col">المبلغ</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;

    if (r.awl && !r.akdariyya) {
      const dens = r.heirs.filter((h) => h.fard).map((h) => (ctx.twoGm && (h.key === "patGrandmother" || h.key === "matGrandmother") ? 6 : h.fard.d));
      const asl = dens.reduce(lcm, 1);
      html += note(`عالت المسألة: مجموع الفروض ${fr(r.awl)} من التركة، فصار أصلها ${num((asl * r.awl.n) / r.awl.d, 0)} بدل ${num(asl, 0)}، ونقص كل نصيب بنسبة فرضه${ref("awl")}.`, "info");
    }
    if (r.akdariyya) html += note(`المسألة الأكدرية: للزوج النصف وللأم الثلث وللجد السدس وللأخت النصف، فتعول إلى 9، ثم يُجمع نصيبا الجد والأخت (4) ويُقسمان بينهما للذكر مثل حظ الأنثيين فتصح من 27${ref("akdariyya")}.`, "info");
    if (r.jaddMethod && !r.akdariyya && !r.malikiyya) html += note(`الجد مع الإخوة: يأخذ الأحظ له من المقاسمة كأخ، أو ثلث التركة (أو ثلث الباقي ومعه أصحاب فروض)، أو السدس، ويُحسب الإخوة لأب عليه ثم يأخذ الأشقاء نصيبهم${ref("grandfather")}.`, "info");
    if (r.malikiyya) html += note(`المسألة المالكية: يأخذ الجد الباقي كله، لأنه لولاه لأخذ الإخوة لأم الثلث ولم يبقَ للأخ لأب شيء${ref("malikiyya")}.`, "info");
    if (r.mushtaraka) html += note(`المسألة المشتركة: يشترك الأشقاء مع الإخوة لأم في الثلث بالتساوي بين الذكر والأنثى${ref("mushtaraka")}.`, "info");
    if (r.radd) html += note(`بقي من التركة شيء بعد الفروض ولا عاصب، فرُدّ الباقي على أصحاب الفروض غير الزوجين بنسبة فروضهم${ref("radd")}.`, "info");
    if (r.raddSpouse) html += note(`لا صاحب فرض غير ${input.husband ? "الزوج" : "الزوجة"} ولا عاصب ولا ذو رحم، فرُدّ الباقي عليه${ref("raddSpouse")}. وإن وُجد ذو رحم فالباقي له: فعّل خيار ذوي الأرحام.`, "info");
    if (r.toArham.n) html += note(`الباقي لذوي الأرحام قبل الرد على أحد الزوجين${ref("raddSpouse")}، ولا تحسب الحاسبة قسمتهم بينهم.`, "info");
    if (r.toTreasury.n) html += note(cfg.noHeirs, "warn");
    if (r.umariyya) html += note(`مسألة عمرية: انحصر الإرث في الأبوين وأحد الزوجين، فللأم ثلث الباقي لا ثلث التركة${ref("umariyya")}.`, "info");
    if (W) html += note(`الوصية الواجبة تُخرج قبل الورثة وقبل الوصية الاختيارية، بحد ثلث التركة${ref("wajiba")}، ويُقسم نصيب كل فرع بين أولاده للذكر مثل حظ الأنثيين.${W.capped ? " وقد جاوز نصيب الفروع الثلث فرُدّ إليه." : ""}`, "info");
    if (r.sonBranchesInherit) html += note("لا ابن حياً، فأولاد الابن المتوفى يرثون بأنفسهم ولا وصية واجبة لهم: أدخلهم في خانتي أبناء الابن وبنات الابن.", "warn");
    if (e.overCap) html += note(`الوصية الاختيارية تتجاوز ثلث ما بعد الديون، فحُسب منها ${money(e.bequestCap, cur)} فقط، والزائد موقوف على إجازة الورثة${ref("bequest")}.`, "warn");

    if (heirs.length && r.base > 1 && r.base <= 100000) {
      const parts = [];
      if (W?.sonBranch) parts.push(`كل فرع ابن متوفى: ${num((r.base * W.sonBranch.n) / W.sonBranch.d, 0)}`);
      if (W?.daughterBranch) parts.push(`كل فرع بنت متوفاة: ${num((r.base * W.daughterBranch.n) / W.daughterBranch.d, 0)}`);
      for (const h of heirs) parts.push(`${name(h)}: ${num((r.base * h.each.n) / h.each.d, 0)}${h.count > 1 ? ` ${each(h)}` : ""}`);
      if (r.toArham.n) parts.push(`ذوو الأرحام: ${num((r.base * r.toArham.n) / r.toArham.d, 0)}`);
      if (r.toTreasury.n) parts.push(`الباقي: ${num((r.base * r.toTreasury.n) / r.toTreasury.d, 0)}`);
      html += note(`تصح المسألة من ${sahmAr(r.base)}: ${parts.join("، ")}.`, "info");
    }
    html += note(cfg.disclaimer, "info");
    return html;
  });
}
