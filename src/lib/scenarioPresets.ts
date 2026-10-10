import type { Scenario } from "@/types/financial";

export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  incomeReductionPct: number;
}

export const scenarioPresets: ScenarioPreset[] = [
  { id: "baseline", label: "No change", description: "Income stays as it is today.", incomeReductionPct: 0 },
  { id: "cut-30", label: "Reduced hours", description: "Income drops by 30%.", incomeReductionPct: 30 },
  { id: "cut-50", label: "Half income", description: "Income drops by 50%.", incomeReductionPct: 50 },
  { id: "job-loss", label: "Job loss", description: "No income for the whole period.", incomeReductionPct: 100 },
];

export const defaultScenario: Scenario = {
  name: "My scenario",
  horizon: 6,
  incomeReductionPct: 0,
  unexpectedExpenses: [],
};
