const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Display-only rounding. e.g. 1234567.6 -> "1,234,568 ₫" */
export function formatVND(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value);
  return `${fmt.format(rounded === 0 ? 0 : rounded)} ₫`;
}

export function formatMonths(value: number): string {
  if (value === Infinity) return "Unlimited";
  return `${(Math.floor(value * 10) / 10).toFixed(1)} months`;
}
