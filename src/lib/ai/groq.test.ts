import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  aiRequestSchema,
  validateAiRequest,
  callGroq,
  AiServiceError,
  type AiRequest,
} from "./groq";

const validInput: AiRequest = {
  feature: "explain_results",
  context: "Ending balance: 50,000,000 VND. Risk: Medium.",
};

const VALID_KEY = "test-key-abc123";

function groqResponse(content: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  } as Response;
}

function mockFetch(impl: (...args: never[]) => Promise<Response>) {
  return vi.fn(impl) as unknown as typeof fetch;
}

describe("AI request validation", () => {
  it("accepts valid input with explain_results feature", () => {
    const result = validateAiRequest(validInput);
    expect(result.feature).toBe("explain_results");
    expect(result.context).toBe(validInput.context);
  });

  it("accepts valid input with generate_action_plan feature", () => {
    const result = validateAiRequest({
      ...validInput,
      feature: "generate_action_plan",
    });
    expect(result.feature).toBe("generate_action_plan");
  });

  it("rejects empty context", () => {
    expect(() =>
      validateAiRequest({ ...validInput, context: "" }),
    ).toThrow();
  });

  it("rejects missing context field", () => {
    expect(() =>
      validateAiRequest({ feature: "explain_results" }),
    ).toThrow();
  });

  it("rejects non-string context", () => {
    expect(() =>
      validateAiRequest({ feature: "explain_results", context: 123 }),
    ).toThrow();
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
    expect(() =>
      validateAiRequest({ ...validInput, feature: "summarize" }),
    ).toThrow();
  });

  it("rejects a missing feature field", () => {
    expect(() => validateAiRequest({ context: "some context" })).toThrow();
  });

  it("rejects a model field supplied by the caller", () => {
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

describe("callGroq — successful responses", () => {
  it("returns implemented:true with content for explain_results", async () => {
    const fetchFn = mockFetch(async () =>
      groqResponse("Your ending balance remains positive throughout the period."),
    );
    const result = await callGroq(validInput, VALID_KEY, { fetchFn });
    expect(result.implemented).toBe(true);
    expect(result.text).toBe(
      "Your ending balance remains positive throughout the period.",
    );
    expect(result.model).toBe("openai/gpt-oss-120b");
  });

  it("returns implemented:true with content for generate_action_plan", async () => {
    const fetchFn = mockFetch(async () =>
      groqResponse("Step 1: Build an emergency reserve covering 3 months of expenses."),
    );
    const result = await callGroq(
      { ...validInput, feature: "generate_action_plan" },
      VALID_KEY,
      { fetchFn },
    );
    expect(result.implemented).toBe(true);
    expect(result.text).toContain("Step 1");
  });
});

describe("callGroq — error handling", () => {
  it("throws AiServiceError when API key is missing", async () => {
    const fetchFn = mockFetch(async () => groqResponse("should not reach"));
    await expect(
      callGroq(validInput, "", { fetchFn }),
    ).rejects.toThrow(AiServiceError);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("throws AiServiceError on timeout (AbortError)", async () => {
    const fetchFn = mockFetch(
      (_url: never, init: never) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = (init as RequestInit).signal;
          if (signal) {
            signal.addEventListener("abort", () => {
              const err = new DOMException(
                "Aborted",
                "AbortError",
              );
              reject(err);
            });
          }
        }),
    );
    await expect(
      callGroq(validInput, VALID_KEY, { fetchFn, timeoutMs: 10 }),
    ).rejects.toSatisfy((err: unknown) => {
      return err instanceof AiServiceError && err.message.includes("timed out");
    });
  });

  it("throws AiServiceError on non-success HTTP response", async () => {
    const fetchFn = mockFetch(async () =>
      ({
        ok: false,
        status: 500,
        json: async () => ({ error: "server error" }),
      }) as unknown as Response,
    );
    await expect(
      callGroq(validInput, VALID_KEY, { fetchFn }),
    ).rejects.toSatisfy((err: unknown) => {
      return (
        err instanceof AiServiceError && err.message.includes("returned an error")
      );
    });
  });

  it("throws AiServiceError on invalid JSON response", async () => {
    const fetchFn = mockFetch(async () =>
      ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
      }) as unknown as Response,
    );
    await expect(
      callGroq(validInput, VALID_KEY, { fetchFn }),
    ).rejects.toSatisfy((err: unknown) => {
      return (
        err instanceof AiServiceError && err.message.includes("invalid response")
      );
    });
  });

  it("throws AiServiceError on malformed provider response (no choices)", async () => {
    const fetchFn = mockFetch(async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({ id: "abc", object: "chat.completion" }),
      }) as unknown as Response,
    );
    await expect(
      callGroq(validInput, VALID_KEY, { fetchFn }),
    ).rejects.toSatisfy((err: unknown) => {
      return (
        err instanceof AiServiceError && err.message.includes("empty response")
      );
    });
  });

  it("throws AiServiceError on empty model output", async () => {
    const fetchFn = mockFetch(async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: "   " } }],
        }),
      }) as unknown as Response,
    );
    await expect(
      callGroq(validInput, VALID_KEY, { fetchFn }),
    ).rejects.toSatisfy((err: unknown) => {
      return (
        err instanceof AiServiceError && err.message.includes("empty response")
      );
    });
  });

  it("throws AiServiceError on choices array with non-object message", async () => {
    const fetchFn = mockFetch(async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: null }],
        }),
      }) as unknown as Response,
    );
    await expect(
      callGroq(validInput, VALID_KEY, { fetchFn }),
    ).rejects.toThrow(AiServiceError);
  });
});

