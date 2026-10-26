import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList, Download, Lightbulb, Plus, RotateCcw, Sparkles, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { RiskBadge } from "@/components/common/RiskBadge";
import { AiExplanation } from "@/components/common/AiExplanation";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/forms/NumericInput";
import { Label } from "@/components/ui/label";
import { simulate } from "@/lib/financialCalculations";
import { formatVND } from "@/lib/formatCurrency";
import { useSimulation } from "@/services/simulationStore";
import { describeScenario } from "@/lib/scenarioUpdates";
import { cn } from "@/lib/utils";
import { useAiExplain } from "@/hooks/useAiExplain";
import { buildSelectedSolutionContext } from "@/lib/ai/contextBuilder";
import {
  type Adjustment,
  type AdjustmentKind,
  type ExperimentState,
  addAdjustment,
  removeAdjustment,
  resetExperiment,
  runExperiment,
  updateAdjustment,
} from "@/lib/actionExperiments";
import {
  type Recommendation,
  type SolutionId,
  priorityStyles,
} from "@/lib/recommendations";
import {
  localizedRecommendations,
  localizedPriorityLabel,
} from "@/lib/localizedRecommendations";
import {
  adjustmentKindLabel,
  adjustmentKindHint,
  localizedRiskReasons,
  localizedScenarioLabel,
} from "@/lib/localizedContent";
import { useT, useLanguage } from "@/i18n/LanguageContext";
import type { FinancialProfile, RiskLevel, Scenario } from "@/types/financial";
import { exportSimulationPdf } from "@/lib/pdfExport";
import { RelevantServices } from "@/components/common/RelevantServices";

export const Route = createFileRoute("/simulate/action-plan")({
  head: () => ({
    meta: [
      { title: "Action Plan & Report — SafeFlow AI" },
      { name: "description", content: "Summary of your simulation and next steps to strengthen your cash-flow resilience." },
      { property: "og:title", content: "Action Plan & Report — SafeFlow AI" },
      { property: "og:description", content: "Your SafeFlow simulation summary and action plan." },
    ],
  }),
  component: ActionPlan,
});

function ActionPlan() {
  const t = useT();
  const { language } = useLanguage();
  const { profile, scenario } = useSimulation();
  const [exp, setExp] = useState<ExperimentState>({ adjustments: [] });
  const [selectedSolutionId, setSelectedSolutionId] = useState<SolutionId | null>(null);
  const ai = useAiExplain();
  const aiSectionRef = useRef<HTMLElement>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (selectedSolutionId !== null && aiSectionRef.current) {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      aiSectionRef.current.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });
    }
  }, [selectedSolutionId]);

  const recs = useMemo(() => {
    if (!profile) return [];
    const result = simulate(profile, scenario);
    return localizedRecommendations({ profile, scenario, result }, t);
  }, [profile, scenario, t]);

  const cmp = useMemo(
    () => profile && exp.adjustments.length > 0
      ? runExperiment(profile, scenario, exp.adjustments)
      : null,
    [profile, scenario, exp.adjustments],
  );

  if (!profile) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow={t("ap.eyebrow")} title={t("ap.title")} />
        <EmptyState icon={ClipboardList} title={t("ap.noReportTitle")}
          description={t("ap.noReportBody")}
          action={<Button asChild><Link to="/simulate/input">{t("ap.goToProfile")}</Link></Button>} />
      </div>
    );
  }

  const result = simulate(profile, scenario);
  const summary = describeScenario(scenario);

  const selectedRec = recs.find((r) => r.solutionId === selectedSolutionId) ?? null;
  const hasExperimentResults = cmp !== null && exp.adjustments.length > 0;

  const simulateAdjustments = (adjustments: { kind: AdjustmentKind; amount: number }[]) => {
    let next: ExperimentState = { adjustments: [] };
    for (const a of adjustments) {
      if (a.amount > 0) next = addAdjustment(next, { kind: a.kind, amount: a.amount });
    }
    setExp(next);
    ai.reset();
    document.getElementById("experiment-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelectSolution = (solId: SolutionId) => {
    setSelectedSolutionId(solId);
    ai.reset();
  };

  const handleExperimentChange = () => {
    ai.reset();
  };

  const handleGeneratePlan = () => {
    if (!profile || !selectedRec) return;
    const ctx = buildSelectedSolutionContext(
      profile, scenario, result, summary, selectedRec, cmp,
    );
    ai.call("generate_action_plan", ctx, language);
  };

  const handleExportPdf = async () => {
    setPdfError(null);
    setPdfLoading(true);
    try {
      await exportSimulationPdf(profile, scenario, t);
    } catch {
      setPdfError(t("ap.exportPdfError"));
    } finally {
      setPdfLoading(false);
    }
  };

  const canGenerateAiPlan = selectedRec !== null;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={t("ap.eyebrow")} title={t("ap.title")}
        description={t("ap.description")}
        actions={<Button type="button" onClick={handleExportPdf} disabled={pdfLoading}><Download /> {pdfLoading ? t("ap.exporting") : t("ap.exportPdf")}</Button>} />
      {pdfError && (
        <p role="alert" className="rounded-lg border border-negative/30 bg-negative/10 px-4 py-2 text-sm text-negative">
          {pdfError}
        </p>
      )}
      <Summary profile={profile} scenario={scenario} />
      <RecommendationPanel
        profile={profile}
        scenario={scenario}
        onSimulate={simulateAdjustments}
        selectedSolutionId={selectedSolutionId}
        onSelectSolution={handleSelectSolution}
      />
      <ExperimentPanel
        id="experiment-panel"
        profile={profile}
        scenario={scenario}
        exp={exp}
        setExp={setExp}
        onExperimentChange={handleExperimentChange}
      />

      {selectedRec && (
        <section ref={aiSectionRef} className="space-y-4" aria-labelledby="ai-plan-h">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal" aria-hidden />
              <h2 id="ai-plan-h" className="text-lg font-semibold">{t("ap.aiPlanTitle")}</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGeneratePlan}
              disabled={ai.status === "loading" || !canGenerateAiPlan}
            >
              <Sparkles /> {ai.status === "loading" ? t("ap.generating") : t("ap.generateAiPlan")}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("ap.aiPlanIntro", { title: selectedRec.title, exp: hasExperimentResults ? t("ap.aiPlanIntroWithExp") : "" })}
          </p>

          <AiExplanation
            status={ai.status}
            text={ai.text}
            error={ai.error}
            onRetry={handleGeneratePlan}
            onDismiss={ai.reset}
            sectionId="ai-action-plan"
            sectionTitle={t("ap.aiPersonalizedTitle")}
          />
        </section>
      )}
    </div>
  );
}

