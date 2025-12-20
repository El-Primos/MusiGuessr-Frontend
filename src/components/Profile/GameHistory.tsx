'use client';

import Button from '@/components/Button';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/Toast';

interface GameHistoryEntry {
  gameId: string;
  date: string; // "01.01.25"
  mode: 'Normal' | 'Tournament';
  score: number;
}

interface GameHistoryProps {
  gameHistory: GameHistoryEntry[];
}

export const GameHistory = ({ gameHistory }: GameHistoryProps) => {
  const { toast, showToast, hideToast } = useToast();

  const handleShareGame = (gameId: string) => {
    const gameUrl = `${window.location.origin}/share/game/${gameId}`;
    navigator.clipboard.writeText(gameUrl);
    showToast('Game link copied!', 'success');
  };

  if (gameHistory.length === 0) {
    return (
      <div className="rounded-lg overflow-hidden border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
        <div className="bg-slate-950 px-4 py-3 border-b border-blue-900/40">
          <h3 className="text-xl font-bold text-white">Game History</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-slate-400 text-sm">No games played yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
      {/* Header */}
      <div className="bg-slate-950 px-4 py-3 border-b border-blue-900/40">
        <h3 className="text-xl font-bold text-white">Game History</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-900/50 border-b border-blue-900/40">
              <th className="px-4 py-3 text-left text-sm font-semibold text-blue-200">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-blue-200">Mode</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-blue-200">Score</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-blue-200">Share</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-blue-900/40">
            {gameHistory.map((game) => (
              <tr
                key={game.gameId}
                className="hover:bg-blue-900/20 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-white">{game.date}</td>
                <td className="px-4 py-3 text-sm text-blue-200">{game.mode}</td>
                <td className="px-4 py-3 text-sm text-white font-semibold">
                  {game.score.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-semibold"
                    onClick={() => handleShareGame(game.gameId)}
                  >
                    Share
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

