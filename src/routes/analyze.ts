// ============================================================
// ROUTE: POST /analyze
// Accepts parsed transactions (JSON array) in the request body,
// runs analytics, pattern detection, insights, and scoring.
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
 * Returns: { analytics, patterns, insights, healthScore }
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

    // Step 2: Analytics
    const analytics = analyzeTransactions(hydrated);

    // Step 3: Pattern detection
    const patterns = detectPatterns(hydrated, analytics);

    // Step 4 + 5: Insights with savings estimates
    const insights = generateInsights(analytics, patterns);

    // Step 6: Financial health score
    const healthScore = calculateScore(analytics, patterns, insights);

    res.status(200).json({
      success: true,
      analytics,
      patterns,
      insights,
      healthScore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Analysis failed.',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
