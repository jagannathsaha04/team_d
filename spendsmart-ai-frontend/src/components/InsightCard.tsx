'use client';

import React from 'react';
import { Sparkles, Utensils, Compass, Layers, AlertCircle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface InsightCardProps {
  title: string;
  description: string;
  savingsEstimate: number;
  category: string;
  delay?: number;
}

export function InsightCard({ title, description, savingsEstimate, category, delay = 0 }: InsightCardProps) {
  // Determine relevant icons/colors
  const getIconConfig = () => {
    const cat = category.toLowerCase();
    if (cat.includes('food') || cat.includes('dining')) {
      return {
        icon: Utensils,
        gradient: 'from-amber-500 to-orange-500',
        bg: 'bg-amber-500/10 text-amber-500',
        glow: 'hover:shadow-amber-500/5 hover:border-amber-500/20'
      };
    }
    if (cat.includes('travel') || cat.includes('transport') || cat.includes('lifestyle')) {
      return {
        icon: Compass,
        gradient: 'from-blue-500 to-indigo-500',
        bg: 'bg-blue-500/10 text-blue-500',
        glow: 'hover:shadow-blue-500/5 hover:border-blue-500/20'
      };
    }
    if (cat.includes('subscription')) {
      return {
        icon: Layers,
        gradient: 'from-purple-500 to-pink-500',
        bg: 'bg-purple-500/10 text-purple-500',
        glow: 'hover:shadow-purple-500/5 hover:border-purple-500/20'
      };
    }
    return {
      icon: Sparkles,
      gradient: 'from-indigo-500 to-purple-500',
      bg: 'bg-indigo-500/10 text-indigo-500',
      glow: 'hover:shadow-indigo-500/5 hover:border-indigo-500/20'
    };
  };

  const config = getIconConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`glow-card rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40 p-6 bg-white dark:bg-zinc-950/40 shadow-sm transition-all duration-300 backdrop-blur-md ${config.glow}`}
    >
      <div className="flex gap-4 items-start">
        <div className={`p-3 rounded-xl ${config.bg} shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-bold text-zinc-800 dark:text-zinc-50 leading-snug tracking-tight">
              {title}
            </h4>
            {savingsEstimate > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                ₹{savingsEstimate.toLocaleString('en-IN')}/mo est. savings
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
