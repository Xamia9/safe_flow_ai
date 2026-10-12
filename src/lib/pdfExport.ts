import { jsPDF } from "jspdf";
import type { FinancialProfile, MonthProjection, Scenario, SimulationResult } from "@/types/financial";
import { simulate, compareScenarios } from "./financialCalculations";
import { selectRecommendations, type Recommendation } from "./recommendations";
import { describeScenario, type ScenarioSummary } from "./scenarioUpdates";
import { formatMonths } from "./formatCurrency";

/* ── Page constants ── */
const PW = 210;
const PH = 297;
const M = 16;
const CW = PW - M * 2;
const LH = 5;
const LH_S = 4.2;

/* ── Colors (matching SafeFlow navy/teal identity) ── */
const C = {
  navy: [30, 58, 95] as [number, number, number],
  navySoft: [235, 240, 248] as [number, number, number],
  teal: [13, 148, 136] as [number, number, number],
  tealSoft: [228, 246, 244] as [number, number, number],
  text: [33, 37, 41] as [number, number, number],
  muted: [108, 117, 125] as [number, number, number],
  lightMuted: [165, 170, 175] as [number, number, number],
  border: [222, 226, 230] as [number, number, number],
  thBg: [30, 58, 95] as [number, number, number],
  thText: [240, 245, 252] as [number, number, number],
  rowAlt: [247, 249, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  rHigh: [200, 50, 50] as [number, number, number],
  rHighSoft: [252, 232, 232] as [number, number, number],
  rMed: [200, 140, 30] as [number, number, number],
  rMedSoft: [252, 244, 224] as [number, number, number],
  rLow: [13, 148, 136] as [number, number, number],
  rLowSoft: [228, 246, 244] as [number, number, number],
  cBase: [120, 140, 170] as [number, number, number],
  cActive: [30, 58, 95] as [number, number, number],
  cIncome: [13, 148, 136] as [number, number, number],
  cOutflow: [200, 80, 60] as [number, number, number],
  cBuffer: [200, 140, 30] as [number, number, number],
  cZero: [200, 50, 50] as [number, number, number],
  cGrid: [225, 230, 235] as [number, number, number],
};

/* ── Currency formatting (VND text — ₫ is not in jsPDF WinAnsi) ── */

function vnd(v: number): string {
  if (!Number.isFinite(v)) return "N/A";
  const r = Math.round(v);
  const sign = r < 0 ? "-" : "";
  return `${sign}${Math.abs(r).toLocaleString("en-US")} VND`;
}

function vndS(v: number): string {
  if (!Number.isFinite(v)) return "N/A";
  const a = Math.abs(v);
  const s = v < 0 ? "-" : "";
  if (a >= 1e9) return `${s}${(a / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${s}${(a / 1e6).toFixed(0)}M`;
  if (a >= 1e3) return `${s}${(a / 1e3).toFixed(0)}K`;
  return `${s}${a}`;
}

/* ── Main entry ── */

export function exportSimulationPdf(profile: FinancialProfile, scenario: Scenario): void {
  if (!profile || !scenario || scenario.horizon <= 0) return;

  const result = simulate(profile, scenario);
  const baseline = compareScenarios(profile, scenario).baseline;
  const summary = describeScenario(scenario);
  const recs = selectRecommendations({ profile, scenario, result });
  const now = new Date();

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = drawHeader(doc, scenario, now);
  y = drawInputSummary(doc, y, profile);
  y = drawScenario(doc, y, scenario, summary);
  y = drawKeyResults(doc, y, result, profile);
  y = drawBalanceChart(doc, y, result.months, baseline.months, profile.safetyBuffer, summary.label);
  y = drawIncomeOutflowChart(doc, y, result.months);
  y = drawMonthlyTable(doc, y, result.months);
  y = drawRecommendations(doc, y, recs);
  drawFooter(doc);

  doc.save(`safeflow-report-${now.toISOString().slice(0, 10)}.pdf`);
}

/* ── Section 1: Header banner ── */

function drawHeader(doc: jsPDF, scenario: Scenario, now: Date): number {
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, PW, 26, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...C.white);
  doc.text("SafeFlow AI", M, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(175, 190, 210);
  doc.text("Cash-flow resilience report", M, 18);

  const ds = now.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  const ts = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  doc.setFontSize(7.5);
  doc.text(`Generated ${ds} at ${ts}`, M, 23);
  doc.text(`Horizon: ${scenario.horizon} months`, PW - M, 23, { align: "right" });

  return 32;
}

/* ── Section 2: Input Summary (5 required + 1 optional) ── */

interface FieldDef { key: keyof FinancialProfile; label: string; optional?: boolean }

const FIELDS: FieldDef[] = [
  { key: "monthlyIncome", label: "Normal monthly net income" },
  { key: "lowSeasonIncome", label: "Low-season monthly net income" },
  { key: "essentialExpenses", label: "Essential living expenses" },
  { key: "openingBalance", label: "Available emergency savings" },
  { key: "debtPayments", label: "Mandatory debt payment" },
  { key: "flexibleExpenses", label: "Flexible spending (optional)", optional: true },
];

function drawInputSummary(doc: jsPDF, y: number, profile: FinancialProfile): number {
  y = secTitle(doc, "Input summary", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.muted);
  doc.text("All amounts are monthly and in VND. Saved only in this browser.", M, y);
  y += 5;

  const colW = CW / 2;
  const rowH = 9;
  let col = 0;
  let rowY = y;

  for (const f of FIELDS) {
    if (rowY + rowH > PH - M - 12) { doc.addPage(); rowY = M; }
    const x = M + col * colW;
    const val = profile[f.key];
    const disp = (f.optional && (val === null || val === undefined)) ? "0 VND" : vnd(typeof val === "number" ? val : 0);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.text(f.label, x + 2, rowY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.text);
    doc.text(disp, x + 2, rowY + 4.5);

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.line(x + 2, rowY + 6, x + colW - 4, rowY + 6);

    col++;
    if (col >= 2) { col = 0; rowY += rowH; }
  }
  if (col > 0) rowY += rowH;
  y = rowY + 1;

  // Safety buffer callout
  y = ensure(doc, y, 12);
  doc.setFillColor(...C.navySoft);
  doc.roundedRect(M, y, CW, 11, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.navy);
  doc.text("Safety buffer (essentials + debt):", M + 4, y + 5);
  doc.setTextColor(...C.navy);
  doc.text(vnd(profile.safetyBuffer), M + 80, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text("One month of essential expenses plus mandatory debt payment (E + D).", M + 4, y + 9);

  return y + 16;
}

/* ── Section 3: Scenario assumptions + risk note ── */

function drawScenario(doc: jsPDF, y: number, sc: Scenario, sm: ScenarioSummary): number {
  y = secTitle(doc, "Scenario assumptions", y);
  y = kvRow(doc, "Scenario type", sm.label, y);
  y = kvRow(doc, "Forecast horizon", `${sc.horizon} months`, y);
  if (sm.reductionPct !== null) y = kvRow(doc, "Income reduction", `${sm.reductionPct}%`, y);
  if (sm.affectedMonths) y = kvRow(doc, "Affected months", sm.affectedMonths, y);
  for (const e of sm.expenses) y = kvRow(doc, `Unexpected expense (month ${e.month})`, vnd(e.amount), y);

  // Risk classification note
  y = ensure(doc, y, 16);
  doc.setFillColor(...C.tealSoft);
  doc.roundedRect(M, y, CW, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.teal);
  doc.text("Risk classification", M + 4, y + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.text);
  doc.setFontSize(7);
  const rn = "Risk level is based on projected month-end balances: High = any negative month-end; Medium = any month below the safety buffer (none negative); Low = all months at or above the buffer. The opening balance may initially be below the safety buffer — that alone does not raise the risk level unless a projected month-end also falls below it.";
  const rl = doc.splitTextToSize(rn, CW - 8);
  doc.text(rl, M + 4, y + 7.5);
  y += 14 + (rl.length - 1) * 3.2 + 2;

  return y + 2;
}

/* ── Section 4: Key results KPI cards ── */

function drawKeyResults(doc: jsPDF, y: number, r: SimulationResult, p: FinancialProfile): number {
  y = secTitle(doc, "Key results", y);

  // Risk badge
  const rc = r.risk.level === "High" ? { bg: C.rHighSoft, fg: C.rHigh }
    : r.risk.level === "Medium" ? { bg: C.rMedSoft, fg: C.rMed }
    : { bg: C.rLowSoft, fg: C.rLow };
  y = ensure(doc, y, 12);
  doc.setFillColor(...rc.bg);
  doc.roundedRect(M, y, CW, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...rc.fg);
  doc.text(`Risk level: ${r.risk.level}`, M + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  const rrt = r.risk.reasons.join("  ");
  const rrl = doc.splitTextToSize(rrt, CW - 70);
  doc.text(rrl, M + 65, y + 6);
  y += 13;

  // KPI cards
  interface Kpi { label: string; value: string; hint?: string | undefined; tone?: [number, number, number] | undefined }
  const kpis: Kpi[] = [
    { label: "Lowest month-end balance", value: vnd(r.lowestBalance), hint: r.lowestBalanceMonth ? `Month ${r.lowestBalanceMonth}` : undefined, tone: r.lowestBalance < 0 ? C.rHigh : r.lowestBalance < p.safetyBuffer ? C.rMed : C.rLow },
    { label: "Ending balance", value: vnd(r.endingBalance), tone: r.endingBalance < 0 ? C.rHigh : r.endingBalance < p.safetyBuffer ? C.rMed : C.rLow },
    { label: "Max monthly gap", value: vnd(r.maxMonthlyGap), hint: "Before using savings" },
    { label: "Max reserve deficit", value: vnd(r.maxReserveDeficit), hint: "Shortfall below zero" },
    { label: "Runway (zero income)", value: formatMonths(r.runwayMonthsZeroIncome) },
    { label: "Minimum income needed", value: vnd(r.minimumIncomeNeeded), hint: "Essentials + debt/mo" },
  ];
  if (r.firstMonthBelowBuffer !== null) kpis.push({ label: "First month below buffer", value: `Month ${r.firstMonthBelowBuffer}`, tone: C.rMed });
  if (r.firstNegativeMonth !== null) kpis.push({ label: "First negative month", value: `Month ${r.firstNegativeMonth}`, tone: C.rHigh });

  const cardW = (CW - 8) / 3;
  const cardH = 15;
  const gap = 4;

  kpis.forEach((k, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    if (col === 0 && row > 0) y += cardH + gap;
    if (col === 0) y = ensure(doc, y, cardH + gap);
    const cx = M + col * (cardW + gap);
    const cy = y;

    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, cy, cardW, cardH, 1.5, 1.5, "FD");

    const ac = k.tone ?? C.navy;
    doc.setFillColor(...ac);
    doc.rect(cx, cy, 1.5, cardH, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);
    const ll = doc.splitTextToSize(k.label, cardW - 8);
    doc.text(ll[0] as string, cx + 4, cy + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...(k.tone ?? C.text));
    const vl = doc.splitTextToSize(k.value, cardW - 8);
    doc.text(vl[0] as string, cx + 4, cy + 9.5);

    if (k.hint) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(...C.lightMuted);
      doc.text(k.hint, cx + 4, cy + 13);
    }
  });

  y += cardH + gap + 4;
  return y;
}

/* ── Section 5: Balance chart (vector) ── */

function drawBalanceChart(doc: jsPDF, y: number, active: MonthProjection[], baseline: MonthProjection[], buffer: number, label: string): number {
  y = secTitle(doc, "Projected cash balance", y);
  const ch = 52;
  y = ensure(doc, y, ch + 16);

  const cx = M + 3;
  const cy = y;
  const cw = CW - 6;
  const ih = ch - 14;
  const iw = cw - 32;

  const vals = [...active.map(m => m.closingBalance), ...baseline.map(m => m.closingBalance), buffer, 0];
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const rng = mx - mn || 1;
  const pad = rng * 0.12;
  const lo = mn - pad;
  const hi = mx + pad;
  const sp = hi - lo;

  doc.setFillColor(...C.white);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(cx, cy, cw, ch, 1, 1, "FD");

  const tY = (v: number) => cy + 3 + ih - ((v - lo) / sp) * ih;
  const tX = (m: number) => cx + 32 + ((m - 1) / Math.max(1, active.length - 1)) * iw;

  // Gridlines
  for (let t = 0; t <= 4; t++) {
    const v = lo + (sp * t) / 4;
    const gy = tY(v);
    doc.setDrawColor(...C.cGrid);
    doc.setLineWidth(0.2);
    doc.line(cx + 32, gy, cx + cw - 3, gy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...C.muted);
    doc.text(vndS(v), cx + 30, gy + 1, { align: "right" });
  }

  // Zero line
  if (lo < 0 && hi > 0) {
    const zy = tY(0);
    doc.setDrawColor(...C.cZero);
    doc.setLineWidth(0.4);
    doc.line(cx + 32, zy, cx + cw - 3, zy);
    doc.setFontSize(5.5);
    doc.setTextColor(...C.cZero);
    doc.text("Zero", cx + 33, zy - 1);
  }

  // Safety buffer line
  const by = tY(buffer);
  if (by >= cy + 3 && by <= cy + 3 + ih) {
    doc.setDrawColor(...C.cBuffer);
    doc.setLineWidth(0.4);
    doc.setLineDashPattern([2, 1.5], 0);
    doc.line(cx + 32, by, cx + cw - 3, by);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(5.5);
    doc.setTextColor(...C.cBuffer);
    doc.text(`Buffer ${vndS(buffer)}`, cx + cw - 4, by - 1, { align: "right" });
  }

  // Baseline (dashed)
  doc.setDrawColor(...C.cBase);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([3, 2], 0);
  for (let i = 1; i < baseline.length; i++) {
    const p0 = baseline[i - 1];
    const p1 = baseline[i];
    if (p0 && p1) doc.line(tX(p0.month), tY(p0.closingBalance), tX(p1.month), tY(p1.closingBalance));
  }
  doc.setLineDashPattern([], 0);

  // Active (solid)
  doc.setDrawColor(...C.cActive);
  doc.setLineWidth(0.8);
  for (let i = 1; i < active.length; i++) {
    const p0 = active[i - 1];
    const p1 = active[i];
    if (p0 && p1) doc.line(tX(p0.month), tY(p0.closingBalance), tX(p1.month), tY(p1.closingBalance));
  }
  active.forEach(m => {
    doc.setFillColor(...C.cActive);
    doc.circle(tX(m.month), tY(m.closingBalance), 0.7, "F");
  });

  // X labels
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(...C.muted);
  active.forEach(m => doc.text(`M${m.month}`, tX(m.month), cy + ch - 2.5, { align: "center" }));

  // Legend
  const ly = cy + ch + 2;
  let lx = cx + 2;
  drawLeg(doc, lx, ly, C.cActive, label); lx += legW(doc, label) + 8;
  drawLegDash(doc, lx, ly, C.cBase, "Baseline"); lx += legW(doc, "Baseline") + 8;
  drawLegDash(doc, lx, ly, C.cBuffer, "Safety buffer"); lx += legW(doc, "Safety buffer") + 8;
  drawLeg(doc, lx, ly, C.cZero, "Zero balance");

  return ly + 7;
}

/* ── Section 6: Income vs outflow chart ── */

function drawIncomeOutflowChart(doc: jsPDF, y: number, months: MonthProjection[]): number {
  y = secTitle(doc, "Monthly income vs outflow", y);
  const ch = 48;
  y = ensure(doc, y, ch + 14);

  const cx = M + 3;
  const cy = y;
  const cw = CW - 6;
  const ih = ch - 12;
  const iw = cw - 32;

  const incomes = months.map(m => m.income);
  const outflows = months.map(m => m.outflow);
  const mxV = Math.max(...incomes, ...outflows, 1);
  const lo = 0;
  const hi = mxV * 1.1;
  const sp = hi - lo;

  doc.setFillColor(...C.white);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(cx, cy, cw, ch, 1, 1, "FD");

  const tY = (v: number) => cy + 3 + ih - ((v - lo) / sp) * ih;
  const tX = (m: number) => cx + 32 + ((m - 1) / Math.max(1, months.length - 1)) * iw;

  for (let t = 0; t <= 3; t++) {
    const v = lo + (sp * t) / 3;
    const gy = tY(v);
    doc.setDrawColor(...C.cGrid);
    doc.setLineWidth(0.2);
    doc.line(cx + 32, gy, cx + cw - 3, gy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...C.muted);
    doc.text(vndS(v), cx + 30, gy + 1, { align: "right" });
  }

  // Income
  doc.setDrawColor(...C.cIncome);
  doc.setLineWidth(0.8);
  for (let i = 1; i < months.length; i++) {
    const p0 = months[i - 1];
    const p1 = months[i];
    if (p0 && p1) doc.line(tX(p0.month), tY(p0.income), tX(p1.month), tY(p1.income));
  }
  months.forEach(m => { doc.setFillColor(...C.cIncome); doc.circle(tX(m.month), tY(m.income), 0.6, "F"); });

  // Outflow
  doc.setDrawColor(...C.cOutflow);
  doc.setLineWidth(0.8);
  for (let i = 1; i < months.length; i++) {
    const p0 = months[i - 1];
    const p1 = months[i];
    if (p0 && p1) doc.line(tX(p0.month), tY(p0.outflow), tX(p1.month), tY(p1.outflow));
  }
  months.forEach(m => { doc.setFillColor(...C.cOutflow); doc.circle(tX(m.month), tY(m.outflow), 0.6, "F"); });

  // X labels
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(...C.muted);
  months.forEach(m => doc.text(`M${m.month}`, tX(m.month), cy + ch - 2.5, { align: "center" }));

  // Legend
  const ly = cy + ch + 2;
  let lx = cx + 2;
  drawLeg(doc, lx, ly, C.cIncome, "Income (adjusted)"); lx += legW(doc, "Income (adjusted)") + 8;
  drawLeg(doc, lx, ly, C.cOutflow, "Outflow");

  return ly + 7;
}

/* ── Section 7: Monthly table ── */

function drawMonthlyTable(doc: jsPDF, y: number, months: MonthProjection[]): number {
  y = secTitle(doc, "Monthly cash-flow projection", y);

  const headers = ["Mo.", "Income", "Outflow", "Net flow", "Closing balance", "Status"];
  const colW = [13, 31, 31, 31, 38, 30];
  const tw = colW.reduce((a, b) => a + b, 0);
  const rh = 6;

  function headerRow(yP: number): number {
    y = ensure(doc, yP, rh + 1);
    doc.setFillColor(...C.thBg);
    doc.rect(M, y, tw, rh, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...C.thText);
    let x = M + 2;
    headers.forEach((h, i) => { doc.text(h, x, y + 4); x += colW[i] ?? 0; });
    return y + rh;
  }

  y = headerRow(y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  months.forEach((m, idx) => {
    y = ensure(doc, y, rh);
    if (y === M) {
      y = headerRow(y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(...C.rowAlt);
      doc.rect(M, y, tw, rh, "F");
    }

    const vals = [
      String(m.month),
      vnd(m.income),
      vnd(m.outflow),
      (m.netCashFlow >= 0 ? "+" : "") + vnd(Math.abs(m.netCashFlow)),
      vnd(m.closingBalance),
      m.negative ? "Negative" : m.belowBuffer ? "Below buffer" : "Above buffer",
    ];

    let x = M + 2;
    vals.forEach((val, i) => {
      if (i === 3) { doc.setTextColor(...(m.netCashFlow < 0 ? C.rHigh : C.text)); doc.setFont("helvetica", "normal"); }
      else if (i === 4) { doc.setTextColor(...(m.negative ? C.rHigh : m.belowBuffer ? C.rMed : C.text)); doc.setFont("helvetica", "bold"); }
      else if (i === 5) { doc.setTextColor(...(m.negative ? C.rHigh : m.belowBuffer ? C.rMed : C.rLow)); doc.setFont("helvetica", "normal"); }
      else { doc.setTextColor(...C.text); doc.setFont("helvetica", "normal"); }
      doc.text(val, x, y + 4);
      x += colW[i] ?? 0;
    });

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.12);
    doc.line(M, y + rh, M + tw, y + rh);
    y += rh;
  });

  return y + 6;
}

/* ── Section 8: Recommendations ── */

function drawRecommendations(doc: jsPDF, y: number, recs: Recommendation[]): number {
  y = secTitle(doc, "Recommended next steps", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  const sub = "Generated from your simulation results using fixed rules, not AI. Not financial advice.";
  const sl = doc.splitTextToSize(sub, CW);
  doc.text(sl, M, y);
  y += (sl.length as number) * LH_S + 3;

  if (recs.length === 0) {
    y = body(doc, "Your projection is stable — no balance falls below your safety buffer within this horizon. No specific recommendation is needed based on the data entered.", y);
    return y + 4;
  }

  for (const rec of recs) {
    const pc = rec.priority === "High" ? C.rHigh : rec.priority === "Medium" ? C.rMed : C.rLow;
    y = ensure(doc, y, 30);
    const cardTop = y;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...C.text);
    const tl = doc.splitTextToSize(rec.title, CW - 28);
    doc.text(tl, M, y + 4);

    // Priority badge
    const pl = `${rec.priority} priority`;
    const pw = doc.getTextWidth(pl) + 6;
    doc.setFillColor(...pc);
    doc.roundedRect(M + CW - pw, y + 0.5, pw, 5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(pl, M + CW - pw / 2, y + 4, { align: "center" });

    y += (tl.length as number) * LH + 2;

    // Why selected
    y = subH(doc, "Why this was selected", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.text);
    for (const reason of rec.triggerReasons) {
      y = ensure(doc, y, LH_S);
      const rl = doc.splitTextToSize(`- ${reason}`, CW - 4);
      doc.text(rl, M + 2, y);
      y += (rl.length as number) * LH_S;
    }
    y += 2;

    // Action steps
    y = subH(doc, "Action steps", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.text);
    rec.actionSteps.forEach((s, i) => {
      y = ensure(doc, y, LH_S);
      const rl = doc.splitTextToSize(`${i + 1}. ${s.text}`, CW - 6);
      doc.text(rl, M + 4, y);
      y += (rl.length as number) * LH_S;
    });
    y += 2;

    // Expected impact
    y = subH(doc, "Expected impact", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.text);
    const il = doc.splitTextToSize(rec.expectedImpact, CW - 4);
    doc.text(il, M + 2, y);
    y += (il.length as number) * LH_S + 1;

    if (rec.impactStatus === "not_quantified") {
      y = ensure(doc, y, LH_S);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(...C.rMed);
      doc.text("This impact cannot be quantified by the current simulation engine.", M + 2, y);
      y += LH_S;
    }

    // Limitations
    if (rec.limitations.length > 0) {
      y = subH(doc, "Limitations", y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...C.muted);
      for (const lim of rec.limitations) {
        y = ensure(doc, y, LH_S);
        const rl = doc.splitTextToSize(`- ${lim}`, CW - 4);
        doc.text(rl, M + 2, y);
        y += (rl.length as number) * LH_S;
      }
    }

    // Missing info
    if (rec.missingInformation.length > 0) {
      y += 1;
      y = subH(doc, "Information needed", y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...C.muted);
      for (const info of rec.missingInformation) {
        y = ensure(doc, y, LH_S);
        const rl = doc.splitTextToSize(`- ${info}`, CW - 4);
        doc.text(rl, M + 2, y);
        y += (rl.length as number) * LH_S;
      }
    }

    // Card border
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(M - 1, cardTop - 1, CW + 2, y - cardTop + 3, 1, 1, "S");
    y += 6;
  }

  return y;
}

/* ── Footer: disclaimer + page numbers ── */

function drawFooter(doc: jsPDF): void {
  const pc = doc.getNumberOfPages();
  for (let p = 1; p <= pc; p++) {
    doc.setPage(p);
    let y = PH - M - 8;
    if (p === pc) {
      // Disclaimer on last page
      y = ensure(doc, y, 16);
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.4);
      doc.line(M, y, M + CW, y);
      y += 4;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.5);
      doc.setTextColor(...C.muted);
      const disc = "This report is generated by SafeFlow AI from the numbers you entered. Projections are mechanical estimates, not guarantees. Recommendations are produced by fixed rules, not AI, and are not financial advice. Real-world results depend on factors a simulation cannot capture. Consult a qualified financial advisor before making decisions.";
      const dl = doc.splitTextToSize(disc, CW);
      doc.text(dl, M, y);
    }
    // Page number
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.lightMuted);
    doc.text(`SafeFlow AI — Cash-flow resilience report  |  Page ${p} of ${pc}`, PW - M, PH - 5, { align: "right" });
  }
}

