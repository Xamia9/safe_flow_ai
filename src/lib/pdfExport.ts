import { jsPDF } from "jspdf";
import type { FinancialProfile, Scenario } from "@/types/financial";
import { simulate } from "./financialCalculations";
import { selectRecommendations } from "./recommendations";
import { describeScenario } from "./scenarioUpdates";
import { formatVND, formatMonths } from "./formatCurrency";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 5.5;

const COLORS = {
  text: [33, 37, 41] as [number, number, number],
  muted: [108, 117, 125] as [number, number, number],
  accent: [13, 148, 136] as [number, number, number],
  header: [15, 76, 70] as [number, number, number],
  border: [222, 226, 230] as [number, number, number],
  tableHeader: [240, 244, 243] as [number, number, number],
  riskHigh: [200, 50, 50] as [number, number, number],
  riskMedium: [200, 140, 30] as [number, number, number],
  riskLow: [13, 148, 136] as [number, number, number],
};

/**
 * Export a client-side PDF report of the current simulation using jsPDF.
 * Runs the same pure engine as the dashboard — no external services, no AI.
 */
export function exportSimulationPdf(profile: FinancialProfile, scenario: Scenario): void {
  const result = simulate(profile, scenario);
  const summary = describeScenario(scenario);
  const recs = selectRecommendations({ profile, scenario, result });

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  // ── Header ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.header);
  doc.text("SafeFlow AI", MARGIN, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  doc.text(`Cash-flow resilience report — generated ${dateStr} at ${timeStr}`, MARGIN, y);
  y += 4;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  y += 6;

  // ── Scenario ──
  y = sectionTitle(doc, "Scenario", y);
  y = keyValue(doc, "Scenario", summary.label, y);
  y = keyValue(doc, "Horizon", `${scenario.horizon} months`, y);
  if (summary.reductionPct !== null) {
    y = keyValue(doc, "Income reduction", `${summary.reductionPct}%`, y);
  }
  if (summary.affectedMonths) {
    y = keyValue(doc, "Affected months", summary.affectedMonths, y);
  }
  if (summary.expenses.length > 0) {
    const total = summary.expenses.reduce((a, e) => a + e.amount, 0);
    y = keyValue(doc, "Unexpected expenses", formatVND(total), y);
  }
  y += 2;
  y = divider(doc, y);

  // ── Financial Profile ──
  y = sectionTitle(doc, "Financial profile", y);
  y = keyValue(doc, "Opening balance", formatVND(profile.openingBalance), y);
  y = keyValue(doc, "Monthly income", formatVND(profile.monthlyIncome), y);
  if (profile.lowSeasonIncome !== undefined) {
    y = keyValue(doc, "Low-season income", formatVND(profile.lowSeasonIncome), y);
  }
  y = keyValue(doc, "Essential expenses", formatVND(profile.essentialExpenses), y);
  y = keyValue(doc, "Flexible expenses", formatVND(profile.flexibleExpenses ?? 0), y);
  y = keyValue(doc, "Debt payments", formatVND(profile.debtPayments), y);
  y = keyValue(doc, "Safety buffer", formatVND(profile.safetyBuffer), y);
  y += 2;
  y = divider(doc, y);

  // ── Key Results ──
  y = sectionTitle(doc, "Key results", y);

  const riskColor = result.risk.level === "High" ? COLORS.riskHigh : result.risk.level === "Medium" ? COLORS.riskMedium : COLORS.riskLow;
  y = ensureSpace(doc, y, LINE_HEIGHT * 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text("Risk level", MARGIN, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...riskColor);
  doc.text(result.risk.level, MARGIN + 55, y);
  y += LINE_HEIGHT;

  for (const reason of result.risk.reasons) {
    y = ensureSpace(doc, y, LINE_HEIGHT);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    const lines = doc.splitTextToSize(`• ${reason}`, CONTENT_WIDTH - 4);
    doc.text(lines, MARGIN + 2, y);
    y += LINE_HEIGHT * lines.length;
  }
  y += 1;

  y = keyValue(doc, "Lowest projected balance", formatVND(result.lowestBalance), y);
  if (result.lowestBalanceMonth !== null) {
    y = keyValue(doc, "Lowest balance month", `Month ${result.lowestBalanceMonth}`, y);
  }
  y = keyValue(doc, "Ending balance", formatVND(result.endingBalance), y);
  y = keyValue(doc, "Minimum income needed", formatVND(result.minimumIncomeNeeded), y);
  y = keyValue(doc, "Largest monthly gap", formatVND(result.maxMonthlyGap), y);
  y = keyValue(doc, "Maximum reserve deficit", formatVND(result.maxReserveDeficit), y);
  if (result.firstMonthBelowBuffer !== null) {
    y = keyValue(doc, "First month below buffer", `Month ${result.firstMonthBelowBuffer}`, y);
  }
  if (result.firstNegativeMonth !== null) {
    y = keyValue(doc, "First negative month", `Month ${result.firstNegativeMonth}`, y);
  }
  y = keyValue(doc, "Runway (zero income)", formatMonths(result.runwayMonthsZeroIncome), y);
  y += 2;
  y = divider(doc, y);

  // ── Monthly Balance Summary ──
  y = sectionTitle(doc, "Monthly balance summary", y);
  const headers = ["Month", "Income", "Outflow", "Net flow", "Closing balance"];
  const colWidths = [20, 35, 35, 35, 45];
  y = simpleTable(doc, y, headers, colWidths, result.months.map((m) => [
    String(m.month),
    formatVND(m.income),
    formatVND(m.outflow),
    (m.netCashFlow >= 0 ? "+" : "") + formatVND(m.netCashFlow),
    formatVND(m.closingBalance),
  ]));
  y += 2;
  y = divider(doc, y);

  // ── Recommendations ──
  y = sectionTitle(doc, "Recommended next steps", y);
  if (recs.length === 0) {
    y = bodyLine(doc, "Your projection is stable — no balance falls below your safety buffer within this horizon. No specific recommendation is needed based on the data entered.", y);
  } else {
    for (const rec of recs) {
      y = ensureSpace(doc, y, LINE_HEIGHT * 6);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.text);
      const titleLines = doc.splitTextToSize(`${rec.title}  [${rec.priority} priority]`, CONTENT_WIDTH);
      doc.text(titleLines, MARGIN, y);
      y += LINE_HEIGHT * titleLines.length + 1;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.muted);
      doc.text("Why this was selected:", MARGIN, y);
      y += LINE_HEIGHT;
      doc.setFont("helvetica", "normal");
      for (const reason of rec.triggerReasons) {
        y = ensureSpace(doc, y, LINE_HEIGHT);
        const lines = doc.splitTextToSize(`• ${reason}`, CONTENT_WIDTH - 4);
        doc.text(lines, MARGIN + 2, y);
        y += LINE_HEIGHT * lines.length;
      }
      y += 1;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.muted);
      doc.text("Action steps:", MARGIN, y);
      y += LINE_HEIGHT;
      doc.setFont("helvetica", "normal");
      rec.actionSteps.forEach((step, i) => {
        y = ensureSpace(doc, y, LINE_HEIGHT);
        const lines = doc.splitTextToSize(`${i + 1}. ${step.text}`, CONTENT_WIDTH - 4);
        doc.text(lines, MARGIN + 2, y);
        y += LINE_HEIGHT * lines.length;
      });
      y += 1;

      y = ensureSpace(doc, y, LINE_HEIGHT * 2);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.muted);
      doc.text("Expected impact:", MARGIN, y);
      y += LINE_HEIGHT;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.text);
      const impactLines = doc.splitTextToSize(rec.expectedImpact, CONTENT_WIDTH);
      doc.text(impactLines, MARGIN, y);
      y += LINE_HEIGHT * impactLines.length + 1;

      if (rec.limitations.length > 0) {
        y = ensureSpace(doc, y, LINE_HEIGHT * 2);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.muted);
        doc.text("Limitations:", MARGIN, y);
        y += LINE_HEIGHT - 1;
        doc.setFont("helvetica", "normal");
        for (const lim of rec.limitations) {
          y = ensureSpace(doc, y, LINE_HEIGHT);
          const lines = doc.splitTextToSize(`• ${lim}`, CONTENT_WIDTH - 4);
          doc.text(lines, MARGIN + 2, y);
          y += (LINE_HEIGHT - 1) * lines.length;
        }
        y += 1;
      }

      y = ensureSpace(doc, y, 6);
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
      y += 4;
    }
  }
  y += 2;

  // ── Disclaimer ──
  y = ensureSpace(doc, y, LINE_HEIGHT * 5);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  const disclaimer = "This report is generated by SafeFlow AI from the numbers you entered. Projections are mechanical estimates, not guarantees. Recommendations are produced by fixed rules, not AI, and are not financial advice. Real-world results depend on factors a simulation cannot capture. Consult a qualified financial advisor before making decisions.";
  const discLines = doc.splitTextToSize(disclaimer, CONTENT_WIDTH);
  doc.text(discLines, MARGIN, y);

  // ── Footer page numbers ──
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Page ${p} of ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, { align: "right" });
  }

  doc.save(`safeflow-report-${now.toISOString().slice(0, 10)}.pdf`);
}

