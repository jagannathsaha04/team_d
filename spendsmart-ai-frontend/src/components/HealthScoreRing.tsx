'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HealthScoreRingProps {
  score: number;
  label: 'Excellent' | 'Moderate' | 'Risky';
  size?: number;
  strokeWidth?: number;
}

export function HealthScoreRing({ score, label, size = 160, strokeWidth = 12 }: HealthScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Color Coding: Green (80+), Yellow (60–79), Red (<60)
  const getColor = () => {
    if (score >= 80) return {
      stroke: 'rgb(16, 185, 129)', // Emerald 500
      bg: 'rgba(16, 185, 129, 0.1)',
      text: 'text-emerald-500 dark:text-emerald-400',
      glow: 'shadow-emerald-500/20'
    };
    if (score >= 60) return {
      stroke: 'rgb(245, 158, 11)', // Amber 500
      bg: 'rgba(245, 158, 11, 0.1)',
      text: 'text-amber-500 dark:text-amber-400',
      glow: 'shadow-amber-500/20'
    };
    return {
      stroke: 'rgb(239, 68, 68)', // Red 500
      bg: 'rgba(239, 68, 68, 0.1)',
      text: 'text-red-500 dark:text-red-400',
      glow: 'shadow-red-500/20'
    };
  };

  const colors = getColor();

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-950/40 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40 shadow-sm dark:shadow-md backdrop-blur-md relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-zinc-50/20 dark:to-zinc-900/10 pointer-events-none" />
      
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-6">
        Financial Health Score
      </h3>

      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-zinc-100 dark:stroke-zinc-800/50"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl font-extrabold text-zinc-800 dark:text-zinc-50 tracking-tighter"
          >
            {score}
          </motion.span>
          <span className={`text-xs font-bold mt-1 px-2.5 py-0.5 rounded-full ${colors.text}`} style={{ backgroundColor: colors.bg }}>
            {label}
          </span>
        </div>
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-6 text-center max-w-[200px] leading-relaxed">
        Based on luxury ratios, budget patterns, and consistency metrics.
      </p>
    </div>
  );
}
