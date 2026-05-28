export interface Transaction {
  date: string;
  merchant: string;
  amount: number;
  category: string;
}

export interface CategoryBreakdown {
  [category: string]: number;
}

export interface WeeklySpending {
  [week: string]: number;
}

export interface MerchantTotal {
  merchant: string;
  total: number;
  transactionCount: number;
}

export interface AnalyticsResult {
  aggregates: {
    totalSpend: number;
    transactionCount: number;
    averageTransaction: number;
    dateRange: { from: string; to: string };
  };
  categoryBreakdown: CategoryBreakdown;
  weeklySpending: WeeklySpending;
  merchants: MerchantTotal[];
}

export interface Pattern {
  type: 'overspending' | 'weekend_spike' | 'high_frequency' | 'subscription';
  severity: 'high' | 'medium' | 'low';
  category?: string;
  merchant?: string;
  detail: string;
  data: {
    metric: number;
    threshold: number;
    unit: string;
  };
}

export interface Insight {
  title: string;
  description: string;
  savingsEstimate: number;
  category: string;
}

export interface HealthScore {
  score: number;
  label: 'Excellent' | 'Moderate' | 'Risky';
}

export interface DashboardData {
  transactions: Transaction[];
  analytics: AnalyticsResult;
  patterns: Pattern[];
  insights: Insight[];
  healthScore: HealthScore;
}
