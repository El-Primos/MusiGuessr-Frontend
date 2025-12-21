'use client';

import Button from '@/components/Button';

export interface TournamentCardData {
  tournamentId: string;
  name: string;
  description: string;
  startDate: string; // "01.01.25"
  endDate: string; // "15.01.25"
  status: 'Upcoming' | 'Active' | 'Completed';
  participants: number;
  maxParticipants?: number;
  prize?: string;
  isRegistered?: boolean;
}

interface TournamentCardProps {
  tournament: TournamentCardData;
  onJoin?: (tournamentId: string) => void;
  onView?: (tournamentId: string) => void;
}

export const TournamentCard = ({ tournament, onJoin, onView }: TournamentCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/40';
      case 'Active':
        return 'bg-green-600/20 text-green-400 border-green-600/40';
      case 'Completed':
        return 'bg-slate-600/20 text-slate-400 border-slate-600/40';
      default:
        return 'bg-blue-600/20 text-blue-400 border-blue-600/40';
    }
  };

  const canJoin = tournament.status === 'Upcoming' && !tournament.isRegistered;
  const isFull = tournament.maxParticipants && tournament.participants >= tournament.maxParticipants;

  return (
    <div className="rounded-lg overflow-hidden border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 hover:border-blue-700/80 transition-all flex flex-col h-full">
      {/* Tournament Image Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-blue-900/40 to-purple-900/40 flex items-center justify-center">
        <div className="text-6xl text-white/20">🏆</div>
        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(tournament.status)}`}>
          {tournament.status}
        </span>
      </div>

      {/* Header */}
      <div className="bg-slate-950 px-4 py-3 border-b border-blue-900/40">
        <h3 className="text-lg font-bold text-white mb-1">{tournament.name}</h3>
        <p className="text-sm text-slate-400 line-clamp-2">{tournament.description}</p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-blue-200">Start Date:</span>
            <p className="text-white font-semibold">{tournament.startDate}</p>
          </div>
          <div>
            <span className="text-blue-200">End Date:</span>
            <p className="text-white font-semibold">{tournament.endDate}</p>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-blue-200">Participants:</span>
            <span className="text-white font-semibold ml-2">
              {tournament.participants}
              {tournament.maxParticipants && ` / ${tournament.maxParticipants}`}
            </span>
          </div>
          {tournament.prize && (
            <div>
              <span className="text-blue-200">Prize:</span>
              <span className="text-yellow-400 font-semibold ml-2">{tournament.prize}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 mt-auto">
          {canJoin && (
            <Button
              className={`flex-1 py-2 text-sm font-semibold rounded-lg ${
                isFull
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              onClick={() => !isFull && onJoin?.(tournament.tournamentId)}
            >
              {isFull ? 'Full' : 'Join'}
            </Button>
          )}
          {tournament.isRegistered && tournament.status !== 'Completed' && (
            <div className="flex-1 py-2 text-sm font-semibold rounded-lg bg-green-600/20 text-green-400 border border-green-600/40 text-center">
              Registered
            </div>
          )}
          <Button
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg font-semibold"
            onClick={() => onView?.(tournament.tournamentId)}
          >
            Details
          </Button>
        </div>
      </div>
    </div>
  );
};
