// ============================================================
// STEP 6 — Financial Health Score
// ============================================================

import { AnalyticsResult, Pattern, Insight, HealthScore } from '../types';

const ESSENTIAL_CATEGORIES = new Set([
  'groceries', 'grocery', 'utilities', 'rent', 'housing',
  'insurance', 'healthcare', 'health', 'education',
  'transport', 'transportation', 'fuel', 'bills',
]);

export function calculateScore(
  analytics: AnalyticsResult,
  patterns: Pattern[],
  insights: Insight[],
): HealthScore {
  let score = 0;
  const totalSpend = analytics.aggregates.totalSpend;

  // Factor 1: Essential vs Luxury ratio (max 30 pts)
  let essentialSpend = 0;
  for (const [category, amount] of Object.entries(analytics.categoryBreakdown)) {
    if (ESSENTIAL_CATEGORIES.has(category.toLowerCase())) {
      essentialSpend += amount;
    }
  }
  const essentialRatio = totalSpend > 0 ? essentialSpend / totalSpend : 0.5;
  score += Math.min(30, Math.round((essentialRatio / 0.7) * 30));

  // Factor 2: Overspending categories (max 25 pts)
  const overspendCount = patterns.filter((p) => p.type === 'overspending').length;
  score += Math.max(0, 25 - overspendCount * 8);

  // Factor 3: Spending consistency across weeks (max 25 pts)
  const weeklyValues = Object.values(analytics.weeklySpending);
  if (weeklyValues.length > 1) {
    const mean = weeklyValues.reduce((s, v) => s + v, 0) / weeklyValues.length;
    const variance = weeklyValues.reduce((s, v) => s + (v - mean) ** 2, 0) / weeklyValues.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    score += Math.min(25, Math.max(0, Math.round(25 * (1 - cv / 1.0))));
  } else {
    score += 15;
  }

  // Factor 4: Savings potential (max 20 pts)
  const totalSavings = insights.reduce((s, i) => s + i.savingsEstimate, 0);
  const savingsRatio = totalSpend > 0 ? totalSavings / totalSpend : 0;
  score += Math.min(20, Math.max(0, Math.round(20 * (1 - savingsRatio / 0.3))));

  // Clamp and label
  score = Math.max(0, Math.min(100, score));
  let label: HealthScore['label'];
  if (score >= 70) label = 'Excellent';
  else if (score >= 40) label = 'Moderate';
  else label = 'Risky';

  return { score, label };
}
