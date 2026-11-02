// Shared English formatting helpers for the /en/ pages.
const nf = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export const moneyEn = (n, cur = "") => (n === null || n === undefined || isNaN(n) ? "—" : `${cur ? cur + " " : ""}${nf.format(n)}`);
export const numEn = (n) => (n === null || n === undefined || isNaN(n) ? "—" : nf0.format(n));
export const plural = (n, one, many = one + "s") => `${numEn(n)} ${Number(n) === 1 ? one : many}`;
export function durationEn(d) {
  if (!d) return "—";
  const parts = [];
  if (d.years) parts.push(plural(d.years, "year"));
  if (d.months) parts.push(plural(d.months, "month"));
  if (d.days) parts.push(plural(d.days, "day"));
  return parts.length ? parts.join(", ") : "less than a day";
}
const dfmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const dateEn = (iso) => (iso ? dfmt.format(new Date(`${iso}T00:00:00Z`)) : "—");
