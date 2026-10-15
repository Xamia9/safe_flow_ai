import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AmountField, formatAmountInput } from "./AmountField";
import { parseProfileDraft } from "@/lib/validation";
import { resetSimulation, setDraftValue, useSimulation } from "@/services/simulationStore";

afterEach(() => { cleanup(); resetSimulation(); });

function Field({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <><AmountField id="amount" label="Amount" value={value} onChange={setValue} /><output>{value}</output></>;
}

describe("monthly amount input", () => {
  it.each([
    ["1000000", "1,000,000"], ["123456789", "123,456,789"], ["0", "0"], ["", ""],
    ["1000.25", "1,000.25"], ["-1000", "-1,000"], ["invalid", "invalid"],
    ["1,000,000", "1,000,000"], ["0000", "0,000"],
  ])("formats %s without numeric coercion", (raw, formatted) => {
    expect(formatAmountInput(raw)).toBe(formatted);
  });

  it("keeps a middle edit and its cursor position, emitting no commas", () => {
    render(<Field initial="123456789" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: "123,9456,789", selectionStart: 5, selectionEnd: 5 } });
    expect(input.value).toBe("1,239,456,789");
    expect(input.selectionStart).toBe(5);
    expect(screen.getByRole("status")).toHaveTextContent("1239456789");
  });

  it("deletes digits across separators in both directions", () => {
    render(<Field initial="1234567" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    input.focus();
    input.setSelectionRange(2, 2);
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(input.value).toBe("234,567");
    expect(input.selectionStart).toBe(0);
    input.setSelectionRange(3, 3);
    fireEvent.keyDown(input, { key: "Delete" });
    expect(input.value).toBe("23,467");
    expect(input.selectionStart).toBe(4);
  });

  it("allows empty and zero and preserves invalid values for validation", () => {
    render(<Field initial="1000000" />);
    const input = screen.getByRole("textbox");
    for (const value of ["", "0", "-1", "oops"]) {
      fireEvent.change(input, { target: { value } });
      expect(input).toHaveValue(value);
    }
  });

  it("stores pasted amounts without commas and parses numeric profile values", () => {
    function StoredField() {
      const { draft } = useSimulation();
      return <AmountField id="stored" label="Income" value={draft.monthlyIncome ?? ""}
        onChange={(value) => setDraftValue("monthlyIncome", value)} />;
    }
    render(<StoredField />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "123,456,789" } });
    const saved = JSON.parse(localStorage.getItem("safeflow:v1") ?? "{}");
    expect(saved.draft.monthlyIncome).toBe("123456789");
    const { profile, errors } = parseProfileDraft({ ...saved.draft, lowSeasonIncome: "0",
      essentialExpenses: "1000000", openingBalance: "0", debtPayments: "0", flexibleExpenses: "" });
    expect(errors).toEqual({});
    expect(profile?.monthlyIncome).toBe(123456789);
    expect(profile?.flexibleExpenses).toBe(0);
  });
});