/**
 * Centralized translation dictionary for SafeFlow AI.
 *
 * English is the source of truth. Vietnamese translations are faithful,
 * professional, and use consistent financial terminology.
 *
 * Brand names (SafeFlow AI, Money Lover, Vietcombank, TPBank, Coursera,
 * Manulife, LNT & Partners, CFRC), URLs, currency values, numbers, route
 * paths and technical IDs are never translated.
 */

export type Language = "en" | "vi";

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
];

export const DEFAULT_LANGUAGE: Language = "en";

/**
 * The translation dictionary. Keys are grouped by namespace for readability
 * but flattened into a single map at lookup time. A missing Vietnamese key
 * falls back to the English value.
 */
export const en = {
  // ── Shared layout / navigation ──
  "nav.home": "Home",
  "nav.profile": "Profile & Scenario",
  "nav.dashboard": "Risk Dashboard",
  "nav.actionPlan": "Action Plan",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",
  "nav.language": "Language",
  "nav.languageEn": "English",
  "nav.languageVi": "Tiếng Việt",

  // ── Footer ──
  "footer.disclaimer":
    "SafeFlow AI is a planning and simulation tool, not financial advice. Projections are deterministic estimates based only on the figures you enter. Your data stays in this browser tab.",

  // ── Root error / not found ──
  "error.notFoundTitle": "Page not found",
  "error.notFoundBody":
    "The page you're looking for doesn't exist or has been moved.",
  "error.goHome": "Go home",
  "error.loadFailTitle": "This page didn't load",
  "error.loadFailBody":
    "Something went wrong on our end. You can try refreshing or head back home.",
  "error.tryAgain": "Try again",

  // ── Home page ──
  "home.metaTitle": "SafeFlow AI — Stress-test your personal cash flow",
  "home.metaDesc":
    "Simulate income shocks and unexpected costs month by month and see when your savings would run low. Guest-first, in VND.",
  "home.eyebrow": "Cash-flow resilience simulator",
  "home.heroTitle": "Know how long your money lasts — ",
  "home.heroTitleHighlight": "before something goes wrong.",
  "home.heroBody":
    "SafeFlow AI projects your month-end balance under the shocks you choose, using clear, deterministic formulas. No sign-up required.",
  "home.startSimulation": "Start a simulation",
  "home.startSimulationCaps": "Start a Simulation",
  "home.howItWorks": "How SafeFlow AI Works",
  "home.step1Eyebrow": "Step 1",
  "home.step1Heading": "Start with your financial picture",
  "home.step1Highlight": "financial picture",
  "home.step1Text":
    "Start with a few essential details about your income, living expenses, debt payments, and savings.",
  "home.step2Eyebrow": "Step 2",
  "home.step2Heading": "Explore possible futures",
  "home.step2Highlight": "possible futures",
  "home.step2Text":
    "Simulate income reductions, temporary interruptions, unexpected expenses, and combined financial shocks over the next 3, 6, or 12 months.",
  "home.step3Eyebrow": "Step 3",
  "home.step3Heading": "Understand your financial risk",
  "home.step3Highlight": "financial risk",
  "home.step3Text":
    "See how your projected balance changes over time, identify potential shortfalls, and understand why a risk level is assigned.",
  "home.step4Eyebrow": "Step 4",
  "home.step4Heading": "Turn insights into action",
  "home.step4Highlight": "into action",
  "home.step4Text":
    "Explore relevant solutions, test supported adjustments, and get AI-assisted explanations and practical next steps.",
  "home.whatDoes": "What SafeFlow does",
  "home.whatDoesNot": "What it does not do",
  "home.doesBullet1": "Projects month-end balances from your own figures",
  "home.doesBullet2": "Compares a baseline with your chosen scenario",
  "home.doesBullet3": "Explains exactly why a risk level was assigned",
  "home.doesNotBullet1":
    "No probabilities, credit scores or investment advice",
  "home.doesNotBullet2": "No account or bank connection required",
  "home.doesNotBullet3": "Your data is not stored on a server",
  "home.sloganPre": "See the risks. Understand your options. ",
  "home.sloganHighlight": "Move forward with confidence.",

  // ── Simulate stepper ──
  "stepper.ariaLabel": "Simulation steps",
  "stepper.profile": "Profile & Scenario",
  "stepper.dashboard": "Risk Dashboard",
  "stepper.actionPlan": "Action Plan",

  // ── Input page ──
  "input.metaTitle": "Financial Profile & Scenario — SafeFlow AI",
  "input.metaDesc":
    "Enter your income, expenses and savings, then choose a stress scenario to simulate.",
  "input.eyebrow": "Step 1",
  "input.title": "Financial profile & scenario",
  "input.description":
    "All amounts are monthly and in VND. Inputs are saved only in this browser on this device and are not synced anywhere.",
  "input.startFresh": "Start fresh",
  "input.freshTitle": "Start a fresh simulation?",
  "input.freshBody":
    "This deletes all inputs and results saved in this browser. This cannot be undone.",
  "input.cancel": "Cancel",
  "input.deleteData": "Delete saved data",
  "input.monthlyProfile": "Your monthly profile",
  "input.fMonthlyIncome": "Normal monthly net income",
  "input.fMonthlyIncomeHint": "Take-home pay in a typical month.",
  "input.fLowSeasonIncome": "Low-season monthly net income",
  "input.fLowSeasonIncomeHint": "Take-home pay in a slow month.",
  "input.fEssentialExpenses": "Essential living expenses",
  "input.fEssentialExpensesHint":
    "Rent, food, utilities, transport. Exclude debt payments.",
  "input.fOpeningBalance": "Available emergency savings",
  "input.fOpeningBalanceHint": "Cash you could use today.",
  "input.fDebtPayments": "Mandatory debt payment",
  "input.fDebtPaymentsHint": "Minimum monthly repayments. Enter 0 if none.",
  "input.fFlexibleExpenses": "Flexible spending",
  "input.fFlexibleExpensesHint": "Non-essential spending. Blank counts as 0.",
  "input.lowWarning":
    "Low-season income is higher than normal income. Please confirm this is correct.",
  "input.lowConfirmLabel": "Yes, this is correct",
  "input.lowConfirmError":
    "Please confirm your low-season income before running.",
  "input.stressScenario": "Stress scenario",
  "input.forecastHorizon": "Forecast horizon",
  "input.horizonAria": "Forecast horizon",
  "input.months": "months",
  "input.scenarioType": "Scenario type",
  "input.scenarioTypeAria": "Scenario type",
  "input.scenarioHint":
    "Picking a scenario fills in illustrative assumptions. Edit any value below to match your situation.",
  "input.incomeReduction": "Income reduction (%)",
  "input.incomeReductionAria": "Income reduction percent",
  "input.suggestedFrom":
    "Suggested from your low-season income: {pct}% (rounded to {rounded}%).",
  "input.noSuggestion":
    "No suggested reduction available (low-season income is not below normal income). Starting at 0% — edit as needed.",
  "input.useSuggested": "Use suggested {pct}%",
  "input.affectedMonths": "Affected months",
  "input.startingMonth": "Starting month",
  "input.numberOfMonths": "Number of months",
  "input.reductionNote":
    "The reduction applies only in these months. 100% means no income.",
  "input.unexpectedExpenses": "Unexpected expenses",
  "input.noneAdded": "None added.",
  "input.month": "Month",
  "input.monthN": "Month {n}",
  "input.amountVnd": "Amount (VND)",
  "input.removeExpense": "Remove expense {n}",
  "input.illustrativeDefault":
    "Illustrative default: one month of essential expenses ({amount}) in month 1.",
  "input.addExpense": "Add expense",
  "input.safetyBuffer": "Safety buffer: {amount}",
  "input.safetyBufferNote":
    "Always one month of essential expenses plus mandatory debt payment (E + D).",
  "input.fixFields": "Please fix the highlighted fields.",
  "input.runSimulation": "Run Simulation",

  // ── Validation messages ──
  "validation.required": "This field is required.",
  "validation.nonNeg": "Enter a number that is zero or greater.",
  "validation.flexNonNeg":
    "Enter a number that is zero or greater, or leave blank.",
  "validation.mustNonNeg": "Must be zero or greater.",
  "validation.flexMustNonNeg": "Must be zero or greater, or left blank.",
  "validation.horizon": "Choose 3, 6 or 12 months.",
  "validation.reductionRange": "Must be between 0% and 100%.",
  "validation.startMonthRange": "Start month must be 1–{horizon}.",
  "validation.durationMin": "Duration must be at least 1 month.",
  "validation.durationEndBy": "Affected months must end by month {horizon}.",
  "validation.expenseMonthRange": "Month must be 1–{horizon}.",
  "validation.expenseAmount": "Must be zero or greater.",

  // ── Scenario presets ──
  "preset.baseline.label": "Baseline",
  "preset.baseline.description": "Normal income, no shocks.",
  "preset.incomeReduction.label": "Income Reduction",
  "preset.incomeReduction.description": "Income drops for a number of months.",
  "preset.interruption.label": "Temporary Income Interruption",
  "preset.interruption.description": "No income for a period.",
  "preset.unexpectedExpense.label": "Unexpected Expense",
  "preset.unexpectedExpense.description": "A one-off cost in one month.",
  "preset.combined.label": "Combined Shock",
  "preset.combined.description":
    "Income reduction plus an unexpected cost.",
  "preset.expenseLabel": "Unexpected expense",

  // ── Scenario summary (describeScenario) ──
  "summary.month": "Month {n}",
  "summary.monthsRange": "Months {start}–{end}",
  "summary.monthsToHorizon": "Months 1–{horizon}",

  // ── Risk classification ──
  "risk.low": "Low risk",
  "risk.medium": "Medium risk",
  "risk.high": "High risk",
  "risk.reasonNegative": "Balance projected below zero in month {n}.",
  "risk.reasonBuffer":
    "Balance falls below your safety buffer in month {n}.",
  "risk.reasonStable":
    "Balance stays at or above your safety buffer throughout the projection.",

  // ── Dashboard ──
  "dash.metaTitle": "Risk Dashboard — SafeFlow AI",
  "dash.metaDesc":
    "Projected balances, shortfall months and risk level for your scenario.",
  "dash.eyebrow": "Step 2",
  "dash.title": "Risk dashboard",
  "dash.description":
    "Projections based on your inputs and assumptions — not historical or actual transactions.",
  "dash.editProfile": "Edit Financial Profile",
  "dash.noSimTitle": "No simulation yet",
  "dash.noSimBody":
    "Complete your financial profile and scenario to see your projected balances and risk level.",
  "dash.goToProfile": "Go to profile",
  "dash.riskSummary": "Risk summary",
  "dash.ruleBased": "Rule-based rating, not a probability.",
  "dash.scenario": "Scenario",
  "dash.horizon": "Horizon",
  "dash.horizonValue": "{n} months",
  "dash.incomeReduction": "Income reduction",
  "dash.affectedMonths": "Affected months",
  "dash.unexpectedExpense": "Unexpected expense",
  "dash.unexpectedExpenseInMonth": "{amount} in month {n}",
  "dash.unexpectedExpenses": "Unexpected expenses",
  "dash.notProjected": "Not projected within this horizon",
  "dash.projectedEnding": "Projected ending balance",
  "dash.lowestBalance": "Lowest month-end balance",
  "dash.firstBelowBuffer": "First month below safety buffer",
  "dash.firstNegative": "First negative-balance month",
  "dash.maxDeficit": "Max reserve deficit",
  "dash.maxGap": "Max monthly cash-flow gap",
  "dash.runwayZero": "Runway with zero income",
  "dash.minIncome": "Minimum income needed",
  "dash.bufferHint": "Buffer {amount} (essentials + debt)",
  "dash.savingsUsedUp": "Savings fully used up",
  "dash.maxDeficitHint": "Largest shortfall below zero when the balance goes negative",
  "dash.maxGapHint": "Before using savings — a gap is not running out of money",
  "dash.runwayHint": "Savings ÷ (essentials + debt)",
  "dash.minIncomeHint": "Essentials + mandatory debt per month",
  "dash.monthN": "Month {n}",
  "dash.projectedCashBalance": "Projected Cash Balance",
  "dash.projectionNote": "Month-end projections, not actual transactions.",
  "dash.scenarioComparison": "Scenario comparison",
  "dash.measure": "Measure",
  "dash.baseline": "Baseline",
  "dash.endingBalance": "Ending balance",
  "dash.lowestBalanceRow": "Lowest balance",
  "dash.firstBufferBreach": "First safety-buffer breach",
  "dash.firstNegativeRow": "First negative-balance month",
  "dash.changeLowestVsBaseline": "Change in lowest balance vs baseline",
  "dash.monthlyProjection": "Monthly projection",
  "dash.colMonth": "Month",
  "dash.colIncomeAdj": "Income (adjusted)",
  "dash.colEssentials": "Essentials",
  "dash.colDebt": "Debt payment",
  "dash.colFlexible": "Flexible",
  "dash.colUnexpected": "Unexpected",
  "dash.colNetFlow": "Net cash flow",
  "dash.colEnding": "Ending balance",
  "dash.colBufferStatus": "Buffer status",
  "dash.statusNegative": "Negative balance",
  "dash.statusBelow": "Below buffer",
  "dash.statusAbove": "Above buffer",
  "dash.showFewer": "Show fewer months",
  "dash.showAll": "Show all {n} months",
  "dash.showLess": "Show less",
  "dash.explainLoading": "Generating…",
  "dash.explainButton": "Explain My Results",
  "dash.viewActionPlan": "View Action Plan",
  "dash.adjustScenario": "Adjust scenario",
  "dash.resetScenario": "Reset Scenario",
  "dash.incomeReductionLabel": "Income reduction",
  "dash.durationFromMonth": "Duration (from month {n})",
  "dash.durationAria": "Duration in months",
  "dash.unexpectedExpenseVnd": "Unexpected expense (VND)",
  "dash.unexpectedAria": "Unexpected expense amount",
  "dash.expenseMonth": "Expense month",
  "dash.aiExplanationTitle": "AI Explanation",

  // ── Action Plan page ──
  "ap.metaTitle": "Action Plan & Report — SafeFlow AI",
  "ap.metaDesc":
    "Summary of your simulation and next steps to strengthen your cash-flow resilience.",
  "ap.eyebrow": "Step 3",
  "ap.title": "Action plan & report",
  "ap.description":
    "Review your results and test how changes could improve your resilience. Projections are estimates, not guarantees.",
  "ap.exportPdf": "Export PDF",
  "ap.noReportTitle": "Nothing to report yet",
  "ap.noReportBody":
    "Run a simulation first. Your summary and action plan will appear here.",
  "ap.goToProfile": "Go to profile",
  "ap.simSummary": "Simulation summary",
  "ap.summaryScenario": "Scenario",
  "ap.summaryHorizon": "Horizon",
  "ap.summaryHorizonValue": "{n} months",
  "ap.summaryReduction": "Income reduction",
  "ap.summaryLowest": "Lowest projected balance",
  "ap.summaryEnding": "Ending balance",
  "ap.summaryMinIncome": "Minimum income needed",
  "ap.summaryLargestGap": "Largest monthly gap",
  "ap.recTitle": "Recommended next steps",
  "ap.recIntroStable":
    "Your projection is stable — no balance falls below your safety buffer within this horizon. No specific recommendation is needed based on the data entered. You can still use the experiment panel below to test hypothetical changes.",
  "ap.recIntro":
    "These recommendations are generated from your simulation results using fixed rules, not AI. They are not financial advice. Select a solution to generate an AI-personalized plan.",
  "ap.selected": "Selected",
  "ap.selectSolution": "Select this solution",
  "ap.simulateAdjustment": "Simulate this adjustment",
  "ap.addManual":
    "Add an adjustment manually in the experiment panel below to test this.",
  "ap.cannotSimulate":
    "This action cannot be simulated with the current experiment tools.",
  "ap.expectedImpact": "Expected impact",
  "ap.impactNotQuantified":
    "This impact cannot be quantified by the current simulation engine.",
  "ap.limitations": "Limitations",
  "ap.informationNeeded": "Information needed",
  "ap.aiPlanTitle": "AI Action Plan for Selected Solution",
  "ap.generateAiPlan": "Generate AI Action Plan",
  "ap.generating": "Generating…",
  "ap.aiPlanIntro":
    "The AI plan will personalize {title} using your simulation results{exp}.",
  "ap.aiPlanIntroWithExp": " and tested adjustments",
  "ap.aiPersonalizedTitle": "AI Personalized Action Plan",
  "ap.testAdjustment": "Test an adjustment",
  "ap.testNote":
    "Try changes without affecting your saved profile. The comparison uses the same formulas as your dashboard.",
  "ap.clearAdjustments": "Clear adjustments",
  "ap.adjustment": "Adjustment",
  "ap.monthlyAmountVnd": "Monthly amount (VND)",
  "ap.removeAdjustment": "Remove adjustment {n}",
  "ap.noAdjustments":
    "No adjustments yet. Add one to see how it could change your outcome.",
  "ap.addAdjustment": "Add adjustment",
  "ap.beforeVsAfter": "Before vs after comparison",
  "ap.riskLevel": "Risk level",
  "ap.lowestBalance": "Lowest balance",
  "ap.endingBalance": "Ending balance",
  "ap.reserveDeficit": "Reserve deficit",
  "ap.maxMonthlyGap": "Max monthly gap",
  "ap.firstBufferBreach": "First buffer breach",
  "ap.none": "None",
  "ap.before": "Before",
  "ap.after": "After",
  "ap.change": "Change",
  "ap.riskImproved": "Risk improved",
  "ap.mechanicalNote":
    "These are mechanical projections from the numbers you entered, not professional financial advice. Real-world results depend on factors a simulation cannot capture.",

  // ── Priority labels ──
  "priority.high": "High priority",
  "priority.medium": "Medium priority",
  "priority.preventive": "Preventive",

  // ── Adjustment labels / hints ──
  "adjustment.cutFlexible": "Reduce flexible spending",
  "adjustment.cutEssentials": "Reduce essential expenses",
  "adjustment.raiseIncome": "Increase monthly income",
  "adjustment.cutFlexibleHint": "Non-essential spending you could cut each month.",
  "adjustment.cutEssentialsHint":
    "An amount you could shave off essentials each month.",
  "adjustment.raiseIncomeHint": "Additional monthly income you could earn.",

  // ── Recommendation content ──
  // Budget optimization
  "rec.budget.title": "Review your flexible spending",
  "rec.budget.reasonGap":
    "Your largest monthly cash-flow gap is {amount}.",
  "rec.budget.reasonNegative":
    "At least one month projects a negative cash flow.",
  "rec.budget.reasonFlex":
    "You currently have {amount} in monthly flexible spending that could be reviewed.",
  "rec.budget.step1":
    "List your current flexible expenses and identify which ones could be reduced or paused.",
  "rec.budget.step2":
    "Prioritise essentials — do not cut mandatory debt payments or essential living costs without careful consideration.",
  "rec.budget.step3":
    "Use the experiment panel below to test how reducing flexible spending by a specific amount could change your projected balance.",
  "rec.budget.impact":
    "Reducing flexible spending can improve your monthly net cash flow and projected ending balance. Use the experiment panel to see the exact effect for your numbers.",
  "rec.budget.lim1":
    "The simulation does not know which specific expenses are truly discretionary — that judgement is yours.",
  "rec.budget.lim2":
    "Essential-expense reductions should only be made voluntarily and when feasible for your situation.",

  // Income stability
  "rec.income.title": "Plan for income variability",
  "rec.income.reasonSeasonal":
    "Your low-season income ({low}) is lower than your normal income ({normal}).",
  "rec.income.reasonInterruption":
    "Your selected scenario includes a full income interruption.",
  "rec.income.reasonReduction":
    "Your scenario includes a {pct}% income reduction.",
  "rec.income.step1":
    "Identify which months your income is typically lower and estimate how much lower it could be.",
  "rec.income.step2":
    "Consider realistic options for your situation: adjusting work hours, finding supplementary income, or building a buffer during higher-income months.",
  "rec.income.step3":
    "Use the experiment panel to test how a specific increase in monthly income could change your projection.",
  "rec.income.impact":
    "Additional income during low-season months can improve your projected balance. Use the experiment panel to see the effect of a specific income increase.",
  "rec.income.lim1":
    "The simulation cannot predict whether additional income is achievable — that depends on your circumstances.",
  "rec.income.lim2":
    "No specific earnings amount or employment outcome is guaranteed.",

  // Emergency reserve
  "rec.reserve.title": "Build your emergency reserve",
  "rec.reserve.reasonOpening":
    "Your opening balance ({opening}) is below your safety buffer of {buffer}.",
  "rec.reserve.reasonBelow":
    "Your projected balance first falls below the safety buffer in month {n}.",
  "rec.reserve.step1":
    "Your safety buffer is {buffer} — one month of essential expenses plus mandatory debt payments.",
  "rec.reserve.step2":
    "If you have a monthly surplus, consider setting aside a portion toward building your reserve over time.",
  "rec.reserve.step3":
    "Building savings depends on having available surplus — it is a gradual process, not an immediate fix for a projected shortfall.",
  "rec.reserve.impact":
    "Accumulating savings toward your safety buffer can reduce the likelihood of future buffer breaches. The pace depends on your available surplus.",
  "rec.reserve.lim1":
    "The safety buffer (essentials + debt) is a model-specific reserve target, not a universal emergency-fund recommendation.",
  "rec.reserve.lim2":
    "Reserve accumulation depends on available surplus and feasible contributions, which the simulation does not assume.",
  "rec.reserve.lim3":
    "Building savings is not an immediate solution to a projected cash shortfall in the coming months.",
  "rec.reserve.missing": "How much surplus you can realistically set aside each month",

  // Debt payment preparation
  "rec.debt.title": "Prepare for debt payments under pressure",
  "rec.debt.reasonPayments":
    "You have mandatory debt payments of {amount} per month.",
  "rec.debt.reasonNegative":
    "Your balance is projected to go negative in month {n}.",
  "rec.debt.reasonBuffer":
    "Your balance falls below the safety buffer in month {n}.",
  "rec.debt.reasonPressure":
    "Your projection shows monthly cash-flow pressure.",
  "rec.debt.step1":
    "Record the actual due dates and amounts of your current debt payments — this information is not captured in your simulation profile.",
  "rec.debt.step2":
    "Review your payment schedule and confirm which payments are due within your simulation horizon.",
  "rec.debt.step3":
    "Contact your existing lender to ask which relief options, if any, are available. Do not stop payments without confirmation.",
  "rec.debt.impact":
    "Understanding your payment schedule and available lender options can help you avoid missed payments during a cash-flow squeeze. The simulation cannot quantify this.",
  "rec.debt.lim1":
    "Actual payment due dates are not captured by the current profile and must be confirmed by you.",
  "rec.debt.lim2":
    "The simulation does not know your lender's policies, available relief programmes, or eligibility.",
  "rec.debt.lim3":
    "Refinancing or new borrowing may not be appropriate for your situation — seek individualised advice before deciding.",
  "rec.debt.lim4":
    "Do not stop or reduce mandatory payments without explicit confirmation from your lender.",
  "rec.debt.missing1": "Actual payment due dates",
  "rec.debt.missing2": "Lender contact details and available options",

  // Major expense planning
  "rec.major.title": "Plan for major or unexpected expenses",
  "rec.major.reasonExpense":
    "Your scenario includes an unexpected expense of {amount} in month {n}.",
  "rec.major.step1":
    "Confirm whether the unexpected expense in your scenario is a real upcoming cost or a hypothetical stress test.",
  "rec.major.step2":
    "If it is a real cost, note the expected timing and amount, and consider how to spread or prepare for it.",
  "rec.major.step3":
    "Use the experiment panel to test how reducing other spending or increasing income could offset the expense.",
  "rec.major.impact":
    "Planning ahead for a known major expense can reduce its impact on your projected balance. Use the experiment panel to test specific adjustments.",
  "rec.major.lim1":
    "The simulation treats each unexpected expense as a single one-off cost — it does not model instalments or phased spending.",
  "rec.major.lim2":
    "The current data model does not support separately entering planned future expenses outside the scenario shock.",

  // Financial support or advice
  "rec.support.title": "Consider seeking financial support or advice",
  "rec.support.reasonNegative":
    "Your balance is projected to go negative in month {n}, indicating substantial financial pressure.",
  "rec.support.reasonDeficit":
    "Your projected reserve deficit is {amount}, and your balance falls below the safety buffer.",
  "rec.support.step1":
    "If you are facing immediate difficulty covering essential costs, consider contacting a recognised financial counselling service in your area.",
  "rec.support.step2":
    "Gather your current income, expense, and debt information before seeking advice — this will make the conversation more productive.",
  "rec.support.step3":
    "Additional information about your specific obligations and available support programmes would be needed for more targeted guidance.",
  "rec.support.impact":
    "Speaking with a qualified advisor or support service can help you navigate options the simulation cannot evaluate. The benefit cannot be quantified by this tool.",
  "rec.support.lim1":
    "The simulation cannot recommend specific organisations, aid programmes, or entitlements.",
  "rec.support.lim2":
    "Eligibility for support programmes depends on information not captured here.",
  "rec.support.lim3":
    "Live discovery of support services is a separate future capability.",
  "rec.support.missing1": "Your location and jurisdiction",
  "rec.support.missing2": "Specific obligations and eligibility criteria",

  // ── Relevant services ──
  "services.explore": "Explore Relevant Services",
  "services.transparency":
    "External resources for reference only. SafeFlow AI does not currently verify these providers or confirm any partnership or affiliate relationship. Please review each provider's terms before using its services.",
  "services.section.budget_optimization": "Personal Finance & Budgeting",
  "services.section.income_stability": "Employment & Skills Development",
  "services.section.emergency_reserve": "Savings & Bank Accounts",
  "services.section.debt_payment_preparation": "Debt Support & Consultation",
  "services.section.major_expense_planning": "Insurance & Financial Planning",
  "services.section.financial_support_advice": "Financial Support & Guidance",
  "services.desc.budget_moneylover":
    "A personal finance app for tracking expenses and budgeting.",
  "services.desc.income_hcm":
    "Job listings and employment support services in Ho Chi Minh City.",
  "services.desc.income_coursera":
    "Online courses and professional certificates to build new skills.",
  "services.desc.reserve_vietcombank":
    "Commercial bank offering savings accounts and personal banking services.",
  "services.desc.reserve_tpbank":
    "Digital banking services including savings and personal accounts.",
  "services.desc.debt_lnt":
    "Law firm providing legal consultation on debt and financial obligations.",
  "services.desc.major_manulife":
    "Insurance and financial planning products for major life expenses.",
  "services.desc.support_cfrc":
    "Financial counseling and support resources for individuals.",

  // ── AI explanation UI ──
  "ai.dismiss": "Dismiss",
  "ai.generating": "Generating explanation…",
  "ai.errorDefault": "Something went wrong. Please try again.",
  "ai.errorServer":
    "The server encountered an error while processing your request. Please try again.",
  "ai.errorEmpty":
    "The AI service returned an empty response. Please try again.",
  "ai.aiEmpty": "The AI returned an empty response. Please try again.",
  "ai.tryAgain": "Try again",
  "ai.footer":
    "Generated by AI from your simulation data. Not financial advice.",

  // ── Chart labels ──
  "chart.ariaLabel":
    "Projected cash balance, baseline versus {scenario}, with zero line and safety buffer of {buffer}",
  "chart.zeroBalance": "Zero balance",
  "chart.safetyBuffer": "Safety buffer {amount}",
  "chart.baseline": "Baseline",
  "chart.monthN": "Month {n}",

  // ── PDF export ──
  "pdf.reportTitle": "Cash-flow resilience report",
  "pdf.generated": "Generated {date} at {time}",
  "pdf.horizon": "Horizon: {n} months",
  "pdf.inputSummary": "Input summary",
  "pdf.inputNote": "All amounts are monthly and in VND. Saved only in this browser.",
  "pdf.safetyBuffer": "Safety buffer (essentials + debt):",
  "pdf.safetyBufferNote": "One month of essential expenses plus mandatory debt payment (E + D).",
  "pdf.scenarioAssumptions": "Scenario assumptions",
  "pdf.scenarioType": "Scenario type",
  "pdf.forecastHorizon": "Forecast horizon",
  "pdf.incomeReduction": "Income reduction",
  "pdf.affectedMonths": "Affected months",
  "pdf.unexpectedExpenseMonth": "Unexpected expense (month {n})",
  "pdf.riskClassification": "Risk classification",
  "pdf.riskNote": "Risk level is based on projected month-end balances: High = any negative month-end; Medium = any month below the safety buffer (none negative); Low = all months at or above the buffer. The opening balance may initially be below the safety buffer — that alone does not raise the risk level unless a projected month-end also falls below it.",
  "pdf.riskLevel": "Risk level: {level}",
  "pdf.keyResults": "Key results",
  "pdf.lowestBalance": "Lowest month-end balance",
  "pdf.endingBalance": "Ending balance",
  "pdf.maxMonthlyGap": "Max monthly gap",
  "pdf.maxReserveDeficit": "Max reserve deficit",
  "pdf.runwayZero": "Runway (zero income)",
  "pdf.minIncomeNeeded": "Minimum income needed",
  "pdf.firstBelowBuffer": "First month below buffer",
  "pdf.firstNegative": "First negative month",
  "pdf.beforeSavings": "Before using savings",
  "pdf.shortfallBelowZero": "Shortfall below zero",
  "pdf.essentialsDebtMo": "Essentials + debt/mo",
  "pdf.monthN": "Month {n}",
  "pdf.projectedCashBalance": "Projected cash balance",
  "pdf.monthlyIncomeOutflow": "Monthly income vs outflow",
  "pdf.incomeAdjusted": "Income (adjusted)",
  "pdf.outflow": "Outflow",
  "pdf.monthlyCashFlow": "Monthly cash-flow projection",
  "pdf.colMonth": "Mo.",
  "pdf.colIncome": "Income",
  "pdf.colOutflow": "Outflow",
  "pdf.colNetFlow": "Net flow",
  "pdf.colClosing": "Closing balance",
  "pdf.colStatus": "Status",
  "pdf.statusNegative": "Negative",
  "pdf.statusBelow": "Below buffer",
  "pdf.statusAbove": "Above buffer",
  "pdf.recommendedNextSteps": "Recommended next steps",
  "pdf.recIntro": "Generated from your simulation results using fixed rules, not AI. Not financial advice.",
  "pdf.stableProjection": "Your projection is stable — no balance falls below your safety buffer within this horizon. No specific recommendation is needed based on the data entered.",
  "pdf.priorityBadge": "{priority} priority",
  "pdf.whySelected": "Why this was selected",
  "pdf.actionSteps": "Action steps",
  "pdf.expectedImpact": "Expected impact",
  "pdf.limitations": "Limitations",
  "pdf.informationNeeded": "Information needed",
  "pdf.disclaimer": "This report is generated by SafeFlow AI from the numbers you entered. Projections are mechanical estimates, not guarantees. Recommendations are produced by fixed rules, not AI, and are not financial advice. Real-world results depend on factors a simulation cannot capture. Consult a qualified financial advisor before making decisions.",
  "pdf.pageFooter": "SafeFlow AI — Cash-flow resilience report  |  Page {p} of {pc}",
  "pdf.zeroBalance": "Zero",
  "pdf.bufferShort": "Buffer {amount}",
  "pdf.baseline": "Baseline",
  "pdf.safetyBufferLabel": "Safety buffer",

  // ── AmountField ──
  "form.optional": "(optional)",

  // ── formatCurrency helpers ──
  "format.unlimited": "Unlimited",
  "format.monthsValue": "{n} months",

  // ── AI prompt language instruction ──
  "ai.promptLang.en": "Respond in clear English.",
  "ai.promptLang.vi":
    "Respond in clear, professional Vietnamese (Tiếng Việt). Keep brand names, currency values, and numbers unchanged.",
} as const;