function Summary({ profile, scenario }: { profile: FinancialProfile; scenario: Scenario }) {
  const t = useT();
  const r = simulate(profile, scenario);
  const summary = describeScenario(scenario);
  const scenarioLabel = localizedScenarioLabel(scenario, t);
  const riskReasons = localizedRiskReasons(r, t);
  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("ap.simSummary")}</h2>
        <RiskBadge level={r.risk.level} />
      </div>
      <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        {[
          [t("ap.summaryScenario"), scenarioLabel],
          [t("ap.summaryHorizon"), t("ap.summaryHorizonValue", { n: scenario.horizon })],
          [t("ap.summaryReduction"), `${scenario.incomeReductionPct}%`],
          [t("ap.summaryLowest"), formatVND(r.lowestBalance)],
          [t("ap.summaryEnding"), formatVND(r.endingBalance)],
          [t("ap.summaryMinIncome"), formatVND(r.minimumIncomeNeeded)],
          [t("ap.summaryLargestGap"), formatVND(r.maxMonthlyGap)],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between border-b pb-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium tabular">{v}</dd></div>
        ))}
      </dl>
      <ul className="mt-4 list-disc pl-5 text-sm">{riskReasons.map((x) => <li key={x}>{x}</li>)}</ul>
    </section>
  );
}

function RecommendationPanel({ profile, scenario, onSimulate, selectedSolutionId, onSelectSolution }: {
  profile: FinancialProfile;
  scenario: Scenario;
  onSimulate: (adjustments: { kind: AdjustmentKind; amount: number }[]) => void;
  selectedSolutionId: SolutionId | null;
  onSelectSolution: (solId: SolutionId) => void;
}) {
  const t = useT();
  const result = useMemo(() => simulate(profile, scenario), [profile, scenario]);
  const recs = useMemo(
    () => localizedRecommendations({ profile, scenario, result }, t),
    [profile, scenario, result, t],
  );

  if (recs.length === 0) {
    return (
      <section className="rounded-xl border bg-card p-6" aria-labelledby="rec-h">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-teal" aria-hidden />
          <h2 id="rec-h" className="text-lg font-semibold">{t("ap.recTitle")}</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("ap.recIntroStable")}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="rec-h">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-teal" aria-hidden />
        <h2 id="rec-h" className="text-lg font-semibold">{t("ap.recTitle")}</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("ap.recIntro")}
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        {recs.map((rec) => (
          <RecCard
            key={rec.solutionId}
            rec={rec}
            onSimulate={onSimulate}
            isSelected={selectedSolutionId === rec.solutionId}
            onSelect={() => onSelectSolution(rec.solutionId)}
          />
        ))}
      </div>
    </section>
  );
}

