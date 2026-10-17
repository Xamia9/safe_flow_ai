import { describe, expect, it } from "vitest";
import { RELEVANT_SERVICES, TRANSPARENCY_NOTE, getServicesForSolution } from "./relevantServices";

const EXPECTED: Record<string, { sectionTitle: string; services: { provider: string; url: string }[] }> = {
  budget_optimization: {
    sectionTitle: "Personal Finance & Budgeting",
    services: [{ provider: "Money Lover", url: "https://moneylover.me/vi/" }],
  },
  income_stability: {
    sectionTitle: "Employment & Skills Development",
    services: [
      { provider: "Ho Chi Minh City Employment Service Center", url: "https://vieclamhcm.com.vn/" },
      { provider: "Coursera Affiliate Program Information", url: "https://www.coursera.org/about/affiliates" },
    ],
  },
  emergency_reserve: {
    sectionTitle: "Savings & Bank Accounts",
    services: [
      { provider: "Vietcombank", url: "https://www.vietcombank.com.vn/" },
      { provider: "TPBank Personal Banking", url: "https://tpb.vn/ca-nhan" },
    ],
  },
  debt_payment_preparation: {
    sectionTitle: "Debt Support & Consultation",
    services: [{ provider: "LNT & Partners", url: "https://www.lntpartners.com/vi" }],
  },
  major_expense_planning: {
    sectionTitle: "Insurance & Financial Planning",
    services: [{ provider: "Manulife Vietnam", url: "https://www.manulife.com.vn/" }],
  },
  financial_support_advice: {
    sectionTitle: "Financial Support & Guidance",
    services: [{ provider: "CFRC", url: "https://www.cfrc.vn/" }],
  },
};

const SOLUTION_IDS = Object.keys(EXPECTED) as (keyof typeof RELEVANT_SERVICES)[];

describe("relevant services mapping", () => {
  it.each(SOLUTION_IDS)("category %s has correct section title", (id) => {
    expect(RELEVANT_SERVICES[id].sectionTitle).toBe(EXPECTED[id]!.sectionTitle);
  });

  it.each(SOLUTION_IDS)("category %s has exact provider names and URLs", (id) => {
    const services = RELEVANT_SERVICES[id].services;
    expect(services).toHaveLength(EXPECTED[id]!.services.length);
    services.forEach((s, i) => {
      expect(s.provider).toBe(EXPECTED[id]!.services[i]!.provider);
      expect(s.url).toBe(EXPECTED[id]!.services[i]!.url);
    });
  });

  it("no URL appears under an unrelated category", () => {
    const allUrls = SOLUTION_IDS.flatMap((id) => RELEVANT_SERVICES[id].services.map((s) => s.url));
    // Every URL should appear in exactly one category
    const counts = new Map<string, number>();
    for (const u of allUrls) counts.set(u, (counts.get(u) ?? 0) + 1);
    for (const [url, count] of counts) {
      expect(count, `URL ${url} appeared ${count} times`).toBe(1);
    }
  });

  it("every service has a non-empty description", () => {
    for (const id of SOLUTION_IDS) {
      for (const s of RELEVANT_SERVICES[id].services) {
        expect(s.description.length).toBeGreaterThan(0);
      }
    }
  });

  it("getServicesForSolution returns the category for mapped IDs", () => {
    for (const id of SOLUTION_IDS) {
      expect(getServicesForSolution(id)).toBe(RELEVANT_SERVICES[id]);
    }
  });

  it("getServicesForSolution returns null for optional_financial_services", () => {
    expect(getServicesForSolution("optional_financial_services")).toBeNull();
  });

  it("transparency note mentions no verification or partnership", () => {
    expect(TRANSPARENCY_NOTE).toContain("does not currently verify");
    expect(TRANSPARENCY_NOTE).toContain("partnership");
    expect(TRANSPARENCY_NOTE).toContain("affiliate");
    expect(TRANSPARENCY_NOTE).toContain("review each provider");
  });
});
