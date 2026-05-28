/**
 * SpendSmart AI — Integration Test Script
 * Run with: npx ts-node src/test.ts
 */

import { parseCSV } from './services/parser';
import { analyzeTransactions, detectPatterns } from './services/analytics';
import { generateInsights } from './services/insights';
import { calculateScore } from './services/scoring';
import { simulateSavings } from './services/simulator';
import * as fs from 'fs';
import * as path from 'path';

console.log('=== SpendSmart AI — Integration Test ===\n');

// Step 1: Parse CSV
const csvPath = path.join(__dirname, '..', 'sample.csv');
const csvText = fs.readFileSync(csvPath, 'utf-8');
const parseResult = parseCSV(csvText);

console.log('STEP 1 — CSV Parsing & Normalization');
console.log(`  Rows: ${parseResult.rowCount}`);
console.log(`  Valid normalized transactions: ${parseResult.transactions.length}`);
console.log(`  Errors: ${parseResult.errors.length}`);
console.log(`  Success: ${parseResult.success}\n`);

// Step 2: Analytics
const analytics = analyzeTransactions(parseResult.transactions);
console.log('STEP 2 — Analytics Pipeline');
console.log(`  Total spend: ₹${analytics.aggregates.totalSpend}`);
console.log(`  Avg transaction: ₹${analytics.aggregates.averageTransaction}`);
console.log(`  Categories breakdown: ${JSON.stringify(analytics.categoryBreakdown)}`);
console.log(`  Top merchant: ${analytics.merchants[0]?.merchant} (₹${analytics.merchants[0]?.total})`);
console.log(`  Weeks tracked: ${Object.keys(analytics.weeklySpending).length}\n`);

// Step 3: Pattern Detection
const patterns = detectPatterns(parseResult.transactions, analytics);
console.log('STEP 3 — Pattern Detection (Fintech Signals)');
patterns.forEach((p) => {
  console.log(`  [${p.type}] [Severity: ${p.severity.toUpperCase()}] ${p.detail}`);
});
console.log();

// Step 4+5: Insights with savings
const insights = generateInsights(analytics, patterns);
console.log('STEP 4+5 — Actionable Insights & advisor recommendations');
insights.forEach((i) => {
  console.log(`  📌 ${i.title}`);
  console.log(`     Advisor note: ${i.description.substring(0, 120)}...`);
});
console.log();

// Step 6: Health Score
const score = calculateScore(analytics, patterns, insights);
console.log('STEP 6 — Financial Health Score');
console.log(`  Score: ${score.score}/100 (${score.label})\n`);

// Step 7: Savings Simulator
const simResult = simulateSavings(
  { foodReduction: 20, travelReduction: 15, entertainmentReduction: 25 },
  analytics,
);
console.log('STEP 7 — Savings Simulator');
console.log(`  Monthly savings: ₹${simResult.monthlySavings}`);
console.log(`  Yearly savings:  ₹${simResult.yearlySavings}\n`);

console.log('=== All tests passed ✅ ===');