function RecCard({ rec, onSimulate, isSelected, onSelect }: {
  rec: Recommendation;
  onSimulate: (adjustments: { kind: AdjustmentKind; amount: number }[]) => void;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const t = useT();
  const canSimulate = rec.experimentSupported && rec.experimentAdjustments && rec.experimentAdjustments.some((a) => a.amount > 0);

  return (
    <div className={cn(
      "flex flex-col rounded-xl border bg-card p-5 transition-colors",
      isSelected && "border-teal ring-1 ring-teal/30",
    )}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold">{rec.title}</h3>
        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", priorityStyles[rec.priority])}>
          {localizedPriorityLabel(rec.priority, t)}
        </span>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
        {rec.triggerReasons.map((reason, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-teal" aria-hidden>•</span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>

      <ol className="mt-4 space-y-2 text-sm">
        {rec.actionSteps.map((step, i) => (
          <li key={i} className="flex gap-2">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-secondary text-xs font-medium tabular">{i + 1}</span>
            <span>{step.text}</span>
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-lg bg-secondary/60 p-3 text-sm">
        <p className="font-medium">{t("ap.expectedImpact")}</p>
        <p className="mt-1 text-muted-foreground">{rec.expectedImpact}</p>
        {rec.impactStatus === "not_quantified" && (
          <p className="mt-1 text-xs font-medium text-warning">
            {t("ap.impactNotQuantified")}
          </p>
        )}
      </div>

      {rec.limitations.length > 0 && (
        <div className="mt-3 text-xs text-muted-foreground">
          <p className="font-medium">{t("ap.limitations")}</p>
          <ul className="mt-1 list-disc pl-4 space-y-0.5">
            {rec.limitations.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>
      )}

      {rec.missingInformation.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          <p className="font-medium">{t("ap.informationNeeded")}</p>
          <ul className="mt-1 list-disc pl-4 space-y-0.5">
            {rec.missingInformation.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      <RelevantServices solutionId={rec.solutionId} />

      <div className="mt-auto space-y-2 pt-4">
        <Button
          type="button"
          variant={isSelected ? "default" : "outline"}
          size="sm"
          onClick={onSelect}
          aria-pressed={isSelected}
        >
          {isSelected ? t("ap.selected") : t("ap.selectSolution")}
        </Button>
        {canSimulate ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSimulate(rec.experimentAdjustments!)}
            className="w-full"
          >
            <TrendingUp /> {t("ap.simulateAdjustment")}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            {rec.experimentSupported
              ? t("ap.addManual")
              : t("ap.cannotSimulate")}
          </p>
        )}
      </div>
    </div>
  );
}

const adjustmentKinds: AdjustmentKind[] = ["cutFlexible", "cutEssentials", "raiseIncome"];

function ExperimentPanel({ id, profile, scenario, exp, setExp, onExperimentChange }: {
  id: string;
  profile: FinancialProfile;
  scenario: Scenario;
  exp: ExperimentState;
  setExp: React.Dispatch<React.SetStateAction<ExperimentState>>;
  onExperimentChange: () => void;
}) {
  const t = useT();
  const cmp = useMemo(
    () => runExperiment(profile, scenario, exp.adjustments),
    [profile, scenario, exp.adjustments],
  );
  const hasAdjustments = exp.adjustments.length > 0;

  const addOne = () => { setExp((s) => addAdjustment(s, { kind: "cutFlexible", amount: 0 })); onExperimentChange(); };
  const removeOne = (i: number) => { setExp((s) => removeAdjustment(s, i)); onExperimentChange(); };
  const patchOne = (i: number, patch: Partial<Adjustment>) => { setExp((s) => updateAdjustment(s, i, patch)); onExperimentChange(); };
  const reset = () => { setExp(resetExperiment()); onExperimentChange(); };

  return (
    <section id={id} className="rounded-xl border bg-card p-6" aria-labelledby="exp-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="exp-h" className="text-lg font-semibold">{t("ap.testAdjustment")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("ap.testNote")}
          </p>
        </div>
        {hasAdjustments && (
          <Button type="button" variant="outline" size="sm" onClick={reset}>
            <RotateCcw /> {t("ap.clearAdjustments")}
          </Button>
        )}
      </div>

      <ul className="mt-5 space-y-3">
        {exp.adjustments.map((a, i) => (
          <li key={i} className="rounded-lg border p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div className="flex-1 min-w-[160px]">
                <Label htmlFor={`kind-${i}`} className="text-xs">{t("ap.adjustment")}</Label>
                <select id={`kind-${i}`} value={a.kind}
                  onChange={(e) => patchOne(i, { kind: e.target.value as AdjustmentKind })}
                  className="mt-1 block h-9 w-full rounded-md border border-input bg-card px-2 text-sm">
                  {adjustmentKinds.map((k) => <option key={k} value={k}>{adjustmentKindLabel(k, t)}</option>)}
                </select>
              </div>
              <div className="sm:w-48">
                <Label htmlFor={`amt-${i}`} className="text-xs">{t("ap.monthlyAmountVnd")}</Label>
                <NumericInput id={`amt-${i}`} value={a.amount} onChange={(n) => patchOne(i, { amount: n })}
                  className="mt-1 w-full tabular" />
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label={t("ap.removeAdjustment", { n: i + 1 })}
                onClick={() => removeOne(i)} className="shrink-0 self-end">
                <Trash2 />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{adjustmentKindHint(a.kind, t)}</p>
          </li>
        ))}
      </ul>

      {!hasAdjustments && (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("ap.noAdjustments")}
        </p>
      )}

      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={addOne}>
        <Plus /> {t("ap.addAdjustment")}
      </Button>

      {hasAdjustments && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label={t("ap.beforeVsAfter")}>
            <ComparisonCard label={t("ap.riskLevel")}
              before={cmp.baseline.risk.level} after={cmp.adjusted.risk.level}
              improved={cmp.riskImproved} riskCard />
            <ComparisonCard label={t("ap.lowestBalance")}
              before={formatVND(cmp.baseline.lowestBalance)} after={formatVND(cmp.adjusted.lowestBalance)}
              delta={cmp.deltaLowestBalance} />
            <ComparisonCard label={t("ap.endingBalance")}
              before={formatVND(cmp.baseline.endingBalance)} after={formatVND(cmp.adjusted.endingBalance)}
              delta={cmp.deltaEndingBalance} />
            <ComparisonCard label={t("ap.reserveDeficit")}
              before={formatVND(cmp.baseline.maxReserveDeficit)} after={formatVND(cmp.adjusted.maxReserveDeficit)}
              delta={cmp.deltaReserveDeficit} lowerIsBetter />
            <ComparisonCard label={t("ap.maxMonthlyGap")}
              before={formatVND(cmp.baseline.maxMonthlyGap)} after={formatVND(cmp.adjusted.maxMonthlyGap)}
              delta={cmp.deltaMaxMonthlyGap} lowerIsBetter />
            <ComparisonCard label={t("ap.firstBufferBreach")}
              before={cmp.baseline.firstMonthBelowBuffer ? t("dash.monthN", { n: cmp.baseline.firstMonthBelowBuffer }) : t("ap.none")}
              after={cmp.adjusted.firstMonthBelowBuffer ? t("dash.monthN", { n: cmp.adjusted.firstMonthBelowBuffer }) : t("ap.none")} />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            {t("ap.mechanicalNote")}
          </p>
        </>
      )}
    </section>
  );
}

const riskTone: Record<RiskLevel, string> = {
  Low: "text-teal",
  Medium: "text-warning",
  High: "text-negative",
};

function ComparisonCard({ label, before, after, delta, improved, lowerIsBetter, riskCard }: {
  label: string;
  before: string;
  after: string;
  delta?: number;
  improved?: boolean;
  lowerIsBetter?: boolean;
  riskCard?: boolean;
}) {
  const t = useT();
  const showDelta = delta !== undefined && delta !== 0;
  const deltaGood = lowerIsBetter ? delta! < 0 : delta! > 0;
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between rounded-md bg-secondary/60 px-3 py-2">
          <span className="text-xs text-muted-foreground">{t("ap.before")}</span>
          <span className={cn("tabular font-medium", riskCard && riskTone[before as RiskLevel])}>{before}</span>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <span className="text-xs text-muted-foreground">{t("ap.after")}</span>
          <span className={cn("tabular font-medium", riskCard && riskTone[after as RiskLevel])}>{after}</span>
        </div>
        {showDelta && (
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-xs text-muted-foreground">{t("ap.change")}</span>
            <span className={cn("flex items-center gap-1 text-xs font-medium tabular", deltaGood ? "text-teal" : "text-negative")}>
              {deltaGood ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {delta! > 0 ? "+" : ""}{formatVND(delta!)}
            </span>
          </div>
        )}
        {improved !== undefined && improved && (
          <p className="text-xs font-medium text-teal">{t("ap.riskImproved")}</p>
        )}
      </div>
    </div>
  );
}
