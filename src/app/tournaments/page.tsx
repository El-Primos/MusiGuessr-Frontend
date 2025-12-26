'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { SettingsButton } from '@/components/SettingsButton';
import { TournamentStats } from '@/components/Tournaments/TournamentStats';
import { TournamentList } from '@/components/Tournaments/TournamentList';
import { TournamentTabs } from '@/components/Tournaments/TournamentTabs';
import { TournamentCardData } from '@/components/Tournaments/TournamentCard';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/Toast';
import { Loading } from '@/components/Loading';
import { useApi } from '@/lib/useApi';
import { calculateTournamentStatus } from '@/lib/tournamentUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  TournamentPageResponse,
  mapTournamentStatus,
  formatTournamentDate,
} from '@/dto/tournament.dto';

// Interface definitions
interface TournamentData {
  stats: {
    tournamentsPlayed: number;
    tournamentsWon: number;
    bestRank: number;
    totalPoints: number;
  };
  tournaments: TournamentCardData[];
}

export default function TournamentsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [registeredTournamentIds, setRegisteredTournamentIds] = useState<Set<number>>(new Set());
  const { toast, showToast, hideToast } = useToast();
  const { apiFetch, token } = useApi('http://localhost:8080');
  const [userId, setUserId] = useState<number | null>(null);

  // Load user ID from localStorage
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

  // Fetch tournaments and user registrations together
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (token && userId) {
        fetchAllData();
      } else {
        // User is not authenticated, stop loading
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, token, userId]);

  async function fetchAllData() {
    setIsLoading(true);
    try {
      if (!token || !userId) {
        setIsLoading(false);
        return;
      }

      // Fetch user registrations and calculate stats
      let userRegisteredIds = new Set<number>();
      const calculatedStats = {
        tournamentsPlayed: 0,
        tournamentsWon: 0,
        bestRank: 0,
        totalPoints: 0,
      };

      try {
        const userResponse = await apiFetch(`/api/users/me/history/tournaments?userId=${userId}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('User tournament history data:', userData);
          
          userRegisteredIds = new Set<number>(userData.map((t: { tournamentId: number }) => t.tournamentId));
          setRegisteredTournamentIds(userRegisteredIds);
          console.log('Loaded registered tournament IDs:', Array.from(userRegisteredIds));

          // Calculate stats from user tournament history
          calculatedStats.tournamentsPlayed = userData.length;
          
          // Calculate total points and fetch rank data
          for (const tournament of userData) {
            console.log('Processing tournament:', tournament);
            if (tournament.userScore) {
              calculatedStats.totalPoints += tournament.userScore;
            }
            
            // Fetch leaderboard to get user's rank for this tournament
            try {
              const leaderboardRes = await apiFetch(`/api/tournaments/${tournament.tournamentId}/leaderboard`);
              if (leaderboardRes.ok) {
                const leaderboard = await leaderboardRes.json();
                const userEntry = leaderboard.find((entry: { userId: number }) => entry.userId === userId);
                if (userEntry) {
                  // Check if user won this tournament
                  if (userEntry.rank === 1) {
                    calculatedStats.tournamentsWon++;
                  }
                  // Update best rank
                  if (calculatedStats.bestRank === 0 || userEntry.rank < calculatedStats.bestRank) {
                    calculatedStats.bestRank = userEntry.rank;
                  }
                }
              }
            } catch {
              console.warn('Could not fetch leaderboard for tournament', tournament.tournamentId);
            }
          }
          
          console.log('Calculated stats:', calculatedStats);
        } else {
          console.warn('Could not fetch user tournaments (status:', userResponse.status, '). Registration status will be updated after joining.');
          // Continue anyway - registration status will be determined by join attempts
        }
      } catch (error) {
        console.warn('Could not fetch user tournaments:', error, '. Registration status will be updated after joining.');
        // Continue anyway - registration status will be determined by join attempts
      }

      // Now fetch tournaments with the registration data already loaded

      // Build query params - fetch all tournaments, filter on client side by dates
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: '50', // Increase size to get more tournaments for client-side filtering
        sort: 'createdAt',
        direction: 'DESC',
      });

      // Don't send status filter to backend - we'll filter by actual dates on frontend
      // const backendStatus = mapToBackendStatus(activeTab);
      // if (backendStatus) {
      //   params.append('status', backendStatus);
      // }

      const response = await apiFetch(`/api/tournaments?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 401) {
          showToast('Please log in to view tournaments', 'error');
          router.push('/auth');
          return;
        }
        throw new Error(`Failed to fetch tournaments: ${response.statusText}`);
      }

      const data: TournamentPageResponse = await response.json();

      // Transform backend DTOs to frontend format with current registration status
      const tournaments: TournamentCardData[] = data.content.map((dto) => {
        const isRegistered = userRegisteredIds.has(dto.id);
        
        return {
          tournamentId: dto.id.toString(),
          playlistId: dto.playlistId,
          name: dto.name,
          description: dto.description,
          startDate: formatTournamentDate(dto.startDate),
          endDate: formatTournamentDate(dto.endDate),
          status: mapTournamentStatus(dto.status),
          participants: dto.participantCount,
          maxParticipants: 500, // TODO: Add to backend when max participants feature is implemented
          prize: '1000 Points', // TODO: Add to backend when prize field is implemented
          isRegistered: isRegistered,
        };
      });

      setTournamentData({
        stats: calculatedStats,
        tournaments,
      });

      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to load tournaments',
        'error'
      );
      setTournamentData(null);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter tournaments based on active tab using date-calculated status
  const filteredTournaments = tournamentData?.tournaments.filter((tournament) => {
    if (activeTab === 'all') return true;
    const actualStatus = calculateTournamentStatus(tournament.startDate, tournament.endDate);
    return actualStatus.toLowerCase() === activeTab;
  }) || [];

  // Handle joining a tournament
  async function handleJoinTournament(tournamentId: string) {
    try {
      const response = await apiFetch(`/api/tournaments/${tournamentId}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        if (response.status === 409) {
          showToast('You are already registered for this tournament', 'error');
          // Update local state to reflect that user is already registered
          const tournamentIdNum = parseInt(tournamentId);
          setRegisteredTournamentIds(prev => new Set(prev).add(tournamentIdNum));
          
          // Update tournament data immediately
          if (tournamentData) {
            setTournamentData({
              ...tournamentData,
              tournaments: tournamentData.tournaments.map((t) =>
                t.tournamentId === tournamentId
                  ? { ...t, isRegistered: true }
                  : t
              ),
            });
          }
          return;
        }
        const errorText = await response.text();
        throw new Error(errorText || `Failed to join tournament: ${response.statusText}`);
      }

      showToast('Successfully joined tournament!', 'success');

      const tournamentIdNum = parseInt(tournamentId);
      
      // Update registered tournaments set
      setRegisteredTournamentIds(prev => new Set(prev).add(tournamentIdNum));

      // Update tournament data immediately to show button change
      if (tournamentData) {
        setTournamentData({
          ...tournamentData,
          tournaments: tournamentData.tournaments.map((t) =>
            t.tournamentId === tournamentId
              ? { ...t, isRegistered: true, participants: t.participants + 1 }
              : t
          ),
        });
      }
    } catch (error) {
      console.error('Error joining tournament:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to join tournament',
        'error'
      );
    }
  }

  // Handle viewing tournament details
  const handleViewTournament = (tournamentId: string) => {
    router.push(`/tournaments/${tournamentId}`);
  };

  // Handle playing a tournament
  const handlePlayTournament = async (tournamentId: string) => {
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
        console.error('Failed to create tournament game:', errorText);
        throw new Error('Failed to create tournament game');
      }

      const gameData = await response.json();
      console.log('Tournament game created:', gameData);
      
      // Navigate to game page with the game ID
      router.push(`/game?gameId=${gameData.id}&tournament=${tournamentId}&playlist=${gameData.playlistId}`);
    } catch (error) {
      showToast('You have already played this tournament game', 'error');
      console.error('Error creating tournament game:', error);
    }
  };

  if (isLoading) {
    return <Loading fullScreen message={t('common.loading')} />;
  }

  // Check if user is not authenticated
  if (!token || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black text-slate-900 dark:text-white">
        <Header
          logoSrc="/logo.png"
          exitVisible={true}
          onExit={() => router.push('/')}
          className="top-0 left-0"
        />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="mb-8">
              <svg
                className="w-24 h-24 mx-auto text-slate-400 dark:text-slate-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                You need to sign in or register to view and participate in tournaments
              </p>
            </div>
            <button
              onClick={() => router.push('/auth')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Sign In or Register
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!tournamentData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black text-slate-900 dark:text-white">
        <Header
          logoSrc="/logo.png"
          exitVisible={true}
          onExit={() => router.push('/')}
          className="top-0 left-0"
        />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-slate-500 dark:text-slate-400">No tournament data available</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black text-slate-900 dark:text-white animate-in fade-in duration-300">
      <Header
        logoSrc="/logo.png"
        exitVisible={true}
        onExit={() => router.push('/')}
        className="top-0 left-0"
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{t('tournaments.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('home.subtitle')}</p>
        </div>

        {/* Tournament Statistics - Compact at top */}
        <div className="mb-6">
          <TournamentStats stats={tournamentData.stats} />
        </div>

        {/* Tabs */}
        <TournamentTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tournament Grid - 3 columns */}
        <TournamentList
          tournaments={filteredTournaments}
          onJoin={handleJoinTournament}
          onView={handleViewTournament}
          onPlay={handlePlayTournament}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
            >
              Previous
            </button>
            <span className="text-slate-600 dark:text-slate-300">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>

      <SettingsButton />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}
