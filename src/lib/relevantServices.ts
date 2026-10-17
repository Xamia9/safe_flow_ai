import type { SolutionId } from "./recommendations";

export interface ServiceLink {
  provider: string;
  url: string;
  description: string;
}

export interface ServiceCategory {
  sectionTitle: string;
  services: ServiceLink[];
}

export const RELEVANT_SERVICES: Record<Exclude<SolutionId, "optional_financial_services">, ServiceCategory> = {
  budget_optimization: {
    sectionTitle: "Personal Finance & Budgeting",
    services: [
      {
        provider: "Money Lover",
        url: "https://moneylover.me/vi/",
        description: "A personal finance app for tracking expenses and budgeting.",
      },
    ],
  },
  income_stability: {
    sectionTitle: "Employment & Skills Development",
    services: [
      {
        provider: "Ho Chi Minh City Employment Service Center",
        url: "https://vieclamhcm.com.vn/",
        description: "Job listings and employment support services in Ho Chi Minh City.",
      },
      {
        provider: "Coursera Affiliate Program Information",
        url: "https://www.coursera.org/about/affiliates",
        description: "Online courses and professional certificates to build new skills.",
      },
    ],
  },
  emergency_reserve: {
    sectionTitle: "Savings & Bank Accounts",
    services: [
      {
        provider: "Vietcombank",
        url: "https://www.vietcombank.com.vn/",
        description: "Commercial bank offering savings accounts and personal banking services.",
      },
      {
        provider: "TPBank Personal Banking",
        url: "https://tpb.vn/ca-nhan",
        description: "Digital banking services including savings and personal accounts.",
      },
    ],
  },
  debt_payment_preparation: {
    sectionTitle: "Debt Support & Consultation",
    services: [
      {
        provider: "LNT & Partners",
        url: "https://www.lntpartners.com/vi",
        description: "Law firm providing legal consultation on debt and financial obligations.",
      },
    ],
  },
  major_expense_planning: {
    sectionTitle: "Insurance & Financial Planning",
    services: [
      {
        provider: "Manulife Vietnam",
        url: "https://www.manulife.com.vn/",
        description: "Insurance and financial planning products for major life expenses.",
      },
    ],
  },
  financial_support_advice: {
    sectionTitle: "Financial Support & Guidance",
    services: [
      {
        provider: "CFRC",
        url: "https://www.cfrc.vn/",
        description: "Financial counseling and support resources for individuals.",
      },
    ],
  },
};

export const TRANSPARENCY_NOTE =
  "External resources for reference only. SafeFlow AI does not currently verify these providers or confirm any partnership or affiliate relationship. Please review each provider's terms before using its services.";

export function getServicesForSolution(id: SolutionId): ServiceCategory | null {
  if (id === "optional_financial_services") return null;
  return RELEVANT_SERVICES[id] ?? null;
}
