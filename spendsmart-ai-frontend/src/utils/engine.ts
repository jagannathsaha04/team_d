import {
  Transaction,
  AnalyticsResult,
  CategoryBreakdown,
  WeeklySpending,
  MerchantTotal,
  Pattern,
  Insight,
  HealthScore,
  DashboardData,
} from '../types';

// ── Merchant Mapping Fallbacks ──────────────────────────────
const merchantCategoryMap: Record<string, string> = {
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
  uber: 'transport',
  ola: 'transport',
  rapido: 'transport',
  irctc: 'transport',
  makemytrip: 'transport',
  redbus: 'transport',
  netflix: 'entertainment',
  spotify: 'entertainment',
  hotstar: 'entertainment',
  'amazon prime': 'entertainment',
  'disney+': 'entertainment',
  youtube: 'entertainment',
  amazon: 'shopping',
  flipkart: 'shopping',
  myntra: 'shopping',
  ajio: 'shopping',
  meesho: 'shopping',
  'electricity board': 'utilities',
  airtel: 'utilities',
  jio: 'utilities',
  bsnl: 'utilities',
  'gym membership': 'health',
  cult: 'health',
  practo: 'health',
  'reliance mart': 'groceries',
  bigbasket: 'groceries',
  dmart: 'groceries',
  zepto: 'groceries',
  blinkit: 'groceries',
  instamart: 'groceries',
};

export function detectCategoryFromMerchant(merchant: string): string | null {
  const normalized = merchant.toLowerCase().trim();
  if (merchantCategoryMap[normalized]) {
    return merchantCategoryMap[normalized];
  }
  for (const [key, category] of Object.entries(merchantCategoryMap)) {
    if (normalized.includes(key)) {
      return category;
    }
  }
  return null;
}

