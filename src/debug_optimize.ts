import { optimizeBudget } from './services/budgetOptimizer';

const sample = [
  { date: new Date('2024-05-01'), merchant: 'swiggy', amount: 500, category: 'food' },
  { date: new Date('2024-05-02'), merchant: 'netflix', amount: 649, category: 'entertainment' },
  { date: new Date('2024-05-03'), merchant: 'reliance', amount: 1500, category: 'groceries' },
  { date: new Date('2024-05-04'), merchant: 'mall', amount: 1200, category: 'shopping' },
];

const out = optimizeBudget(sample as any, 2000);
console.log(JSON.stringify(out, null, 2));
