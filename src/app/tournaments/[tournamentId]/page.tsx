'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { SettingsButton } from '@/components/SettingsButton';
import { LeaderboardTable } from '@/components/Leaderboard/LeaderboardTable';
import Button from '@/components/Button';

// Interface definitions
interface TournamentDetails {
  tournamentId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Active' | 'Completed';
  participants: number;
  maxParticipants?: number;
  prize?: string;
  imageUrl?: string;
  isRegistered?: boolean;
  rules: string[];
  leaderboard: {
    rank: number;
    playerName: string;
    score: number;
  }[];
}

// Mock data - Remove when backend is ready
// Backend integration: Replace with API call
// Expected API endpoint: GET /api/tournaments/:id
// Expected response format: TournamentDetails
const mockTournamentDetails: Record<string, TournamentDetails> = {
  '1': {
    tournamentId: '1',
    name: 'Winter Championship 2025',
    description: 'Compete for the ultimate winter music champion title! Test your knowledge of winter classics and contemporary hits in this exciting tournament.',
    startDate: '25.12.24',
    endDate: '05.01.25',
    status: 'Active',
    participants: 456,
    maxParticipants: 500,
    prize: '1000 Points',
    isRegistered: true,
    rules: [
      'Tournament runs from December 25, 2024 to January 5, 2025',
      'Each player gets 10 songs to guess per day',
      'Points are awarded based on speed and accuracy',
      'Top 3 players receive special prizes',
      'Fair play rules apply - cheating will result in disqualification',
    ],
    leaderboard: [
      { rank: 1, playerName: 'MusicMaster', score: 9850 },
      { rank: 2, playerName: 'SongGuru', score: 9720 },
      { rank: 3, playerName: 'MelodyKing', score: 9650 },
      { rank: 4, playerName: 'Your name', score: 9500 },
      { rank: 5, playerName: 'BeatHunter', score: 9350 },
      { rank: 6, playerName: 'RhythmQueen', score: 9200 },
      { rank: 7, playerName: 'TuneSeeker', score: 9100 },
      { rank: 8, playerName: 'HarmonyPro', score: 8950 },
      { rank: 9, playerName: 'ChordChampion', score: 8800 },
      { rank: 10, playerName: 'NoteNinja', score: 8650 },
    ],
  },
  '2': {
    tournamentId: '2',
    name: 'New Year Special',
    description: 'Ring in the new year with an exciting tournament.',
    startDate: '01.01.25',
    endDate: '07.01.25',
    status: 'Upcoming',
    participants: 234,
    maxParticipants: 500,
    prize: '500 Points',
    isRegistered: false,
    rules: [
      'Tournament starts on January 1, 2025',
      'Registration closes when max participants reached',
      'Daily challenges available',
      'Prize pool distributed to top 10 players',
    ],
    leaderboard: [],
  },
};

