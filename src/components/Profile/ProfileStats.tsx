'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface ProfileStatsProps {
  stats: {
    averageScore: number;
    totalGames: number;
    guessAccuracy: number; // percentage
  };
}

export const ProfileStats = ({ stats }: ProfileStatsProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-blue-900/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-slate-100 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 dark:border-blue-900/40">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('profile.statistics')}</h3>
      </div>

      {/* Stats Content */}
      <div className="p-4 bg-white/50 dark:bg-slate-900/50">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-600 dark:text-blue-200">{t('profile.averageScore')}:</span>
            <span className="text-slate-900 dark:text-white font-semibold">{stats.averageScore.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-600 dark:text-blue-200">{t('profile.totalGames')}:</span>
            <span className="text-slate-900 dark:text-white font-semibold">{stats.totalGames.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-600 dark:text-blue-200">{t('profile.guessAccuracy')}:</span>
            <span className="text-slate-900 dark:text-white font-semibold">%{stats.guessAccuracy}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

