import { useSyncExternalStore } from "react";
import type { FinancialProfile, Scenario } from "@/types/financial";
import { defaultScenario } from "@/lib/scenarioPresets";

/**
 * Guest-only state persisted in this browser's localStorage.
 * Not synced to any server or other device.
 */
export type DraftValues = Record<string, string>;

export interface State {
  draft: DraftValues;
  scenario: Scenario;
  /** Last validated profile used for a run. */
  profile: FinancialProfile | null;
}

const KEY = "safeflow:v1";
const initial: State = { draft: {}, scenario: defaultScenario, profile: null };

function load(): State {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      draft: parsed.draft ?? {},
      scenario: { ...defaultScenario, ...parsed.scenario },
      profile: parsed.profile ?? null,
    };
  } catch {
    return initial;
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function emit() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: keep in memory */
  }
  listeners.forEach((l) => l());
}

export function setSimulation(next: Partial<State>) {
  state = { ...state, ...next };
  emit();
}

export function setDraftValue(key: string, value: string) {
  state = { ...state, draft: { ...state.draft, [key]: value } };
  emit();
}

/** Clears all locally saved inputs and results. */
export function resetSimulation() {
  state = initial;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useSimulation(): State {
  return useSyncExternalStore(subscribe, () => state, () => initial);
}
