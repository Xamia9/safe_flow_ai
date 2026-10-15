import { useLayoutEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Presentation only: preserve blanks, zero, precision, and invalid input for validation. */
export function formatAmountInput(value: string): string {
  const raw = value.replace(/,/g, "");
  return raw.replace(/^([+-]?)(\d+)(\.\d*)?$/, (_, sign: string, digits: string, fraction: string | undefined) =>
    sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (fraction ?? ""));
}

function displayPosition(display: string, rawPosition: number): number {
  let position = 0;
  let count = 0;
  while (position < display.length && count < rawPosition) {
    if (display[position] !== ",") count++;
    position++;
  }
  return position;
}

export function AmountField({ id, label, hint, value, onChange, error, optional }: {
  id: string; label: string; hint?: string | undefined; value: string;
  onChange: (v: string) => void; error?: string | undefined; optional?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // The field owns its displayed string; the parent only ever receives the comma-free raw string.
  const [display, setDisplay] = useState(() => formatAmountInput(value));
  const caret = useRef<[number, number] | null>(null);
  if (display.replace(/,/g, "") !== value.replace(/,/g, "")) {
    // External change (reset, preset, storage restore): adopt it without touching the caret.
    setDisplay(formatAmountInput(value));
  }

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (caret.current && input && input === document.activeElement) input.setSelectionRange(...caret.current);
    caret.current = null;
  });

  const updateValue = (next: string, start: number, end = start) => {
    const raw = next.replace(/,/g, "");
    const formatted = formatAmountInput(raw);
    const rawBefore = (pos: number) => next.slice(0, pos).replace(/,/g, "").length;
    caret.current = [displayPosition(formatted, rawBefore(start)), displayPosition(formatted, rawBefore(end))];
    setDisplay(formatted);
    if (raw !== value) onChange(raw);
    // Force a render so the caret is restored even when the formatted text did not change.
    if (formatted === display) forceRender((n) => n + 1);
  };
  const [, forceRender] = useState(0);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          inputMode="numeric"
          value={display}
          onChange={(e) => updateValue(e.currentTarget.value,
            e.currentTarget.selectionStart ?? e.currentTarget.value.length,
            e.currentTarget.selectionEnd ?? e.currentTarget.value.length)}
          onKeyDown={(e) => {
            const input = e.currentTarget;
            const start = input.selectionStart;
            if (start === null || start !== input.selectionEnd || e.altKey || e.ctrlKey || e.metaKey) return;
            // A grouping comma is not a digit: delete the adjacent digit rather than getting stuck on it.
            if (e.key === "Backspace" && input.value[start - 1] === ",") {
              e.preventDefault();
              updateValue(input.value.slice(0, start - 2) + input.value.slice(start), start - 2);
            } else if (e.key === "Delete" && input.value[start] === ",") {
              e.preventDefault();
              updateValue(input.value.slice(0, start) + input.value.slice(start + 2), start);
            }
          }}
          aria-invalid={!!error}
          aria-describedby={hint || error ? `${id}-desc` : undefined}
          className="bg-card text-card-foreground pr-12 tabular"
          placeholder="0"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">VND</span>
      </div>
      <p id={`${id}-desc`} className={error ? "text-xs text-negative" : "text-xs text-muted-foreground"}>
        {error ?? hint}
      </p>
    </div>
  );
}