export default function TournamentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params?.tournamentId as string;
  
  const [tournament, setTournament] = useState<TournamentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Backend integration - Replace with API call
  useEffect(() => {
    // Mock: Simulate API call
    setTimeout(() => {
      const data = mockTournamentDetails[tournamentId];
      setTournament(data || null);
      setIsLoading(false);
    }, 500);
  }, [tournamentId]);

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

  const handleJoinTournament = () => {
    // TODO: Backend integration - Call API to join tournament
    if (tournament) {
      setTournament({ ...tournament, isRegistered: true, participants: tournament.participants + 1 });
    }
  };

  const handleLeaveTournament = () => {
    // TODO: Backend integration - Call API to leave tournament
    if (tournament) {
      setTournament({ ...tournament, isRegistered: false, participants: tournament.participants - 1 });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
        <Header
          logoSrc="/logo.png"
          exitVisible={true}
          onExit={() => router.push('/tournaments')}
          className="top-0 left-0"
        />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-slate-400">Loading...</div>
        </main>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
        <Header
          logoSrc="/logo.png"
          exitVisible={true}
          onExit={() => router.push('/tournaments')}
          className="top-0 left-0"
        />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Tournament Not Found</h2>
            <p className="text-slate-400 mb-6">The tournament you are looking for does not exist.</p>
            <Button
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              onClick={() => router.push('/tournaments')}
            >
              Back to Tournaments
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const canJoin = tournament.status === 'Upcoming' && !tournament.isRegistered;
  const canLeave = tournament.status !== 'Completed' && tournament.isRegistered;
  const isFull = tournament.maxParticipants && tournament.participants >= tournament.maxParticipants;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      <Header
        logoSrc="/logo.png"
        exitVisible={true}
        onExit={() => router.push('/tournaments')}
        className="top-0 left-0"
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/tournaments')}
          className="mb-6 text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
        >
          <span>←</span>
          <span>Back to Tournaments</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Tournament Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tournament Header */}
            <div className="rounded-lg overflow-hidden border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
              {/* Tournament Image */}
              <div className="relative h-64 bg-gradient-to-br from-blue-900/40 to-purple-900/40 flex items-center justify-center">
                <div className="text-8xl text-white/20">🏆</div>
                <span className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(tournament.status)}`}>
                  {tournament.status}
                </span>
              </div>

              {/* Tournament Details */}
              <div className="p-6 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{tournament.name}</h1>
                  <p className="text-slate-400">{tournament.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-200 block">Start Date</span>
                    <span className="text-white font-semibold">{tournament.startDate}</span>
                  </div>
                  <div>
                    <span className="text-blue-200 block">End Date</span>
                    <span className="text-white font-semibold">{tournament.endDate}</span>
                  </div>
                  <div>
                    <span className="text-blue-200 block">Participants</span>
                    <span className="text-white font-semibold">
                      {tournament.participants}
                      {tournament.maxParticipants && ` / ${tournament.maxParticipants}`}
                    </span>
                  </div>
                  {tournament.prize && (
                    <div>
                      <span className="text-blue-200 block">Prize</span>
                      <span className="text-yellow-400 font-semibold">{tournament.prize}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {canJoin && (
                    <Button
                      className={`flex-1 py-3 text-sm font-semibold rounded-lg ${
                        isFull
                          ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                      onClick={handleJoinTournament}
                    >
                      {isFull ? 'Tournament Full' : 'Join Tournament'}
                    </Button>
                  )}
                  {canLeave && (
                    <Button
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-semibold"
                      onClick={handleLeaveTournament}
                    >
                      Leave Tournament
                    </Button>
                  )}
                  {tournament.isRegistered && tournament.status === 'Active' && (
                    <Button
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-semibold"
                      onClick={() => router.push(`/game?tournament=${tournament.tournamentId}`)}
                    >
                      Play Now
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Rules Section */}
            <div className="rounded-lg overflow-hidden border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
              <div className="bg-slate-950 px-6 py-4 border-b border-blue-900/40">
                <h2 className="text-xl font-bold text-white">Tournament Rules</h2>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {tournament.rules.map((rule, index) => (
                    <li key={index} className="flex gap-3 text-slate-300">
                      <span className="text-blue-400 font-semibold">{index + 1}.</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Panel - Leaderboard */}
          <div className="lg:col-span-1">
            <div className="rounded-lg overflow-hidden border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 sticky top-4">
              <div className="bg-slate-950 px-6 py-4 border-b border-blue-900/40">
                <h2 className="text-xl font-bold text-white">Leaderboard</h2>
              </div>
              <div className="p-4">
                {tournament.leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 text-sm">
                      {tournament.status === 'Upcoming'
                        ? 'Leaderboard will be available when the tournament starts.'
                        : 'No scores yet. Be the first to play!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tournament.leaderboard.map((entry) => (
                      <div
                        key={entry.rank}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg
                          ${entry.playerName === 'Your name' 
                            ? 'bg-blue-900/30 border border-blue-600/40' 
                            : 'bg-slate-900/50 hover:bg-slate-800/50'}
                          transition-colors
                        `}
                      >
                        {/* Rank */}
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                          ${entry.rank === 1 ? 'bg-yellow-600/30 text-yellow-400' : ''}
                          ${entry.rank === 2 ? 'bg-slate-500/30 text-slate-300' : ''}
                          ${entry.rank === 3 ? 'bg-orange-600/30 text-orange-400' : ''}
                          ${entry.rank > 3 ? 'bg-slate-700/30 text-slate-400' : ''}
                        `}>
                          {entry.rank}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold truncate ${
                            entry.playerName === 'Your name' ? 'text-blue-300' : 'text-white'
                          }`}>
                            {entry.playerName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {entry.score.toLocaleString()} pts
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <SettingsButton />
    </div>
  );
}
