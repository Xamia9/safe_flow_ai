import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AiExplanation } from "@/components/common/AiExplanation";
import { normalizeAiMarkdown } from "@/components/common/AiMarkdown";
import { EXPLAIN_RESULTS_PROMPT, GENERATE_ACTION_PLAN_PROMPT } from "@/lib/ai/groq";
import { LanguageProvider } from "@/i18n/LanguageContext";

const show = (text: string | null) =>
  render(<LanguageProvider><AiExplanation status="success" text={text} error={null} onRetry={() => {}} onDismiss={() => {}} sectionId="t" sectionTitle="AI" /></LanguageProvider>);

describe("system prompts", () => {
  it("explain prompt is concise and structured", () => {
    for (const s of ["120 words", "**Key Findings**", "**What This Means**", "**Important Note**", "Markdown only"]) expect(EXPLAIN_RESULTS_PROMPT).toContain(s);
  });
  it("action plan prompt focuses on one solution", () => {
    for (const s of ["200 words", "ONE solution", "**Simulation Takeaway**", "**Your Action Steps**", "**What to Watch**", "**Important Note**", "Never invent"]) expect(GENERATE_ACTION_PLAN_PROMPT).toContain(s);
  });
});

describe("AI markdown rendering", () => {
  it("renders bold, headings and lists without raw syntax", () => {
    const { container } = show("## Plan\n**Key Findings**\n- one\n- two\n\n1. step");
    expect(screen.getByRole("heading", { name: "Plan" })).toBeInTheDocument();
    expect(container.querySelector("strong")?.textContent).toBe("Key Findings");
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
    expect(container.querySelectorAll("ol li")).toHaveLength(1);
    expect(container.textContent).not.toContain("**");
    expect(container.textContent).not.toContain("##");
  });
  it("renders GFM tables", () => {
    const { container } = show("| Metric | Current | After |\n|---|---|---|\n| Balance | 1 | 2 |");
    expect(container.querySelector("table")).not.toBeNull();
    expect(container.querySelectorAll("th")).toHaveLength(3);
    expect(container.textContent).not.toContain("|");
  });
  it("does not render HTML and strips <br> and outer fences", () => {
    const { container } = show("<script>x</script><b>hi</b>");
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(normalizeAiMarkdown("```markdown\n**a**<br>b\n```")).toBe("**a**\nb");
  });
  it("handles empty and malformed responses", () => {
    show("   ");
    expect(screen.getByText(/empty response/i)).toBeInTheDocument();
    const { container } = show("**unclosed | bad |\n- ");
    expect(container.textContent).toContain("unclosed");
  });
});
