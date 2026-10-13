import { describe, expect, it } from "vitest";
import { aiRequestSchema, validateAiRequest, type AiRequest } from "./groq";

const validInput: AiRequest = {
  feature: "explain_results",
  context: "Ending balance: 50,000,000 VND. Risk: Medium.",
};

describe("AI request validation", () => {
  it("accepts valid input with explain_results feature", () => {
    const result = validateAiRequest(validInput);
    expect(result.feature).toBe("explain_results");
    expect(result.context).toBe(validInput.context);
  });

  it("accepts valid input with generate_action_plan feature", () => {
    const result = validateAiRequest({ ...validInput, feature: "generate_action_plan" });
    expect(result.feature).toBe("generate_action_plan");
  });

  it("rejects empty context", () => {
    expect(() => validateAiRequest({ ...validInput, context: "" })).toThrow();
  });

  it("rejects missing context field", () => {
    expect(() => validateAiRequest({ feature: "explain_results" })).toThrow();
  });

  it("rejects non-string context", () => {
    expect(() => validateAiRequest({ feature: "explain_results", context: 123 })).toThrow();
  });

  it("rejects oversized context", () => {
    const long = "x".repeat(8001);
    expect(() => validateAiRequest({ ...validInput, context: long })).toThrow();
  });

  it("accepts context at exactly the max length", () => {
    const max = "x".repeat(8000);
    const result = validateAiRequest({ ...validInput, context: max });
    expect(result.context).toHaveLength(8000);
  });

  it("rejects an invalid feature value", () => {
    expect(() => validateAiRequest({ ...validInput, feature: "summarize" })).toThrow();
  });

  it("rejects a missing feature field", () => {
    expect(() => validateAiRequest({ context: "some context" })).toThrow();
  });

  it("rejects a model field supplied by the caller", () => {
    // The schema has no `model` property; Zod's default behavior is to
    // strip unknown keys, so we assert the parsed result never carries one.
    const input = { ...validInput, model: "gpt-4o" } as unknown;
    const result = validateAiRequest(input);
    expect(result).not.toHaveProperty("model");
  });

  it("rejects non-object input", () => {
    expect(() => validateAiRequest("not an object")).toThrow();
    expect(() => validateAiRequest(null)).toThrow();
    expect(() => validateAiRequest(undefined)).toThrow();
    expect(() => validateAiRequest(42)).toThrow();
  });

  it("schema does not declare a model field", () => {
    const shape = aiRequestSchema.shape;
    expect(shape).not.toHaveProperty("model");
  });
});
