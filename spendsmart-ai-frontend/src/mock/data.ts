import { DashboardData } from '../types';

export const mockTransactions = [
  { date: "2024-01-02", merchant: "Swiggy", amount: 450, category: "Food" },
  { date: "2024-01-03", merchant: "Uber", amount: 200, category: "Transport" },
  { date: "2024-01-04", merchant: "Netflix", amount: 649, category: "Entertainment" },
  { date: "2024-01-05", merchant: "Starbucks", amount: 380, category: "Food" },
  { date: "2024-01-06", merchant: "Swiggy", amount: 520, category: "Food" },
  { date: "2024-01-07", merchant: "Amazon", amount: 2500, category: "Shopping" },
  { date: "2024-01-08", merchant: "Zomato", amount: 350, category: "Food" },
  { date: "2024-01-09", merchant: "Reliance Mart", amount: 1800, category: "Groceries" },
  { date: "2024-01-10", merchant: "Swiggy", amount: 480, category: "Food" },
  { date: "2024-01-11", merchant: "Spotify", amount: 119, category: "Entertainment" },
  { date: "2024-01-12", merchant: "Uber", amount: 350, category: "Transport" },
  { date: "2024-01-13", merchant: "Swiggy", amount: 390, category: "Food" },
  { date: "2024-01-14", merchant: "McDonald's", amount: 270, category: "Food" },
  { date: "2024-01-15", merchant: "Electricity Board", amount: 1500, category: "Utilities" },
  { date: "2024-01-16", merchant: "Swiggy", amount: 510, category: "Food" },
  { date: "2024-01-17", merchant: "Starbucks", amount: 420, category: "Food" },
  { date: "2024-01-18", merchant: "Uber", amount: 180, category: "Transport" },
  { date: "2024-01-19", merchant: "Zomato", amount: 680, category: "Food" },
  { date: "2024-01-20", merchant: "Amazon Prime", amount: 199, category: "Entertainment" },
  { date: "2024-01-21", merchant: "Swiggy", amount: 440, category: "Food" },
  { date: "2024-01-22", merchant: "Reliance Mart", amount: 2200, category: "Groceries" },
  { date: "2024-01-23", merchant: "Fuel Station", amount: 2000, category: "Transport" },
  { date: "2024-01-24", merchant: "Gym Membership", amount: 1500, category: "Health" },
  { date: "2024-01-25", merchant: "Swiggy", amount: 460, category: "Food" },
  { date: "2024-01-26", merchant: "Movie Tickets", amount: 800, category: "Entertainment" },
  { date: "2024-01-27", merchant: "Uber", amount: 220, category: "Transport" },
  { date: "2024-01-28", merchant: "Netflix", amount: 649, category: "Entertainment" },
  { date: "2024-01-29", merchant: "Swiggy", amount: 500, category: "Food" },
  { date: "2024-01-30", merchant: "Starbucks", amount: 350, category: "Food" },
  { date: "2024-01-31", merchant: "Electricity Board", amount: 1500, category: "Utilities" }
];

