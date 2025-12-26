'use client';

import Button from '@/components/Button';
import { calculateTournamentStatus, hasTournamentStarted, hasTournamentEnded } from '@/lib/tournamentUtils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface TournamentCardData {
  tournamentId: string;
  playlistId: number;
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
  onPlay?: (tournamentId: string) => void;
}

export const TournamentCard = ({ tournament, onJoin, onView, onPlay }: TournamentCardProps) => {
  const { t } = useLanguage();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming':
        return 'bg-yellow-600/20 text-yellow-600 dark:text-yellow-400 border-yellow-600/40';
      case 'Active':
        return 'bg-green-600/20 text-green-600 dark:text-green-400 border-green-600/40';
      case 'Completed':
        return 'bg-slate-600/20 text-slate-500 dark:text-slate-400 border-slate-600/40';
      default:
        return 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border-blue-600/40';
    }
  };
  // Calculate tournament timing using shared utility functions
  const actualStatus = calculateTournamentStatus(tournament.startDate, tournament.endDate);
  const hasStarted = hasTournamentStarted(tournament.startDate);
  const hasEnded = hasTournamentEnded(tournament.endDate);
  
  // Can only join if not registered, not ended, and tournament is upcoming or active
  const canJoin = !tournament.isRegistered && !hasEnded;
  const isFull = tournament.maxParticipants && tournament.participants >= tournament.maxParticipants;
  
  const canPlay = tournament.isRegistered && hasStarted && !hasEnded;

  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-blue-900/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 hover:border-slate-300 dark:hover:border-blue-700/80 transition-all flex flex-col h-full">
      {/* Tournament Image Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500/20 dark:from-blue-900/40 to-purple-500/20 dark:to-purple-900/40 flex items-center justify-center">
        <div className="text-6xl text-slate-400/40 dark:text-white/20">🏆</div>
        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(actualStatus)}`}>
          {actualStatus}
        </span>
      </div>

      {/* Header */}
      <div className="bg-slate-100 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 dark:border-blue-900/40">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{tournament.name}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{tournament.description}</p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-blue-600 dark:text-blue-200">{t('tournaments.startDate')}:</span>
            <p className="text-slate-900 dark:text-white font-semibold">{tournament.startDate}</p>
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-200">{t('tournaments.endDate')}:</span>
            <p className="text-slate-900 dark:text-white font-semibold">{tournament.endDate}</p>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-blue-600 dark:text-blue-200">{t('tournaments.participants')}:</span>
            <span className="text-slate-900 dark:text-white font-semibold ml-2">
              {tournament.participants}
              {tournament.maxParticipants && ` / ${tournament.maxParticipants}`}
            </span>
          </div>
          {tournament.prize && (
            <div>
              <span className="text-blue-600 dark:text-blue-200">{t('tournaments.prize')}:</span>
              <span className="text-yellow-500 dark:text-yellow-400 font-semibold ml-2">{tournament.prize}</span>
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
              {isFull ? t('tournaments.tournamentFull') : t('tournaments.joinTournament')}
            </Button>
          )}
          {canPlay && (
            <Button
              className="flex-1 py-2 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onPlay?.(tournament.tournamentId)}
            >
              {t('tournaments.playNow')}
            </Button>
          )}
          {tournament.isRegistered && !canPlay && !hasEnded && (
            <div className="flex-1 py-2 text-sm font-semibold rounded-lg bg-green-600/20 text-green-400 border border-green-600/40 text-center cursor-not-allowed">
              {t('tournaments.registered')}
            </div>
          )}
          {tournament.isRegistered && hasEnded && (
            <div className="flex-1 py-2 text-sm font-semibold rounded-lg bg-green-600/20 text-green-400 border border-green-600/40 text-center">
              {t('tournaments.past')}
            </div>
          )}
          <Button
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg font-semibold"
            onClick={() => onView?.(tournament.tournamentId)}
          >
            {t('common.details')}
          </Button>
        </div>
      </div>
    </div>
  );
};
