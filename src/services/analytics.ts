// ============================================================
// STEP 2 — Analytics Engine
// Computes aggregate metrics from validated transactions:
//   • Total spend
//   • Per-category breakdown
//   • Weekly spending timeline
//   • Top merchants by spend
// ============================================================
// STEP 3 — Pattern Detection
// Layered on top of analytics to detect anomalies:
//   • Overspending  — any category > 30% of total
//   • Weekend spikes — weekend avg > weekday avg
//   • High frequency — same merchant > 5 transactions
//   • Subscriptions  — recurring same-merchant, similar amounts
// ============================================================

import {
  Transaction,
  AnalyticsResult,
  CategoryBreakdown,
  WeeklySpending,
  MerchantTotal,
  Pattern,
} from '../types';

// ── Helpers ─────────────────────────────────────────────────

/**
 * Return an ISO-week key like "2024-W03" for a given date.
 */
function getISOWeekKey(d: Date): string {
  // Clone to avoid mutating the original
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday (ISO week definition)
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Check if a date falls on a weekend (Saturday = 6, Sunday = 0).
 */
function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

// ── STEP 2: Core Analytics ──────────────────────────────────

/**
 * Compute aggregate analytics across all transactions.
 */
export function analyzeTransactions(transactions: Transaction[]): AnalyticsResult {
  let totalSpend = 0;
  const categoryBreakdown: CategoryBreakdown = {};
  const weeklySpending: WeeklySpending = {};
  const merchantTotals: Record<string, number> = {};

  for (const tx of transactions) {
    // Running total
    totalSpend += tx.amount;

    // Category accumulation
    const cat = tx.category.toLowerCase();
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + tx.amount;

    // Weekly accumulation
    const weekKey = getISOWeekKey(tx.date);
    weeklySpending[weekKey] = (weeklySpending[weekKey] || 0) + tx.amount;

    // Merchant accumulation
    const m = tx.merchant.toLowerCase();
    merchantTotals[m] = (merchantTotals[m] || 0) + tx.amount;
  }

  // Top merchants — sorted descending by total, take top 10
  const topMerchants: MerchantTotal[] = Object.entries(merchantTotals)
    .map(([merchant, total]) => ({ merchant, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    categoryBreakdown: roundValues(categoryBreakdown),
    weeklySpending: roundValues(weeklySpending),
    topMerchants,
  };
}

/** Round all values in a Record to 2 decimals for cleanliness. */
function roundValues(obj: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = Math.round(v * 100) / 100;
  }
  return out;
}

// ── STEP 3: Pattern Detection ───────────────────────────────

/**
 * Detect spending patterns and anomalies from transactions + analytics.
 */
export function detectPatterns(
  transactions: Transaction[],
  analytics: AnalyticsResult,
): Pattern[] {
  const patterns: Pattern[] = [];

  // ── 1. Overspending: any category > 30% of total ──
  for (const [category, amount] of Object.entries(analytics.categoryBreakdown)) {
    const pct = (amount / analytics.totalSpend) * 100;
    if (pct > 30) {
      patterns.push({
        type: 'overspending',
        category,
        detail: `"${category}" accounts for ${pct.toFixed(1)}% of total spending (₹${amount.toFixed(0)})`,
        value: Math.round(pct * 10) / 10,
      });
    }
  }

  // ── 2. Weekend spikes: compare weekend avg vs weekday avg ──
  let weekendTotal = 0;
  let weekendCount = 0;
  let weekdayTotal = 0;
  let weekdayCount = 0;

  for (const tx of transactions) {
    if (isWeekend(tx.date)) {
      weekendTotal += tx.amount;
      weekendCount++;
    } else {
      weekdayTotal += tx.amount;
      weekdayCount++;
    }
  }

  const weekendAvg = weekendCount > 0 ? weekendTotal / weekendCount : 0;
  const weekdayAvg = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0;

  if (weekendAvg > weekdayAvg * 1.25 && weekendCount > 0) {
    // Weekend avg is at least 25% higher than weekday avg
    patterns.push({
      type: 'weekend_spike',
      detail: `Weekend avg spend (₹${weekendAvg.toFixed(0)}) is ${((weekendAvg / weekdayAvg - 1) * 100).toFixed(0)}% higher than weekday avg (₹${weekdayAvg.toFixed(0)})`,
      value: Math.round(weekendAvg - weekdayAvg),
    });
  }

  // ── 3. High frequency: same merchant > 5 transactions ──
  const merchantFreq: Record<string, number> = {};
  for (const tx of transactions) {
    const key = tx.merchant.toLowerCase();
    merchantFreq[key] = (merchantFreq[key] || 0) + 1;
  }

  for (const [merchant, count] of Object.entries(merchantFreq)) {
    if (count > 5) {
      patterns.push({
        type: 'high_frequency',
        merchant,
        detail: `${count} transactions at "${merchant}" — consider bundling or a membership`,
        value: count,
      });
    }
  }

  // ── 4. Subscription detection: recurring merchant with similar amounts ──
  const merchantAmounts: Record<string, number[]> = {};
  for (const tx of transactions) {
    const key = tx.merchant.toLowerCase();
    if (!merchantAmounts[key]) merchantAmounts[key] = [];
    merchantAmounts[key].push(tx.amount);
  }

  for (const [merchant, amounts] of Object.entries(merchantAmounts)) {
    if (amounts.length < 2) continue;

    // Check if amounts are "similar" — standard deviation < 15% of mean
    const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const variance = amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const coeffOfVariation = mean > 0 ? stdDev / mean : 1;

    if (coeffOfVariation < 0.15 && amounts.length >= 2) {
      patterns.push({
        type: 'subscription',
        merchant,
        detail: `"${merchant}" appears ${amounts.length} times with similar amounts (~₹${mean.toFixed(0)}). Likely a subscription.`,
        value: Math.round(mean * amounts.length * 100) / 100,
      });
    }
  }

  return patterns;
}
