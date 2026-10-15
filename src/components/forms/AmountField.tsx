import { useLayoutEffect, useRef } from "react";
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
  const pendingSelection = useRef<[number, number] | null>(null);

  useLayoutEffect(() => {
    if (pendingSelection.current && inputRef.current === document.activeElement) {
      inputRef.current?.setSelectionRange(...pendingSelection.current);
    }
    pendingSelection.current = null;
  });

  const updateValue = (input: HTMLInputElement, next: string, start: number, end = start) => {
    const raw = next.replace(/,/g, "");
    const display = formatAmountInput(raw);
    const selection: [number, number] = [
      displayPosition(display, next.slice(0, start).replace(/,/g, "").length),
      displayPosition(display, next.slice(0, end).replace(/,/g, "").length),
    ];
    pendingSelection.current = selection;
    // Also restore immediately when removing only a separator leaves the stored value unchanged.
    input.value = display;
    input.setSelectionRange(...selection);
    onChange(raw);
  };

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
          value={formatAmountInput(value)}
          onChange={(e) => updateValue(e.currentTarget, e.currentTarget.value,
            e.currentTarget.selectionStart ?? e.currentTarget.value.length,
            e.currentTarget.selectionEnd ?? e.currentTarget.value.length)}
          onKeyDown={(e) => {
            const input = e.currentTarget;
            const start = input.selectionStart;
            if (start === null || start !== input.selectionEnd || e.altKey || e.ctrlKey || e.metaKey) return;
            // A grouping comma is not a digit: delete the adjacent digit rather than getting stuck on it.
            if (e.key === "Backspace" && input.value[start - 1] === ",") {
              e.preventDefault();
              updateValue(input, input.value.slice(0, start - 2) + input.value.slice(start), start - 2);
            } else if (e.key === "Delete" && input.value[start] === ",") {
              e.preventDefault();
              updateValue(input, input.value.slice(0, start) + input.value.slice(start + 2), start);
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
