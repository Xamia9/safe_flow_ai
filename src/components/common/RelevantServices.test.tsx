import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RelevantServices } from "@/components/common/RelevantServices";
import { RELEVANT_SERVICES, TRANSPARENCY_NOTE } from "@/lib/relevantServices";

describe("RelevantServices component", () => {
  it("renders the disclosure button and is collapsed by default", () => {
    render(<RelevantServices solutionId="budget_optimization" />);
    expect(screen.getByRole("button", { name: /explore relevant services/i })).toBeInTheDocument();
    // Links should not be visible when collapsed
    expect(screen.queryByRole("link", { name: /money lover/i })).not.toBeInTheDocument();
  });

  it("expands to show provider links on click", () => {
    render(<RelevantServices solutionId="budget_optimization" />);
    const trigger = screen.getByRole("button", { name: /explore relevant services/i });
    fireEvent.click(trigger);
    const link = screen.getByRole("link", { name: /money lover/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://moneylover.me/vi/");
  });

  it("uses safe external-link attributes on every link", () => {
    render(<RelevantServices solutionId="income_stability" />);
    fireEvent.click(screen.getByRole("button", { name: /explore relevant services/i }));
    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("shows the transparency note when expanded", () => {
    render(<RelevantServices solutionId="emergency_reserve" />);
    fireEvent.click(screen.getByRole("button", { name: /explore relevant services/i }));
    expect(screen.getByText(TRANSPARENCY_NOTE)).toBeInTheDocument();
  });

  it("shows the correct section title for each category", () => {
    const ids = Object.keys(RELEVANT_SERVICES) as (keyof typeof RELEVANT_SERVICES)[];
    for (const id of ids) {
      const { unmount } = render(<RelevantServices solutionId={id} />);
      fireEvent.click(screen.getByRole("button", { name: /explore relevant services/i }));
      expect(screen.getByText(RELEVANT_SERVICES[id].sectionTitle)).toBeInTheDocument();
      unmount();
    }
  });

  it("renders nothing for optional_financial_services", () => {
    const { container } = render(<RelevantServices solutionId="optional_financial_services" />);
    expect(container.firstChild).toBeNull();
  });

  it("collapses when clicked again", () => {
    render(<RelevantServices solutionId="budget_optimization" />);
    const trigger = screen.getByRole("button", { name: /explore relevant services/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("link", { name: /money lover/i })).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByRole("link", { name: /money lover/i })).not.toBeInTheDocument();
  });

  it("displays all providers for a multi-service category", () => {
    render(<RelevantServices solutionId="income_stability" />);
    fireEvent.click(screen.getByRole("button", { name: /explore relevant services/i }));
    expect(screen.getByText(/Ho Chi Minh City Employment Service Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Coursera Affiliate Program Information/i)).toBeInTheDocument();
  });
});
