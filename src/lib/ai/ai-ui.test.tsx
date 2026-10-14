import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { AiExplanation } from "@/components/common/AiExplanation";

describe("AiExplanation component", () => {
  it("renders nothing when status is idle", () => {
    const { container } = render(
      <AiExplanation status="idle" text={null} error={null} onRetry={() => {}} onDismiss={() => {}} sectionId="test" sectionTitle="Test" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows loading spinner and message when loading", () => {
    render(
      <AiExplanation status="loading" text={null} error={null} onRetry={() => {}} onDismiss={() => {}} sectionId="test" sectionTitle="Test" />,
    );
    expect(screen.getByText("Generating explanation…")).toBeInTheDocument();
  });

  it("renders AI text when successful", () => {
    render(
      <AiExplanation status="success" text="Your balance stays positive." error={null} onRetry={() => {}} onDismiss={() => {}} sectionId="test" sectionTitle="AI Result" />,
    );
    expect(screen.getByText("Your balance stays positive.")).toBeInTheDocument();
    expect(screen.getByText("AI Result")).toBeInTheDocument();
  });

  it("shows error message and retry button on error", () => {
    const onRetry = vi.fn();
    render(
      <AiExplanation status="error" text={null} error="The AI service returned an error." onRetry={onRetry} onDismiss={() => {}} sectionId="test" sectionTitle="AI Result" />,
    );
    expect(screen.getByText("The AI service returned an error.")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <AiExplanation status="success" text="Some text" error={null} onRetry={() => {}} onDismiss={onDismiss} sectionId="test" sectionTitle="AI" />,
    );
    const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("has an accessible live region", () => {
    render(
      <AiExplanation status="loading" text={null} error={null} onRetry={() => {}} onDismiss={() => {}} sectionId="ai-test" sectionTitle="AI" />,
    );
    const section = document.getElementById("ai-test");
    expect(section).toBeInTheDocument();
    expect(section?.getAttribute("aria-live")).toBe("polite");
  });
});

describe("useAiExplain hook", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("starts in idle state", async () => {
    vi.doMock("@/lib/ai/groq", () => ({
      explainWithGroq: vi.fn(),
    }));
    const { useAiExplain } = await import("@/hooks/useAiExplain");
    const { renderHook } = await import("@testing-library/react");
    const { result } = renderHook(() => useAiExplain());
    expect(result.current.status).toBe("idle");
    expect(result.current.text).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("transitions to success on successful call", async () => {
    const mockFn = vi.fn().mockResolvedValue({ text: "Explanation here", implemented: true, model: "test" });
    vi.doMock("@/lib/ai/groq", () => ({
      explainWithGroq: mockFn,
    }));
    const { useAiExplain } = await import("@/hooks/useAiExplain");
    const { renderHook, waitFor } = await import("@testing-library/react");
    const { result } = renderHook(() => useAiExplain());

    await result.current.call("explain_results", "some context");

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(result.current.text).toBe("Explanation here");
    expect(result.current.error).toBeNull();
    expect(mockFn).toHaveBeenCalledWith({ data: { feature: "explain_results", context: "some context" } });
  });

  it("transitions to error on failed call", async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error("Service unavailable"));
    vi.doMock("@/lib/ai/groq", () => ({
      explainWithGroq: mockFn,
    }));
    const { useAiExplain } = await import("@/hooks/useAiExplain");
    const { renderHook, waitFor } = await import("@testing-library/react");
    const { result } = renderHook(() => useAiExplain());

    await result.current.call("generate_action_plan", "context");

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.text).toBeNull();
    expect(result.current.error).toBe("Service unavailable");
  });

  it("resets to idle on reset()", async () => {
    vi.doMock("@/lib/ai/groq", () => ({
      explainWithGroq: vi.fn().mockResolvedValue({ text: "ok", implemented: true, model: "test" }),
    }));
    const { useAiExplain } = await import("@/hooks/useAiExplain");
    const { renderHook, waitFor } = await import("@testing-library/react");
    const { result } = renderHook(() => useAiExplain());

    await result.current.call("explain_results", "ctx");
    await waitFor(() => expect(result.current.status).toBe("success"));
    act(() => {
      result.current.reset();
    });
    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(result.current.text).toBeNull();
  });

  it("uses generic error message for non-Error exceptions", async () => {
    vi.doMock("@/lib/ai/groq", () => ({
      explainWithGroq: vi.fn().mockRejectedValue("string error"),
    }));
    const { useAiExplain } = await import("@/hooks/useAiExplain");
    const { renderHook, waitFor } = await import("@testing-library/react");
    const { result } = renderHook(() => useAiExplain());

    await result.current.call("explain_results", "ctx");

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.error).toBe("Something went wrong. Please try again.");
  });

  it("shows friendly message when error contains HTML", async () => {
    vi.doMock("@/lib/ai/groq", () => ({
      explainWithGroq: vi.fn().mockRejectedValue(new Error("<!doctype html><html>Something went wrong on our end</html>")),
    }));
    const { useAiExplain } = await import("@/hooks/useAiExplain");
    const { renderHook, waitFor } = await import("@testing-library/react");
    const { result } = renderHook(() => useAiExplain());

    await result.current.call("explain_results", "ctx");

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.error).toBe("The server encountered an error while processing your request. Please try again.");
    expect(result.current.error).not.toContain("<!doctype");
  });

  it("handles empty AI response as error", async () => {
    vi.doMock("@/lib/ai/groq", () => ({
      explainWithGroq: vi.fn().mockResolvedValue({ text: "  ", implemented: true, model: "test" }),
    }));
    const { useAiExplain } = await import("@/hooks/useAiExplain");
    const { renderHook, waitFor } = await import("@testing-library/react");
    const { result } = renderHook(() => useAiExplain());

    await result.current.call("explain_results", "ctx");

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.error).toBe("The AI service returned an empty response. Please try again.");
  });
});

