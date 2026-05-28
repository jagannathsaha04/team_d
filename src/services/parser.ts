// ============================================================
// STEP 1 — CSV Parsing, Validation & Data Normalization
//
// Pipeline:
//   Raw CSV → PapaParse → Row Validation → Normalization → Transaction[]
//
// Normalization layer (NEW):
//   • Merchant names: lowercase, trimmed, noise removed
//   • Categories: lowercase, standardized format
//   • Missing categories: inferred via merchant→category map
//   • Amounts: absolute value, 2-decimal precision
// ============================================================

import Papa from 'papaparse';
import { Transaction, ValidationError, ParseResult } from '../types';

// ── MERCHANT → CATEGORY FALLBACK MAP ────────────────────────
// WHY: Many CSVs from banks have missing or inconsistent categories.
// This map lets us infer a reasonable category from the merchant name
// using keyword matching (e.g. "swiggy" → "food").
// ─────────────────────────────────────────────────────────────

const merchantCategoryMap: Record<string, string> = {
  // Food & Dining
  zomato: 'food',
  swiggy: 'food',
  'uber eats': 'food',
  dominos: 'food',
  mcdonalds: 'food',
  "mcdonald's": 'food',
  starbucks: 'food',
  kfc: 'food',
  pizzahut: 'food',
  dunkin: 'food',

  // Travel & Transport
  uber: 'transport',
  ola: 'transport',
  rapido: 'transport',
  irctc: 'transport',
  makemytrip: 'transport',
  redbus: 'transport',

  // Entertainment & Streaming
  netflix: 'entertainment',
  spotify: 'entertainment',
  hotstar: 'entertainment',
  'amazon prime': 'entertainment',
  'disney+': 'entertainment',
  youtube: 'entertainment',

  // Shopping
  amazon: 'shopping',
  flipkart: 'shopping',
  myntra: 'shopping',
  ajio: 'shopping',
  meesho: 'shopping',

  // Utilities & Bills
  'electricity board': 'utilities',
  airtel: 'utilities',
  jio: 'utilities',
  bsnl: 'utilities',

  // Health & Fitness
  'gym membership': 'health',
  cult: 'health',
  practo: 'health',

  // Groceries
  'reliance mart': 'groceries',
  bigbasket: 'groceries',
  dmart: 'groceries',
  zepto: 'groceries',
  blinkit: 'groceries',
  instamart: 'groceries',
};

// ── CATEGORY INFERENCE ──────────────────────────────────────

/**
 * Detect a category from a merchant name using the fallback map.
 *
 * HOW: We check if the normalized merchant name contains any key
 * from our map. We use `includes()` so partial matches work —
 * e.g. "swiggy delivery" still matches "swiggy".
 *
 * WHY: This gives us a safety net when the CSV has blank or
 * unreliable category values. Without this, those rows would
 * either be rejected or bucketed into "uncategorized", which
 * degrades the quality of every downstream analysis.
 */
export function detectCategoryFromMerchant(merchant: string): string | null {
  const normalized = merchant.toLowerCase().trim();

  // Direct match first (fastest path)
  if (merchantCategoryMap[normalized]) {
    return merchantCategoryMap[normalized];
  }

  // Keyword/substring match (handles "swiggy delivery", "uber ride", etc.)
  for (const [key, category] of Object.entries(merchantCategoryMap)) {
    if (normalized.includes(key)) {
      return category;
    }
  }

  return null; // No match found — will fall back to "uncategorized"
}

// ── DATA NORMALIZATION ──────────────────────────────────────

/**
 * Normalize a single transaction's fields for consistency.
 *
 * WHY each step matters:
 *   • Lowercase merchant: "Swiggy", "SWIGGY", "swiggy" → same bucket in analytics
 *   • Trim whitespace: prevents "swiggy " and "swiggy" from being separate
 *   • Remove noise chars: strips stray punctuation that some bank exports add
 *   • Lowercase category: ensures "Food" and "food" aggregate correctly
 *   • Absolute amount: some exports use negative values for debits
 *   • 2-decimal rounding: prevents floating-point drift (e.g. 450.00000001)
 */
export function normalizeTransaction(tx: {
  date: Date;
  merchant: string;
  amount: number;
  category: string;
}): Transaction {
  // Step 1: Clean merchant name
  //   - Lowercase for consistent grouping
  //   - Trim leading/trailing whitespace
  //   - Remove noisy characters (#, *, extra spaces)
  const merchant = tx.merchant
    .toLowerCase()
    .trim()
    .replace(/[#*]+/g, '')      // remove noise chars from bank exports
    .replace(/\s+/g, ' ');      // collapse multiple spaces into one

  // Step 2: Normalize category
  //   - Lowercase for consistent grouping
  //   - If blank/missing → try to infer from merchant name
  //   - Last resort → "uncategorized" so no data is silently lost
  let category = tx.category.toLowerCase().trim();
  if (category.length === 0) {
    // WHY: Rather than rejecting the row, we try our merchant→category map.
    // This preserves the transaction data for analysis.
    category = detectCategoryFromMerchant(merchant) ?? 'uncategorized';
  }

  // Step 3: Normalize amount
  //   - Math.abs: some banks report expenses as negative numbers
  //   - Round to 2 decimals: avoids floating-point artifacts downstream
  const amount = Math.round(Math.abs(tx.amount) * 100) / 100;

  return {
    date: tx.date,
    merchant,
    amount,
    category,
  };
}

// ── CSV PARSING ─────────────────────────────────────────────

/**
 * Parse a raw CSV string into validated, normalized Transaction objects.
 *
 * Pipeline: Raw CSV → PapaParse → Validate each row → Normalize → Output
 */
export function parseCSV(csvText: string): ParseResult {
  const errors: ValidationError[] = [];
  const transactions: Transaction[] = [];

  // --- Parse with PapaParse (synchronous mode) ---
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

  // --- Validate & normalize each row ---
  const data = parsed.data as Record<string, string>[];
  data.forEach((row: Record<string, string>, index: number) => {
    const rowNum = index + 2; // +1 for header, +1 for 1-indexing

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

    // 3. Category — allowed to be empty now (normalization will handle it)
    //    WHY changed: Previously we rejected rows with no category. Now we
    //    infer it from the merchant map, which preserves more data for analysis.
    const rawCategory = (row['category'] ?? '').trim();

    // 4. Merchant — default to "unknown" if missing
    const rawMerchant = (row['merchant'] ?? 'unknown').trim();

    // --- Normalize the validated row ---
    // This ensures all downstream services receive clean, consistent data.
    const normalized = normalizeTransaction({
      date,
      merchant: rawMerchant,
      amount,
      category: rawCategory,
    });

    transactions.push(normalized);
  });

  return {
    success: errors.length === 0,
    transactions,
    errors,
    rowCount: data.length,
  };
}
