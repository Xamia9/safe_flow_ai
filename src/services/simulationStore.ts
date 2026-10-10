import { useSyncExternalStore } from "react";
import type { FinancialProfile, Scenario } from "@/types/financial";
import { defaultScenario } from "@/lib/scenarioPresets";

/** In-memory, guest-only session state. Nothing is sent to a server. */
interface State {
  profile: FinancialProfile | null;
  scenario: Scenario;
}

let state: State = { profile: null, scenario: defaultScenario };
const listeners = new Set<() => void>();

export function setSimulation(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function resetSimulation() {
  setSimulation({ profile: null, scenario: defaultScenario });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const initial: State = { profile: null, scenario: defaultScenario };

export function useSimulation(): State {
  return useSyncExternalStore(subscribe, () => state, () => initial);
}
