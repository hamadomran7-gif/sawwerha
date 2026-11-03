import { ksaInheritance, ksaEstateNet } from "../calc.js";
import { bind, pct, table, big, note } from "../app.js";
import { moneyEn, numEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const money = (n) => moneyEn(n, "SAR");
const COUNTS = ["sons", "daughters", "sonsSons", "sonsDaughters", "fullBrothers", "fullSisters", "patBrothers", "patSisters", "matSiblings", "fullNephews", "patNephews", "fullUncles", "patUncles", "fullCousins", "patCousins"];
const FLAGS = ["father", "mother", "grandfather", "patGrandmother", "matGrandmother"];
// [singular, plural]
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

function basis(h, r, ctx) {
  const f = h.fard ? fr(h.fard) : "";
  switch (h.basis) {
    case "excluded":
      return blocked(h, r);
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
      return "Residuary with nothing left after the fixed shares (Art. 227)";
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
  if (r.error) return note("A husband and a wife cannot both be heirs in one case: choose one according to the deceased's sex.", "warn");

  const net = e.net;
  const amt = (f) => Math.round((net * 100 * f.n) / f.d) / 100;
  const ctx = { husband: input.husband, anyFard: r.heirs.some((h) => h.fard), twoGm: r.heirs.filter((h) => (h.key === "patGrandmother" || h.key === "matGrandmother") && h.fard).length === 2 };
  const heirs = r.heirs.filter((h) => h.basis !== "excluded");
  const out = r.heirs.filter((h) => h.basis === "excluded");

  let html = big("Net estate to divide among the heirs", money(net), e.debts || e.bequest ? `From an estate of ${money(e.estate)}` : "");
  if (e.debts || e.bequest || e.overCap) {
    html += table(
      [
        ["Estate value", money(e.estate)],
        e.debts ? ["Debts and funeral costs", `− ${money(e.debts)}`] : null,
        e.bequest ? [`Bequest (capped at one-third: ${money(e.bequestCap)})`, `− ${money(e.bequest)}`] : null,
        ["Net for the heirs", money(net), { strong: true }],
      ],
      "From estate to net (Art. 198)"
    );
  }

  const rows = [];
  for (const h of heirs) {
    const multi = h.count > 1;
    rows.push(
      `<tr><th scope="row">${name(h)}<small>${basis(h, r, ctx)}</small></th>` +
        `<td>${fr(h.share)}<small>${pct(val(h.share) * 100, 2)}${multi ? ` · each ${fr(h.each)}` : ""}</small></td>` +
        `<td>${money(amt(h.share))}${multi ? `<small>each ${money(amt(h.each))}</small>` : ""}</td></tr>`
    );
  }
  if (r.toArham.n) rows.push(`<tr><th scope="row">Distant kin<small>The remainder, divided among them by representation</small></th><td>${fr(r.toArham)}<small>${pct(val(r.toArham) * 100, 2)}</small></td><td>${money(amt(r.toArham))}</td></tr>`);
  if (r.toTreasury.n) rows.push(`<tr><th scope="row">No heir entered<small>To distant kin if any, otherwise the public treasury</small></th><td>${fr(r.toTreasury)}<small>${pct(val(r.toTreasury) * 100, 2)}</small></td><td>${money(amt(r.toTreasury))}</td></tr>`);
  for (const h of out) rows.push(`<tr class="out"><th scope="row">${name(h)}<small>${blocked(h, r)}</small></th><td>0</td><td>—</td></tr>`);
  html += `<div class="table-scroll"><table class="shares"><caption>Heirs' shares</caption><thead><tr><th scope="col">Heir</th><th scope="col">Share</th><th scope="col">Amount</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;

  if (r.awl) {
    const dens = r.heirs.filter((h) => h.fard).map((h) => (ctx.twoGm && (h.key === "patGrandmother" || h.key === "matGrandmother") ? 6 : h.fard.d));
    const asl = dens.reduce(lcm, 1);
    html += note(`Proportional reduction ('awl): the fixed shares add up to ${fr(r.awl)} of the estate, so the case rises from ${numEn(asl)} to ${numEn((asl * r.awl.n) / r.awl.d)} parts and every share shrinks in proportion (Art. 230).`, "info");
  }
  if (r.radd) html += note("Something is left after the fixed shares and there is no residuary, so it is returned to the fixed-share heirs other than the spouses in proportion to their shares (Art. 231/1).", "info");
  if (r.raddSpouse) html += note(`There is no other fixed-share heir, residuary or distant kin, so the remainder returns to the ${input.husband ? "husband" : "wife"} (Art. 231/2). If there are distant kin, the remainder is theirs: tick the distant kin option.`, "info");
  if (r.toArham.n) html += note("Distant kin come before any return to a spouse (Art. 231/2). They divide the remainder by standing in the place of the relative they descend through, which the calculator does not compute.", "info");
  if (r.toTreasury.n) html += note("No residuary or fixed-share heir takes the whole estate. If there are distant kin (such as a daughter's child or a maternal uncle), tick that option; otherwise, in Islamic law the remainder goes to the public treasury. We found no explicit article on this in the law.", "warn");
  if (r.umariyya) html += note("'Umariyya case: the heirs are the parents and one spouse, so the mother takes one-third of what is left, not one-third of the estate (Art. 213).", "info");
  if (out.some((h) => h.excludedBy === "grandfather" && h.key !== "matSiblings")) html += note("Under Saudi law the grandfather inherits like the father and excludes the siblings, so they do not share with him (Art. 212).", "info");
  if (input.father && input.patGrandmother && !input.mother) html += note("The father does not exclude his own mother: the paternal grandmother takes 1/6 alongside him (Art. 214).", "info");
  if (r.heirs.some((h) => h.basis === "none")) html += note("The fixed shares use up the estate, so the residuary drops out; Saudi law does not apply sharing in the Mushtaraka case (Art. 227).", "info");
  if (e.overCap) html += note(`The bequest exceeds one-third of what is left after debts, so only ${money(e.bequestCap)} is counted. The excess needs the heirs' consent, and is valid for someone with no heirs (Arts. 190–191).`, "warn");

  if (heirs.length && r.base > 1 && r.base <= 100000) {
    const parts = heirs.map((h) => `${name(h)}: ${numEn((r.base * h.each.n) / h.each.d)}${h.count > 1 ? " each" : ""}`);
    if (r.toArham.n) parts.push(`distant kin: ${numEn((r.base * r.toArham.n) / r.toArham.d)}`);
    if (r.toTreasury.n) parts.push(`remainder: ${numEn((r.base * r.toTreasury.n) / r.toTreasury.d)}`);
    html += note(`The estate divides into ${numEn(r.base)} equal parts: ${parts.join("; ")}.`, "info");
  }
  html += note("For illustration only; it does not replace the court's heirship deed and division. Do not enter an heir who killed the deceased intentionally or who is of a different religion (Arts. 200 and 202).", "info");
  return html;
});