/* ── Helpers ── */

function ensure(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PH - M - 10) { doc.addPage(); return M; }
  return y;
}

function secTitle(doc: jsPDF, title: string, y: number): number {
  y = ensure(doc, y, 12);
  doc.setFillColor(...C.navy);
  doc.rect(M, y - 1, 2, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...C.navy);
  doc.text(title, M + 5, y + 3);
  y += 6;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.line(M, y, M + CW, y);
  return y + 3.5;
}

function subH(doc: jsPDF, text: string, y: number): number {
  y = ensure(doc, y, LH_S + 1);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.muted);
  doc.text(text, M, y);
  return y + LH_S;
}

function body(doc: jsPDF, text: string, y: number): number {
  y = ensure(doc, y, LH * 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.text);
  const l = doc.splitTextToSize(text, CW);
  doc.text(l, M, y);
  y += (l.length as number) * LH;
  return y;
}

function kvRow(doc: jsPDF, key: string, value: string, y: number): number {
  y = ensure(doc, y, LH + 1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.muted);
  doc.text(key, M, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.text);
  doc.text(value, M + 65, y);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.12);
  doc.line(M, y + 1.5, M + CW, y + 1.5);
  return y + LH + 1;
}

function drawLeg(doc: jsPDF, x: number, y: number, color: [number, number, number], label: string): void {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.line(x, y, x + 5, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...C.text);
  doc.text(label, x + 7, y + 1);
}

function drawLegDash(doc: jsPDF, x: number, y: number, color: [number, number, number], label: string): void {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([2, 1], 0);
  doc.line(x, y, x + 5, y);
  doc.setLineDashPattern([], 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...C.text);
  doc.text(label, x + 7, y + 1);
}

function legW(doc: jsPDF, label: string): number {
  return 7 + doc.getTextWidth(label) + 3;
}
