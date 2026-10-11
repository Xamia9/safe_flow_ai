import { type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseAmount } from "@/lib/validation";
import { formatWithCaret } from "@/lib/formatInput";

export function AmountField({ id, label, hint, value, onChange, error, optional }: {
  id: string; label: string; hint?: string | undefined; value: string;
  onChange: (v: string) => void; error?: string | undefined; optional?: boolean;
}) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(formatWithCaret(e.target.value, e.target));
  };
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onBlur={(e) => {
            const n = parseAmount(e.target.value);
            if (n !== null && !Number.isNaN(n)) {
              onChange(n.toLocaleString("en-US"));
            }
          }}
          aria-invalid={!!error}
          aria-describedby={hint || error ? `${id}-desc` : undefined}
          className="pr-12 tabular"
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
