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
    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-blue-900/60 bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 shadow-sm">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 dark:border-blue-900/40">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Statistics</h3>
      </div>

      {/* Stats Content */}
      <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-700 dark:text-blue-200">Average Score:</span>
            <span className="text-slate-900 dark:text-white font-semibold">{stats.averageScore.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-700 dark:text-blue-200">Total Games:</span>
            <span className="text-slate-900 dark:text-white font-semibold">{stats.totalGames.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-700 dark:text-blue-200">Guess Accuracy:</span>
            <span className="text-slate-900 dark:text-white font-semibold">%{stats.guessAccuracy}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

