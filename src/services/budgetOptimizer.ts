// ============================================================
// Smart Budget Optimizer
// ============================================================

import { Transaction } from '../types';

export interface Recommendation {
  category: string;
  reductionPercent: number;
  savings: number;
}

export interface BudgetOptimizationResult {
  isOverBudget: boolean;
  deficit: number;
  recommendations: Recommendation[];
  message: string;
}

// Simple category classification
const essentialCategories = ['groceries', 'utilities', 'rent'];
const nonEssentialCategories = ['food', 'entertainment', 'shopping'];

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Optimize a user's monthly budget by proposing realistic cuts to non-essential categories.
 * - Prioritizes non-essential categories
 * - Applies reductions between 10% and 30%
 * - Keeps suggestions realistic and explainable
 */
export function optimizeBudget(transactions: Transaction[], monthlyBudget: number): BudgetOptimizationResult {
  const totalSpend = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  const isOverBudget = totalSpend > monthlyBudget;
  const deficitRaw = Math.max(0, totalSpend - monthlyBudget);
  const deficit = Math.round(deficitRaw * 100) / 100;

  if (!isOverBudget) {
    return {
      isOverBudget: false,
      deficit: 0,
      recommendations: [],
      message: `Good news — your total monthly spend (₹${totalSpend.toFixed(2)}) is within the budget of ₹${monthlyBudget.toFixed(2)}.`,
    };
  }

  // Aggregate spend by category
  const categoryTotals: Record<string, number> = {};
  for (const tx of transactions) {
    const cat = (tx.category || 'uncategorized').toLowerCase();
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (tx.amount || 0);
  }

  // Build candidate list from non-essential categories present in the data
  const candidates = Object.entries(categoryTotals)
    .filter(([cat]) => nonEssentialCategories.includes(cat))
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const recommendations: Recommendation[] = [];
  let remaining = deficit;

  // First pass: suggest a realistic reduction per category sufficient to cover the deficit if possible
  for (const c of candidates) {
    if (remaining <= 0) break;
    const { category, total } = c;

    // If the category has zero spend, skip
    if (total <= 0) continue;

    // Compute the percent reduction needed from this category alone to cover the remaining deficit
    const needPercent = Math.ceil((remaining / total) * 100);
    // Constrain the suggestion to 10% - 30%
    const reductionPercent = clamp(needPercent || 10, 10, 30);
    const savings = Math.round((total * reductionPercent) / 100);

    recommendations.push({ category, reductionPercent, savings });
    remaining = Math.max(0, remaining - savings);
  }

  // Second pass: if still short, ramp up existing recommendations up to 30%
  if (remaining > 0 && recommendations.length > 0) {
    // Try to increase previously suggested reductions up to 30%
    for (const rec of recommendations) {
      if (remaining <= 0) break;
      const total = categoryTotals[rec.category] || 0;
      if (rec.reductionPercent >= 30) continue;
      const maxExtraPercent = 30 - rec.reductionPercent;
      const extraNeededPercent = Math.ceil((remaining / total) * 100);
      const extraPercent = clamp(extraNeededPercent, 0, maxExtraPercent);
      if (extraPercent <= 0) continue;
      const extraSavings = Math.round((total * extraPercent) / 100);
      rec.reductionPercent += extraPercent;
      rec.savings += extraSavings;
      remaining = Math.max(0, remaining - extraSavings);
    }
  }

  // If still not enough, consider adding a conservative reduction across other non-essential categories (fallback)
  if (remaining > 0) {
    // Find any other non-essential categories not yet recommended
    const remainingCandidates = Object.entries(categoryTotals)
      .filter(([cat]) => nonEssentialCategories.includes(cat) && !recommendations.some(r => r.category === cat))
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    for (const c of remainingCandidates) {
      if (remaining <= 0) break;
      const { category, total } = c;
      const reductionPercent = 10; // conservative default
      const savings = Math.round((total * reductionPercent) / 100);
      recommendations.push({ category, reductionPercent, savings });
      remaining = Math.max(0, remaining - savings);
    }
  }

  // Final message and sanity: if still short, ask user to review essential categories or increase targets
  const deficitRemaining = Math.round(remaining * 100) / 100;
  const message = deficitRemaining <= 0
    ? `You are exceeding your budget by ₹${deficit.toFixed(2)}. Reducing the following categories can bring you back within budget.`
    : `You are exceeding your budget by ₹${deficit.toFixed(2)}. Suggested non-essential reductions cover most of the gap; consider reviewing essentials or increasing reduction targets (remaining short: ₹${deficitRemaining.toFixed(2)}).`;

  return {
    isOverBudget: true,
    deficit,
    recommendations,
    message,
  };
}

export default optimizeBudget;
