'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  playerName: string;
  score: number;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  activeTab: 'global' | 'friends';
  isAuthenticated: boolean;
  currentUserId?: number | null;
}

// Helper function to get rank color
const getRankColor = (rank: number, isCurrentUser: boolean): string => {
  // Highlight current user's entry
  if (isCurrentUser) {
    return 'text-blue-600 dark:text-blue-400 font-bold';
  }
  
  // Top 3 ranks get special colors
  switch (rank) {
    case 1:
      return 'text-yellow-500 dark:text-yellow-400 font-bold'; // Gold
    case 2:
      return 'text-slate-500 dark:text-slate-300 font-semibold'; // Silver
    case 3:
      return 'text-orange-500 dark:text-orange-400 font-semibold'; // Bronze
    default:
      return 'text-slate-900 dark:text-white';
  }
};

export const LeaderboardTable = ({ data, activeTab, isAuthenticated, currentUserId }: LeaderboardTableProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-blue-900/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* Table Header */}
      <div className="bg-slate-100 dark:bg-slate-950 px-4 py-3 flex font-semibold text-sm border-b border-slate-200 dark:border-blue-900/40">
        <div className="w-16 text-blue-600 dark:text-blue-200">{t('leaderboard.rank')}</div>
        <div className="flex-1 text-blue-600 dark:text-blue-200">{t('leaderboard.player')}</div>
        <div className="w-32 text-right text-blue-600 dark:text-blue-200">{t('leaderboard.score')}</div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-200 dark:divide-blue-900/40">
        {!isAuthenticated ? (
          // Not authenticated state
          <div className="px-4 py-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Please log in to see the leaderboard.
            </p>
          </div>
        ) : data.length === 0 ? (
          // Empty state
          <div className="px-4 py-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {activeTab === 'friends' 
                ? 'You have no friends right now. Add friends to see their scores here!'
                : 'No leaderboard data available.'
              }
            </p>
          </div>
        ) : (
          data.map((entry) => {
            const isCurrentUser = currentUserId !== null && entry.userId === currentUserId;
            return (
              <div
                key={`${entry.userId}-${entry.rank}`}
                className={`
                  px-4 py-3 flex items-center text-sm
                  border-b border-slate-200 dark:border-blue-900/40
                  hover:bg-slate-100 dark:hover:bg-blue-900/20
                  transition-colors
                  ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-950/30' : ''}
                `}
              >
                {/* Rank */}
                <div className={`w-16 ${getRankColor(entry.rank, isCurrentUser)}`}>
                  {entry.rank}
                </div>

                {/* Player Name */}
                <div className={`flex-1 ${isCurrentUser ? 'text-blue-600 dark:text-blue-300 font-semibold' : 'text-slate-700 dark:text-blue-200'}`}>
                  {entry.playerName}
                </div>

                {/* Score */}
                <div className={`w-32 text-right font-semibold ${isCurrentUser ? 'text-blue-600 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                  {entry.score.toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

