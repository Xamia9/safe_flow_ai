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
      return <AmountField id="stored" label="Income" value={draft["monthlyIncome"] ?? ""}
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

  const type = (input: HTMLInputElement, value: string, caret = value.length) => {
    input.focus();
    fireEvent.change(input, { target: { value, selectionStart: caret, selectionEnd: caret } });
  };

  it("crosses the 9,999,999 boundary and keeps long numbers intact", () => {
    render(<Field />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    let v = "";
    for (const d of "9999999") { v = input.value + d; type(input, v); }
    expect(input.value).toBe("9,999,999");
    type(input, "9,999,9990");
    expect(input.value).toBe("99,999,990");
    type(input, "");
    type(input, "10000000");
    expect(input.value).toBe("10,000,000");
    expect(Number(screen.getByRole("status").textContent)).toBe(10000000);
    type(input, "100000000"); expect(input.value).toBe("100,000,000");
    type(input, "1000000000"); expect(input.value).toBe("1,000,000,000");
    expect(screen.getByRole("status")).toHaveTextContent(/^1000000000$/);
  });

  it("deletes from start, middle, end and clears without digits reappearing", () => {
    render(<Field initial="10000000" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    type(input, "0,000,000", 0); expect(input.value).toBe("0,000,000"); expect(input.selectionStart).toBe(0);
    type(input, "0,00,000", 4); expect(input.value).toBe("000,000"); expect(input.selectionStart).toBe(2);
    type(input, "000,00"); expect(input.value).toBe("00,000");
    type(input, ""); expect(input.value).toBe(""); expect(screen.getByRole("status")).toHaveTextContent(/^$/);
    type(input, "5"); expect(input.value).toBe("5");
  });

  it("replaces a selection with a pasted long number", () => {
    render(<Field initial="123456" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    type(input, "1,234,567,890");
    expect(input.value).toBe("1,234,567,890");
    expect(input.selectionStart).toBe(13);
    expect(screen.getByRole("status")).toHaveTextContent(/^1234567890$/);
  });

  it("adopts external resets", () => {
    function Resettable() {
      const [value, setValue] = useState("1234");
      return <><AmountField id="a" label="A" value={value} onChange={setValue} /><button onClick={() => setValue("")}>reset</button></>;
    }
    render(<Resettable />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("1,234");
    fireEvent.click(screen.getByRole("button"));
    expect(input.value).toBe("");
  });
});
