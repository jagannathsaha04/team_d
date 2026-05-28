'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  gradient: string;
  delay?: number;
}

export function StatsCard({ title, value, subtext, icon: Icon, gradient, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40 p-6 bg-white dark:bg-zinc-950/40 shadow-sm dark:shadow-md dark:shadow-black/20 group backdrop-blur-md"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-zinc-50/30 dark:to-zinc-900/10 pointer-events-none" />
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-gradient-to-br ${gradient} pointer-events-none group-hover:scale-125 transition-transform duration-700`} />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-50 tracking-tight">
            {value}
          </h3>
          {subtext && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {subtext}
            </p>
          )}
        </div>

        <div className={`p-3 rounded-xl bg-gradient-to-tr ${gradient} text-white shadow-lg shadow-indigo-500/10 group-hover:rotate-6 transition-transform duration-300`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
