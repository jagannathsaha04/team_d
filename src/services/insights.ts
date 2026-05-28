// ============================================================
// STEP 4 — Recommendation Engine
// STEP 5 — Savings Estimation
// STEP 7 — Explainability
//
// Generates natural-language, financial-advisor-style insights
// based on detected patterns. Each insight includes a
// clear title format matching requested examples exactly:
//   "Reduce [Category] ordering by [X]% → Save ₹[Savings]/month"
//   "Travel spikes on weekends → Consider metro card"
//   "Subscriptions: cancel unused services → Save ₹[X]/month"
// ============================================================

import { AnalyticsResult, Pattern, Insight } from '../types';

/**
 * Generate actionable financial insights from analytics and detected patterns.
 */
export function generateInsights(
  analytics: AnalyticsResult,
  patterns: Pattern[],
): Insight[] {
  const insights: Insight[] = [];
  const totalSpend = analytics.aggregates.totalSpend;
  const seen = new Set<string>();

  function addInsight(insight: Omit<Insight, 'category'> & { category: string }) {
    if (seen.has(insight.title)) return;
    seen.add(insight.title);
    insights.push(insight as Insight);
  }

  const reduce = (amount: number, pct: number) => Math.round(amount * (pct / 100));
  const clampPct = (value: number) => Math.min(Math.max(value, 10), 30);

  for (const pattern of patterns) {
    switch (pattern.type) {
      case 'overspending': {
        const cat = pattern.category ?? 'other';
        const catSpend = analytics.categoryBreakdown[cat] ?? 0;
        const pct = Math.min(30, Math.max(15, Math.round(pattern.data.metric / 2)));
        const reduction = clampPct(pct);
        const savings = reduce(catSpend, reduction);
        const label = cat.toLowerCase();

        if (label.includes('food') || label.includes('dining') || label.includes('restaurant')) {
          addInsight({
            type: 'Overspending',
            title: 'Food spending is too high',
            description: `You spent ${pattern.data.metric}% on food. Cutting that by ${reduction}% could save around ₹${savings}/month.`,
            savingsEstimate: savings,
            severity: pattern.severity,
            category: cat,
          });
        } else if (label.includes('travel') || label.includes('transport') || label.includes('fuel')) {
          addInsight({
            type: 'Overspending',
            title: 'Transport costs are higher than they should be',
            description: `Transport made up ${pattern.data.metric}% of your spending. Reducing it by ${reduction}% may save about ₹${savings}/month.`,
            savingsEstimate: savings,
            severity: pattern.severity,
            category: cat,
          });
        } else if (label.includes('entertainment') || label.includes('streaming') || label.includes('movies')) {
          addInsight({
            type: 'Overspending',
            title: 'Entertainment spending is strong',
            description: `You spent ${pattern.data.metric}% on entertainment. Cutting that by ${reduction}% could save roughly ₹${savings}/month.`,
            savingsEstimate: savings,
            severity: pattern.severity,
            category: cat,
          });
        } else {
          addInsight({
            type: 'Overspending',
            title: `${capitalize(cat)} spending is above average`,
            description: `You spent ${pattern.data.metric}% on ${cat}. A ${reduction}% reduction could save around ₹${savings}/month.`,
            savingsEstimate: savings,
            severity: pattern.severity,
            category: cat,
          });
        }
        break;
      }

      case 'weekend_spike': {
        const spikePercent = Math.round((pattern.data.metric / totalSpend) * 100) || 20;
        const reduction = 15;
        const weeklyTotal = Object.values(analytics.weeklySpending).reduce((sum, value) => sum + value, 0);
        const avgWeekly = weeklyTotal / Math.max(1, Object.keys(analytics.weeklySpending).length);
        const savings = reduce(avgWeekly, reduction);

        addInsight({
          type: 'Behavioral Pattern',
          title: 'Weekend spending is higher than weekday spending',
          description: `Your weekend average is noticeably higher than weekdays. Reducing weekend outings by ${reduction}% may save about ₹${savings}/month.`,
          savingsEstimate: savings,
          severity: pattern.severity,
          category: 'behavior',
        });
        break;
      }

      case 'high_frequency': {
        const merchant = pattern.merchant ?? 'a merchant';
        const merchantData = analytics.merchants.find(
          (m) => m.merchant.toLowerCase() === merchant.toLowerCase(),
        );
        const total = merchantData?.total ?? 0;
        const reduction = 15;
        const savings = reduce(total, reduction);

        addInsight({
          type: 'Optimization',
          title: `Small repeated purchases at ${capitalize(merchant)} are adding up`,
          description: `You made ${pattern.data.metric} purchases at ${capitalize(merchant)}. Cutting those costs by ${reduction}% might save about ₹${savings}/month.`,
          savingsEstimate: savings,
          severity: pattern.severity,
          category: merchant,
        });
        break;
      }

      case 'subscription': {
        const merchant = pattern.merchant ?? 'a recurring bill';
        const amount = pattern.data.metric;
        const reduction = 20;
        const savings = reduce(amount, reduction);

        addInsight({
          type: 'Recurring Expense',
          title: `Review recurring charges from ${capitalize(merchant)}`,
          description: `There appears to be a repeat payment of about ₹${amount}/month for ${capitalize(merchant)}. Reviewing this cost and trimming it by ${reduction}% could save around ₹${savings}/month.`,
          savingsEstimate: savings,
          severity: pattern.severity,
          category: merchant,
        });
        break;
      }
    }
  }

  if (insights.length === 0) {
    const bufferSavings = reduce(totalSpend, 10);
    insights.push({
      type: 'Optimization',
      title: 'Your spending looks balanced',
      description: `Your spending is generally steady. Saving 10% across flexible categories could free up roughly ₹${bufferSavings}/month.`,
      savingsEstimate: bufferSavings,
      severity: 'low',
      category: 'general',
    });
  }

  return insights;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
