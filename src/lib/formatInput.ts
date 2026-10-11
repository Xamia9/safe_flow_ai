/**
 * Format a numeric string with comma-separated thousands while preserving
 * the caret position.  Call from an input's onChange handler.
 *
 * Strips non-digits, formats the remaining number with toLocaleString,
 * then restores the caret to the same digit offset it was at before formatting.
 */
export function formatWithCaret(raw: string, input: HTMLInputElement): string {
  const selStart = input.selectionStart ?? raw.length;
  const digitsBefore = raw.slice(0, selStart).replace(/[^\d]/g, "").length;
  const stripped = raw.replace(/[^\d]/g, "");
  if (stripped === "") return "";
  const n = Number(stripped);
  if (!Number.isFinite(n)) return "";
  const formatted = n.toLocaleString("en-US");
  let caret = 0;
  let digitsSeen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (digitsSeen >= digitsBefore) break;
    if (/\d/.test(formatted[i]!)) digitsSeen++;
    caret = i + 1;
  }
  requestAnimationFrame(() => {
    input.setSelectionRange(caret, caret);
  });
  return formatted;
}
