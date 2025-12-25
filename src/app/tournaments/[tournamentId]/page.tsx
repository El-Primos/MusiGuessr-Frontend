'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { SettingsButton } from '@/components/SettingsButton';
import Button from '@/components/Button';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/Toast';
import { Loading } from '@/components/Loading';
import { calculateTournamentStatus, hasTournamentStarted, hasTournamentEnded } from '@/lib/tournamentUtils';
import {
  TournamentResponseDTO,
  TournamentLeaderboardEntryDTO,
  mapTournamentStatus,
  formatTournamentDate,
} from '@/dto/tournament.dto';

interface TournamentDetails {
  tournamentId: string;
  playlistId: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Active' | 'Completed';
  participants: number;
  maxParticipants?: number;
  prize?: string;
  isRegistered: boolean;
  leaderboard: {
    rank: number;
    playerName: string;
    score: number;
  }[];
}

export default function TournamentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params?.tournamentId as string;
  
  const [tournament, setTournament] = useState<TournamentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { apiFetch, token } = useApi('http://localhost:8080');
  const { toast, showToast, hideToast } = useToast();
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const parsed = JSON.parse(raw);
          setUserId(parsed?.id || null);
        }
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (token && tournamentId && userId) {
      fetchTournamentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tournamentId, userId]);

  async function fetchTournamentData() {
    setIsLoading(true);
    try {
      if (!token) {
        setIsLoading(false);
        return;
      }

      const tournamentResponse = await apiFetch(`/api/tournaments/${tournamentId}`);
      
      if (!tournamentResponse.ok) {
        if (tournamentResponse.status === 404) {
          setTournament(null);
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch tournament');
      }

      const tournamentData: TournamentResponseDTO = await tournamentResponse.json();

      const leaderboardResponse = await apiFetch(`/api/tournaments/${tournamentId}/leaderboard`);
      let leaderboard: { rank: number; playerName: string; score: number }[] = [];
      
      if (leaderboardResponse.ok) {
        const leaderboardData: TournamentLeaderboardEntryDTO[] = await leaderboardResponse.json();
        console.log('Leaderboard data from API:', leaderboardData);
        leaderboard = leaderboardData.map(entry => ({
          rank: entry.rank,
          playerName: entry.username,
          score: entry.score,
        }));
        console.log('Transformed leaderboard:', leaderboard);
      } else {
        console.warn('Failed to fetch leaderboard, status:', leaderboardResponse.status);
      }

      console.log('DEBUG: Starting registration check. userId:', userId, 'tournamentId:', tournamentId);
      
      let isRegistered = false;
      if (userId) {
        console.log('DEBUG: userId exists, attempting to fetch tournament history');
        try {
          // Use the same approach as the working tournaments list page
          const historyResponse = await apiFetch(`/api/users/me/history/tournaments?userId=${userId}`);
          console.log('History API response status:', historyResponse.status);
          
          if (historyResponse.ok) {
            const userTournaments = await historyResponse.json();
            const tournamentIdNum = parseInt(tournamentId);
            
            console.log('Checking registration:', {
              currentTournamentId: tournamentIdNum,
              tournamentIdType: typeof tournamentIdNum,
              userTournaments: userTournaments,
              userTournamentIds: userTournaments.map((t: { tournamentId: number }) => t.tournamentId),
            });
            
            isRegistered = userTournaments.some((t: { tournamentId: number }) => {
              const matches = t.tournamentId === tournamentIdNum;
              console.log(`Comparing: ${t.tournamentId} === ${tournamentIdNum} = ${matches}`);
              return matches;
            });
            
            console.log('Final isRegistered value:', isRegistered);
          } else {
            console.warn('Could not fetch tournament history, status:', historyResponse.status);
            // Fallback: check localStorage for recently joined tournaments
            try {
              const recentJoins = localStorage.getItem('recentTournamentJoins');
              if (recentJoins) {
                const joins: number[] = JSON.parse(recentJoins);
                isRegistered = joins.includes(parseInt(tournamentId));
              }
            } catch (e) {
              console.warn('Could not check localStorage for recent joins');
            }
          }
        } catch (error) {
          console.warn('Error fetching tournament history:', error);
        }
      } else {
        console.warn('DEBUG: No userId found, skipping registration check');
      }

      setTournament({
        tournamentId: tournamentData.id.toString(),
        playlistId: tournamentData.playlistId,
        name: tournamentData.name,
        description: tournamentData.description,
        startDate: formatTournamentDate(tournamentData.startDate),
        endDate: formatTournamentDate(tournamentData.endDate),
        status: mapTournamentStatus(tournamentData.status),
        participants: tournamentData.participantCount,
        maxParticipants: 500,
        prize: '1000 Points',
        isRegistered: isRegistered,
        leaderboard,
      });
    } catch (error) {
      showToast('Failed to load tournament', 'error');
      setTournament(null);
    } finally {
      setIsLoading(false);
    }
  }

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

  const handleJoinTournament = async () => {
    try {
      const response = await apiFetch(`/api/tournaments/${tournamentId}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        if (response.status === 409) {
          showToast('You are already registered', 'error');
          if (tournament) {
            setTournament({ ...tournament, isRegistered: true });
          }
          return;
        }
        throw new Error('Failed to join tournament');
      }

      showToast('Successfully joined tournament!', 'success');
      if (tournament) {
        setTournament({ 
          ...tournament, 
          isRegistered: true, 
          participants: tournament.participants + 1 
        });
        
        // Save to localStorage as fallback
        try {
          const recentJoins = localStorage.getItem('recentTournamentJoins');
          const joins: number[] = recentJoins ? JSON.parse(recentJoins) : [];
          const tournamentIdNum = parseInt(tournamentId);
          if (!joins.includes(tournamentIdNum)) {
            joins.push(tournamentIdNum);
            localStorage.setItem('recentTournamentJoins', JSON.stringify(joins));
          }
        } catch (e) {
          console.warn('Could not save to localStorage');
        }
      }
    } catch (error) {
      showToast('Failed to join tournament', 'error');
    }
  };

  const handleLeaveTournament = async () => {
    try {
      const response = await apiFetch(`/api/tournaments/${tournamentId}/leave`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to leave tournament');
      }

      showToast('Successfully left tournament', 'success');
      if (tournament) {
        setTournament({ 
          ...tournament, 
          isRegistered: false, 
          participants: Math.max(0, tournament.participants - 1)
        });
        
        // Remove from localStorage fallback
        try {
          const recentJoins = localStorage.getItem('recentTournamentJoins');
          if (recentJoins) {
            const joins: number[] = JSON.parse(recentJoins);
            const tournamentIdNum = parseInt(tournamentId);
            const updatedJoins = joins.filter(id => id !== tournamentIdNum);
            localStorage.setItem('recentTournamentJoins', JSON.stringify(updatedJoins));
          }
        } catch (e) {
          console.warn('Could not update localStorage');
        }
      }
    } catch (error) {
      showToast('Failed to leave tournament', 'error');
    }
  };

  const handlePlayTournament = async () => {
    try {
      // Create tournament game
      const response = await apiFetch(`/api/games/tournament?tournamentId=${tournamentId}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('You already played this tournament:', errorText);
        throw new Error('You already played this tournament');
      }

      const gameData = await response.json();
      console.log('Tournament game created:', gameData);
      
      // Navigate to game page with the game ID
      router.push(`/game?gameId=${gameData.id}&tournament=${tournamentId}&playlist=${gameData.playlistId}`);
    } catch (error) {
      showToast('You already played this tournament', 'error');
      console.error('You already played this tournament:', error);
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Loading tournament details..." />;
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

  // Calculate actual status and timing using shared utility functions
  const actualStatus = calculateTournamentStatus(tournament.startDate, tournament.endDate);
  const hasStarted = hasTournamentStarted(tournament.startDate);
  const hasEnded = hasTournamentEnded(tournament.endDate);
  
  const canJoin = !tournament.isRegistered && !hasEnded;
  const isFull = tournament.maxParticipants && tournament.participants >= tournament.maxParticipants;
  const canPlay = tournament.isRegistered && hasStarted && !hasEnded;
  const canLeave = tournament.isRegistered && !hasEnded;

  // Debug log to check button states
  console.log('Tournament button states:', {
    isRegistered: tournament.isRegistered,
    hasStarted,
    hasEnded,
    canJoin,
    canPlay,
    shouldShowAlreadyJoined: tournament.isRegistered && !canPlay && !hasEnded
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white animate-in fade-in duration-300">
      <Header
        logoSrc="/logo.png"
        exitVisible={true}
        onExit={() => router.push('/tournaments')}
        className="top-0 left-0"
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/tournaments')}
          className="mb-6 text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
        >
          <span>←</span>
          <span>Back to Tournaments</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg overflow-hidden border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
              <div className="relative h-64 bg-gradient-to-br from-blue-900/40 to-purple-900/40 flex items-center justify-center">
                <div className="text-8xl text-white/20">🏆</div>
                <span className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(actualStatus)}`}>
                  {actualStatus}
                </span>
              </div>

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

                <div className="flex gap-3 pt-4">
                  {canJoin && (
                    <Button
                      className={`flex-1 py-3 text-sm font-semibold rounded-lg ${
                        isFull
                          ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                      onClick={!isFull ? handleJoinTournament : undefined}
                    >
                      {isFull ? 'Tournament Full' : 'Join Tournament'}
                    </Button>
                  )}
                  {canPlay && (
                    <Button
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-semibold"
                      onClick={handlePlayTournament}
                    >
                      Play Now
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
                  {tournament.isRegistered && hasEnded && (
                    <div className="flex-1 py-3 text-sm font-semibold rounded-lg bg-green-600/20 text-green-400 border border-green-600/40 text-center">
                      Registered
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

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
                    {tournament.leaderboard.map((entry) => {
                      let isCurrentUser = false;
                      try {
                        const userStr = localStorage.getItem('user');
                        if (userStr) {
                          const user = JSON.parse(userStr);
                          isCurrentUser = user?.username === entry.playerName;
                        }
                      } catch (e) {
                        // Ignore parse errors
                      }
                      
                      return (
                        <div
                          key={entry.rank}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            isCurrentUser
                              ? 'bg-blue-900/30 border border-blue-600/40' 
                              : 'bg-slate-900/50 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            entry.rank === 1 ? 'bg-yellow-600/30 text-yellow-400' : ''
                          } ${entry.rank === 2 ? 'bg-slate-500/30 text-slate-300' : ''} ${
                            entry.rank === 3 ? 'bg-orange-600/30 text-orange-400' : ''
                          } ${entry.rank > 3 ? 'bg-slate-700/30 text-slate-400' : ''}`}>
                            {entry.rank}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-semibold truncate ${
                              isCurrentUser ? 'text-blue-300' : 'text-white'
                            }`}>
                              {entry.playerName}
                            </div>
                            <div className="text-xs text-slate-400">
                              {entry.score ? entry.score.toLocaleString() : '0'} pts
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <SettingsButton />
      
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}
