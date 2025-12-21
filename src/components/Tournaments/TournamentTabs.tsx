'use client';

interface TournamentTabsProps {
  activeTab: 'all' | 'upcoming' | 'active' | 'completed';
  onTabChange: (tab: 'all' | 'upcoming' | 'active' | 'completed') => void;
}

export const TournamentTabs = ({ activeTab, onTabChange }: TournamentTabsProps) => {
  const tabs: { key: 'all' | 'upcoming' | 'active' | 'completed'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
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
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
