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
    <div className="rounded-lg overflow-hidden border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
      {/* Stats Content - Compact horizontal layout */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.tournamentsPlayed.toLocaleString()}</div>
            <div className="text-xs text-blue-200 mt-1">Tournaments Played</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.tournamentsWon.toLocaleString()}</div>
            <div className="text-xs text-blue-200 mt-1">Tournaments Won</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">#{stats.bestRank}</div>
            <div className="text-xs text-blue-200 mt-1">Best Rank</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.totalPoints.toLocaleString()}</div>
            <div className="text-xs text-blue-200 mt-1">Total Points</div>
          </div>
        </div>
      </div>
    </div>
  );
};
