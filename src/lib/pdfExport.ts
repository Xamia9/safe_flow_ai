import { jsPDF } from "jspdf";
import type { FinancialProfile, MonthProjection, Scenario, SimulationResult } from "@/types/financial";
import { simulate, compareScenarios } from "./financialCalculations";
import { type Recommendation } from "./recommendations";
import { describeScenario, type ScenarioSummary } from "./scenarioUpdates";
import { localizedRecommendations, localizedPriorityLabel } from "./localizedRecommendations";
import { localizedRiskReasons, localizedScenarioLabel } from "./localizedContent";
import type { TranslateFn as T } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

/* ── Page constants ── */
const PW = 210;
const PH = 297;
const M = 16;
const CW = PW - M * 2;
const LH = 5;
const LH_S = 4.2;
const CHART_PAD = 4;

/* ── Font management ──
 * jsPDF's built-in "helvetica" uses WinAnsi encoding which cannot render
 * Vietnamese diacritics. We fetch and embed Roboto TTF (full Unicode coverage
 * including Vietnamese) at export time, then use it for all text. */
const FONT_URLS = {
  regular: "https://cdn.jsdelivr.net/gh/googlefonts/roboto/src/hinted/Roboto-Regular.ttf",
  bold: "https://cdn.jsdelivr.net/gh/googlefonts/roboto/src/hinted/Roboto-Bold.ttf",
  italic: "https://cdn.jsdelivr.net/gh/googlefonts/roboto/src/hinted/Roboto-Italic.ttf",
};

type FontData = { regular: string; bold: string; italic: string };
let fontCache: FontData | null = null;
let fontFetchPromise: Promise<FontData> | null = null;

