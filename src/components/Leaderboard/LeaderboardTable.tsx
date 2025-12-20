'use client';

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  activeTab: 'global' | 'friends';
  isAuthenticated: boolean;
}

// Helper function to get rank color
const getRankColor = (rank: number, playerName: string): string => {
  // Highlight current user's entry
  if (playerName === 'Your name') {
    return 'text-blue-400 font-bold';
  }
  
  // Top 3 ranks get special colors
  switch (rank) {
    case 1:
      return 'text-yellow-400 font-bold'; // Gold
    case 2:
      return 'text-slate-300 font-semibold'; // Silver
    case 3:
      return 'text-orange-400 font-semibold'; // Bronze
    default:
      return 'text-white';
  }
};

export const LeaderboardTable = ({ data, activeTab, isAuthenticated }: LeaderboardTableProps) => {
  return (
    <div className="rounded-lg overflow-hidden border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
      {/* Table Header */}
      <div className="bg-slate-950 px-4 py-3 flex font-semibold text-sm border-b border-blue-900/40">
        <div className="w-16 text-blue-200">#</div>
        <div className="flex-1 text-blue-200">Player Name</div>
        <div className="w-32 text-right text-blue-200">Score</div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-blue-900/40">
        {activeTab === 'friends' && !isAuthenticated ? (
          // Not authenticated state
          <div className="px-4 py-8 text-center">
            <p className="text-slate-400 text-sm">
              Please log in to see your friends leaderboard.
            </p>
          </div>
        ) : data.length === 0 ? (
          // Empty state
          <div className="px-4 py-8 text-center">
            <p className="text-slate-400 text-sm">
              {activeTab === 'friends' 
                ? 'You have no friends right now. Add friends to see their scores here!'
                : 'No leaderboard data available.'
              }
            </p>
          </div>
        ) : (
          data.map((entry) => (
            <div
              key={entry.rank}
              className={`
                px-4 py-3 flex items-center text-sm
                border-b border-blue-900/40
                hover:bg-blue-900/20
                transition-colors
                ${entry.playerName === 'Your name' ? 'bg-blue-950/30' : ''}
              `}
            >
              {/* Rank */}
              <div className={`w-16 ${getRankColor(entry.rank, entry.playerName)}`}>
                {entry.rank}
              </div>

              {/* Player Name */}
              <div className={`flex-1 ${entry.playerName === 'Your name' ? 'text-blue-300 font-semibold' : 'text-blue-200'}`}>
                {entry.playerName}
              </div>

              {/* Score */}
              <div className={`w-32 text-right font-semibold ${entry.playerName === 'Your name' ? 'text-blue-300' : 'text-white'}`}>
                {entry.score.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

