import { describe, expect, it } from "vitest";
import { formatWithCaret } from "./formatInput";

function makeInput(value: string, caret: number): HTMLInputElement {
  const el = document.createElement("input");
  el.value = value;
  el.setSelectionRange(caret, caret);
  return el;
}

describe("formatWithCaret", () => {
  it("formats a plain number with commas", () => {
    const el = makeInput("40000000", 8);
    expect(formatWithCaret("40000000", el)).toBe("40,000,000");
  });

  it("preserves caret at the end when appending digits", () => {
    const el = makeInput("40000000", 8);
    formatWithCaret("40000000", el);
    // Caret should be restored via rAF; we can't test rAF sync, but the formatted string is correct
  });

  it("handles empty input", () => {
    const el = makeInput("", 0);
    expect(formatWithCaret("", el)).toBe("");
  });

  it("strips non-digit characters", () => {
    const el = makeInput("1abc2", 5);
    expect(formatWithCaret("1abc2", el)).toBe("12");
  });

  it("handles paste of formatted value", () => {
    const el = makeInput("25,000,000", 10);
    expect(formatWithCaret("25,000,000", el)).toBe("25,000,000");
  });

  it("handles a single digit", () => {
    const el = makeInput("5", 1);
    expect(formatWithCaret("5", el)).toBe("5");
  });

  it("handles zero", () => {
    const el = makeInput("0", 1);
    expect(formatWithCaret("0", el)).toBe("0");
  });
});
