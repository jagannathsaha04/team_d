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
  transactionCount: number;
}

/** Full analytics output — structured into clear sections */
export interface AnalyticsResult {
  /** Aggregate numbers across all transactions */
  aggregates: {
    totalSpend: number;
    transactionCount: number;
    averageTransaction: number;
    dateRange: { from: string; to: string };
  };
  /** Per-category spend totals */
  categoryBreakdown: CategoryBreakdown;
  /** Per-ISO-week spend totals */
  weeklySpending: WeeklySpending;
  /** Top merchants ranked by total spend */
  merchants: MerchantTotal[];
}

/**
 * A detected spending pattern / anomaly.
 */
export interface Pattern {
  type: 'overspending' | 'weekend_spike' | 'high_frequency' | 'subscription';
  severity: 'high' | 'medium' | 'low';
  category?: string;
  merchant?: string;
  detail: string;
  /** The trigger metric (e.g. % of total, count, ₹ diff) */
  data: {
    metric: number;
    threshold: number;
    unit: string;
    extra?: Record<string, number>; // optional dictionary for auxiliary metrics
  };
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

/** Clean /analyze response shape (Step 8) */
export interface AnalysisResponse {
  totalSpend: number;
  categoryBreakdown: CategoryBreakdown;
  weeklySpending: WeeklySpending;
  patterns: Pattern[];
  insights: Insight[];
  healthScore: HealthScore;
}
