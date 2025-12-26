'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface TournamentTabsProps {
  activeTab: 'all' | 'upcoming' | 'active' | 'completed';
  onTabChange: (tab: 'all' | 'upcoming' | 'active' | 'completed') => void;
}

export const TournamentTabs = ({ activeTab, onTabChange }: TournamentTabsProps) => {
  const { t } = useLanguage();
  
  const tabs: { key: 'all' | 'upcoming' | 'active' | 'completed'; labelKey: string }[] = [
    { key: 'all', labelKey: 'leaderboard.allTime' },
    { key: 'upcoming', labelKey: 'tournaments.upcoming' },
    { key: 'active', labelKey: 'tournaments.active' },
    { key: 'completed', labelKey: 'tournaments.past' },
  ];

  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === tab.key
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent'
          }`}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
};
