'use client';

interface LeaderboardTabsProps {
  activeTab: 'global' | 'friends';
  onTabChange: (tab: 'global' | 'friends') => void;
}

export const LeaderboardTabs = ({ activeTab, onTabChange }: LeaderboardTabsProps) => {
  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => onTabChange('global')}
        className={`
          px-6 py-2 rounded-lg font-semibold transition-colors
          ${activeTab === 'global'
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-blue-900/40'
          }
        `}
      >
        Global
      </button>
      <button
        onClick={() => onTabChange('friends')}
        className={`
          px-6 py-2 rounded-lg font-semibold transition-colors
          ${activeTab === 'friends'
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-blue-900/40'
          }
        `}
      >
        Friends
      </button>
    </div>
  );
};

