import { uaeEmiratisation, rules } from "../calc.js";
import { bind, table, big, note } from "../app.js";
import { moneyEn, numEn, plural, dateEn } from "./en-common.js";

const form = document.getElementById("calc");
const result = document.getElementById("result");
const m = (n) => moneyEn(n, "AED");
const cit = (n) => plural(n, "Emirati");
const LABEL = { "2025-12-31": "31 December 2025 deadline (8%)", "2026-06-30": "30 June 2026 deadline (9%)", "2026-12-31": "31 December 2026 deadline (10%)" };

bind(form, result, (v) => {
  const W = Math.floor(Number(v.total) || 0);
  const E = rules.ae.emiratisation;
  form.querySelectorAll("[data-large]").forEach((el) => (el.hidden = W > 0 && W < E.largeMin));
  form.querySelectorAll("[data-small]").forEach((el) => (el.hidden = !(W >= E.smallMin && W < E.largeMin)));
  if (!W || v.emiratis === null) return null;
  const r = uaeEmiratisation({ total: W, skilled: v.skilled ?? 0, emiratis: v.emiratis, baseline: v.baseline || 0, sector14: v.sector14 === "yes" });
  if (!r) return null;
  let html = "";
  if (r.scope === "none") {
    html = big("No mandatory Emiratisation target for your company", "—", r.small ? "20–49 workers outside the 14 targeted activities" : "Fewer than 20 workers");
    html += note("Mandatory targets apply to companies with 50 or more workers, and to companies with 20 to 49 workers in 14 economic activities. You can still benefit from Nafis support when you hire Emiratis.", "info");
    return html;
  }
  if (r.scope === "small") {
    const y25 = r.years.find((y) => y.year === 2025);
    html = big("Required by the end of 2025", cit(y25.required), y25.short ? `You have ${numEn(r.have)}; shortfall ${cit(y25.short)}` : `You have ${numEn(r.have)}: target met`);
    html += table(
      r.years.flatMap((y) => [
        [`Required by the end of ${y.year}`, cit(y.required)],
        ["Shortfall", y.short ? cit(y.short) : "None"],
        [`Contribution for ${y.year} (${m(y.per)} per missing Emirati)`, m(y.contrib), { strong: y.year === 2025 }],
      ]),
      "Companies with 20–49 workers in the targeted activities"
    );
    html += note("No new target for this group had been announced for 2026 by November 2026, so you must keep the Emiratis you hired. The 2025 contribution is payable from January 2026 and can be paid monthly, and if an Emirati leaves you have two months to hire a replacement.", "info");
  } else {
    const end = r.deadlines.find((d) => d.date === "2026-12-31");
    const same = end.a === end.b;
    const shortTxt = (n) => (n ? cit(n) : "None");
    const sub = same
      ? `You have ${numEn(r.have)} · ${end.shortA ? `shortfall ${cit(end.shortA)}, contribution ${m(end.contribA)}` : "target met"}`
      : `${cit(end.b)} at 10%, ${cit(end.a)} under the Resolution 279 table · you have ${numEn(r.have)}`;
    html = big("Required by the end of 2026", same ? cit(end.a) : `${numEn(Math.min(end.a, end.b))}–${numEn(Math.max(end.a, end.b))} Emiratis`, sub);
    html += table(
      [
        ["Skilled workers", numEn(r.S)],
        ["Yearly increase under the Resolution 279 table", cit(r.inc)],
        r.base ? ["Baseline Emiratis (added in the table reading)", numEn(r.base)] : null,
        ["Emiratis as a share of all workers", `${numEn(Math.round(r.share * 1000) / 10)}%`],
      ],
      "Company with 50 or more workers"
    );
    for (const d of r.deadlines) {
      const past = d.date < new Date().toISOString().slice(0, 10);
      const eq = d.a === d.b;
      const c = (x) => (r.exempt ? "Exempt (70% or more)" : m(x));
      const rows = eq
        ? [
            ["Required (table and percentage agree)", cit(d.a)],
            ["Shortfall", shortTxt(d.shortA)],
            [`Contribution (${m(d.per)} per missing Emirati)`, c(d.contribA), { strong: true }],
          ]
        : !d.shortA && !d.shortB
        ? [
            ["Required under the Resolution 279 table", cit(d.a)],
            [`Required at ${numEn(d.pct * 100)}% of skilled workers`, cit(d.b)],
            ["Shortfall", "None under either reading", { strong: true }],
          ]
        : [
            ["Required under the Resolution 279 table", cit(d.a)],
            [`Required at ${numEn(d.pct * 100)}% of skilled workers`, cit(d.b)],
            ["Shortfall under the table", shortTxt(d.shortA)],
            ["Shortfall at the percentage", shortTxt(d.shortB)],
            [`Contribution under the table (${m(d.per)} per missing Emirati)`, c(d.contribA), { strong: true }],
            ["Contribution at the percentage", c(d.contribB), { strong: true }],
          ];
      if (d.shortA || d.shortB) rows.push(["Collected from", `${dateEn(d.collect)}${d.date === "2026-12-31" ? " (expected)" : ""}`, { muted: true }]);
      html += table(rows, `${LABEL[d.date] || dateEn(d.date)}${past ? " — passed" : ""}`);
    }
    if (r.exempt) html += note("Your Emiratis make up 70% or more of all workers; companies at this level were exempted from contributions in a January 2023 amendment (secondary source).", "info");
    html += note("For past deadlines we assume you had the same number of Emiratis then as today. The binding figure is what MoHRE's system shows for your company, and the half-year rounding is our assumption.", "warn");
  }
  html += note(`An Emirati counts with a valid work permit, pension registration and pay through WPS, in a skilled job, on at least AED ${numEn(E.minSalary)} a month (from 1 July 2026 lower salaries do not count). Fake Emiratisation carries a fine of AED ${numEn(E.fakeMin)} to ${numEn(E.fakeMax)} per Emirati, and up to AED 1 million under the Labour Law.`, "info");
  return html;
});