export type TranslationKey = keyof typeof en;

export const vi: Record<TranslationKey, string> = {
  // ── Shared layout / navigation ──
  "nav.home": "Trang chủ",
  "nav.profile": "Hồ sơ & Kịch bản",
  "nav.dashboard": "Bảng rủi ro",
  "nav.actionPlan": "Kế hoạch hành động",
  "nav.openMenu": "Mở menu",
  "nav.closeMenu": "Đóng menu",
  "nav.language": "Ngôn ngữ",
  "nav.languageEn": "English",
  "nav.languageVi": "Tiếng Việt",

  // ── Footer ──
  "footer.disclaimer":
    "SafeFlow AI là công cụ lập kế hoạch và mô phỏng, không phải lời khuyên tài chính. Các dự toán là kết quả cơ học dựa trên các con số bạn nhập. Dữ liệu của bạn chỉ lưu trong tab trình duyệt này.",

  // ── Root error / not found ──
  "error.notFoundTitle": "Không tìm thấy trang",
  "error.notFoundBody":
    "Trang bạn tìm không tồn tại hoặc đã được chuyển đi.",
  "error.goHome": "Về trang chủ",
  "error.loadFailTitle": "Trang này không tải được",
  "error.loadFailBody":
    "Đã có lỗi xảy ra. Bạn có thể tải lại trang hoặc quay về trang chủ.",
  "error.tryAgain": "Thử lại",

  // ── Home page ──
  "home.metaTitle": "SafeFlow AI — Kiểm tra sức chịu dòng tiền cá nhân",
  "home.metaDesc":
    "Mô phỏng các cú sốc thu nhập và chi phí phát sinh theo từng tháng và xem khi nào tiền tiết kiệm của bạn sẽ cạn. Dùng ngay, không cần đăng nhập, tính bằng VND.",
  "home.eyebrow": "Công cụ mô phỏng khả năng chịu đựng dòng tiền",
  "home.heroTitle": "Biết tiền của bạn trụ được bao lâu — ",
  "home.heroTitleHighlight": "trước khi sự cố xảy ra.",
  "home.heroBody":
    "SafeFlow AI dự phóng số dư cuối tháng của bạn dưới các cú sốc bạn chọn, bằng những công thức rõ ràng và tất định. Không cần đăng ký.",
  "home.startSimulation": "Bắt đầu mô phỏng",
  "home.startSimulationCaps": "Bắt đầu Mô phỏng",
  "home.howItWorks": "Cách SafeFlow AI hoạt động",
  "home.step1Eyebrow": "Bước 1",
  "home.step1Heading": "Bắt đầu với bức tranh tài chính của bạn",
  "home.step1Highlight": "bức tranh tài chính",
  "home.step1Text":
    "Bắt đầu với một vài thông tin cơ bản về thu nhập, chi phí sinh hoạt, thanh toán nợ và tiền tiết kiệm của bạn.",
  "home.step2Eyebrow": "Bước 2",
  "home.step2Heading": "Khám phá các tương lai có thể",
  "home.step2Highlight": "các tương lai có thể",
  "home.step2Text":
    "Mô phỏng giảm thu nhập, gián đoạn tạm thời, chi phí phát sinh và các cú sốc tài chính kết hợp trong 3, 6 hoặc 12 tháng tới.",
  "home.step3Eyebrow": "Bước 3",
  "home.step3Heading": "Hiểu rủi ro tài chính của bạn",
  "home.step3Highlight": "rủi ro tài chính",
  "home.step3Text":
    "Xem số dư dự kiến thay đổi theo thời gian, nhận diện các điểm thiếu hụt tiềm năng và hiểu vì sao một mức độ rủi ro được gán cho bạn.",
  "home.step4Eyebrow": "Bước 4",
  "home.step4Heading": "Biến hiểu biết thành hành động",
  "home.step4Highlight": "thành hành động",
  "home.step4Text":
    "Khám phá các giải pháp phù hợp, thử nghiệm các điều chỉnh được hỗ trợ và nhận giải thích bằng AI cùng các bước tiếp theo thực tế.",
  "home.whatDoes": "SafeFlow làm được gì",
  "home.whatDoesNot": "SafeFlow không làm gì",
  "home.doesBullet1": "Dự phóng số dư cuối tháng từ chính con số của bạn",
  "home.doesBullet2": "So sánh đường cơ sở với kịch bản bạn chọn",
  "home.doesBullet3": "Giải thích rõ ràng vì sao một mức rủi ro được gán",
  "home.doesNotBullet1":
    "Không đưa ra xác suất, điểm tín dụng hay lời khuyên đầu tư",
  "home.doesNotBullet2": "Không cần tài khoản hay kết nối ngân hàng",
  "home.doesNotBullet3": "Dữ liệu của bạn không lưu trên máy chủ",
  "home.sloganPre": "Nhìn thấy rủi ro. Hiểu các lựa chọn. ",
  "home.sloganHighlight": "Tiến bước với tự tin.",

  // ── Simulate stepper ──
  "stepper.ariaLabel": "Các bước mô phỏng",
  "stepper.profile": "Hồ sơ & Kịch bản",
  "stepper.dashboard": "Bảng rủi ro",
  "stepper.actionPlan": "Kế hoạch hành động",

  // ── Input page ──
  "input.metaTitle": "Hồ sơ Tài chính & Kịch bản — SafeFlow AI",
  "input.metaDesc":
    "Nhập thu nhập, chi phí và tiết kiệm, sau đó chọn kịch bản áp lực để mô phỏng.",
  "input.eyebrow": "Bước 1",
  "input.title": "Hồ sơ tài chính & kịch bản",
  "input.description":
    "Mọi số liệu đều tính theo tháng và bằng VND. Thông tin chỉ lưu trong trình duyệt trên thiết bị này và không đồng bộ đi đâu.",
  "input.startFresh": "Bắt đầu lại",
  "input.freshTitle": "Bắt đầu một mô phỏng mới?",
  "input.freshBody":
    "Thao tác này sẽ xoá toàn bộ thông tin và kết quả đã lưu trong trình duyệt. Không thể hoàn tác.",
  "input.cancel": "Huỷ",
  "input.deleteData": "Xoá dữ liệu đã lưu",
  "input.monthlyProfile": "Hồ sơ hàng tháng của bạn",
  "input.fMonthlyIncome": "Thu nhập ròng hàng tháng thông thường",
  "input.fMonthlyIncomeHint": "Thu nhập thực nhận trong một tháng điển hình.",
  "input.fLowSeasonIncome": "Thu nhập ròng hàng tháng mùa thấp điểm",
  "input.fLowSeasonIncomeHint": "Thu nhập thực nhận trong một tháng vắng.",
  "input.fEssentialExpenses": "Chi phí sinh hoạt thiết yếu",
  "input.fEssentialExpensesHint":
    "Tiền thuê nhà, ăn uống, điện nước, đi lại. Không tính thanh toán nợ.",
  "input.fOpeningBalance": "Tiền tiết kiệm dự phòng khả dụng",
  "input.fOpeningBalanceHint": "Tiền mặt bạn có thể dùng ngay hôm nay.",
  "input.fDebtPayments": "Thanh toán nợ bắt buộc",
  "input.fDebtPaymentsHint": "Khoản trả tối thiểu hàng tháng. Nhập 0 nếu không có.",
  "input.fFlexibleExpenses": "Chi tiêu linh hoạt",
  "input.fFlexibleExpensesHint": "Chi tiêu không thiết yếu. Để trống tức là 0.",
  "input.lowWarning":
    "Thu nhập mùa thấp điểm cao hơn thu nhập thường. Vui lòng xác nhận đây là đúng.",
  "input.lowConfirmLabel": "Vâng, đây là đúng",
  "input.lowConfirmError":
    "Vui lòng xác nhận thu nhập mùa thấp điểm trước khi chạy.",
  "input.stressScenario": "Kịch bản áp lực",
  "input.forecastHorizon": "Khung thời gian dự phóng",
  "input.horizonAria": "Khung thời gian dự phóng",
  "input.months": "tháng",
  "input.scenarioType": "Loại kịch bản",
  "input.scenarioTypeAria": "Loại kịch bản",
  "input.scenarioHint":
    "Chọn một kịch bản sẽ điền sẵn các giả định minh hoạ. Bạn có thể chỉnh sửa bất kỳ giá trị nào bên dưới cho phù hợp với tình hình của mình.",
  "input.incomeReduction": "Giảm thu nhập (%)",
  "input.incomeReductionAria": "Phần trăm giảm thu nhập",
  "input.suggestedFrom":
    "Gợi ý từ thu nhập mùa thấp điểm: {pct}% (làm tròn thành {rounded}%).",
  "input.noSuggestion":
    "Không có gợi ý giảm (thu nhập mùa thấp điểm không thấp hơn thu nhập thường). Bắt đầu từ 0% — hãy chỉnh sửa nếu cần.",
  "input.useSuggested": "Dùng mức gợi ý {pct}%",
  "input.affectedMonths": "Các tháng chịu ảnh hưởng",
  "input.startingMonth": "Tháng bắt đầu",
  "input.numberOfMonths": "Số tháng",
  "input.reductionNote":
    "Mức giảm chỉ áp dụng trong các tháng này. 100% nghĩa là không có thu nhập.",
  "input.unexpectedExpenses": "Chi phí phát sinh",
  "input.noneAdded": "Chưa có khoản nào.",
  "input.month": "Tháng",
  "input.monthN": "Tháng {n}",
  "input.amountVnd": "Số tiền (VND)",
  "input.removeExpense": "Xoá chi phí {n}",
  "input.illustrativeDefault":
    "Giá trị mặc định minh hoạ: một tháng chi phí thiết yếu ({amount}) ở tháng 1.",
  "input.addExpense": "Thêm chi phí",
  "input.safetyBuffer": "Quỹ dự phòng an toàn: {amount}",
  "input.safetyBufferNote":
    "Luôn bằng một tháng chi phí thiết yếu cộng thanh toán nợ bắt buộc (E + D).",
  "input.fixFields": "Vui lòng sửa các trường đang bị đánh dấu.",
  "input.runSimulation": "Chạy mô phỏng",

  // ── Validation messages ──
  "validation.required": "Trường này là bắt buộc.",
  "validation.nonNeg": "Nhập một số bằng 0 hoặc lớn hơn.",
  "validation.flexNonNeg":
    "Nhập một số bằng 0 hoặc lớn hơn, hoặc để trống.",
  "validation.mustNonNeg": "Phải bằng 0 hoặc lớn hơn.",
  "validation.flexMustNonNeg": "Phải bằng 0 hoặc lớn hơn, hoặc để trống.",
  "validation.horizon": "Chọn 3, 6 hoặc 12 tháng.",
  "validation.reductionRange": "Phải nằm trong khoảng 0% đến 100%.",
  "validation.startMonthRange": "Tháng bắt đầu phải từ 1–{horizon}.",
  "validation.durationMin": "Thời lượng phải ít nhất 1 tháng.",
  "validation.durationEndBy": "Các tháng ảnh hưởng phải kết thúc trước tháng {horizon}.",
  "validation.expenseMonthRange": "Tháng phải từ 1–{horizon}.",
  "validation.expenseAmount": "Phải bằng 0 hoặc lớn hơn.",

  // ── Scenario presets ──
  "preset.baseline.label": "Đường cơ sở",
  "preset.baseline.description": "Thu nhập bình thường, không có cú sốc.",
  "preset.incomeReduction.label": "Giảm thu nhập",
  "preset.incomeReduction.description": "Thu nhập giảm trong một số tháng.",
  "preset.interruption.label": "Gián đoạn thu nhập tạm thời",
  "preset.interruption.description": "Không có thu nhập trong một khoảng thời gian.",
  "preset.unexpectedExpense.label": "Chi phí phát sinh",
  "preset.unexpectedExpense.description": "Một khoản chi một lần trong một tháng.",
  "preset.combined.label": "Cú sốc kết hợp",
  "preset.combined.description": "Giảm thu nhập cộng với chi phí phát sinh.",
  "preset.expenseLabel": "Chi phí phát sinh",

  // ── Scenario summary ──
  "summary.month": "Tháng {n}",
  "summary.monthsRange": "Tháng {start}–{end}",
  "summary.monthsToHorizon": "Tháng 1–{horizon}",

  // ── Risk classification ──
  "risk.low": "Rủi ro thấp",
  "risk.medium": "Rủi ro trung bình",
  "risk.high": "Rủi ro cao",
  "risk.reasonNegative": "Số dư dự phóng âm ở tháng {n}.",
  "risk.reasonBuffer": "Số dư xuống dưới quỹ dự phòng an toàn ở tháng {n}.",
  "risk.reasonStable":
    "Số dư giữ ở hoặc trên quỹ dự phòng an toàn trong toàn bộ dự phóng.",

  // ── Dashboard ──
  "dash.metaTitle": "Bảng Rủi ro — SafeFlow AI",
  "dash.metaDesc":
    "Số dư dự phóng, các tháng thiếu hụt và mức độ rủi ro cho kịch bản của bạn.",
  "dash.eyebrow": "Bước 2",
  "dash.title": "Bảng rủi ro",
  "dash.description":
    "Dự phóng dựa trên thông tin và giả định bạn nhập — không phải giao dịch thực tế hay lịch sử.",
  "dash.editProfile": "Sửa hồ sơ tài chính",
  "dash.noSimTitle": "Chưa có mô phỏng",
  "dash.noSimBody":
    "Hoàn thành hồ sơ tài chính và kịch bản để xem số dư dự phóng và mức rủi ro của bạn.",
  "dash.goToProfile": "Đến hồ sơ",
  "dash.riskSummary": "Tóm tắt rủi ro",
  "dash.ruleBased": "Xếp hạng theo quy tắc, không phải xác suất.",
  "dash.scenario": "Kịch bản",
  "dash.horizon": "Khung thời gian",
  "dash.horizonValue": "{n} tháng",
  "dash.incomeReduction": "Giảm thu nhập",
  "dash.affectedMonths": "Các tháng ảnh hưởng",
  "dash.unexpectedExpense": "Chi phí phát sinh",
  "dash.unexpectedExpenseInMonth": "{amount} ở tháng {n}",
  "dash.unexpectedExpenses": "Các chi phí phát sinh",
  "dash.notProjected": "Không xảy ra trong khung thời gian này",
  "dash.projectedEnding": "Số dư tiền mặt dự kiến cuối kỳ",
  "dash.lowestBalance": "Số dư cuối tháng thấp nhất",
  "dash.firstBelowBuffer": "Tháng đầu tiên dưới quỹ dự phòng",
  "dash.firstNegative": "Tháng đầu tiên số dư âm",
  "dash.maxDeficit": "Thiếu hụt quỹ lớn nhất",
  "dash.maxGap": "Khoảng hụt dòng tiền tháng lớn nhất",
  "dash.runwayZero": "Thời gian trụ khi thu nhập bằng 0",
  "dash.minIncome": "Thu nhập tối thiểu cần có",
  "dash.bufferHint": "Quỹ {amount} (thiết yếu + nợ)",
  "dash.savingsUsedUp": "Tiết kiệm đã dùng cạn",
  "dash.maxDeficitHint": "Mức thiếu hụt dưới 0 lớn nhất khi số dư bị âm",
  "dash.maxGapHint": "Trước khi dùng tiết kiệm — khoảng hụt không phải là cạn tiền",
  "dash.runwayHint": "Tiết kiệm ÷ (thiết yếu + nợ)",
  "dash.minIncomeHint": "Thiết yếu + nợ bắt buộc mỗi tháng",
  "dash.monthN": "Tháng {n}",
  "dash.projectedCashBalance": "Số dư tiền mặt dự kiến",
  "dash.projectionNote": "Dự phóng cuối tháng, không phải giao dịch thực tế.",
  "dash.scenarioComparison": "So sánh kịch bản",
  "dash.measure": "Chỉ số",
  "dash.baseline": "Đường cơ sở",
  "dash.endingBalance": "Số dư cuối kỳ",
  "dash.lowestBalanceRow": "Số dư thấp nhất",
  "dash.firstBufferBreach": "Tháng đầu tiên thủng quỹ dự phòng",
  "dash.firstNegativeRow": "Tháng đầu tiên số dư âm",
  "dash.changeLowestVsBaseline": "Thay đổi số dư thấp nhất so với cơ sở",
  "dash.monthlyProjection": "Dự phóng hàng tháng",
  "dash.colMonth": "Tháng",
  "dash.colIncomeAdj": "Thu nhập (điều chỉnh)",
  "dash.colEssentials": "Thiết yếu",
  "dash.colDebt": "Thanh toán nợ",
  "dash.colFlexible": "Linh hoạt",
  "dash.colUnexpected": "Phát sinh",
  "dash.colNetFlow": "Dòng tiền ròng",
  "dash.colEnding": "Số dư cuối kỳ",
  "dash.colBufferStatus": "Trạng thái quỹ",
  "dash.statusNegative": "Số dư âm",
  "dash.statusBelow": "Dưới quỹ",
  "dash.statusAbove": "Trên quỹ",
  "dash.showFewer": "Thu gọn các tháng",
  "dash.showAll": "Xem tất cả {n} tháng",
  "dash.showLess": "Thu gọn",
  "dash.explainLoading": "Đang tạo…",
  "dash.explainButton": "Giải thích kết quả",
  "dash.viewActionPlan": "Xem kế hoạch hành động",
  "dash.adjustScenario": "Điều chỉnh kịch bản",
  "dash.resetScenario": "Đặt lại kịch bản",
  "dash.incomeReductionLabel": "Giảm thu nhập",
  "dash.durationFromMonth": "Thời lượng (từ tháng {n})",
  "dash.durationAria": "Thời lượng tính theo tháng",
  "dash.unexpectedExpenseVnd": "Chi phí phát sinh (VND)",
  "dash.unexpectedAria": "Số tiền chi phí phát sinh",
  "dash.expenseMonth": "Tháng phát sinh",
  "dash.aiExplanationTitle": "Giải thích bằng AI",

  // ── Action Plan page ──
  "ap.metaTitle": "Kế hoạch Hành động & Báo cáo — SafeFlow AI",
  "ap.metaDesc":
    "Tóm tắt mô phỏng và các bước tiếp theo để tăng cường khả năng chịu đựng dòng tiền của bạn.",
  "ap.eyebrow": "Bước 3",
  "ap.title": "Kế hoạch hành động & báo cáo",
  "ap.description":
    "Xem lại kết quả và thử cách thay đổi có thể cải thiện khả năng chịu đựng. Dự phóng là ước tính, không phải bảo chứng.",
  "ap.exportPdf": "Xuất PDF",
  "ap.noReportTitle": "Chưa có báo cáo",
  "ap.noReportBody":
    "Hãy chạy mô phỏng trước. Tóm tắt và kế hoạch hành động sẽ hiển thị tại đây.",
  "ap.goToProfile": "Đến hồ sơ",
  "ap.simSummary": "Tóm tắt mô phỏng",
  "ap.summaryScenario": "Kịch bản",
  "ap.summaryHorizon": "Khung thời gian",
  "ap.summaryHorizonValue": "{n} tháng",
  "ap.summaryReduction": "Giảm thu nhập",
  "ap.summaryLowest": "Số dư dự phóng thấp nhất",
  "ap.summaryEnding": "Số dư cuối kỳ",
  "ap.summaryMinIncome": "Thu nhập tối thiểu cần có",
  "ap.summaryLargestGap": "Khoảng hụt tháng lớn nhất",
  "ap.recTitle": "Các bước tiếp theo được gợi ý",
  "ap.recIntroStable":
    "Dự phóng của bạn ổn định — không có tháng nào xuống dưới quỹ dự phòng trong khung thời gian này. Không cần gợi ý cụ thể dựa trên dữ liệu đã nhập. Bạn vẫn có thể dùng khung thử nghiệm bên dưới để thử các thay đổi giả định.",
  "ap.recIntro":
    "Các gợi ý này được tạo từ kết quả mô phỏng bằng quy tắc cố định, không phải AI, và không phải lời khuyên tài chính. Chọn một giải pháp để tạo kế hoạch cá nhân hoá bằng AI.",
  "ap.selected": "Đã chọn",
  "ap.selectSolution": "Chọn giải pháp này",
  "ap.simulateAdjustment": "Mô phỏng điều chỉnh này",
  "ap.addManual":
    "Thêm một điều chỉnh thủ công trong khung thử nghiệm bên dưới để thử.",
  "ap.cannotSimulate":
    "Không thể mô phỏng hành động này bằng công cụ thử nghiệm hiện tại.",
  "ap.expectedImpact": "Tác động dự kiến",
  "ap.impactNotQuantified":
    "Tác động này không thể định lượng bằng công cụ mô phỏng hiện tại.",
  "ap.limitations": "Giới hạn",
  "ap.informationNeeded": "Thông tin cần có",
  "ap.aiPlanTitle": "Kế hoạch hành động AI cho giải pháp đã chọn",
  "ap.generateAiPlan": "Tạo kế hoạch hành động AI",
  "ap.generating": "Đang tạo…",
  "ap.aiPlanIntro":
    "Kế hoạch AI sẽ cá nhân hoá {title} dựa trên kết quả mô phỏng của bạn{exp}.",
  "ap.aiPlanIntroWithExp": " và các điều chỉnh đã thử",
  "ap.aiPersonalizedTitle": "Kế hoạch hành động cá nhân hoá bằng AI",
  "ap.testAdjustment": "Thử một điều chỉnh",
  "ap.testNote":
    "Thay đổi mà không ảnh hưởng đến hồ sơ đã lưu. Phép so sánh dùng cùng công thức như bảng rủi ro.",
  "ap.clearAdjustments": "Xoá các điều chỉnh",
  "ap.adjustment": "Điều chỉnh",
  "ap.monthlyAmountVnd": "Số tiền hàng tháng (VND)",
  "ap.removeAdjustment": "Xoá điều chỉnh {n}",
  "ap.noAdjustments":
    "Chưa có điều chỉnh nào. Thêm một điều chỉnh để xem nó có thể thay đổi kết quả ra sao.",
  "ap.addAdjustment": "Thêm điều chỉnh",
  "ap.beforeVsAfter": "So sánh trước và sau",
  "ap.riskLevel": "Mức độ rủi ro",
  "ap.lowestBalance": "Số dư thấp nhất",
  "ap.endingBalance": "Số dư cuối kỳ",
  "ap.reserveDeficit": "Thiếu hụt quỹ dự phòng",
  "ap.maxMonthlyGap": "Khoảng hụt tháng lớn nhất",
  "ap.firstBufferBreach": "Tháng đầu tiên thủng quỹ",
  "ap.none": "Không",
  "ap.before": "Trước",
  "ap.after": "Sau",
  "ap.change": "Thay đổi",
  "ap.riskImproved": "Rủi ro được cải thiện",
  "ap.mechanicalNote":
    "Đây là dự phóng cơ học từ các con số bạn nhập, không phải lời khuyên tài chính chuyên nghiệp. Kết quả thực tế phụ thuộc vào những yếu tố mà mô phỏng không thể nắm bắt.",

  // ── Priority labels ──
  "priority.high": "Ưu tiên cao",
  "priority.medium": "Ưu tiên trung bình",
  "priority.preventive": "Phòng ngừa",

  // ── Adjustment labels / hints ──
  "adjustment.cutFlexible": "Giảm chi tiêu linh hoạt",
  "adjustment.cutEssentials": "Giảm chi phí thiết yếu",
  "adjustment.raiseIncome": "Tăng thu nhập hàng tháng",
  "adjustment.cutFlexibleHint": "Chi tiêu không thiết yếu bạn có thể cắt mỗi tháng.",
  "adjustment.cutEssentialsHint":
    "Khoản bạn có thể tiết giảm từ chi phí thiết yếu mỗi tháng.",
  "adjustment.raiseIncomeHint": "Thu nhập thêm bạn có thể kiếm được mỗi tháng.",

  // ── Recommendation content ──
  "rec.budget.title": "Xem lại chi tiêu linh hoạt của bạn",
  "rec.budget.reasonGap": "Khoảng hụt dòng tiền tháng lớn nhất của bạn là {amount}.",
  "rec.budget.reasonNegative": "Có ít nhất một tháng có dòng tiền ròng âm.",
  "rec.budget.reasonFlex":
    "Bạn hiện có {amount} chi tiêu linh hoạt hàng tháng có thể xem xét lại.",
  "rec.budget.step1":
    "Liệt kê chi tiêu linh hoạt hiện tại và xác định khoản nào có thể giảm hoặc tạm dừng.",
  "rec.budget.step2":
    "Ưu tiên chi phí thiết yếu — không cắt thanh toán nợ bắt buộc hay chi phí sinh hoạt thiết yếu nếu chưa cân nhắc kỹ.",
  "rec.budget.step3":
    "Dùng khung thử nghiệm bên dưới để xem việc giảm chi tiêu linh hoạt một khoản cụ thể có thể thay đổi số dư dự phóng ra sao.",
  "rec.budget.impact":
    "Việc giảm chi tiêu linh hoạt có thể cải thiện dòng tiền ròng hàng tháng và số dư cuối kỳ. Dùng khung thử nghiệm để xem tác động chính xác với con số của bạn.",
  "rec.budget.lim1":
    "Mô phỏng không biết khoản chi nào thực sự là tuỳ ý — đánh giá đó thuộc về bạn.",
  "rec.budget.lim2":
    "Việc giảm chi phí thiết yếu chỉ nên làm tự nguyện và khi khả thi với tình huống của bạn.",

  "rec.income.title": "Lập kế hoạch cho sự biến động thu nhập",
  "rec.income.reasonSeasonal":
    "Thu nhập mùa thấp điểm ({low}) thấp hơn thu nhập thường ({normal}).",
  "rec.income.reasonInterruption":
    "Kịch bản bạn chọn bao gồm một gián đoạn thu nhập hoàn toàn.",
  "rec.income.reasonReduction": "Kịch bản của bạn gồm giảm {pct}% thu nhập.",
  "rec.income.step1":
    "Xác định những tháng thu nhập thường thấp hơn và ước tính mức thấp hơn bao nhiêu.",
  "rec.income.step2":
    "Cân nhắc các lựa chọn thực tế cho tình huống của bạn: điều chỉnh giờ làm, tìm thu nhập bổ sung, hoặc tích lũy quỹ trong các tháng thu nhập cao hơn.",
  "rec.income.step3":
    "Dùng khung thử nghiệm để xem một mức tăng thu nhập cụ thể có thể thay đổi dự phóng ra sao.",
  "rec.income.impact":
    "Thu nhập thêm trong các tháng thấp điểm có thể cải thiện số dư dự phóng. Dùng khung thử nghiệm để xem tác động của một mức tăng thu nhập cụ thể.",
  "rec.income.lim1":
    "Mô phỏng không thể đoán trước việc có thu nhập thêm hay không — điều đó tuỳ thuộc vào hoàn cảnh của bạn.",
  "rec.income.lim2":
    "Không bảo đảm bất kỳ mức thu nhập hay kết quả việc làm cụ thể nào.",

  "rec.reserve.title": "Xây dựng quỹ dự phòng khẩn cấp",
  "rec.reserve.reasonOpening":
    "Số dư đầu kỳ ({opening}) đang dưới quỹ dự phòng an toàn là {buffer}.",
  "rec.reserve.reasonBelow":
    "Số dư dự phóng lần đầu xuống dưới quỹ dự phòng ở tháng {n}.",
  "rec.reserve.step1":
    "Quỹ dự phòng an toàn của bạn là {buffer} — bằng một tháng chi phí thiết yếu cộng thanh toán nợ bắt buộc.",
  "rec.reserve.step2":
    "Nếu bạn có thặng dư hàng tháng, hãy cân nhắc dành một phần để dần xây dựng quỹ dự phòng.",
  "rec.reserve.step3":
    "Việc tích lũy tiết kiệm phụ thuộc vào thặng dư khả dụng — đây là quá trình dần dần, không phải giải pháp tức thì cho thiếu hụt dự phóng.",
  "rec.reserve.impact":
    "Tích lũy tiết kiệm hướng tới quỹ dự phòng có thể giảm nguy cơ thủng quỹ trong tương lai. Tốc độ phụ thuộc vào thặng dư khả dụng của bạn.",
  "rec.reserve.lim1":
    "Quỹ dự phòng (thiết yếu + nợ) là mục tiêu dự phòng theo mô hình này, không phải khuyến nghị quỹ khẩn cấp phổ quát.",
  "rec.reserve.lim2":
    "Việc tích lũy quỹ phụ thuộc vào thặng dư và các khoản đóng góp khả thi, mà mô phỏng không giả định.",
  "rec.reserve.lim3":
    "Tích lũy tiết kiệm không phải giải pháp tức thì cho thiếu hụt dòng tiền dự phóng trong các tháng tới.",
  "rec.reserve.missing": "Bạn có thể tiết kiệm thực tế bao nhiêu mỗi tháng",

  "rec.debt.title": "Chuẩn bị thanh toán nợ khi chịu áp lực",
  "rec.debt.reasonPayments": "Bạn có thanh toán nợ bắt buộc {amount} mỗi tháng.",
  "rec.debt.reasonNegative": "Số dư dự phóng sẽ bị âm ở tháng {n}.",
  "rec.debt.reasonBuffer": "Số dư xuống dưới quỹ dự phòng ở tháng {n}.",
  "rec.debt.reasonPressure": "Dự phóng của bạn cho thấy áp lực dòng tiền hàng tháng.",
  "rec.debt.step1":
    "Ghi lại ngày đến hạn và số tiền thực tế của các khoản nợ hiện tại — thông tin này không có trong hồ sơ mô phỏng.",
  "rec.debt.step2":
    "Xem lại lịch thanh toán và xác nhận khoản nào đến hạn trong khung thời gian mô phỏng.",
  "rec.debt.step3":
    "Liên hệ chủ nợ hiện tại để hỏi các phương án hỗ trợ (nếu có). Không ngừng thanh toán khi chưa được xác nhận.",
  "rec.debt.impact":
    "Nắm rõ lịch thanh toán và các phương án của chủ nợ có thể giúp bạn tránh trễ hạn khi dòng tiền căng. Mô phỏng không thể định lượng điều này.",
  "rec.debt.lim1":
    "Ngày đến hạn thực tế không được ghi nhận trong hồ sơ hiện tại và phải do bạn xác nhận.",
  "rec.debt.lim2":
    "Mô phỏng không biết chính sách của chủ nợ, các chương trình hỗ trợ hay điều kiện đủ điều kiện.",
  "rec.debt.lim3":
    "Tái cấp vốn hay vay mới có thể không phù hợp với tình huống của bạn — hãy tìm lời khuyên cá nhân hoá trước khi quyết định.",
  "rec.debt.lim4":
    "Không ngừng hoặc giảm thanh toán bắt buộc khi chưa có xác nhận rõ ràng từ chủ nợ.",
  "rec.debt.missing1": "Ngày đến hạn thanh toán thực tế",
  "rec.debt.missing2": "Thông tin liên hệ và các phương án của chủ nợ",

  "rec.major.title": "Lập kế hoạch cho chi phí lớn hoặc phát sinh",
  "rec.major.reasonExpense":
    "Kịch bản của bạn có chi phí phát sinh {amount} ở tháng {n}.",
  "rec.major.step1":
    "Xác nhận chi phí phát sinh trong kịch bản là một chi phí thực sắp tới hay chỉ là bài kiểm tra áp lực giả định.",
  "rec.major.step2":
    "Nếu là chi phí thực, ghi lại thời điểm và số tiền dự kiến, và cân nhắc cách dàn trải hoặc chuẩn bị.",
  "rec.major.step3":
    "Dùng khung thử nghiệm để xem việc giảm chi tiêu khác hay tăng thu nhập có thể bù đắp khoản chi này.",
  "rec.major.impact":
    "Lập kế hoạch trước cho một chi phí lớn đã biết có thể giảm tác động lên số dư dự phóng. Dùng khung thử nghiệm để thử các điều chỉnh cụ thể.",
  "rec.major.lim1":
    "Mô phỏng coi mỗi chi phí phát sinh là một khoản một lần — không mô hình hoá trả góp hay chi tiêu theo giai đoạn.",
  "rec.major.lim2":
    "Mô hình dữ liệu hiện tại không hỗ trợ nhập riêng các chi phí dự kiến trong tương lai ngoài kịch bản áp lực.",

  "rec.support.title": "Cân nhắc tìm hỗ trợ hoặc tư vấn tài chính",
  "rec.support.reasonNegative":
    "Số dư dự phóng sẽ bị âm ở tháng {n}, cho thấy áp lực tài chính đáng kể.",
  "rec.support.reasonDeficit":
    "Thiếu hụt quỹ dự phóng của bạn là {amount}, và số dư xuống dưới quỹ dự phòng an toàn.",
  "rec.support.step1":
    "Nếu bạn đang gặp khó khăn tức thì trong việc chi trả chi phí thiết yếu, hãy cân nhắc liên hệ một dịch vụ tư vấn tài chính được công nhận tại khu vực của bạn.",
  "rec.support.step2":
    "Chuẩn bị sẵn thông tin thu nhập, chi phí và nợ hiện tại trước khi tìm tư vấn — điều này giúp cuộc trao đổi hiệu quả hơn.",
  "rec.support.step3":
    "Cần thêm thông tin về các nghĩa vụ cụ thể và các chương trình hỗ trợ sẵn có để có hướng dẫn sát hơn.",
  "rec.support.impact":
    "Trao đổi với một cố vấn chuyên môn hoặc dịch vụ hỗ trợ có thể giúp bạn tiếp cận các phương án mà mô phỏng không thể đánh giá. Lợi ích không thể định lượng bằng công cụ này.",
  "rec.support.lim1":
    "Mô phỏng không thể giới thiệu tổ chức, chương trình hỗ trợ hay quyền lợi cụ thể.",
  "rec.support.lim2":
    "Điều kiện đủ điều kiện cho các chương trình hỗ trợ phụ thuộc vào thông tin không được ghi nhận ở đây.",
  "rec.support.lim3":
    "Việc khám phá dịch vụ hỗ trợ trực tiếp là một khả năng sẽ phát triển trong tương lai.",
  "rec.support.missing1": "Vị trí và khu vực pháp lý của bạn",
  "rec.support.missing2": "Các nghĩa vụ cụ thể và tiêu chí đủ điều kiện",

  // ── Relevant services ──
  "services.explore": "Khám phá dịch vụ phù hợp",
  "services.transparency":
    "Tài nguyên ngoài chỉ để tham khảo. SafeFlow AI hiện không xác minh các nhà cung cấp này và không xác nhận bất kỳ quan hệ đối tác hay liên kết nào. Vui lòng xem điều khoản của từng nhà cung cấp trước khi sử dụng.",
  "services.section.budget_optimization": "Tài chính cá nhân & Ngân sách",
  "services.section.income_stability": "Việc làm & Phát triển kỹ năng",
  "services.section.emergency_reserve": "Tiết kiệm & Tài khoản ngân hàng",
  "services.section.debt_payment_preparation": "Hỗ trợ nợ & Tư vấn",
  "services.section.major_expense_planning": "Bảo hiểm & Lập kế hoạch tài chính",
  "services.section.financial_support_advice": "Hỗ trợ & Hướng dẫn tài chính",
  "services.desc.budget_moneylover":
    "Ứng dụng tài chính cá nhân để theo dõi chi tiêu và lập ngân sách.",
  "services.desc.income_hcm":
    "Việc làm và dịch vụ hỗ trợ việc làm tại TP. Hồ Chí Minh.",
  "services.desc.income_coursera":
    "Khóa học trực tuyến và chứng chỉ nghề nghiệp để xây dựng kỹ năng mới.",
  "services.desc.reserve_vietcombank":
    "Ngân hàng thương mại cung cấp tài khoản tiết kiệm và dịch vụ ngân hàng cá nhân.",
  "services.desc.reserve_tpbank":
    "Dịch vụ ngân hàng số gồm tiết kiệm và tài khoản cá nhân.",
  "services.desc.debt_lnt":
    "Hãng luật cung cấp tư vấn pháp lý về nợ và nghĩa vụ tài chính.",
  "services.desc.major_manulife":
    "Sản phẩm bảo hiểm và lập kế hoạch tài chính cho các chi phí lớn trong đời.",
  "services.desc.support_cfrc":
    "Tư vấn và nguồn lực hỗ trợ tài chính cho cá nhân.",

  // ── AI explanation UI ──
  "ai.dismiss": "Đóng",
  "ai.generating": "Đang tạo giải thích…",
  "ai.errorDefault": "Đã có lỗi xảy ra. Vui lòng thử lại.",
  "ai.errorServer":
    "Máy chủ gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại.",
  "ai.errorEmpty": "Dịch vụ AI trả về phản hồi rỗng. Vui lòng thử lại.",
  "ai.aiEmpty": "AI trả về phản hồi rỗng. Vui lòng thử lại.",
  "ai.tryAgain": "Thử lại",
  "ai.footer":
    "Nội dung do AI tạo từ dữ liệu mô phỏng của bạn. Không phải lời khuyên tài chính.",

  // ── Chart labels ──
  "chart.ariaLabel":
    "Số dư tiền mặt dự kiến, đường cơ sở so với {scenario}, với đường 0 và quỹ dự phòng {buffer}",
  "chart.zeroBalance": "Số dư 0",
  "chart.safetyBuffer": "Quỹ dự phòng {amount}",
  "chart.baseline": "Đường cơ sở",
  "chart.monthN": "Tháng {n}",

  // ── AmountField ──
  "form.optional": "(tuỳ chọn)",

  // ── formatCurrency helpers ──
  "format.unlimited": "Không giới hạn",
  "format.monthsValue": "{n} tháng",

  // ── PDF export ──
  "pdf.reportTitle": "Báo cáo khả năng chịu đựng dòng tiền",
  "pdf.generated": "Tạo lúc {date} {time}",
  "pdf.horizon": "Khung thời gian: {n} tháng",
  "pdf.inputSummary": "Tóm tắt dữ liệu nhập",
  "pdf.inputNote": "Tất cả số liệu tính theo tháng và bằng VND. Chỉ lưu trong trình duyệt này.",
  "pdf.safetyBuffer": "Quỹ dự phòng an toàn (thiết yếu + nợ):",
  "pdf.safetyBufferNote": "Bằng một tháng chi phí thiết yếu cộng thanh toán nợ bắt buộc (E + D).",
  "pdf.scenarioAssumptions": "Giả định kịch bản",
  "pdf.scenarioType": "Loại kịch bản",
  "pdf.forecastHorizon": "Khung thời gian dự phóng",
  "pdf.incomeReduction": "Giảm thu nhập",
  "pdf.affectedMonths": "Các tháng ảnh hưởng",
  "pdf.unexpectedExpenseMonth": "Chi phí phát sinh (tháng {n})",
  "pdf.riskClassification": "Phân loại rủi ro",
  "pdf.riskNote": "Mức rủi ro dựa trên số dư cuối tháng dự phóng: Cao = bất kỳ tháng nào số dư âm; Trung bình = bất kỳ tháng nào dưới quỹ dự phòng (không âm); Thấp = mọi tháng ở hoặc trên quỹ. Số dư đầu kỳ có thể ban đầu dưới quỹ dự phòng — điều đó một mình không nâng mức rủi ro trừ khi số dư cuối tháng dự phóng cũng xuống dưới quỹ.",
  "pdf.riskLevel": "Mức rủi ro: {level}",
  "pdf.keyResults": "Kết quả chính",
  "pdf.lowestBalance": "Số dư cuối tháng thấp nhất",
  "pdf.endingBalance": "Số dư cuối kỳ",
  "pdf.maxMonthlyGap": "Khoảng hụt tháng lớn nhất",
  "pdf.maxReserveDeficit": "Thiếu hụt quỹ lớn nhất",
  "pdf.runwayZero": "Thời gian trụ (thu nhập 0)",
  "pdf.minIncomeNeeded": "Thu nhập tối thiểu cần có",
  "pdf.firstBelowBuffer": "Tháng đầu tiên dưới quỹ",
  "pdf.firstNegative": "Tháng đầu tiên số dư âm",
  "pdf.beforeSavings": "Trước khi dùng tiết kiệm",
  "pdf.shortfallBelowZero": "Thiếu hụt dưới 0",
  "pdf.essentialsDebtMo": "Thiết yếu + nợ/tháng",
  "pdf.monthN": "Tháng {n}",
  "pdf.projectedCashBalance": "Số dư tiền mặt dự kiến",
  "pdf.monthlyIncomeOutflow": "Thu nhập vs chi phí hàng tháng",
  "pdf.incomeAdjusted": "Thu nhập (điều chỉnh)",
  "pdf.outflow": "Chi phí",
  "pdf.monthlyCashFlow": "Dự phóng dòng tiền hàng tháng",
  "pdf.colMonth": "Th.",
  "pdf.colIncome": "Thu nhập",
  "pdf.colOutflow": "Chi phí",
  "pdf.colNetFlow": "Dòng ròng",
  "pdf.colClosing": "Số dư cuối kỳ",
  "pdf.colStatus": "Trạng thái",
  "pdf.statusNegative": "Số dư âm",
  "pdf.statusBelow": "Dưới quỹ",
  "pdf.statusAbove": "Trên quỹ",
  "pdf.recommendedNextSteps": "Các bước tiếp theo được gợi ý",
  "pdf.recIntro": "Tạo từ kết quả mô phỏng bằng quy tắc cố định, không phải AI. Không phải lời khuyên tài chính.",
  "pdf.stableProjection": "Dự phóng của bạn ổn định — không có tháng nào xuống dưới quỹ dự phòng trong khung thời gian này. Không cần gợi ý cụ thể dựa trên dữ liệu đã nhập.",
  "pdf.priorityBadge": "Ưu tiên {priority}",
  "pdf.whySelected": "Vì sao được chọn",
  "pdf.actionSteps": "Các bước hành động",
  "pdf.expectedImpact": "Tác động dự kiến",
  "pdf.limitations": "Giới hạn",
  "pdf.informationNeeded": "Thông tin cần có",
  "pdf.disclaimer": "Báo cáo này được SafeFlow AI tạo từ các con số bạn nhập. Dự phóng là ước tính cơ học, không phải bảo chứng. Các gợi ý được tạo bằng quy tắc cố định, không phải AI, và không phải lời khuyên tài chính. Kết quả thực tế phụ thuộc vào những yếu tố mà mô phỏng không thể nắm bắt. Hãy tham khảo cố vấn tài chính có chuyên môn trước khi quyết định.",
  "pdf.pageFooter": "SafeFlow AI — Báo cáo khả năng chịu đựng dòng tiền  |  Trang {p}/{pc}",
  "pdf.zeroBalance": "Số 0",
  "pdf.bufferShort": "Quỹ {amount}",
  "pdf.baseline": "Đường cơ sở",
  "pdf.safetyBufferLabel": "Quỹ dự phòng an toàn",

  // ── AI prompt language instruction ──
  "ai.promptLang.en": "Respond in clear English.",
  "ai.promptLang.vi":
    "Respond in clear, professional Vietnamese (Tiếng Việt). Keep brand names, currency values, and numbers unchanged.",
};
