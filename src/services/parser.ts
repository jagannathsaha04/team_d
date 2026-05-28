// ============================================================
// STEP 1 — CSV Parsing & Validation Service
// Uses PapaParse to convert raw CSV text into validated
// Transaction objects. Every row is checked for:
//   • Amount is a valid number
//   • Date is parseable
//   • Category is non-empty
// ============================================================

import Papa from 'papaparse';
import { Transaction, ValidationError, ParseResult } from '../types';

/**
 * Parse a raw CSV string into validated Transaction objects.
 */
export function parseCSV(csvText: string): ParseResult {
  const errors: ValidationError[] = [];
  const transactions: Transaction[] = [];

  // --- Parse with PapaParse (synchronous mode — no complete callback needed) ---
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase(),
  });

  // Catch structural CSV errors (missing delimiters, etc.)
  if (parsed.errors && parsed.errors.length > 0) {
    parsed.errors.forEach((e: any) => {
      errors.push({
        row: (e.row ?? -1) + 2,
        field: 'csv',
        message: e.message,
      });
    });
  }

  // --- Validate each row ---
  const data = parsed.data as Record<string, string>[];
  data.forEach((row: Record<string, string>, index: number) => {
    const rowNum = index + 2; // Account for header row + 1-indexing

    // 1. Validate Amount — must be a finite number
    const rawAmount = row['amount'];
    const amount = parseFloat(rawAmount);
    if (rawAmount === undefined || rawAmount.trim() === '' || isNaN(amount) || !isFinite(amount)) {
      errors.push({ row: rowNum, field: 'amount', message: `Invalid amount: "${rawAmount}"` });
      return;
    }

    // 2. Validate Date — must produce a valid Date object
    const rawDate = row['date'];
    const date = new Date(rawDate);
    if (!rawDate || isNaN(date.getTime())) {
      errors.push({ row: rowNum, field: 'date', message: `Invalid date: "${rawDate}"` });
      return;
    }

    // 3. Validate Category — must be a non-empty string
    const category = (row['category'] ?? '').trim();
    if (category.length === 0) {
      errors.push({ row: rowNum, field: 'category', message: 'Category is missing or empty' });
      return;
    }

    // 4. Merchant — default to "Unknown" if missing
    const merchant = (row['merchant'] ?? 'Unknown').trim();

    // --- Row passed all validations ---
    transactions.push({
      date,
      merchant,
      amount: Math.abs(amount),
      category,
    });
  });

  return {
    success: errors.length === 0,
    transactions,
    errors,
    rowCount: data.length,
  };
}