async function fetchFontBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load font: ${url}`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

async function loadFonts(): Promise<FontData> {
  if (fontCache) return fontCache;
  if (fontFetchPromise) return fontFetchPromise;
  fontFetchPromise = (async () => {
    const [regular, bold, italic] = await Promise.all([
      fetchFontBase64(FONT_URLS.regular),
      fetchFontBase64(FONT_URLS.bold),
      fetchFontBase64(FONT_URLS.italic),
    ]);
    fontCache = { regular, bold, italic };
    return fontCache;
  })();
  return fontFetchPromise;
}

const FONT_NAME = "Roboto";

async function createPdfDoc(): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const fonts = await loadFonts();
  doc.addFileToVFS("Roboto-Regular.ttf", fonts.regular);
  doc.addFileToVFS("Roboto-Bold.ttf", fonts.bold);
  doc.addFileToVFS("Roboto-Italic.ttf", fonts.italic);
  doc.addFont("Roboto-Regular.ttf", FONT_NAME, "normal");
  doc.addFont("Roboto-Bold.ttf", FONT_NAME, "bold");
  doc.addFont("Roboto-Italic.ttf", FONT_NAME, "italic");
  return doc;
}

/* ── Colors ── */
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

export async function exportSimulationPdf(profile: FinancialProfile, scenario: Scenario, t: T): Promise<void> {
  if (!profile || !scenario || scenario.horizon <= 0) return;

  const result = simulate(profile, scenario);
  const baseline = compareScenarios(profile, scenario).baseline;
  const summary = describeScenario(scenario);
  const recs = localizedRecommendations({ profile, scenario, result }, t);
  const now = new Date();

  const doc = await createPdfDoc();
  let y = drawHeader(doc, scenario, now, t);
  y = drawInputSummary(doc, y, profile, t);
  y = drawScenario(doc, y, scenario, summary, t);
  y = drawKeyResults(doc, y, result, profile, t);
  y = drawBalanceChart(doc, y, result.months, baseline.months, profile.safetyBuffer, localizedScenarioLabel(scenario, t), t);
  y = drawIncomeOutflowChart(doc, y, result.months, t);
  y = drawMonthlyTable(doc, y, result.months, t);
  y = drawRecommendations(doc, y, recs, t);
  drawFooter(doc, t);

  doc.save(`safeflow-report-${now.toISOString().slice(0, 10)}.pdf`);
}

/* ── Font helpers ── */
function setFont(doc: jsPDF, style: "normal" | "bold" | "italic", size: number): void {
  doc.setFont(FONT_NAME, style);
  doc.setFontSize(size);
}

/* ── Text width measurement that respects current font settings ── */
function textW(doc: jsPDF, text: string): number {
  return doc.getTextWidth(text);
}

/* ── Split text to width, returning string[] ── */
function splitText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function drawHeader(doc: jsPDF, scenario: Scenario, now: Date, t: T): number {
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, PW, 26, "F");

  setFont(doc, "bold", 19);
  doc.setTextColor(...C.white);
  doc.text("SafeFlow AI", M, 12);

  setFont(doc, "normal", 8.5);
  doc.setTextColor(175, 190, 210);
  doc.text(t("pdf.reportTitle"), M, 18);

  const ds = now.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  const ts = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  setFont(doc, "normal", 7.5);
  doc.text(t("pdf.generated", { date: ds, time: ts }), M, 23);
  doc.text(t("pdf.horizon", { n: scenario.horizon }), PW - M, 23, { align: "right" });

  return 32;
}

const FIELD_KEYS: (keyof FinancialProfile)[] = [
  "monthlyIncome", "lowSeasonIncome", "essentialExpenses",
  "openingBalance", "debtPayments", "flexibleExpenses",
];
const FIELD_LABELS: Record<string, TranslationKey> = {
  monthlyIncome: "input.fMonthlyIncome",
  lowSeasonIncome: "input.fLowSeasonIncome",
  essentialExpenses: "input.fEssentialExpenses",
  openingBalance: "input.fOpeningBalance",
  debtPayments: "input.fDebtPayments",
  flexibleExpenses: "input.fFlexibleExpenses",
};

function drawInputSummary(doc: jsPDF, y: number, profile: FinancialProfile, t: T): number {
  y = secTitleKeep(doc, t("pdf.inputSummary"), y, 20);
  setFont(doc, "normal", 7.5);
  doc.setTextColor(...C.muted);
  const noteLines = splitText(doc, t("pdf.inputNote"), CW);
  doc.text(noteLines, M, y);
  y += (noteLines.length as number) * LH_S + 2;

  const colW = CW / 2;
  const rowH = 9;
  let col = 0;
  let rowY = y;

  for (const key of FIELD_KEYS) {
    if (rowY + rowH > PH - M - 12) { doc.addPage(); rowY = M; }
    const x = M + col * colW;
    const val = profile[key];
    const isOptional = key === "flexibleExpenses";
    const disp = (isOptional && (val === null || val === undefined)) ? "0 VND" : vnd(typeof val === "number" ? val : 0);

    setFont(doc, "normal", 7.5);
    doc.setTextColor(...C.muted);
    const labelLines = splitText(doc, t(FIELD_LABELS[key]!), colW - 6);
    doc.text(labelLines[0] as string, x + 2, rowY);

    setFont(doc, "bold", 9);
    doc.setTextColor(...C.text);
    const valLines = splitText(doc, disp, colW - 6);
    doc.text(valLines[0] as string, x + 2, rowY + 4.5);

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.line(x + 2, rowY + 6, x + colW - 4, rowY + 6);

    col++;
    if (col >= 2) { col = 0; rowY += rowH; }
  }
  if (col > 0) rowY += rowH;
  y = rowY + 1;

  // Safety buffer box — measure label width to position value without overlap
  y = ensure(doc, y, 14);
  setFont(doc, "bold", 8.5);
  const bufLabel = t("pdf.safetyBuffer");
  const bufLabelW = textW(doc, bufLabel);
  const bufVal = vnd(profile.safetyBuffer);
  const bufValW = textW(doc, bufVal);
  const boxH = Math.max(11, bufLabelW + bufValW + 12 > CW - 8 ? 14 : 11);

  doc.setFillColor(...C.navySoft);
  doc.roundedRect(M, y, CW, boxH, 2, 2, "F");
  doc.setTextColor(...C.navy);
  doc.text(bufLabel, M + 4, y + 5);

  // Position value after label, or on next line if too wide
  if (bufLabelW + bufValW + 8 < CW - 8) {
    doc.text(bufVal, M + 4 + bufLabelW + 6, y + 5);
  } else {
    setFont(doc, "bold", 8.5);
    doc.text(bufVal, M + 4, y + 9.5);
  }

  setFont(doc, "normal", 7);
  doc.setTextColor(...C.muted);
  const bufNoteLines = splitText(doc, t("pdf.safetyBufferNote"), CW - 8);
  const noteY = bufLabelW + bufValW + 8 < CW - 8 ? y + 9 : y + 13;
  doc.text(bufNoteLines, M + 4, noteY);

  return y + boxH + 4;
}

function drawScenario(doc: jsPDF, y: number, sc: Scenario, sm: ScenarioSummary, t: T): number {
  y = secTitleKeep(doc, t("pdf.scenarioAssumptions"), y, 20);
  y = kvRow(doc, t("pdf.scenarioType"), localizedScenarioLabel(sc, t), y);
  y = kvRow(doc, t("pdf.forecastHorizon"), t("format.monthsValue", { n: sc.horizon }), y);
  if (sm.reductionPct !== null) y = kvRow(doc, t("pdf.incomeReduction"), `${sm.reductionPct}%`, y);
  if (sm.affectedMonths) y = kvRow(doc, t("pdf.affectedMonths"), sm.affectedMonths, y);
  for (const e of sm.expenses) y = kvRow(doc, t("pdf.unexpectedExpenseMonth", { n: e.month }), vnd(e.amount), y);

  y = ensure(doc, y, 16);
  setFont(doc, "bold", 8);
  doc.setTextColor(...C.teal);
  doc.text(t("pdf.riskClassification"), M + 4, y + 4.5);
  setFont(doc, "normal", 7);
  doc.setTextColor(...C.text);
  const rn = t("pdf.riskNote");
  const rl = splitText(doc, rn, CW - 8);
  doc.text(rl, M + 4, y + 7.5);
  y += 14 + (rl.length - 1) * 3.2 + 2;

  return y + 2;
}

function drawKeyResults(doc: jsPDF, y: number, r: SimulationResult, p: FinancialProfile, t: T): number {
  y = secTitleKeep(doc, t("pdf.keyResults"), y, 24);

  const rc = r.risk.level === "High" ? { bg: C.rHighSoft, fg: C.rHigh }
    : r.risk.level === "Medium" ? { bg: C.rMedSoft, fg: C.rMed }
    : { bg: C.rLowSoft, fg: C.rLow };
  y = ensure(doc, y, 14);

  const riskLabel = t("pdf.riskLevel", { level: r.risk.level });
  setFont(doc, "bold", 9.5);
  const riskLabelW = textW(doc, riskLabel);
  const riskReasons = localizedRiskReasons(r, t);
  const rrt = riskReasons.join("  ");
  const riskBoxH = 10;

  doc.setFillColor(...rc.bg);
  doc.roundedRect(M, y, CW, riskBoxH, 2, 2, "F");
  setFont(doc, "bold", 9.5);
  doc.setTextColor(...rc.fg);
  doc.text(riskLabel, M + 4, y + 6);

  // Place risk reasons after the label, wrapping if needed
  const reasonsMaxW = CW - riskLabelW - 12;
  setFont(doc, "normal", 7);
  doc.setTextColor(...C.muted);
  if (reasonsMaxW > 40) {
    const rrl = splitText(doc, rrt, reasonsMaxW);
    doc.text(rrl, M + 4 + riskLabelW + 6, y + 6);
  } else {
    // Not enough room — put reasons on next line
    const rrl = splitText(doc, rrt, CW - 8);
    doc.text(rrl, M + 4, y + 9);
  }
  y += riskBoxH + 4;

  interface Kpi { label: string; value: string; hint?: string | undefined; tone?: [number, number, number] | undefined }
  const kpis: Kpi[] = [
    { label: t("pdf.lowestBalance"), value: vnd(r.lowestBalance), hint: r.lowestBalanceMonth ? t("pdf.monthN", { n: r.lowestBalanceMonth }) : undefined, tone: r.lowestBalance < 0 ? C.rHigh : r.lowestBalance < p.safetyBuffer ? C.rMed : C.rLow },
    { label: t("pdf.endingBalance"), value: vnd(r.endingBalance), tone: r.endingBalance < 0 ? C.rHigh : r.endingBalance < p.safetyBuffer ? C.rMed : C.rLow },
    { label: t("pdf.maxMonthlyGap"), value: vnd(r.maxMonthlyGap), hint: t("pdf.beforeSavings") },
    { label: t("pdf.maxReserveDeficit"), value: vnd(r.maxReserveDeficit), hint: t("pdf.shortfallBelowZero") },
    { label: t("pdf.runwayZero"), value: r.runwayMonthsZeroIncome === Infinity ? t("format.unlimited") : t("format.monthsValue", { n: (Math.floor(r.runwayMonthsZeroIncome * 10) / 10).toFixed(1) }) },
    { label: t("pdf.minIncomeNeeded"), value: vnd(r.minimumIncomeNeeded), hint: t("pdf.essentialsDebtMo") },
  ];
  if (r.firstMonthBelowBuffer !== null) kpis.push({ label: t("pdf.firstBelowBuffer"), value: t("pdf.monthN", { n: r.firstMonthBelowBuffer }), tone: C.rMed });
  if (r.firstNegativeMonth !== null) kpis.push({ label: t("pdf.firstNegative"), value: t("pdf.monthN", { n: r.firstNegativeMonth }), tone: C.rHigh });

  const cardW = (CW - 8) / 3;
  const cardH = 16;
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

    setFont(doc, "normal", 6.5);
    doc.setTextColor(...C.muted);
    const ll = splitText(doc, k.label, cardW - 8);
    doc.text(ll[0] as string, cx + 4, cy + 4);

    setFont(doc, "bold", 9);
    doc.setTextColor(...(k.tone ?? C.text));
    const vl = splitText(doc, k.value, cardW - 8);
    doc.text(vl[0] as string, cx + 4, cy + 9.5);

    if (k.hint) {
      setFont(doc, "normal", 6);
      doc.setTextColor(...C.lightMuted);
      const hl = splitText(doc, k.hint, cardW - 8);
      doc.text(hl[0] as string, cx + 4, cy + 13.5);
    }
  });

  y += cardH + gap + 4;
  return y;
}

function drawBalanceChart(doc: jsPDF, y: number, active: MonthProjection[], baseline: MonthProjection[], buffer: number, label: string, t: T): number {
  y = secTitleKeep(doc, t("pdf.projectedCashBalance"), y, 70);
  const ch = 52;
  y = ensure(doc, y, ch + 16);

  const cx = M + CHART_PAD;
  const cy = y;
  const cw = CW - CHART_PAD * 2;
  const ih = ch - 14;
  const iw = cw - 38;

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

  const plotL = cx + 32;
  const plotR = cx + cw - 6;
  const tY = (v: number) => cy + 3 + ih - ((v - lo) / sp) * ih;
  const tX = (m: number) => plotL + ((m - 1) / Math.max(1, active.length - 1)) * iw;

  for (let tt = 0; tt <= 4; tt++) {
    const v = lo + (sp * tt) / 4;
    const gy = tY(v);
    doc.setDrawColor(...C.cGrid);
    doc.setLineWidth(0.2);
    doc.line(plotL, gy, plotR, gy);
    setFont(doc, "normal", 5.5);
    doc.setTextColor(...C.muted);
    doc.text(vndS(v), cx + 30, gy + 1, { align: "right" });
  }

  if (lo < 0 && hi > 0) {
    const zy = tY(0);
    doc.setDrawColor(...C.cZero);
    doc.setLineWidth(0.4);
    doc.line(plotL, zy, plotR, zy);
    setFont(doc, "normal", 5.5);
    doc.setTextColor(...C.cZero);
    doc.text(t("pdf.zeroBalance"), plotL + 1, zy - 1);
  }

  const by = tY(buffer);
  if (by >= cy + 3 && by <= cy + 3 + ih) {
    doc.setDrawColor(...C.cBuffer);
    doc.setLineWidth(0.4);
    doc.setLineDashPattern([2, 1.5], 0);
    doc.line(plotL, by, plotR, by);
    doc.setLineDashPattern([], 0);
    setFont(doc, "normal", 5.5);
    doc.setTextColor(...C.cBuffer);
    doc.text(t("pdf.bufferShort", { amount: vndS(buffer) }), plotR - 1, by - 1, { align: "right" });
  }

  doc.setDrawColor(...C.cBase);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([3, 2], 0);
  for (let i = 1; i < baseline.length; i++) {
    const p0 = baseline[i - 1];
    const p1 = baseline[i];
    if (p0 && p1) doc.line(tX(p0.month), tY(p0.closingBalance), tX(p1.month), tY(p1.closingBalance));
  }
  doc.setLineDashPattern([], 0);

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

  setFont(doc, "normal", 5.5);
  doc.setTextColor(...C.muted);
  active.forEach(m => doc.text(`M${m.month}`, tX(m.month), cy + ch - 2.5, { align: "center" }));

  const ly = cy + ch + 2;
  let lx = cx + 4;
  drawLeg(doc, lx, ly, C.cActive, label); lx += legW(doc, label) + 8;
  drawLegDash(doc, lx, ly, C.cBase, t("pdf.baseline")); lx += legW(doc, t("pdf.baseline")) + 8;
  drawLegDash(doc, lx, ly, C.cBuffer, t("pdf.safetyBufferLabel")); lx += legW(doc, t("pdf.safetyBufferLabel")) + 8;
  drawLeg(doc, lx, ly, C.cZero, t("pdf.zeroBalance"));

  return ly + 7;
}

function drawIncomeOutflowChart(doc: jsPDF, y: number, months: MonthProjection[], t: T): number {
  y = secTitleKeep(doc, t("pdf.monthlyIncomeOutflow"), y, 64);
  const ch = 48;
  y = ensure(doc, y, ch + 14);

  const cx = M + CHART_PAD;
  const cy = y;
  const cw = CW - CHART_PAD * 2;
  const ih = ch - 12;
  const iw = cw - 38;

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

  const plotL = cx + 32;
  const plotR = cx + cw - 6;
  const tY = (v: number) => cy + 3 + ih - ((v - lo) / sp) * ih;
  const tX = (m: number) => plotL + ((m - 1) / Math.max(1, months.length - 1)) * iw;

  for (let tt = 0; tt <= 3; tt++) {
    const v = lo + (sp * tt) / 3;
    const gy = tY(v);
    doc.setDrawColor(...C.cGrid);
    doc.setLineWidth(0.2);
    doc.line(plotL, gy, plotR, gy);
    setFont(doc, "normal", 5.5);
    doc.setTextColor(...C.muted);
    doc.text(vndS(v), cx + 30, gy + 1, { align: "right" });
  }

  doc.setDrawColor(...C.cIncome);
  doc.setLineWidth(0.8);
  for (let i = 1; i < months.length; i++) {
    const p0 = months[i - 1];
    const p1 = months[i];
    if (p0 && p1) doc.line(tX(p0.month), tY(p0.income), tX(p1.month), tY(p1.income));
  }
  months.forEach(m => { doc.setFillColor(...C.cIncome); doc.circle(tX(m.month), tY(m.income), 0.6, "F"); });

  doc.setDrawColor(...C.cOutflow);
  doc.setLineWidth(0.8);
  for (let i = 1; i < months.length; i++) {
    const p0 = months[i - 1];
    const p1 = months[i];
    if (p0 && p1) doc.line(tX(p0.month), tY(p0.outflow), tX(p1.month), tY(p1.outflow));
  }
  months.forEach(m => { doc.setFillColor(...C.cOutflow); doc.circle(tX(m.month), tY(m.outflow), 0.6, "F"); });

  setFont(doc, "normal", 5.5);
  doc.setTextColor(...C.muted);
  months.forEach(m => doc.text(`M${m.month}`, tX(m.month), cy + ch - 2.5, { align: "center" }));

  const ly = cy + ch + 2;
  let lx = cx + 4;
  drawLeg(doc, lx, ly, C.cIncome, t("pdf.incomeAdjusted")); lx += legW(doc, t("pdf.incomeAdjusted")) + 8;
  drawLeg(doc, lx, ly, C.cOutflow, t("pdf.outflow"));

  return ly + 7;
}

function drawMonthlyTable(doc: jsPDF, y: number, months: MonthProjection[], t: T): number {
  y = secTitleKeep(doc, t("pdf.monthlyCashFlow"), y, 18);

  const headers = [t("pdf.colMonth"), t("pdf.colIncome"), t("pdf.colOutflow"), t("pdf.colNetFlow"), t("pdf.colClosing"), t("pdf.colStatus")];
  // Widen status column for Vietnamese text, narrow others slightly
  const colW = [12, 29, 29, 29, 36, 32];
  const tw = colW.reduce((a, b) => a + b, 0);
  const rh = 7;

  function headerRow(yP: number): number {
    y = ensure(doc, yP, rh + 1);
    doc.setFillColor(...C.thBg);
    doc.rect(M, y, tw, rh, "F");
    setFont(doc, "bold", 7);
    doc.setTextColor(...C.thText);
    let x = M + 2;
    headers.forEach((h, i) => {
      const lines = splitText(doc, h, colW[i]! - 2);
      doc.text(lines[0] as string, x, y + 4);
      x += colW[i]!;
    });
    return y + rh;
  }

  y = headerRow(y);
  setFont(doc, "normal", 7);

  months.forEach((m, idx) => {
    y = ensure(doc, y, rh);
    if (y === M) {
      y = headerRow(y);
      setFont(doc, "normal", 7);
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
      m.negative ? t("pdf.statusNegative") : m.belowBuffer ? t("pdf.statusBelow") : t("pdf.statusAbove"),
    ];

    let x = M + 2;
    vals.forEach((val, i) => {
      if (i === 3) { doc.setTextColor(...(m.netCashFlow < 0 ? C.rHigh : C.text)); setFont(doc, "normal", 7); }
      else if (i === 4) { doc.setTextColor(...(m.negative ? C.rHigh : m.belowBuffer ? C.rMed : C.text)); setFont(doc, "bold", 7); }
      else if (i === 5) { doc.setTextColor(...(m.negative ? C.rHigh : m.belowBuffer ? C.rMed : C.rLow)); setFont(doc, "normal", 7); }
      else { doc.setTextColor(...C.text); setFont(doc, "normal", 7); }
      // Truncate if value is wider than column
      const colWidth = colW[i]!;
      let text = val;
      if (textW(doc, text) > colWidth - 2) {
        const lines = splitText(doc, text, colWidth - 2);
        text = lines[0] as string;
      }
      doc.text(text, x, y + 4.5);
      x += colWidth;
    });

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.12);
    doc.line(M, y + rh, M + tw, y + rh);
    y += rh;
  });

  return y + 6;
}

function drawRecommendations(doc: jsPDF, y: number, recs: Recommendation[], t: T): number {
  y = secTitleKeep(doc, t("pdf.recommendedNextSteps"), y, 24);
  setFont(doc, "normal", 7);
  doc.setTextColor(...C.muted);
  const sub = t("pdf.recIntro");
  const sl = splitText(doc, sub, CW);
  doc.text(sl, M, y);
  y += (sl.length as number) * LH_S + 3;

  if (recs.length === 0) {
    y = body(doc, t("pdf.stableProjection"), y);
    return y + 4;
  }

  const RX = M + 3;
  const RW = CW - 6;
  const BW = RW - 6;

  for (let ri = 0; ri < recs.length; ri++) {
    const rec = recs[ri]!;
    const pc = rec.priority === "High" ? C.rHigh : rec.priority === "Medium" ? C.rMed : C.rLow;

    const estH = estimateRecHeight(doc, rec, RW, BW);
    const availSpace = PH - M - 10 - y;
    if (availSpace < estH * 0.4 && availSpace < 40) {
      doc.addPage();
      y = M;
    }
    y = ensure(doc, y, 20);

    setFont(doc, "bold", 9.5);
    doc.setTextColor(...C.text);
    const tl = splitText(doc, rec.title, RW - 26);
    doc.text(tl, RX, y + 4);

    const pl = t("pdf.priorityBadge", { priority: localizedPriorityLabel(rec.priority, t) });
    setFont(doc, "bold", 6.5);
    const pw = textW(doc, pl) + 6;
    doc.setFillColor(...pc);
    doc.roundedRect(M + CW - pw - 2, y + 0.5, pw, 5, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(pl, M + CW - pw / 2 - 2, y + 4, { align: "center" });

    y += (tl.length as number) * LH + 2;

    y = subH2(doc, t("pdf.whySelected"), y, RX);
    setFont(doc, "normal", 7.5);
    doc.setTextColor(...C.text);
    for (const reason of rec.triggerReasons) {
      y = ensure(doc, y, LH_S);
      const rl = splitText(doc, `\u2022  ${reason}`, BW);
      doc.text(rl, RX + 3, y);
      y += (rl.length as number) * LH_S;
    }
    y += 2;

    y = subH2(doc, t("pdf.actionSteps"), y, RX);
    setFont(doc, "normal", 7.5);
    doc.setTextColor(...C.text);
    rec.actionSteps.forEach((s, i) => {
      y = ensure(doc, y, LH_S);
      const rl = splitText(doc, `${i + 1}.  ${s.text}`, BW);
      doc.text(rl, RX + 3, y);
      y += (rl.length as number) * LH_S;
    });
    y += 2;

    y = subH2(doc, t("pdf.expectedImpact"), y, RX);
    setFont(doc, "normal", 7.5);
    doc.setTextColor(...C.text);
    const il = splitText(doc, rec.expectedImpact, BW);
    doc.text(il, RX + 3, y);
    y += (il.length as number) * LH_S + 1;

    if (rec.impactStatus === "not_quantified") {
      y = ensure(doc, y, LH_S);
      setFont(doc, "italic", 7);
      doc.setTextColor(...C.rMed);
      const nl = splitText(doc, t("ap.impactNotQuantified"), BW);
      doc.text(nl, RX + 3, y);
      y += (nl.length as number) * LH_S;
    }

    if (rec.limitations.length > 0) {
      y = subH2(doc, t("pdf.limitations"), y, RX);
      setFont(doc, "normal", 7);
      doc.setTextColor(...C.muted);
      for (const lim of rec.limitations) {
        y = ensure(doc, y, LH_S);
        const rl = splitText(doc, `\u2022  ${lim}`, BW);
        doc.text(rl, RX + 3, y);
        y += (rl.length as number) * LH_S;
      }
    }

    if (rec.missingInformation.length > 0) {
      y += 1;
      y = subH2(doc, t("pdf.informationNeeded"), y, RX);
      setFont(doc, "normal", 7);
      doc.setTextColor(...C.muted);
      for (const info of rec.missingInformation) {
        y = ensure(doc, y, LH_S);
        const rl = splitText(doc, `\u2022  ${info}`, BW);
        doc.text(rl, RX + 3, y);
        y += (rl.length as number) * LH_S;
      }
    }

    if (ri < recs.length - 1) {
      y += 3;
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.2);
      doc.line(M, y, M + CW, y);
      y += 5;
    } else {
      y += 4;
    }
  }

  return y;
}

function drawFooter(doc: jsPDF, t: T): void {
  const pc = doc.getNumberOfPages();
  for (let p = 1; p <= pc; p++) {
    doc.setPage(p);
    let y = PH - M - 8;
    if (p === pc) {
      y = ensure(doc, y, 16);
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.4);
      doc.line(M, y, M + CW, y);
      y += 4;
      setFont(doc, "italic", 6.5);
      doc.setTextColor(...C.muted);
      const disc = t("pdf.disclaimer");
      const dl = splitText(doc, disc, CW);
      doc.text(dl, M, y);
    }
    setFont(doc, "normal", 6.5);
    doc.setTextColor(...C.lightMuted);
    doc.text(t("pdf.pageFooter", { p, pc }), PW - M, PH - 5, { align: "right" });
  }
}

function ensure(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PH - M - 10) { doc.addPage(); return M; }
  return y;
}

function secTitle(doc: jsPDF, title: string, y: number): number {
  y = ensure(doc, y, 12);
  doc.setFillColor(...C.navy);
  doc.rect(M, y - 1, 2, 5.5, "F");
  setFont(doc, "bold", 11.5);
  doc.setTextColor(...C.navy);
  // Wrap long Vietnamese section titles
  const titleLines = splitText(doc, title, CW - 5);
  doc.text(titleLines[0] as string, M + 5, y + 3);
  y += 6;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.line(M, y, M + CW, y);
  return y + 3.5;
}

function secTitleKeep(doc: jsPDF, title: string, y: number, minContent: number): number {
  const headingH = 12;
  if (y + headingH + minContent > PH - M - 10) { doc.addPage(); y = M; }
  return secTitle(doc, title, y);
}

function subH2(doc: jsPDF, text: string, y: number, x: number): number {
  y = ensure(doc, y, LH_S + 1);
  setFont(doc, "bold", 7.5);
  doc.setTextColor(...C.muted);
  doc.text(text, x, y);
  return y + LH_S;
}

function estimateRecHeight(doc: jsPDF, rec: Recommendation, rw: number, bw: number): number {
  let h = 0;
  const tl = splitText(doc, rec.title, rw - 26);
  h += (tl.length as number) * LH + 2;
  h += LH_S;
  for (const r of rec.triggerReasons) {
    const rl = splitText(doc, `\u2022  ${r}`, bw);
    h += (rl.length as number) * LH_S;
  }
  h += 2;
  h += LH_S;
  for (const s of rec.actionSteps) {
    const rl = splitText(doc, `1.  ${s.text}`, bw);
    h += (rl.length as number) * LH_S;
  }
  h += 2;
  h += LH_S;
  const il = splitText(doc, rec.expectedImpact, bw);
  h += (il.length as number) * LH_S + 1;
  if (rec.impactStatus === "not_quantified") h += LH_S;
  if (rec.limitations.length > 0) {
    h += LH_S;
    for (const l of rec.limitations) {
      const rl = splitText(doc, `\u2022  ${l}`, bw);
      h += (rl.length as number) * LH_S;
    }
  }
  if (rec.missingInformation.length > 0) {
    h += 1 + LH_S;
    for (const info of rec.missingInformation) {
      const rl = splitText(doc, `\u2022  ${info}`, bw);
      h += (rl.length as number) * LH_S;
    }
  }
  h += 8;
  return h;
}

function body(doc: jsPDF, text: string, y: number): number {
  y = ensure(doc, y, LH * 2);
  setFont(doc, "normal", 7.5);
  doc.setTextColor(...C.text);
  const l = splitText(doc, text, CW);
  doc.text(l, M, y);
  y += (l.length as number) * LH;
  return y;
}

function kvRow(doc: jsPDF, key: string, value: string, y: number): number {
  y = ensure(doc, y, LH + 1);
  setFont(doc, "normal", 8.5);
  doc.setTextColor(...C.muted);
  const keyLines = splitText(doc, key, 60);
  doc.text(keyLines, M, y);
  setFont(doc, "bold", 8.5);
  doc.setTextColor(...C.text);
  // Position value at fixed offset; if value is too long, wrap it
  const valMaxW = CW - 65;
  const valLines = splitText(doc, value, valMaxW);
  doc.text(valLines[0] as string, M + 65, y);
  // If value wrapped to multiple lines, advance for extra lines
  if (valLines.length > 1) {
    y += (valLines.length - 1) * LH_S;
  }
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.12);
  doc.line(M, y + 1.5, M + CW, y + 1.5);
  return y + LH + 1;
}

function drawLeg(doc: jsPDF, x: number, y: number, color: [number, number, number], label: string): void {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.line(x, y, x + 5, y);
  setFont(doc, "normal", 6);
  doc.setTextColor(...C.text);
  doc.text(label, x + 7, y + 1);
}

function drawLegDash(doc: jsPDF, x: number, y: number, color: [number, number, number], label: string): void {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([2, 1], 0);
  doc.line(x, y, x + 5, y);
  doc.setLineDashPattern([], 0);
  setFont(doc, "normal", 6);
  doc.setTextColor(...C.text);
  doc.text(label, x + 7, y + 1);
}

function legW(doc: jsPDF, label: string): number {
  return 7 + textW(doc, label) + 3;
}