describe("callGroq — request integrity", () => {
  it("sends request to the correct Groq endpoint", async () => {
    const fetchFn = mockFetch(async () => groqResponse("ok"));
    await callGroq(validInput, VALID_KEY, { fetchFn });
    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.any(Object),
    );
  });

  it("sends the fixed model identifier, not a caller-supplied one", async () => {
    const fetchFn = mockFetch(async () => groqResponse("ok"));
    await callGroq(validInput, VALID_KEY, { fetchFn });
    const calls = (fetchFn as unknown as { mock: { calls: unknown[][] } }).mock
      .calls;
    const callArgs = calls[0];
    if (!callArgs) throw new Error("fetch was not called");
    const body = JSON.parse((callArgs[1] as RequestInit).body as string) as {
      model: string;
    };
    expect(body.model).toBe("openai/gpt-oss-120b");
  });

  it("sends the API key in the Authorization header", async () => {
    const fetchFn = mockFetch(async () => groqResponse("ok"));
    await callGroq(validInput, VALID_KEY, { fetchFn });
    const calls = (fetchFn as unknown as { mock: { calls: unknown[][] } }).mock
      .calls;
    const callArgs = calls[0];
    if (!callArgs) throw new Error("fetch was not called");
    const headers = (callArgs[1] as RequestInit).headers as Record<
      string,
      string
    >;
    expect(headers["Authorization"]).toBe(`Bearer ${VALID_KEY}`);
  });

  it("uses the feature-specific system prompt, not the user context", async () => {
    const fetchFn = mockFetch(async () => groqResponse("ok"));
    await callGroq(
      { ...validInput, feature: "generate_action_plan" },
      VALID_KEY,
      { fetchFn },
    );
    const calls = (fetchFn as unknown as { mock: { calls: unknown[][] } }).mock
      .calls;
    const callArgs = calls[0];
    if (!callArgs) throw new Error("fetch was not called");
    const body = JSON.parse((callArgs[1] as RequestInit).body as string) as {
      messages: { role: string; content: string }[];
    };
    const systemMsg = body.messages.find((m) => m.role === "system");
    const userMsg = body.messages.find((m) => m.role === "user");
    expect(systemMsg?.content).toContain("action plan generator");
    expect(userMsg?.content).toBe(validInput.context);
  });
});

describe("callGroq — credential safety", () => {
  it("does not include the API key in the returned response", async () => {
    const fetchFn = mockFetch(async () => groqResponse("some explanation"));
    const result = await callGroq(validInput, VALID_KEY, { fetchFn });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(VALID_KEY);
  });

  it("does not include the API key in error messages", async () => {
    const fetchFn = mockFetch(async () =>
      ({
        ok: false,
        status: 401,
        json: async () => ({ error: "invalid api key: " + VALID_KEY }),
      }) as unknown as Response,
    );
    try {
      await callGroq(validInput, VALID_KEY, { fetchFn });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AiServiceError);
      expect((err as Error).message).not.toContain(VALID_KEY);
    }
  });
});

describe("callGroq — caller cannot override model or feature", () => {
  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("ignores a model field sneaked into the request via the schema", () => {
    const sneaky = {
      ...validInput,
      model: "gpt-4o",
    } as unknown;
    const parsed = validateAiRequest(sneaky);
    expect(parsed).not.toHaveProperty("model");
  });

  it("rejects an invalid feature at the validation layer", () => {
    const badInput = {
      feature: "delete_everything",
      context: "hello",
    } as unknown;
    expect(() => validateAiRequest(badInput)).toThrow();
  });
});
