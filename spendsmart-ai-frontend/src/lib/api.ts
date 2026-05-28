import { Transaction } from '../types';

const BACKEND_URL = 'http://localhost:3000';

export interface UploadResponse {
  success: boolean;
  transactions: Transaction[];
  errors: any[];
  rowCount: number;
}

export interface AnalyzeResponse {
  totalSpend: number;
  categoryBreakdown: Record<string, number>;
  weeklySpending: Record<string, number>;
  patterns: any[];
  insights: any[];
  healthScore: {
    score: number;
    label: 'Excellent' | 'Moderate' | 'Risky';
  };
}

export interface SimulateResponse {
  success: boolean;
  monthlySavings: number;
  yearlySavings: number;
}

/**
 * Upload CSV file to backend
 * POST /upload
 */
export async function uploadCSV(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BACKEND_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Failed to upload CSV file.');
  }

  return response.json();
}

/**
 * Analyze transactions on backend
 * POST /analyze
 */
export async function analyzeTransactions(transactions: Transaction[]): Promise<AnalyzeResponse> {
  const response = await fetch(`${BACKEND_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transactions }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Failed to analyze transactions.');
  }

  return response.json();
}

/**
 * Simulate savings on backend
 * POST /simulate
 */
export async function simulateSavings(
  transactions: Transaction[],
  input: { foodReduction: number; travelReduction: number; entertainmentReduction: number }
): Promise<SimulateResponse> {
  const response = await fetch(`${BACKEND_URL}/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transactions,
      foodReduction: input.foodReduction,
      travelReduction: input.travelReduction,
      entertainmentReduction: input.entertainmentReduction,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Failed to simulate savings.');
  }

  return response.json();
}
