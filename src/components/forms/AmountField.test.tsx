import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AmountField } from "./AmountField";
import { parseAmount, parseProfileDraft } from "@/lib/validation";
import { resetSimulation, setDraftValue, useSimulation } from "@/services/simulationStore";

afterEach(() => { cleanup(); resetSimulation(); });

function Field({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <><AmountField id="amount" label="Amount" value={value} onChange={setValue} /><output>{value}</output></>;
}

describe("monthly amount input", () => {
  it("does not insert thousands separators while typing", () => {
    render(<Field />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    for (const d of "10000000") {
      fireEvent.change(input, { target: { value: input.value + d } });
    }
    expect(input.value).toBe("10000000");
  });

  it("preserves digits without reformatting", () => {
    render(<Field initial="123456789" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("123456789");
  });

  it("retains user-entered commas in the display", () => {
    render(<Field />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "10,000,000" } });
    expect(input.value).toBe("10,000,000");
    expect(screen.getByRole("status")).toHaveTextContent(/^10,000,000$/);
  });

  it("normalizes comma-formatted values to the correct numeric value", () => {
    expect(parseAmount("10,000,000")).toBe(10000000);
    expect(parseAmount("1,000,000")).toBe(1000000);
    expect(parseAmount("10000000")).toBe(10000000);
  });

  it("rejects malformed comma grouping", () => {
    expect(Number.isNaN(parseAmount("10,00,000"))).toBe(true);
    expect(Number.isNaN(parseAmount("1,00,000"))).toBe(true);
  });

  it("allows empty and zero and preserves invalid values for validation", () => {
    render(<Field initial="1000000" />);
    const input = screen.getByRole("textbox");
    for (const value of ["", "0", "-1", "oops"]) {
      fireEvent.change(input, { target: { value } });
      expect(input).toHaveValue(value);
    }
  });

  it("stores values with commas and parses numeric profile values correctly", () => {
    function StoredField() {
      const { draft } = useSimulation();
      return <AmountField id="stored" label="Income" value={draft["monthlyIncome"] ?? ""}
        onChange={(value) => setDraftValue("monthlyIncome", value)} />;
    }
    render(<StoredField />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "123,456,789" } });
    const saved = JSON.parse(localStorage.getItem("safeflow:v1") ?? "{}");
    expect(saved.draft.monthlyIncome).toBe("123,456,789");
    const { profile, errors } = parseProfileDraft({ ...saved.draft, lowSeasonIncome: "0",
      essentialExpenses: "1000000", openingBalance: "0", debtPayments: "0", flexibleExpenses: "" });
    expect(errors).toEqual({});
    expect(profile?.monthlyIncome).toBe(123456789);
    expect(profile?.flexibleExpenses).toBe(0);
  });

  const type = (input: HTMLInputElement, value: string) => {
    input.focus();
    fireEvent.change(input, { target: { value } });
  };

  it("handles long numbers without separators", () => {
    render(<Field />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    type(input, "10000000");
    expect(input.value).toBe("10000000");
    expect(parseAmount(screen.getByRole("status").textContent ?? "")).toBe(10000000);
    type(input, "100000000");
    expect(input.value).toBe("100000000");
    type(input, "1000000000");
    expect(input.value).toBe("1000000000");
  });

  it("clears and re-enters values without digits reappearing", () => {
    render(<Field initial="10000000" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    type(input, "");
    expect(input.value).toBe("");
    expect(screen.getByRole("status")).toHaveTextContent(/^$/);
    type(input, "5");
    expect(input.value).toBe("5");
  });

  it("allows editing commas and digits without the displayed string changing", () => {
    render(<Field initial="1,000,000" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    // Delete a comma in the middle — display should reflect exactly what was typed
    type(input, "1000,000");
    expect(input.value).toBe("1000,000");
    // Add a digit at the end
    type(input, "1000,0000");
    expect(input.value).toBe("1000,0000");
  });

  it("replaces a value with a pasted comma-formatted long number", () => {
    render(<Field initial="123456" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    type(input, "1,234,567,890");
    expect(input.value).toBe("1,234,567,890");
    expect(parseAmount(screen.getByRole("status").textContent ?? "")).toBe(1234567890);
  });

  it("adopts external resets", () => {
    function Resettable() {
      const [value, setValue] = useState("1234");
      return <><AmountField id="a" label="A" value={value} onChange={setValue} /><button onClick={() => setValue("")}>reset</button></>;
    }
    render(<Resettable />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("1234");
    fireEvent.click(screen.getByRole("button"));
    expect(input.value).toBe("");
  });
});