// ── Helpers ──

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - MARGIN - 5) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  y = ensureSpace(doc, y, LINE_HEIGHT * 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.accent);
  doc.text(title, MARGIN, y);
  y += LINE_HEIGHT + 1;
  return y;
}

function bodyLine(doc: jsPDF, text: string, y: number): number {
  y = ensureSpace(doc, y, LINE_HEIGHT * 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  doc.text(lines, MARGIN, y);
  y += LINE_HEIGHT * lines.length;
  return y;
}

function keyValue(doc: jsPDF, key: string, value: string, y: number): number {
  y = ensureSpace(doc, y, LINE_HEIGHT);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(key, MARGIN, y);
  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "medium");
  doc.text(value, MARGIN + 65, y);
  y += LINE_HEIGHT;
  return y;
}

function divider(doc: jsPDF, y: number): number {
  y = ensureSpace(doc, y, 4);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  return y + 4;
}

function simpleTable(doc: jsPDF, y: number, headers: string[], colWidths: number[], rows: string[][]): number {
  const rowH = 6;
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);

  // Header row
  y = ensureSpace(doc, y, rowH);
  doc.setFillColor(...COLORS.tableHeader);
  doc.rect(MARGIN, y - rowH + 1.5, tableWidth, rowH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  let x = MARGIN + 2;
  headers.forEach((h, i) => {
    doc.text(h, x, y);
    x += colWidths[i] ?? 0;
  });
  y += rowH;

  // Data rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const row of rows) {
    y = ensureSpace(doc, y, rowH);
    x = MARGIN + 2;
    row.forEach((val, i) => {
      const isNeg = i === 3 && val.startsWith("-");
      doc.setTextColor(isNeg ? 200 : 50, isNeg ? 50 : 50, 50);
      doc.text(val, x, y);
      x += colWidths[i] ?? 0;
    });
    y += rowH;
  }
  return y;
}
