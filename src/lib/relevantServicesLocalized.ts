/**
 * Localized relevant-services data.
 *
 * Provider names (Money Lover, Vietcombank, TPBank, Coursera, Manulife,
 * LNT & Partners, CFRC) and URLs are never translated. Only the section
 * titles and per-service descriptions are localized.
 */
import type { SolutionId } from "./recommendations";
import type { TranslationKey } from "@/i18n/translations";
import type { t as TFn } from "@/i18n/LanguageContext";

type T = typeof TFn;

export interface ServiceLink {
  provider: string;
  url: string;
  description: string;
}

export interface ServiceCategory {
  sectionTitle: string;
  services: ServiceLink[];
}

interface RawService {
  provider: string;
  url: string;
  /** Translation key for the description. */
  descKey: TranslationKey;
}

interface RawCategory {
  sectionKey: TranslationKey;
  services: RawService[];
}

const RAW: Record<Exclude<SolutionId, "optional_financial_services">, RawCategory> = {
  budget_optimization: {
    sectionKey: "services.section.budget_optimization",
    services: [
      { provider: "Money Lover", url: "https://moneylover.me/vi/", descKey: "services.desc.budget_moneylover" },
    ],
  },
  income_stability: {
    sectionKey: "services.section.income_stability",
    services: [
      { provider: "Ho Chi Minh City Employment Service Center", url: "https://vieclamhcm.com.vn/", descKey: "services.desc.income_hcm" },
      { provider: "Coursera Affiliate Program Information", url: "https://www.coursera.org/about/affiliates", descKey: "services.desc.income_coursera" },
    ],
  },
  emergency_reserve: {
    sectionKey: "services.section.emergency_reserve",
    services: [
      { provider: "Vietcombank", url: "https://www.vietcombank.com.vn/", descKey: "services.desc.reserve_vietcombank" },
      { provider: "TPBank Personal Banking", url: "https://tpb.vn/ca-nhan", descKey: "services.desc.reserve_tpbank" },
    ],
  },
  debt_payment_preparation: {
    sectionKey: "services.section.debt_payment_preparation",
    services: [
      { provider: "LNT & Partners", url: "https://www.lntpartners.com/vi", descKey: "services.desc.debt_lnt" },
    ],
  },
  major_expense_planning: {
    sectionKey: "services.section.major_expense_planning",
    services: [
      { provider: "Manulife Vietnam", url: "https://www.manulife.com.vn/", descKey: "services.desc.major_manulife" },
    ],
  },
  financial_support_advice: {
    sectionKey: "services.section.financial_support_advice",
    services: [
      { provider: "CFRC", url: "https://www.cfrc.vn/", descKey: "services.desc.support_cfrc" },
    ],
  },
};

export function getLocalizedServicesForSolution(id: SolutionId, t: T): ServiceCategory | null {
  if (id === "optional_financial_services") return null;
  const raw = RAW[id as Exclude<SolutionId, "optional_financial_services">];
  if (!raw) return null;
  return {
    sectionTitle: t(raw.sectionKey),
    services: raw.services.map((s) => ({ provider: s.provider, url: s.url, description: t(s.descKey) })),
  };
}

/** The six solution categories that carry external services. */
export const SOLUTION_IDS_WITH_SERVICES: Exclude<SolutionId, "optional_financial_services">[] = [
  "budget_optimization",
  "income_stability",
  "emergency_reserve",
  "debt_payment_preparation",
  "major_expense_planning",
  "financial_support_advice",
];
