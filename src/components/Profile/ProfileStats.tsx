'use client';

interface ProfileStatsProps {
  stats: {
    averageScore: number;
    totalGames: number;
    guessAccuracy: number; // percentage
  };
}

export const ProfileStats = ({ stats }: ProfileStatsProps) => {
  return (
    <div className="rounded-lg overflow-hidden border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
      {/* Header */}
      <div className="bg-slate-950 px-4 py-3 border-b border-blue-900/40">
        <h3 className="text-xl font-bold text-white">Statistics</h3>
      </div>

      {/* Stats Content */}
      <div className="p-4 bg-slate-900/50">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-200">Average Score:</span>
            <span className="text-white font-semibold">{stats.averageScore.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-200">Total Games:</span>
            <span className="text-white font-semibold">{stats.totalGames.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-200">Guess Accuracy:</span>
            <span className="text-white font-semibold">%{stats.guessAccuracy}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

