// ============================================================
// STEP 7 — Savings Simulator
// ============================================================

import { AnalyticsResult, SimulatorInput, SimulatorOutput } from '../types';

/**
 * Simulate potential savings by applying user-specified percentage
 * reductions to Food, Travel, and Entertainment categories.
 */
export function simulateSavings(
  input: SimulatorInput,
  analytics: AnalyticsResult,
): SimulatorOutput {
  const breakdown = analytics.categoryBreakdown;

  // Find matching category spend (case-insensitive fuzzy match)
  const foodSpend = findCategorySpend(breakdown, ['food', 'dining', 'restaurant', 'groceries']);
  const travelSpend = findCategorySpend(breakdown, ['travel', 'transport', 'transportation', 'fuel']);
  const entertainmentSpend = findCategorySpend(breakdown, ['entertainment', 'leisure', 'movies', 'gaming']);

  // Calculate monthly savings from each reduction
  const foodSavings = foodSpend * (clampPct(input.foodReduction) / 100);
  const travelSavings = travelSpend * (clampPct(input.travelReduction) / 100);
  const entertainmentSavings = entertainmentSpend * (clampPct(input.entertainmentReduction) / 100);

  const monthlySavings = Math.round((foodSavings + travelSavings + entertainmentSavings) * 100) / 100;

  return {
    monthlySavings,
    yearlySavings: Math.round(monthlySavings * 12 * 100) / 100,
  };
}

/** Sum spend across all categories whose names include any of the keywords. */
function findCategorySpend(breakdown: Record<string, number>, keywords: string[]): number {
  let total = 0;
  for (const [cat, amount] of Object.entries(breakdown)) {
    const lower = cat.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      total += amount;
    }
  }
  return total;
}

/** Clamp a percentage value to [0, 100]. */
function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value ?? 0));
}
