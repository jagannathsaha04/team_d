// ============================================================
// ROUTE: POST /simulate
// Accepts reduction percentages and transaction data,
// returns projected monthly and yearly savings.
// ============================================================

import { Router, Request, Response } from 'express';
import { Transaction, SimulatorInput } from '../types';
import { analyzeTransactions } from '../services/analytics';
import { simulateSavings } from '../services/simulator';

const router = Router();

/**
 * POST /simulate
 * Body: {
 *   transactions: Transaction[],
 *   reductions: { foodReduction, travelReduction, entertainmentReduction }
 * }
 * Returns: { monthlySavings, yearlySavings }
 */
router.post('/', (req: Request, res: Response): void => {
  try {
    const { transactions, reductions } = req.body;

    // Validate transactions
    if (!Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Request body must contain a non-empty "transactions" array.',
      });
      return;
    }

    // Validate reductions object
    if (!reductions || typeof reductions !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Request body must contain a "reductions" object with foodReduction, travelReduction, entertainmentReduction.',
      });
      return;
    }

    // Re-hydrate date strings
    const hydrated: Transaction[] = transactions.map((tx: any) => ({
      date: new Date(tx.date),
      merchant: String(tx.merchant),
      amount: Number(tx.amount),
      category: String(tx.category),
    }));

    // Build analytics first (simulator needs category breakdown)
    const analytics = analyzeTransactions(hydrated);

    // Build simulator input
    const input: SimulatorInput = {
      foodReduction: Number(reductions.foodReduction) || 0,
      travelReduction: Number(reductions.travelReduction) || 0,
      entertainmentReduction: Number(reductions.entertainmentReduction) || 0,
    };

    // Run simulation
    const result = simulateSavings(input, analytics);

    res.status(200).json({
      success: true,
      simulation: result,
      appliedReductions: input,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Simulation failed.',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
