'use client';

import { TournamentCard, TournamentCardData } from './TournamentCard';

interface TournamentListProps {
  tournaments: TournamentCardData[];
  onJoin?: (tournamentId: string) => void;
  onView?: (tournamentId: string) => void;
  onPlay?: (tournamentId: string) => void;
}

export const TournamentList = ({ tournaments, onJoin, onView, onPlay }: TournamentListProps) => {
  if (tournaments.length === 0) {
    return (
      <div className="rounded-lg overflow-hidden border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
        <div className="bg-slate-950 px-4 py-3 border-b border-blue-900/40">
          <h3 className="text-xl font-bold text-white">Available Tournaments</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-slate-400 text-sm">No tournaments available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tournaments Grid - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <TournamentCard
            key={tournament.tournamentId}
            tournament={tournament}
            onJoin={onJoin}
            onView={onView}
            onPlay={onPlay}
          />
        ))}
      </div>
    </div>
  );
};
