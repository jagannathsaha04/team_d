// ============================================================
// SpendSmart AI — Shared Type Definitions
// ============================================================

/** A single parsed and validated transaction row */
export interface Transaction {
  date: Date;
  merchant: string;
  amount: number;
  category: string;
}

/** Category-level spending totals */
export interface CategoryBreakdown {
  [category: string]: number;
}

/** Week-level spending totals (ISO week key, e.g. "2024-W03") */
export interface WeeklySpending {
  [week: string]: number;
}

/** A merchant with its aggregate spend */
export interface MerchantTotal {
  merchant: string;
  total: number;
}

/** Full analytics output from analyzeTransactions() */
export interface AnalyticsResult {
  totalSpend: number;
  categoryBreakdown: CategoryBreakdown;
  weeklySpending: WeeklySpending;
  topMerchants: MerchantTotal[];
}

/** A detected spending pattern / anomaly */
export interface Pattern {
  type: 'overspending' | 'weekend_spike' | 'high_frequency' | 'subscription';
  category?: string;
  merchant?: string;
  detail: string;
  value: number; // the metric that triggered the pattern
}

/** A single actionable insight with estimated savings */
export interface Insight {
  title: string;
  description: string;
  savingsEstimate: number;
  category: string;
}

/** Financial health score output */
export interface HealthScore {
  score: number;
  label: 'Excellent' | 'Moderate' | 'Risky';
}

/** Savings simulator input */
export interface SimulatorInput {
  foodReduction: number;       // percentage (0–100)
  travelReduction: number;     // percentage (0–100)
  entertainmentReduction: number; // percentage (0–100)
}

/** Savings simulator output */
export interface SimulatorOutput {
  monthlySavings: number;
  yearlySavings: number;
}

/** Validation error for a single CSV row */
export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

/** Result of CSV parsing — either success or failure with errors */
export interface ParseResult {
  success: boolean;
  transactions: Transaction[];
  errors: ValidationError[];
  rowCount: number;
}

/** Combined analysis response sent to the client */
export interface AnalysisResponse {
  analytics: AnalyticsResult;
  patterns: Pattern[];
  insights: Insight[];
  healthScore: HealthScore;
}
