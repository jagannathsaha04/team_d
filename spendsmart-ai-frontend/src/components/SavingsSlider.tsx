'use client';

import React from 'react';

interface SavingsSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: 'amber' | 'blue' | 'purple';
}

export function SavingsSlider({ label, value, onChange, color }: SavingsSliderProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'amber':
        return {
          bg: 'accent-amber-500',
          text: 'text-amber-500',
          track: 'from-amber-500 to-orange-500'
        };
      case 'blue':
        return {
          bg: 'accent-blue-500',
          text: 'text-blue-500',
          track: 'from-blue-500 to-indigo-500'
        };
      case 'purple':
        return {
          bg: 'accent-purple-500',
          text: 'text-purple-500',
          track: 'from-purple-500 to-pink-500'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="space-y-3 p-4 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-zinc-200/30 dark:border-zinc-800/20">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        <span className={`text-sm font-bold ${colors.text} bg-white dark:bg-zinc-950/60 px-2 py-0.5 rounded-md border border-zinc-200/40 dark:border-zinc-800/40`}>
          {value}%
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={`w-full h-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 cursor-pointer ${colors.bg}`}
      />

      <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
        <span>0% (No reduction)</span>
        <span>50%</span>
        <span>100% (Fully cut)</span>
      </div>
    </div>
  );
}
