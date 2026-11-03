// Generic English inheritance calculator UI for the GCC country pages: takes a rule profile, article references and wording per country.
import { gccInheritance, inheritanceWithWajiba, ksaEstateNet } from "../calc.js";
import { bind, pct, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const COUNTS = ["sons", "daughters", "sonsSons", "sonsDaughters", "fullBrothers", "fullSisters", "patBrothers", "patSisters", "matSiblings", "fullNephews", "patNephews", "fullUncles", "patUncles", "fullCousins", "patCousins"];
const FLAGS = ["father", "mother", "grandfather", "patGrandmother", "matGrandmother"];
const NAME = {
  husband: ["Husband"], wives: ["Wife", "Wives"], sons: ["Son", "Sons"], daughters: ["Daughter", "Daughters"],
  sonsSons: ["Son's son", "Son's sons"], sonsDaughters: ["Son's daughter", "Son's daughters"], father: ["Father"], mother: ["Mother"],
  grandfather: ["Paternal grandfather"], patGrandmother: ["Paternal grandmother"], matGrandmother: ["Maternal grandmother"],
  fullBrothers: ["Full brother", "Full brothers"], fullSisters: ["Full sister", "Full sisters"],
  patBrothers: ["Paternal half-brother", "Paternal half-brothers"], patSisters: ["Paternal half-sister", "Paternal half-sisters"],
  matSiblings: ["Maternal half-sibling", "Maternal half-siblings"],
  fullNephews: ["Full brother's son", "Full brother's sons"], patNephews: ["Half-brother's son", "Half-brother's sons"],
  fullUncles: ["Full paternal uncle", "Full paternal uncles"], patUncles: ["Paternal half-uncle", "Paternal half-uncles"],
  fullCousins: ["Full uncle's son", "Full uncle's sons"], patCousins: ["Half-uncle's son", "Half-uncle's sons"],
};
const DESC = new Set(["sons", "daughters", "sonsSons", "sonsDaughters"]);
const BY = {
  sons: "a son", sonsSons: "a son's son", father: "the father", grandfather: "the grandfather", mother: "the mother", fullBrothers: "a full brother", patBrothers: "a paternal half-brother",
  fullNephews: "a full brother's son", patNephews: "a half-brother's son", fullUncles: "a full paternal uncle", patUncles: "a paternal half-uncle", fullCousins: "a full uncle's son",
};
const PAIR_MALE = { daughters: "the son", sonsDaughters: "the son's son", fullSisters: "the full brother", patSisters: "the paternal half-brother" };
const JADD = {
  muqasama: "Residuary, sharing with the siblings as one more brother (the best option for him)",
  third: "One-third of the estate (better for him than sharing)",
  thirdRemainder: "One-third of what is left after the fixed shares (the best option for him)",
  sixth: "One-sixth as a fixed share (the best option for him); nothing is left for the siblings",
  malikiyya: "Everything left (the Malikiyya case)",
};

const fr = (f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
const val = (f) => f.n / f.d;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a * b) / gcd(a, b);
const name = (h) => (h.count > 1 ? `${NAME[h.key][1] || NAME[h.key][0]} (${h.count})` : NAME[h.key][0]);

function blocked(h, r) {
  const b = h.excludedBy;
  let by = BY[b];
  if (b === "daughters") by = "two or more daughters taking two-thirds";
  else if (b === "fullSisters") by = r.heirs.find((x) => x.key === "fullSisters")?.basis === "asabaMaGhayr" ? "the full sister, a residuary with the daughters" : "two or more full sisters taking two-thirds";
  else if (b === "patSisters") by = "the paternal half-sister, a residuary with the daughters";
  else if (h.key === "matSiblings" && DESC.has(b)) by = "an inheriting descendant";
  return `Excluded by ${by}`;
}

export function mountInheritanceEn(cfg) {
  const form = document.getElementById("calc");
  const result = document.getElementById("result");
  const money = (n) => moneyEn(n, cfg.cur);
  const A = cfg.art || {};
  const ref = (k) => (A[k] ? ` (${A[k]})` : "");

  function basis(h, r, ctx) {
    const f = h.fard ? fr(h.fard) : "";
    if (h.basis.startsWith("jadd:")) return JADD[h.basis.slice(5)] || "Residuary";
    switch (h.basis) {
      case "excluded":
        return blocked(h, r);
      case "jaddSibling":
        return "Residuary, sharing with the grandfather; a male takes twice a female's share";
      case "akdariyya":
        return "Akdariyya: the grandfather's and sister's shares are pooled and split two to one";
      case "mushtaraka":
        return "Mushtaraka: full siblings share the third equally with the maternal siblings";
      case "fard":
        if (h.key === "mother" && r.umariyya) return `One-third of what is left after the ${ctx.husband ? "husband" : "wife"} ('Umariyya)`;
        if ((h.key === "patGrandmother" || h.key === "matGrandmother") && ctx.twoGm) return "Fixed share: 1/6 shared by both grandmothers";
        return r.awl ? `Fixed share ${f} before reduction` : `Fixed share ${f}`;
      case "fardRadd":
        return `Fixed share ${f}, plus the return`;
      case "fardAsaba":
        return "1/6 fixed share plus the remainder as residuary";
      case "asaba":
        if (r.heirs.some((x) => x.basis === "asabaBiGhayr")) return "Residuary: a male takes twice a female's share";
        return ctx.anyFard ? "Residuary: what is left after the fixed shares" : "Residuary: the whole estate";
      case "asabaBiGhayr":
        return `Residuary with ${PAIR_MALE[h.key]}: a male takes twice a female's share`;
      case "asabaMaGhayr":
        return "Residuary with the daughters: what is left after the fixed shares";
      default:
        return `Residuary with nothing left after the fixed shares${ref("mushtaraka")}`;
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
    if (r.error) return note("A husband and a wife cannot both be heirs in one case: choose one according to the deceased's sex.", "warn");

    const net = e.net;
    const amt = (f) => Math.round((net * 100 * f.n) / f.d) / 100;
    const ctx = { husband: input.husband, anyFard: r.heirs.some((h) => h.fard), twoGm: r.heirs.filter((h) => (h.key === "patGrandmother" || h.key === "matGrandmother") && h.fard).length === 2 };
    const heirs = r.heirs.filter((h) => h.basis !== "excluded");
    const out = r.heirs.filter((h) => h.basis === "excluded");

    let html = big("Net estate to divide", money(net), e.debts || e.bequest ? `From an estate of ${money(e.estate)}` : "");
    if (e.debts || e.bequest || e.overCap) {
      html += table(
        [
          ["Estate value", money(e.estate)],
          e.debts ? ["Debts and funeral costs", `− ${money(e.debts)}`] : null,
          e.bequest ? [`Optional bequest (capped at one-third: ${money(e.bequestCap)})`, `− ${money(e.bequest)}`] : null,
          ["Net for the heirs", money(net), { strong: true }],
        ],
        `From estate to net${ref("order")}`
      );
    }

    const rows = [];
    const W = r.wajiba;
    if (W) {
      if (W.sonBranch) rows.push(`<tr><th scope="row">Children of a predeceased son (${W.deadSons})<small>Obligatory bequest: their father's share as if alive${W.capped ? ", capped at one-third" : ""}</small></th><td>${fr(W.sonBranch)}<small>${pct(val(W.sonBranch) * 100, 2)} per branch</small></td><td>${money(amt(W.sonBranch))}<small>per branch, a male twice a female</small></td></tr>`);
      if (W.daughterBranch) rows.push(`<tr><th scope="row">Children of a predeceased daughter (${W.deadDaughters})<small>Obligatory bequest: their mother's share as if alive${W.capped ? ", capped at one-third" : ""}</small></th><td>${fr(W.daughterBranch)}<small>${pct(val(W.daughterBranch) * 100, 2)} per branch</small></td><td>${money(amt(W.daughterBranch))}<small>per branch, a male twice a female</small></td></tr>`);
    }
    for (const h of heirs) {
      const multi = h.count > 1;
      rows.push(
        `<tr><th scope="row">${name(h)}<small>${basis(h, r, ctx)}</small></th>` +
          `<td>${fr(h.share)}<small>${pct(val(h.share) * 100, 2)}${multi ? ` · each ${fr(h.each)}` : ""}</small></td>` +
          `<td>${money(amt(h.share))}${multi ? `<small>each ${money(amt(h.each))}</small>` : ""}</td></tr>`
      );
    }
    if (r.toArham.n) rows.push(`<tr><th scope="row">Distant kin<small>The remainder, divided among them under the law</small></th><td>${fr(r.toArham)}<small>${pct(val(r.toArham) * 100, 2)}</small></td><td>${money(amt(r.toArham))}</td></tr>`);
    if (r.toTreasury.n) rows.push(`<tr><th scope="row">No heir entered<small>${cfg.noHeirsShort}</small></th><td>${fr(r.toTreasury)}<small>${pct(val(r.toTreasury) * 100, 2)}</small></td><td>${money(amt(r.toTreasury))}</td></tr>`);
    for (const h of out) rows.push(`<tr class="out"><th scope="row">${name(h)}<small>${blocked(h, r)}</small></th><td>0</td><td>—</td></tr>`);
    html += `<div class="table-scroll"><table class="shares"><caption>Heirs' shares</caption><thead><tr><th scope="col">Heir</th><th scope="col">Share</th><th scope="col">Amount</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;

    if (r.awl && !r.akdariyya) {
      const dens = r.heirs.filter((h) => h.fard).map((h) => (ctx.twoGm && (h.key === "patGrandmother" || h.key === "matGrandmother") ? 6 : h.fard.d));
      const asl = dens.reduce(lcm, 1);
      html += note(`Proportional reduction ('awl): the fixed shares add up to ${fr(r.awl)} of the estate, so the case rises from ${numEn(asl)} to ${numEn((asl * r.awl.n) / r.awl.d)} parts and every share shrinks in proportion${ref("awl")}.`, "info");
    }
    if (r.akdariyya) html += note(`Akdariyya: husband 1/2, mother 1/3, grandfather 1/6 and sister 1/2 rise to 9 parts; the grandfather's and sister's 4 parts are pooled and split two to one, giving 27 parts${ref("akdariyya")}.`, "info");
    if (r.jaddMethod && !r.akdariyya && !r.malikiyya) html += note(`Grandfather with siblings: he takes the best of sharing as a brother, one-third of the estate (or one-third of what is left when there are fixed-share heirs), or one-sixth; paternal half-siblings are counted against him and then give way to full siblings${ref("grandfather")}.`, "info");
    if (r.malikiyya) html += note(`Malikiyya: the grandfather takes everything left, because without him the maternal siblings would take the third and nothing would remain for the paternal brother${ref("malikiyya")}.`, "info");
    if (r.mushtaraka) html += note(`Mushtaraka: the full siblings share the third equally with the maternal siblings, male and female alike${ref("mushtaraka")}.`, "info");
    if (r.radd) html += note(`Something is left after the fixed shares and there is no residuary, so it returns to the fixed-share heirs other than the spouses in proportion to their shares${ref("radd")}.`, "info");
    if (r.raddSpouse) html += note(`There is no other fixed-share heir, residuary or distant kin, so the remainder returns to the ${input.husband ? "husband" : "wife"}${ref("raddSpouse")}. If there are distant kin, the remainder is theirs: tick that option.`, "info");
    if (r.toArham.n) html += note(`Distant kin come before any return to a spouse${ref("raddSpouse")}; the calculator does not divide the remainder among them.`, "info");
    if (r.toTreasury.n) html += note(cfg.noHeirs, "warn");
    if (r.umariyya) html += note(`'Umariyya case: the heirs are the parents and one spouse, so the mother takes one-third of what is left, not of the estate${ref("umariyya")}.`, "info");
    if (W) html += note(`The obligatory bequest is paid before the heirs and before any optional bequest, capped at one-third of the estate${ref("wajiba")}; each branch's share is split among its children, a male taking twice a female.${W.capped ? " The branches' shares exceeded one-third and were reduced to it." : ""}`, "info");
    if (r.sonBranchesInherit) html += note("There is no living son, so a predeceased son's children inherit in their own right and get no obligatory bequest: enter them as son's sons and son's daughters.", "warn");
    if (e.overCap) html += note(`The optional bequest exceeds one-third of what is left after debts, so only ${money(e.bequestCap)} is counted; the excess needs the heirs' consent${ref("bequest")}.`, "warn");

    if (heirs.length && r.base > 1 && r.base <= 100000) {
      const parts = [];
      if (W?.sonBranch) parts.push(`each predeceased son's branch: ${numEn((r.base * W.sonBranch.n) / W.sonBranch.d)}`);
      if (W?.daughterBranch) parts.push(`each predeceased daughter's branch: ${numEn((r.base * W.daughterBranch.n) / W.daughterBranch.d)}`);
      for (const h of heirs) parts.push(`${name(h)}: ${numEn((r.base * h.each.n) / h.each.d)}${h.count > 1 ? " each" : ""}`);
      if (r.toArham.n) parts.push(`distant kin: ${numEn((r.base * r.toArham.n) / r.toArham.d)}`);
      if (r.toTreasury.n) parts.push(`remainder: ${numEn((r.base * r.toTreasury.n) / r.toTreasury.d)}`);
      html += note(`The estate divides into ${numEn(r.base)} equal parts: ${parts.join("; ")}.`, "info");
    }
    html += note(cfg.disclaimer, "info");
    return html;
  });
}