export function normalizeTransaction(tx: {
  date: string;
  merchant: string;
  amount: number;
  category: string;
}): Transaction {
  const merchant = tx.merchant
    .toLowerCase()
    .trim()
    .replace(/[#*]+/g, '')
    .replace(/\s+/g, ' ');

  let category = tx.category.toLowerCase().trim();
  if (category.length === 0) {
    category = detectCategoryFromMerchant(merchant) ?? 'uncategorized';
  }

  const amount = Math.round(Math.abs(tx.amount) * 100) / 100;

  return {
    date: tx.date,
    merchant,
    amount,
    category,
  };
}

function getISOWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Analytics Pipeline ──────────────────────────────────────

export function analyzeTransactions(transactions: Transaction[]): AnalyticsResult {
  let totalSpend = 0;
  let minDate = new Date(transactions[0]?.date ?? new Date());
  let maxDate = new Date(transactions[0]?.date ?? new Date());

  const categoryBreakdown: CategoryBreakdown = {};
  const weeklySpending: WeeklySpending = {};
  const merchantTotals: Record<string, { total: number; count: number }> = {};

  for (const tx of transactions) {
    const amount = tx.amount;
    totalSpend += amount;

    const txDate = new Date(tx.date);
    if (txDate < minDate) minDate = txDate;
    if (txDate > maxDate) maxDate = txDate;

    // Category
    const cat = tx.category;
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amount;

    // Weekly
    const weekKey = getISOWeekKey(txDate);
    weeklySpending[weekKey] = (weeklySpending[weekKey] || 0) + amount;

    // Merchant
    const m = tx.merchant;
    if (!merchantTotals[m]) merchantTotals[m] = { total: 0, count: 0 };
    merchantTotals[m].total += amount;
    merchantTotals[m].count += 1;
  }

  // Round breakdowns
  for (const k of Object.keys(categoryBreakdown)) categoryBreakdown[k] = round2(categoryBreakdown[k]);
  for (const k of Object.keys(weeklySpending)) weeklySpending[k] = round2(weeklySpending[k]);

  const merchants: MerchantTotal[] = Object.entries(merchantTotals)
    .map(([merchant, { total, count }]) => ({
      merchant,
      total: round2(total),
      transactionCount: count,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    aggregates: {
      totalSpend: round2(totalSpend),
      transactionCount: transactions.length,
      averageTransaction: round2(transactions.length > 0 ? totalSpend / transactions.length : 0),
      dateRange: {
        from: minDate.toISOString().split('T')[0],
        to: maxDate.toISOString().split('T')[0],
      },
    },
    categoryBreakdown,
    weeklySpending,
    merchants,
  };
}

// ── Pattern Detection ───────────────────────────────────────

export function detectPatterns(
  transactions: Transaction[],
  analytics: AnalyticsResult,
): Pattern[] {
  const patterns: Pattern[] = [];
  const totalSpend = analytics.aggregates.totalSpend;

  // 1. Overspending (>30%)
  for (const [category, amount] of Object.entries(analytics.categoryBreakdown)) {
    const pct = round2((amount / totalSpend) * 100);
    if (pct > 30) {
      patterns.push({
        type: 'overspending',
        severity: pct > 50 ? 'high' : pct > 40 ? 'medium' : 'low',
        category,
        detail: `"${category}" accounts for ${pct}% of total spending (₹${Math.round(amount)}).`,
        data: { metric: pct, threshold: 30, unit: '% of total spend' },
      });
    }
  }

  // 2. Weekend Spikes (>25%)
  let weekendTotal = 0, weekendCount = 0;
  let weekdayTotal = 0, weekdayCount = 0;

  for (const tx of transactions) {
    const txDate = new Date(tx.date);
    if (isWeekend(txDate)) {
      weekendTotal += tx.amount;
      weekendCount++;
    } else {
      weekdayTotal += tx.amount;
      weekdayCount++;
    }
  }

  const weekendAvg = weekendCount > 0 ? round2(weekendTotal / weekendCount) : 0;
  const weekdayAvg = weekdayCount > 0 ? round2(weekdayTotal / weekdayCount) : 0;

  if (weekendAvg > weekdayAvg * 1.25 && weekendCount >= 2) {
    const spikePercent = round2(((weekendAvg / weekdayAvg) - 1) * 100);
    patterns.push({
      type: 'weekend_spike',
      severity: spikePercent > 50 ? 'high' : 'medium',
      detail: `Weekend avg spend (₹${weekendAvg}/tx) is ${spikePercent}% higher than weekday avg (₹${weekdayAvg}/tx).`,
      data: {
        metric: round2(weekendAvg - weekdayAvg),
        threshold: 25,
        unit: 'INR extra spend per tx',
      },
    });
  }

  // 3. High Frequency (>5)
  const merchantFreq: Record<string, number> = {};
  for (const tx of transactions) {
    merchantFreq[tx.merchant] = (merchantFreq[tx.merchant] || 0) + 1;
  }

  for (const [merchant, count] of Object.entries(merchantFreq)) {
    if (count > 5) {
      patterns.push({
        type: 'high_frequency',
        severity: count > 10 ? 'high' : 'medium',
        merchant,
        detail: `${count} transactions at "${merchant}" — frequent small spends add up.`,
        data: { metric: count, threshold: 5, unit: 'transactions' },
      });
    }
  }

  // 4. Subscription Detection
  const merchantAmounts: Record<string, number[]> = {};
  for (const tx of transactions) {
    if (!merchantAmounts[tx.merchant]) merchantAmounts[tx.merchant] = [];
    merchantAmounts[tx.merchant].push(tx.amount);
  }

  for (const [merchant, amounts] of Object.entries(merchantAmounts)) {
    if (amounts.length < 2) continue;
    const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const variance = amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 1;

    if (cv < 0.15) {
      const totalValue = round2(mean * amounts.length);
      patterns.push({
        type: 'subscription',
        severity: totalValue > 1000 ? 'high' : 'medium',
        merchant,
        detail: `"${merchant}" appears ${amounts.length} times with consistent recurring charges.`,
        data: {
          metric: round2(mean),
          threshold: 15,
          unit: 'INR per charge',
        },
      });
    }
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  patterns.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  return patterns;
}

// ── Insight Engine ──────────────────────────────────────────

export function generateInsights(
  analytics: AnalyticsResult,
  patterns: Pattern[],
): Insight[] {
  const insights: Insight[] = [];
  const totalSpend = analytics.aggregates.totalSpend;

  for (const pattern of patterns) {
    switch (pattern.type) {
      case 'overspending': {
        const cat = pattern.category ?? 'unknown';
        const catSpend = analytics.categoryBreakdown[cat] ?? 0;

        if (cat.includes('food') || cat.includes('dining') || cat.includes('restaurant')) {
          const reductionPct = 20;
          const savings = Math.round(catSpend * (reductionPct / 100));
          insights.push({
            title: `Reduce Food ordering by ${reductionPct}% → Save ₹${savings.toLocaleString('en-IN')}/month`,
            description: `Your food spending (₹${catSpend.toLocaleString('en-IN')}) represents ${pattern.data.metric}% of your total budget. Swapping delivery for home-cooked meals could save you around ₹${savings.toLocaleString('en-IN')} this month.`,
            savingsEstimate: savings,
            category: cat,
          });
        } else if (cat.includes('travel') || cat.includes('transport') || cat.includes('fuel')) {
          const reductionPct = 15;
          const savings = Math.round(catSpend * (reductionPct / 100));
          insights.push({
            title: `Reduce Travel spending by ${reductionPct}% → Save ₹${savings.toLocaleString('en-IN')}/month`,
            description: `You spent ₹${catSpend.toLocaleString('en-IN')} on transportation (${pattern.data.metric}% of total). Swapping occasional cabs for public transit will yield substantial monthly savings.`,
            savingsEstimate: savings,
            category: cat,
          });
        } else {
          const reductionPct = 15;
          const savings = Math.round(catSpend * (reductionPct / 100));
          insights.push({
            title: `Reduce ${capitalize(cat)} spending by ${reductionPct}% → Save ₹${savings.toLocaleString('en-IN')}/month`,
            description: `Your spending on ${cat} stands at ₹${catSpend.toLocaleString('en-IN')} (${pattern.data.metric}% of total). Trimming a modest ${reductionPct}% off discretionary purchases frees up solid cash.`,
            savingsEstimate: savings,
            category: cat,
          });
        }
        break;
      }
      case 'weekend_spike': {
        const savings = Math.round(pattern.data.metric * 4);
        insights.push({
          title: `Travel spikes on weekends → Consider metro card`,
          description: `Weekend transit transactions average ₹${Math.round(pattern.data.metric)} more than weekdays. Bundling trips or using fixed-fare options like a metro pass will cap weekend transit inflation.`,
          savingsEstimate: savings,
          category: 'lifestyle',
        });
        break;
      }
      case 'high_frequency': {
        const merchant = pattern.merchant ?? 'a merchant';
        const merchantData = analytics.merchants.find(m => m.merchant.toLowerCase() === merchant.toLowerCase());
        const total = merchantData?.total ?? 0;
        const savings = Math.round(total * 0.1);
        insights.push({
          title: `Reduce frequent small spends → Save ₹${savings.toLocaleString('en-IN')}/month by bundling`,
          description: `You made ${pattern.data.metric} visits to "${capitalize(merchant)}" totaling ₹${total.toLocaleString('en-IN')}. Loyalty tier benefits or pre-purchasing items in bulk will trim frequent transaction premium fees.`,
          savingsEstimate: savings,
          category: 'frequent_spend',
        });
        break;
      }
      case 'subscription': {
        const merchant = pattern.merchant ?? 'a service';
        const savings = Math.round(pattern.data.metric);
        insights.push({
          title: `Subscriptions: cancel unused services → Save ₹${savings.toLocaleString('en-IN')}/month`,
          description: `We detected recurring monthly billing of ₹${pattern.data.metric.toLocaleString('en-IN')} from "${capitalize(merchant)}". Audit this subscription and cancel immediately if unused.`,
          savingsEstimate: savings,
          category: 'subscriptions',
        });
        break;
      }
    }
  }

  if (insights.length === 0) {
    insights.push({
      title: `Keep a steady course → Save by maintaining current balance`,
      description: `Your categories are incredibly well-proportioned with no major overruns. Maintain your consistent budgeting habits to build capital.`,
      savingsEstimate: Math.round(totalSpend * 0.1),
      category: 'general',
    });
  }

  return insights;
}

// ── Financial Health Score ──────────────────────────────────

export function calculateScore(
  analytics: AnalyticsResult,
  patterns: Pattern[],
  insights: Insight[],
): HealthScore {
  let score = 0;
  const totalSpend = analytics.aggregates.totalSpend;
  const ESSENTIAL_CATEGORIES = new Set([
    'groceries', 'grocery', 'utilities', 'rent', 'housing',
    'insurance', 'healthcare', 'health', 'education',
    'transport', 'transportation', 'fuel', 'bills',
  ]);

  // 1. Essential Ratio (30 pts)
  let essentialSpend = 0;
  for (const [category, amount] of Object.entries(analytics.categoryBreakdown)) {
    if (ESSENTIAL_CATEGORIES.has(category.toLowerCase())) {
      essentialSpend += amount;
    }
  }
  const essentialRatio = totalSpend > 0 ? essentialSpend / totalSpend : 0.5;
  score += Math.min(30, Math.round((essentialRatio / 0.7) * 30));

  // 2. Overspending Penalties (25 pts)
  const overspendCount = patterns.filter(p => p.type === 'overspending').length;
  score += Math.max(0, 25 - overspendCount * 8);

  // 3. Spending Consistency (25 pts)
  const weeklyValues = Object.values(analytics.weeklySpending);
  if (weeklyValues.length > 1) {
    const mean = weeklyValues.reduce((s, v) => s + v, 0) / weeklyValues.length;
    const variance = weeklyValues.reduce((s, v) => s + (v - mean) ** 2, 0) / weeklyValues.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    score += Math.min(25, Math.max(0, Math.round(25 * (1 - cv / 1.0))));
  } else {
    score += 15;
  }

  // 4. Savings Potential (20 pts)
  const totalSavings = insights.reduce((s, i) => s + i.savingsEstimate, 0);
  const savingsRatio = totalSpend > 0 ? totalSavings / totalSpend : 0;
  score += Math.min(20, Math.max(0, Math.round(20 * (1 - savingsRatio / 0.3))));

  score = Math.max(0, Math.min(100, score));
  let label: HealthScore['label'] = 'Risky';
  if (score >= 80) label = 'Excellent';
  else if (score >= 60) label = 'Moderate';

  return { score, label };
}

// ── Complete Pipeline Orchestrator ──────────────────────────

export function processRawTransactions(rawTransactions: {
  date: string;
  merchant: string;
  amount: number;
  category: string;
}[]): DashboardData {
  const transactions = rawTransactions.map(tx => normalizeTransaction(tx));
  const analytics = analyzeTransactions(transactions);
  const patterns = detectPatterns(transactions, analytics);
  const insights = generateInsights(analytics, patterns);
  const healthScore = calculateScore(analytics, patterns, insights);

  return {
    transactions,
    analytics,
    patterns,
    insights,
    healthScore,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
