// ============================================================
// ROUTE: POST /analyze
//
// Refactored to return the exact, clean output format requested
// in STEP 8:
// {
//   totalSpend,
//   categoryBreakdown,
//   weeklySpending,
//   patterns,
//   insights,
//   healthScore
// }
// ============================================================

import { Router, Request, Response } from 'express';
import { Transaction } from '../types';
import { analyzeTransactions, detectPatterns } from '../services/analytics';
import { generateInsights } from '../services/insights';
import { calculateScore } from '../services/scoring';

const router = Router();

/**
 * POST /analyze
 * Body: { transactions: Transaction[] }
 * Returns: { totalSpend, categoryBreakdown, weeklySpending, patterns, insights, healthScore }
 */
router.post('/', (req: Request, res: Response): void => {
  try {
    const { transactions } = req.body;

    // Validate input
    if (!Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Request body must contain a non-empty "transactions" array.',
      });
      return;
    }

    // Re-hydrate date strings into Date objects
    const hydrated: Transaction[] = transactions.map((tx: any) => ({
      date: new Date(tx.date),
      merchant: String(tx.merchant),
      amount: Number(tx.amount),
      category: String(tx.category),
    }));

    // Step 2: Run core analytics pipeline (aggregates, category/weekly breakdown, merchant ranking)
    const analytics = analyzeTransactions(hydrated);

    // Step 3: Run explicit pattern detection
    const patterns = detectPatterns(hydrated, analytics);

    // Step 4+5: Run insight engine (matching exact target titles + advisor explainability)
    const insights = generateInsights(analytics, patterns);

    // Step 6: Calculate the weighted financial health score (0-100)
    const healthScore = calculateScore(analytics, patterns, insights);

    // Step 8: Return the clean final output format
    res.status(200).json({
      totalSpend: analytics.aggregates.totalSpend,
      categoryBreakdown: analytics.categoryBreakdown,
      weeklySpending: analytics.weeklySpending,
      patterns,
      insights,
      healthScore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Analysis pipeline failed.',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
