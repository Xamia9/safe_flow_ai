import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { parseAmount } from "@/lib/validation";

/**
 * Text input for monetary amounts that keeps the displayed string (which may
 * contain user-entered thousands separators) separate from the numeric value
 * passed to the parent. No commas are inserted or removed while typing — the
 * display always reflects exactly what the user typed. The parent receives a
 * normalized number via parseAmount.
 */
export function NumericInput({ id, value, onChange, className, ariaInvalid }: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  className?: string;
  ariaInvalid?: boolean;
}) {
  const [display, setDisplay] = useState(() => (value > 0 && Number.isFinite(value) ? String(Math.round(value)) : ""));
  const lastExternal = useRef(value);
  const lastEmitted = useRef(display);

  if (value !== lastExternal.current) {
    lastExternal.current = value;
    const expected = value > 0 && Number.isFinite(value) ? String(Math.round(value)) : "";
    const displayParsed = parseAmount(display);
    const displayNum = displayParsed === null || Number.isNaN(displayParsed) ? 0 : displayParsed;
    if (displayNum !== value && display !== expected) {
      setDisplay(expected);
      lastEmitted.current = expected;
    }
  }

  const handleChange = (raw: string) => {
    setDisplay(raw);
    lastEmitted.current = raw;
    const n = parseAmount(raw);
    onChange(n === null ? 0 : n);
  };

  return (
    <Input
      id={id}
      inputMode="numeric"
      className={className}
      value={display}
      onChange={(e) => handleChange(e.currentTarget.value)}
      aria-invalid={ariaInvalid}
    />
  );
}
