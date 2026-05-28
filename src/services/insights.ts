// ============================================================
// STEP 4 — Recommendation Engine
// STEP 5 — Savings Estimation
// STEP 7 — Explainability
//
// Generates natural-language, financial-advisor-style insights
// based on detected patterns. Each insight includes a
// clear title format matching requested examples exactly:
//   "Reduce [Category] ordering by [X]% → Save ₹[Savings]/month"
//   "Travel spikes on weekends → Consider metro card"
//   "Subscriptions: cancel unused services → Save ₹[X]/month"
// ============================================================

import { AnalyticsResult, Pattern, Insight } from '../types';

/**
 * Generate actionable financial insights from analytics and detected patterns.
 */
export function generateInsights(
  analytics: AnalyticsResult,
  patterns: Pattern[],
): Insight[] {
  const insights: Insight[] = [];
  const totalSpend = analytics.aggregates.totalSpend;

  for (const pattern of patterns) {
    switch (pattern.type) {
      // ── Food / category overspending ──────────────────────
      case 'overspending': {
        const cat = pattern.category ?? 'unknown';
        const catSpend = analytics.categoryBreakdown[cat] ?? 0;

        if (cat.includes('food') || cat.includes('dining') || cat.includes('restaurant')) {
          const reductionPct = 20;
          const savings = Math.round(catSpend * (reductionPct / 100));
          
          insights.push({
            title: `Reduce Food ordering by ${reductionPct}% → Save ₹${savings.toLocaleString('en-IN')}/month`,
            description:
              `Your food spending (₹${catSpend.toLocaleString('en-IN')}) represents ${pattern.data.metric}% ` +
              `of your total budget. Because eating out and delivery are highly flexible, targeting a ` +
              `${reductionPct}% reduction through home cooking or meal prepping is the most effective ` +
              `way to claw back ₹${savings.toLocaleString('en-IN')} this month.`,
            savingsEstimate: savings,
            category: cat,
          });
        } else if (cat.includes('travel') || cat.includes('transport') || cat.includes('fuel')) {
          const reductionPct = 15;
          const savings = Math.round(catSpend * (reductionPct / 100));

          insights.push({
            title: `Reduce Travel spending by ${reductionPct}% → Save ₹${savings.toLocaleString('en-IN')}/month`,
            description:
              `You spent ₹${catSpend.toLocaleString('en-IN')} on transportation (${pattern.data.metric}% of total). ` +
              `Trimming this by just ${reductionPct}% via consolidated errands or public transit ` +
              `options yields a solid monthly savings of ₹${savings.toLocaleString('en-IN')}.`,
            savingsEstimate: savings,
            category: cat,
          });
        } else {
          const reductionPct = 15;
          const savings = Math.round(catSpend * (reductionPct / 100));

          insights.push({
            title: `Reduce ${capitalize(cat)} spending by ${reductionPct}% → Save ₹${savings.toLocaleString('en-IN')}/month`,
            description:
              `Your spending on ${cat} has reached ₹${catSpend.toLocaleString('en-IN')}, making up ` +
              `${pattern.data.metric}% of your total spending. Swapping to cost-effective alternatives or ` +
              `deferring discretionary purchases by ${reductionPct}% will easily save ₹${savings.toLocaleString('en-IN')}/month.`,
            savingsEstimate: savings,
            category: cat,
          });
        }
        break;
      }

      // ── Weekend travel / spend spike advice ──────────────────
      case 'weekend_spike': {
        const spikePercent = pattern.data.extra?.spikePercent ?? 25;
        const savings = Math.round(pattern.data.metric * 4); // ~4 weekends per month
        
        insights.push({
          title: `Travel spikes on weekends → Consider metro card`,
          description:
            `We detected that your weekend average transaction size is ${spikePercent}% ` +
            `higher than your weekdays (an average surge of ₹${pattern.data.metric.toLocaleString('en-IN')}/transaction). ` +
            `If this is driven by weekend transit and rides, switching to public transport ` +
            `or pre-purchasing a metro card could offset these surges and save you roughly ₹${savings.toLocaleString('en-IN')} each month.`,
          savingsEstimate: savings,
          category: 'lifestyle',
        });
        break;
      }

      // ── High frequency → bundling advice ──────────────────
      case 'high_frequency': {
        const merchant = pattern.merchant ?? 'a merchant';
        const merchantData = analytics.merchants.find(
          (m) => m.merchant.toLowerCase() === merchant.toLowerCase(),
        );
        const total = merchantData?.total ?? 0;
        const savings = Math.round(total * 0.1); 
        
        insights.push({
          title: `Reduce frequent small spends → Save ₹${savings.toLocaleString('en-IN')}/month by bundling`,
          description:
            `You visited "${capitalize(merchant)}" ${pattern.data.metric} times this period, totaling ` +
            `₹${total.toLocaleString('en-IN')}. Frequent transactions are prime candidates for loyalty ` +
            `programs or bundling orders to eliminate repetitive delivery fees, saving you up to 10% (₹${savings}).`,
          savingsEstimate: savings,
          category: 'frequent_spend',
        });
        break;
      }

      // ── Subscription detection → cancel/review advice ─────
      case 'subscription': {
        const merchant = pattern.merchant ?? 'a service';
        const savings = Math.round(pattern.data.metric); 
        
        insights.push({
          title: `Subscriptions: cancel unused services → Save ₹${savings.toLocaleString('en-IN')}/month`,
          description:
            `We detected recurring, stable billing of ₹${pattern.data.metric.toLocaleString('en-IN')} from ` +
            `"${capitalize(merchant)}" (deviation within strict subscription thresholds). If you aren't ` +
            `consistently utilizing this service, canceling it today is a risk-free way to immediately boost ` +
            `your disposable income.`,
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
      description:
        `Your budget looks incredibly healthy with no major category overspending or erratic spending patterns. ` +
        `We suggest maintaining a 10% general savings buffer, which would safeguard your financial score long term.`,
      savingsEstimate: Math.round(totalSpend * 0.1),
      category: 'general',
    });
  }

  return insights;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
