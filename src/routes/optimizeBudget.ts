// ============================================================
// ROUTE: POST /optimize-budget
// Body: { transactions: Transaction[], monthlyBudget: number }
// Returns: BudgetOptimizationResult
// ============================================================

import { Router, Request, Response } from 'express';
import { Transaction } from '../types';
import { optimizeBudget } from '../services/budgetOptimizer';

const router = Router();

router.post('/', (req: Request, res: Response): void => {
  try {
    const { transactions, monthlyBudget } = req.body;

    if (!Array.isArray(transactions) || typeof monthlyBudget !== 'number') {
      res.status(400).json({ success: false, error: 'Invalid request body. Expect { transactions: Transaction[], monthlyBudget: number }' });
      return;
    }

    const hydrated: Transaction[] = transactions.map((tx: any) => ({
      date: new Date(tx.date),
      merchant: String(tx.merchant),
      amount: Number(tx.amount),
      category: String(tx.category || 'uncategorized'),
    }));

    const result = optimizeBudget(hydrated, monthlyBudget);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Budget optimization failed.', detail: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
