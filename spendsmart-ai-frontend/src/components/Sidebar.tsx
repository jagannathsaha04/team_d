'use client';

import React from 'react';
import { LayoutDashboard, Compass, Cpu, Wallet, Sun, Moon, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeTab: 'dashboard' | 'insights' | 'simulator';
  setActiveTab: (tab: 'dashboard' | 'insights' | 'simulator') => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onBackToLanding?: () => void;
  fileName?: string | null;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  onBackToLanding,
  fileName
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'insights', label: 'AI Insights', icon: Compass },
    { id: 'simulator', label: 'Simulator', icon: Cpu },
  ] as const;

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200/50 dark:border-zinc-800/40 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl flex flex-col justify-between p-6 h-screen sticky top-0">
      <div className="space-y-8">
        {/* Brand/Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-md text-zinc-800 dark:text-zinc-50 tracking-tight leading-none">
              SpendSmart <span className="text-indigo-500">AI</span>
            </h1>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mt-1">
              FINTECH ANALYTICS
            </span>
          </div>
        </div>

        {/* Back navigation */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors w-full group py-1"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Change Data Source</span>
          </button>
        )}

        {/* Menu Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group
                  ${isActive 
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10 border-l-2 border-indigo-500' 
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50'
                  }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-indigo-500' : 'text-zinc-400 dark:text-zinc-500'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-500"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls */}
      <div className="space-y-4 pt-6 border-t border-zinc-200/50 dark:border-zinc-800/40">
        {fileName && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40">
            <span className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500 block">
              Active Session
            </span>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block truncate mt-0.5">
              {fileName}
            </span>
          </div>
        )}

        {/* Theme toggle & label */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold border border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/10 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 transition-colors text-zinc-600 dark:text-zinc-300"
        >
          <span className="flex items-center gap-2">
            {darkMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            <span>{darkMode ? 'Dark Theme' : 'Light Theme'}</span>
          </span>
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
            Toggle
          </span>
        </button>
      </div>
    </aside>
  );
}
