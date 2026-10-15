import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NumericInput } from "./NumericInput";
import { parseAmount } from "@/lib/validation";

afterEach(() => { cleanup(); });

function Field({ initial = 0 }: { initial?: number }) {
  const [value, setValue] = useState(initial);
  return <><NumericInput id="amt" value={value} onChange={setValue} /><output>{value}</output></>;
}

describe("NumericInput", () => {
  it("does not insert thousands separators while typing", () => {
    render(<Field />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    for (const d of "10000000") {
      fireEvent.change(input, { target: { value: input.value + d } });
    }
    expect(input.value).toBe("10000000");
    expect(screen.getByRole("status")).toHaveTextContent(/^10000000$/);
  });

  it("preserves user-entered commas in the display", () => {
    render(<Field />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "10,000,000" } });
    expect(input.value).toBe("10,000,000");
    expect(screen.getByRole("status")).toHaveTextContent(/^10000000$/);
  });

  it("normalizes comma-formatted input to the correct numeric value", () => {
    render(<Field />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1,234,567" } });
    expect(input.value).toBe("1,234,567");
    expect(screen.getByRole("status")).toHaveTextContent(/^1234567$/);
    expect(parseAmount(input.value)).toBe(1234567);
  });

  it("allows editing digits in the middle without the display changing unexpectedly", () => {
    render(<Field initial={10000000} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("10000000");
    // Simulate editing: change to 10000000 -> insert digit in middle
    fireEvent.change(input, { target: { value: "10000500" } });
    expect(input.value).toBe("10000500");
    expect(screen.getByRole("status")).toHaveTextContent(/^10000500$/);
  });

  it("allows deleting digits and clearing the field", () => {
    render(<Field initial={10000000} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");
    expect(screen.getByRole("status")).toHaveTextContent(/^0$/);
    fireEvent.change(input, { target: { value: "5" } });
    expect(input.value).toBe("5");
    expect(screen.getByRole("status")).toHaveTextContent(/^5$/);
  });

  it("handles pasting comma-formatted values", () => {
    render(<Field initial={123456} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1,234,567,890" } });
    expect(input.value).toBe("1,234,567,890");
    expect(screen.getByRole("status")).toHaveTextContent(/^1234567890$/);
  });

  it("adopts external value changes", () => {
    function Resettable() {
      const [value, setValue] = useState(1234);
      return <><NumericInput id="a" value={value} onChange={setValue} />
        <button onClick={() => setValue(0)}>reset</button></>;
    }
    render(<Resettable />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("1234");
    fireEvent.click(screen.getByRole("button"));
    expect(input.value).toBe("");
  });
});
