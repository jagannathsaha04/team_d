// ============================================================
// STEP 4 — Recommendation Engine
// STEP 5 — Savings Estimation
//
// Generates natural-language, financial-advisor-style insights
// based on detected patterns. Each insight includes an
// estimated savings figure (% reduction × category spend).
// ============================================================

import { AnalyticsResult, Pattern, Insight } from '../types';

/**
 * Generate actionable financial insights from analytics and detected patterns.
 *
 * Each insight reads like advice from a personal financial advisor —
 * warm, specific, and backed by numbers.
 */
export function generateInsights(
  analytics: AnalyticsResult,
  patterns: Pattern[],
): Insight[] {
  const insights: Insight[] = [];

  for (const pattern of patterns) {
    switch (pattern.type) {
      // ── Food / category overspending ──────────────────────
      case 'overspending': {
        const cat = pattern.category ?? 'unknown';
        const catSpend = analytics.categoryBreakdown[cat] ?? 0;

        if (cat.includes('food') || cat.includes('dining') || cat.includes('restaurant')) {
          // Food-specific advice
          const reductionPct = 20;
          const savings = Math.round(catSpend * (reductionPct / 100));
          insights.push({
            title: `Your food spending deserves a second look`,
            description:
              `You've spent ₹${catSpend.toLocaleString('en-IN')} on ${cat}, which makes up over ` +
              `${pattern.value}% of your total budget. A modest ${reductionPct}% cutback — ` +
              `maybe meal-prepping twice a week or swapping delivery for home-cooked meals — ` +
              `could save you around ₹${savings.toLocaleString('en-IN')} this period. ` +
              `Small shifts here add up fast.`,
            savingsEstimate: savings,
            category: cat,
          });
        } else if (cat.includes('travel') || cat.includes('transport')) {
          // Travel-specific advice
          const reductionPct = 15;
          const savings = Math.round(catSpend * (reductionPct / 100));
          insights.push({
            title: `Travel costs are eating into your budget`,
            description:
              `At ₹${catSpend.toLocaleString('en-IN')}, travel & transport is one of your largest ` +
              `spending categories (${pattern.value}%). Consider a monthly transit pass, ` +
              `carpooling, or consolidating errands to reduce trips. ` +
              `Even a ${reductionPct}% reduction could free up ₹${savings.toLocaleString('en-IN')}.`,
            savingsEstimate: savings,
            category: cat,
          });
        } else if (cat.includes('entertainment') || cat.includes('leisure')) {
          // Entertainment advice
          const reductionPct = 25;
          const savings = Math.round(catSpend * (reductionPct / 100));
          insights.push({
            title: `Entertainment spending is on the higher side`,
            description:
              `You're allocating ₹${catSpend.toLocaleString('en-IN')} to entertainment — ` +
              `about ${pattern.value}% of your total. That's not necessarily bad, but if you're ` +
              `looking to tighten things up, trimming ${reductionPct}% (roughly ₹${savings.toLocaleString('en-IN')}) ` +
              `is a painless place to start. Think free events, shared subscriptions, or a ` +
              `"no-spend weekend" once a month.`,
            savingsEstimate: savings,
            category: cat,
          });
        } else {
          // Generic overspending advice
          const reductionPct = 15;
          const savings = Math.round(catSpend * (reductionPct / 100));
          insights.push({
            title: `${capitalize(cat)} spending is above the comfort zone`,
            description:
              `Your "${cat}" category sits at ₹${catSpend.toLocaleString('en-IN')}, which is ` +
              `${pattern.value}% of your total spend. I'd recommend auditing this category — ` +
              `see which individual purchases you can reduce or defer. A ${reductionPct}% trim ` +
              `could save ₹${savings.toLocaleString('en-IN')}.`,
            savingsEstimate: savings,
            category: cat,
          });
        }
        break;
      }

      // ── Weekend spike advice ──────────────────────────────
      case 'weekend_spike': {
        const savings = Math.round(pattern.value * 4); // ~4 weekends per month
        insights.push({
          title: `Weekend spending is noticeably higher`,
          description:
            `Your weekend transactions average ₹${pattern.value} more per transaction than ` +
            `weekdays. Over a month that could mean an extra ₹${savings.toLocaleString('en-IN')} ` +
            `slipping through. Try setting a weekend spending cap or planning free activities — ` +
            `hikes, home movie nights, or cooking with friends.`,
          savingsEstimate: savings,
          category: 'lifestyle',
        });
        break;
      }

      // ── High frequency → bundling advice ──────────────────
      case 'high_frequency': {
        const merchant = pattern.merchant ?? 'a merchant';
        const merchantData = analytics.topMerchants.find(
          (m) => m.merchant.toLowerCase() === merchant.toLowerCase(),
        );
        const total = merchantData?.total ?? 0;
        const savings = Math.round(total * 0.1); // estimate 10% savings via bundling
        insights.push({
          title: `You're a regular at ${capitalize(merchant)}`,
          description:
            `With ${pattern.value} visits and ₹${total.toLocaleString('en-IN')} spent, ` +
            `you clearly love "${merchant}". Ask about loyalty programs, bulk discounts, ` +
            `or monthly memberships — frequent customers often qualify for 10%+ savings. ` +
            `That's roughly ₹${savings.toLocaleString('en-IN')} back in your pocket.`,
          savingsEstimate: savings,
          category: 'frequent_spend',
        });
        break;
      }

      // ── Subscription detection → cancel/review advice ─────
      case 'subscription': {
        const merchant = pattern.merchant ?? 'a service';
        const annualCost = Math.round(pattern.value * 12);
        const savings = Math.round(pattern.value); // save the full amount by cancelling
        insights.push({
          title: `Possible subscription: ${capitalize(merchant)}`,
          description:
            `"${capitalize(merchant)}" charges roughly the same amount on a recurring basis, ` +
            `totalling ₹${pattern.value.toLocaleString('en-IN')} so far. Projected annually, ` +
            `that's ₹${annualCost.toLocaleString('en-IN')}. If you're not actively using this ` +
            `service, cancelling it could save ₹${savings.toLocaleString('en-IN')} right away. ` +
            `Even if you keep it, check for a cheaper tier.`,
          savingsEstimate: savings,
          category: 'subscriptions',
        });
        break;
      }
    }
  }

  // ── Bonus insight if no patterns found (everything looks healthy) ──
  if (insights.length === 0) {
    insights.push({
      title: `Your spending looks well-balanced`,
      description:
        `No major red flags here — your categories are diversified and no single area ` +
        `dominates your budget. Keep tracking your expenses and revisit monthly to ` +
        `catch any emerging trends early.`,
      savingsEstimate: 0,
      category: 'general',
    });
  }

  return insights;
}

/** Capitalize the first letter of a string. */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
