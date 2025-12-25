'use client';

interface TournamentStatsProps {
  stats: {
    tournamentsPlayed: number;
    tournamentsWon: number;
    bestRank: number;
    totalPoints: number;
  };
}

export const TournamentStats = ({ stats }: TournamentStatsProps) => {
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-blue-900/60 bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 shadow-sm">
      {/* Stats Content - Compact horizontal layout */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.tournamentsPlayed.toLocaleString()}</div>
            <div className="text-xs text-blue-700 dark:text-blue-200 mt-1">Tournaments Played</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.tournamentsWon.toLocaleString()}</div>
            <div className="text-xs text-blue-700 dark:text-blue-200 mt-1">Tournaments Won</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">#{stats.bestRank}</div>
            <div className="text-xs text-blue-700 dark:text-blue-200 mt-1">Best Rank</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalPoints.toLocaleString()}</div>
            <div className="text-xs text-blue-700 dark:text-blue-200 mt-1">Total Points</div>
          </div>
        </div>
      </div>
    </div>
  );
};