describe("AI context builders", () => {
  const profile = {
    openingBalance: 50_000_000,
    monthlyIncome: 30_000_000,
    lowSeasonIncome: 14_000_000,
    essentialExpenses: 12_000_000,
    flexibleExpenses: 3_000_000,
    debtPayments: 2_000_000,
    safetyBuffer: 14_000_000,
  };
  const scenario = {
    name: "Income reduction",
    kind: "income-reduction" as const,
    horizon: 6 as const,
    incomeReductionPct: 50,
    unexpectedExpenses: [],
    interruption: null,
  };

  it("buildExplainResultsContext includes scenario, balances, risk, and monthly data", async () => {
    const { simulate } = await import("@/lib/financialCalculations");
    const { describeScenario } = await import("@/lib/scenarioUpdates");
    const { buildExplainResultsContext } = await import("@/lib/ai/contextBuilder");

    const result = simulate(profile, scenario);
    const summary = describeScenario(scenario);
    const ctx = buildExplainResultsContext(profile, scenario, result, summary);

    expect(ctx).toContain("Income reduction");
    expect(ctx).toContain("6 months");
    expect(ctx).toContain("Ending balance:");
    expect(ctx).toContain("Lowest month-end balance:");
    expect(ctx).toContain("Safety buffer:");
    expect(ctx).toContain("Risk classification:");
    expect(ctx).toContain("Monthly projections");
  });

  it("buildActionPlanContext includes recommendation categories and experiment outcomes", async () => {
    const { simulate } = await import("@/lib/financialCalculations");
    const { describeScenario } = await import("@/lib/scenarioUpdates");
    const { selectRecommendations } = await import("@/lib/recommendations");
    const { runExperiment } = await import("@/lib/actionExperiments");
    const { buildActionPlanContext } = await import("@/lib/ai/contextBuilder");

    const result = simulate(profile, scenario);
    const summary = describeScenario(scenario);
    const recs = selectRecommendations({ profile, scenario, result });
    const experiment = runExperiment(profile, scenario, [{ kind: "cutFlexible", amount: 1_000_000 }]);

    const ctx = buildActionPlanContext(profile, scenario, result, summary, recs, experiment);

    expect(ctx).toContain("Recommendation categories");
    expect(ctx).toContain(recs[0]!.title);
    expect(ctx).toContain("Experiment outcomes");
  });

  it("buildActionPlanContext handles null experiment", async () => {
    const { simulate } = await import("@/lib/financialCalculations");
    const { describeScenario } = await import("@/lib/scenarioUpdates");
    const { selectRecommendations } = await import("@/lib/recommendations");
    const { buildActionPlanContext } = await import("@/lib/ai/contextBuilder");

    const result = simulate(profile, scenario);
    const summary = describeScenario(scenario);
    const recs = selectRecommendations({ profile, scenario, result });

    const ctx = buildActionPlanContext(profile, scenario, result, summary, recs, null);

    expect(ctx).toContain("Recommendation categories");
    expect(ctx).not.toContain("Experiment outcomes");
  });

  it("context stays under 8000 character limit", async () => {
    const { simulate } = await import("@/lib/financialCalculations");
    const { describeScenario } = await import("@/lib/scenarioUpdates");
    const { buildExplainResultsContext } = await import("@/lib/ai/contextBuilder");

    const longScenario = { ...scenario, horizon: 12 as const };
    const result = simulate(profile, longScenario);
    const summary = describeScenario(longScenario);
    const ctx = buildExplainResultsContext(profile, longScenario, result, summary);

    expect(ctx.length).toBeLessThan(8000);
  });

  it("buildSelectedSolutionContext includes only the selected recommendation", async () => {
    const { simulate } = await import("@/lib/financialCalculations");
    const { describeScenario } = await import("@/lib/scenarioUpdates");
    const { selectRecommendations } = await import("@/lib/recommendations");
    const { runExperiment } = await import("@/lib/actionExperiments");
    const { buildSelectedSolutionContext } = await import("@/lib/ai/contextBuilder");

    const result = simulate(profile, scenario);
    const summary = describeScenario(scenario);
    const recs = selectRecommendations({ profile, scenario, result });
    const experiment = runExperiment(profile, scenario, [{ kind: "cutFlexible", amount: 1_000_000 }]);

    const selectedRec = recs[0]!;
    const ctx = buildSelectedSolutionContext(profile, scenario, result, summary, selectedRec, experiment);

    expect(ctx).toContain("Selected solution to personalize:");
    expect(ctx).toContain(selectedRec.title);
    expect(ctx).toContain("Experiment outcomes for this solution");
    expect(ctx).not.toContain("Recommendation categories");
  });

  it("buildSelectedSolutionContext handles null experiment", async () => {
    const { simulate } = await import("@/lib/financialCalculations");
    const { describeScenario } = await import("@/lib/scenarioUpdates");
    const { selectRecommendations } = await import("@/lib/recommendations");
    const { buildSelectedSolutionContext } = await import("@/lib/ai/contextBuilder");

    const result = simulate(profile, scenario);
    const summary = describeScenario(scenario);
    const recs = selectRecommendations({ profile, scenario, result });

    const ctx = buildSelectedSolutionContext(profile, scenario, result, summary, recs[0]!, null);

    expect(ctx).toContain("Selected solution to personalize:");
    expect(ctx).not.toContain("Experiment outcomes");
  });

  it("buildSelectedSolutionContext does not include other recommendations", async () => {
    const { simulate } = await import("@/lib/financialCalculations");
    const { describeScenario } = await import("@/lib/scenarioUpdates");
    const { selectRecommendations } = await import("@/lib/recommendations");
    const { buildSelectedSolutionContext } = await import("@/lib/ai/contextBuilder");

    const result = simulate(profile, scenario);
    const summary = describeScenario(scenario);
    const recs = selectRecommendations({ profile, scenario, result });

    if (recs.length < 2) return; // skip if only one rec

    const selectedRec = recs[0]!;
    const otherRec = recs[1]!;
    const ctx = buildSelectedSolutionContext(profile, scenario, result, summary, selectedRec, null);

    expect(ctx).toContain(selectedRec.title);
    expect(ctx).not.toContain(otherRec.title);
  });
});
