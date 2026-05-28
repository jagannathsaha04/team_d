// ============================================================
// STEP 2 — Analytics Engine (Refactored into explicit pipeline)
//
// The analysis pipeline is now broken into discrete, testable
// functions that each do ONE thing:
//
//   aggregateTotals()          → total spend, count, average, date range
//   computeCategoryBreakdown() → per-category spend sums
//   computeWeeklySpending()    → per-ISO-week spend sums
//   computeMerchantRankings()  → top merchants by total spend
//
// STEP 3 — Pattern Detection
//
// Each pattern detector returns a structured signal with:
//   { type, severity, data: { metric, threshold, unit } }
//
// This makes patterns explainable — you can always say:
//   "This rule fired because <metric> exceeded <threshold> <unit>"
// ============================================================

import {
  Transaction,
  AnalyticsResult,
  CategoryBreakdown,
  WeeklySpending,
  MerchantTotal,
  Pattern,
} from '../types';

// ── Date Helpers ────────────────────────────────────────────

/**
 * Return an ISO-week key like "2024-W03" for a given date.
 * Used to bucket transactions into weekly time windows.
 */
function getISOWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
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

/** Round a number to 2 decimal places. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─────────────────────────────────────────────────────────────
// STEP 2A: aggregateTotals()
// ─────────────────────────────────────────────────────────────

export function aggregateTotals(transactions: Transaction[]): AnalyticsResult['aggregates'] {
  let totalSpend = 0;
  let minDate = transactions[0]?.date ?? new Date();
  let maxDate = transactions[0]?.date ?? new Date();

  for (const tx of transactions) {
    totalSpend += tx.amount;
    if (tx.date < minDate) minDate = tx.date;
    if (tx.date > maxDate) maxDate = tx.date;
  }

  return {
    totalSpend: round2(totalSpend),
    transactionCount: transactions.length,
    averageTransaction: round2(transactions.length > 0 ? totalSpend / transactions.length : 0),
    dateRange: {
      from: minDate.toISOString().split('T')[0],
      to: maxDate.toISOString().split('T')[0],
    },
  };
}

// ─────────────────────────────────────────────────────────────
// STEP 2B: computeCategoryBreakdown()
// ─────────────────────────────────────────────────────────────

export function computeCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown {
  const breakdown: CategoryBreakdown = {};

  for (const tx of transactions) {
    const cat = tx.category;
    breakdown[cat] = (breakdown[cat] || 0) + tx.amount;
  }

  for (const key of Object.keys(breakdown)) {
    breakdown[key] = round2(breakdown[key]);
  }

  return breakdown;
}

// ─────────────────────────────────────────────────────────────
// STEP 2C: computeWeeklySpending()
// ─────────────────────────────────────────────────────────────

export function computeWeeklySpending(transactions: Transaction[]): WeeklySpending {
  const weekly: WeeklySpending = {};

  for (const tx of transactions) {
    const weekKey = getISOWeekKey(tx.date);
    weekly[weekKey] = (weekly[weekKey] || 0) + tx.amount;
  }

  for (const key of Object.keys(weekly)) {
    weekly[key] = round2(weekly[key]);
  }

  return weekly;
}

// ─────────────────────────────────────────────────────────────
// STEP 2D: computeMerchantRankings()
// ─────────────────────────────────────────────────────────────

export function computeMerchantRankings(transactions: Transaction[]): MerchantTotal[] {
  const totals: Record<string, { total: number; count: number }> = {};

  for (const tx of transactions) {
    const m = tx.merchant;
    if (!totals[m]) totals[m] = { total: 0, count: 0 };
    totals[m].total += tx.amount;
    totals[m].count += 1;
  }

  return Object.entries(totals)
    .map(([merchant, { total, count }]) => ({
      merchant,
      total: round2(total),
      transactionCount: count,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

// ─────────────────────────────────────────────────────────────
// STEP 2 (main): analyzeTransactions()
// ─────────────────────────────────────────────────────────────

export function analyzeTransactions(transactions: Transaction[]): AnalyticsResult {
  return {
    aggregates: aggregateTotals(transactions),
    categoryBreakdown: computeCategoryBreakdown(transactions),
    weeklySpending: computeWeeklySpending(transactions),
    merchants: computeMerchantRankings(transactions),
  };
}

// ═════════════════════════════════════════════════════════════
// STEP 3 — PATTERN DETECTION
// ═════════════════════════════════════════════════════════════

// ── 3A: Overspending Detection ──────────────────────────────
function detectOverspending(
  categoryBreakdown: CategoryBreakdown,
  totalSpend: number,
): Pattern[] {
  const THRESHOLD_PCT = 30;
  const patterns: Pattern[] = [];

  for (const [category, amount] of Object.entries(categoryBreakdown)) {
    const pct = round2((amount / totalSpend) * 100);

    if (pct > THRESHOLD_PCT) {
      const severity: Pattern['severity'] =
        pct > 50 ? 'high' :
        pct > 40 ? 'medium' : 'low';

      patterns.push({
        type: 'overspending',
        severity,
        category,
        detail:
          `"${category}" accounts for ${pct}% of total spending (₹${Math.round(amount)}). ` +
          `Rule: any category > ${THRESHOLD_PCT}% is flagged as overspending.`,
        data: { metric: pct, threshold: THRESHOLD_PCT, unit: '% of total spend' },
      });
    }
  }

  return patterns;
}

// ── 3B: Weekend Spike Detection ─────────────────────────────
function detectWeekendSpikes(transactions: Transaction[]): Pattern[] {
  let weekendTotal = 0, weekendCount = 0;
  let weekdayTotal = 0, weekdayCount = 0;

  for (const tx of transactions) {
    if (isWeekend(tx.date)) {
      weekendTotal += tx.amount;
      weekendCount++;
    } else {
      weekdayTotal += tx.amount;
      weekdayCount++;
    }
  }

  const weekendAvg = weekendCount > 0 ? round2(weekendTotal / weekendCount) : 0;
  const weekdayAvg = weekdayCount > 0 ? round2(weekdayTotal / weekdayCount) : 0;

  const SPIKE_THRESHOLD = 1.25;
  if (weekendAvg > weekdayAvg * SPIKE_THRESHOLD && weekendCount >= 2) {
    const spikePercent = round2(((weekendAvg / weekdayAvg) - 1) * 100);
    const severity: Pattern['severity'] = spikePercent > 50 ? 'high' : 'medium';
    const spikeAmount = round2(weekendAvg - weekdayAvg);

    return [{
      type: 'weekend_spike',
      severity,
      detail:
        `Weekend avg spend (₹${weekendAvg}/tx) is ${spikePercent}% higher than weekday avg ` +
        `(₹${weekdayAvg}/tx). Rule: flags when weekend avg exceeds weekday avg by >25%.`,
      data: {
        metric: spikeAmount, // primary financial metric: extra spend per transaction
        threshold: 25,
        unit: 'INR extra spend per tx',
        extra: {
          spikePercent,
        },
      },
    }];
  }

  return [];
}

// ── 3C: High-Frequency Small Spends ─────────────────────────
function detectHighFrequency(transactions: Transaction[]): Pattern[] {
  const FREQ_THRESHOLD = 5;
  const merchantFreq: Record<string, number> = {};
  const patterns: Pattern[] = [];

  for (const tx of transactions) {
    merchantFreq[tx.merchant] = (merchantFreq[tx.merchant] || 0) + 1;
  }

  for (const [merchant, count] of Object.entries(merchantFreq)) {
    if (count > FREQ_THRESHOLD) {
      const severity: Pattern['severity'] = count > 10 ? 'high' : 'medium';

      patterns.push({
        type: 'high_frequency',
        severity,
        merchant,
        detail:
          `${count} transactions at "${merchant}" — frequent small spends add up. ` +
          `Rule: flags any merchant with >${FREQ_THRESHOLD} transactions.`,
        data: { metric: count, threshold: FREQ_THRESHOLD, unit: 'transactions' },
      });
    }
  }

  return patterns;
}

// ── 3D: Subscription Detection ──────────────────────────────
function detectSubscriptions(transactions: Transaction[]): Pattern[] {
  const merchantAmounts: Record<string, number[]> = {};
  const patterns: Pattern[] = [];

  for (const tx of transactions) {
    if (!merchantAmounts[tx.merchant]) merchantAmounts[tx.merchant] = [];
    merchantAmounts[tx.merchant].push(tx.amount);
  }

  for (const [merchant, amounts] of Object.entries(merchantAmounts)) {
    if (amounts.length < 2) continue;

    const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const variance = amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 1;
    const CV_THRESHOLD = 0.15;

    if (cv < CV_THRESHOLD) {
      const totalValue = round2(mean * amounts.length);
      const severity: Pattern['severity'] = totalValue > 1000 ? 'high' : 'medium';

      patterns.push({
        type: 'subscription',
        severity,
        merchant,
        detail:
          `"${merchant}" appears ${amounts.length} times with consistent amounts ` +
          `(~₹${Math.round(mean)}/charge, CV=${(cv * 100).toFixed(1)}%). ` +
          `Total: ₹${totalValue}. Rule: CV < ${CV_THRESHOLD * 100}% = likely subscription.`,
        data: {
          metric: round2(mean), // primary financial metric: recurring cost per charge
          threshold: CV_THRESHOLD * 100,
          unit: 'INR per charge',
          extra: {
            cvPercent: round2(cv * 100),
            count: amounts.length,
          },
        },
      });
    }
  }

  return patterns;
}

// ── Main pattern detection orchestrator ─────────────────────

export function detectPatterns(
  transactions: Transaction[],
  analytics: AnalyticsResult,
): Pattern[] {
  const patterns: Pattern[] = [
    ...detectOverspending(analytics.categoryBreakdown, analytics.aggregates.totalSpend),
    ...detectWeekendSpikes(transactions),
    ...detectHighFrequency(transactions),
    ...detectSubscriptions(transactions),
  ];

  const severityOrder = { high: 0, medium: 1, low: 2 };
  patterns.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return patterns;
}
