import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n/LanguageContext";

export function AmountField({ id, label, hint, value, onChange, error, optional }: {
  id: string; label: string; hint?: string | undefined; value: string;
  onChange: (v: string) => void; error?: string | undefined; optional?: boolean;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastValue = useRef(value);
  const [display, setDisplay] = useState(value);

  if (value !== lastValue.current) {
    lastValue.current = value;
    setDisplay(value);
  }

  const updateValue = (next: string) => {
    setDisplay(next);
    if (next !== lastValue.current) {
      lastValue.current = next;
      onChange(next);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} {optional && <span className="font-normal text-muted-foreground">{t("form.optional")}</span>}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          inputMode="numeric"
          value={display}
          onChange={(e) => updateValue(e.currentTarget.value)}
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