export const mockDashboardData: DashboardData = {
  transactions: mockTransactions.map((tx, idx) => ({
    date: tx.date,
    merchant: tx.merchant.toLowerCase(),
    amount: tx.amount,
    category: tx.category.toLowerCase()
  })),
  analytics: {
    aggregates: {
      totalSpend: 22566,
      transactionCount: 30,
      averageTransaction: 752.2,
      dateRange: { from: "2024-01-02", to: "2024-01-31" }
    },
    categoryBreakdown: {
      food: 6200,
      transport: 2950,
      entertainment: 2416,
      shopping: 2500,
      groceries: 4000,
      utilities: 3000,
      health: 1500
    },
    weeklySpending: {
      "2024-W01": 4699,
      "2024-W02": 3759,
      "2024-W03": 3929,
      "2024-W04": 7829,
      "2024-W05": 2350
    },
    merchants: [
      { merchant: "reliance mart", total: 4000, transactionCount: 2 },
      { merchant: "swiggy", total: 3750, transactionCount: 8 },
      { merchant: "electricity board", total: 3000, transactionCount: 2 },
      { merchant: "amazon", total: 2500, transactionCount: 1 },
      { merchant: "fuel station", total: 2000, transactionCount: 1 },
      { merchant: "gym membership", total: 1500, transactionCount: 1 },
      { merchant: "netflix", total: 1298, transactionCount: 2 },
      { merchant: "starbucks", total: 1150, transactionCount: 3 },
      { merchant: "zomato", total: 1030, transactionCount: 2 },
      { merchant: "uber", total: 950, transactionCount: 4 }
    ]
  },
  patterns: [
    {
      type: "subscription",
      severity: "high",
      merchant: "swiggy",
      detail: "\"swiggy\" appears 8 times with consistent amounts (~₹469/charge, CV=8.6%). Total: ₹3750.",
      data: { metric: 468.75, threshold: 15, unit: "INR per charge" }
    },
    {
      type: "subscription",
      severity: "high",
      merchant: "netflix",
      detail: "\"netflix\" appears 2 times with consistent amounts (~₹649/charge, CV=0.0%). Total: ₹1298.",
      data: { metric: 649, threshold: 15, unit: "INR per charge" }
    },
    {
      type: "subscription",
      severity: "high",
      merchant: "starbucks",
      detail: "\"starbucks\" appears 3 times with consistent amounts (~₹383/charge, CV=7.5%). Total: ₹1150.",
      data: { metric: 383.33, threshold: 15, unit: "INR per charge" }
    },
    {
      type: "subscription",
      severity: "high",
      merchant: "reliance mart",
      detail: "\"reliance mart\" appears 2 times with consistent amounts (~₹2000/charge, CV=10.0%). Total: ₹4000.",
      data: { metric: 2000, threshold: 15, unit: "INR per charge" }
    },
    {
      type: "subscription",
      severity: "high",
      merchant: "electricity board",
      detail: "\"electricity board\" appears 2 times with consistent amounts (~₹1500/charge, CV=0.0%). Total: ₹3000.",
      data: { metric: 1500, threshold: 15, unit: "INR per charge" }
    },
    {
      type: "high_frequency",
      severity: "medium",
      merchant: "swiggy",
      detail: "8 transactions at \"swiggy\" — frequent small spends add up.",
      data: { metric: 8, threshold: 5, unit: "transactions" }
    }
  ],
  insights: [
    {
      title: "Subscriptions: cancel unused services → Save ₹469/month",
      description: "We detected recurring, stable billing of ₹468.75 from \"Swiggy\". If you aren't consistently utilizing this service, canceling it today is a risk-free way to save ₹469/month immediately.",
      savingsEstimate: 469,
      category: "subscriptions"
    },
    {
      title: "Subscriptions: cancel unused services → Save ₹649/month",
      description: "We detected recurring, stable billing of ₹649 from \"Netflix\". Cancel immediately if you're in a viewing drought.",
      savingsEstimate: 649,
      category: "subscriptions"
    },
    {
      title: "Subscriptions: cancel unused services → Save ₹383/month",
      description: "Consistent charges of ₹383 from \"Starbucks\" look like a subscription. Switching to filter coffee twice a week saves ₹383/month.",
      savingsEstimate: 383,
      category: "subscriptions"
    },
    {
      title: "Subscriptions: cancel unused services → Save ₹2,000/month",
      description: "Recurring purchases of ₹2,000 at \"Reliance Mart\" detected. Buy house brands and groceries in bulk to save ₹2,000/month.",
      savingsEstimate: 2000,
      category: "subscriptions"
    },
    {
      title: "Subscriptions: cancel unused services → Save ₹1,500/month",
      description: "Electricity charges average ₹1,500. Swapping normal bulbs for smart LEDs will slash this utility bill by ₹1,500/month over time.",
      savingsEstimate: 1500,
      category: "subscriptions"
    },
    {
      title: "Reduce frequent small spends → Save ₹375/month by bundling",
      description: "You visited \"Swiggy\" 8 times this period, totaling ₹3,750. Frequent orders invite massive premium charges. Ordering larger portions twice a week rather than daily saves ₹375.",
      savingsEstimate: 375,
      category: "frequent_spend"
    }
  ],
  healthScore: {
    score: 66,
    label: "Moderate"
  }
};
