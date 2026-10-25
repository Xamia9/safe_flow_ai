/**
 * Currency / duration formatting helpers shared by UI and PDF.
 *
 * Numeric values and currency are never translated. Only surrounding labels
 * (e.g. "Unlimited", "X months") are localized, and callers pass the
 * translate function in.
 */
const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Display-only rounding. e.g. 1234567.6 -> "1,234,568 ₫". Same as formatVND. */
export function formatVND(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value);
  return `${fmt.format(rounded === 0 ? 0 : rounded)} ₫`;
}

/** "<n> VND" form used inside sentences by recommendations. Unchanged. */
export function formatAmount(n: number): string {
  if (!Number.isFinite(n)) return "N/A";
  return `${Math.round(n).toLocaleString("en-US")} VND`;
}

/** Compact VND for chart axes, e.g. "12M". Unchanged. */
export function formatVNDShort(v: number): string {
  if (!Number.isFinite(v)) return "N/A";
  const a = Math.abs(v);
  const s = v < 0 ? "-" : "";
  if (a >= 1e9) return `${s}${(a / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${s}${(a / 1e6).toFixed(0)}M`;
  if (a >= 1e3) return `${s}${(a / 1e3).toFixed(0)}K`;
  return `${s}${a}`;
}

/** Localized "X months" / "<n> tháng" — caller passes the translate fn. */
export function formatMonthsLocalized(
  value: number,
  t: (key: "format.unlimited" | "format.monthsValue", params?: Record<string, string | number>) => string,
): string {
  if (value === Infinity) return t("format.unlimited");
  return t("format.monthsValue", { n: (Math.floor(value * 10) / 10).toFixed(1) });
}
