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
import { useApi } from '@/lib/useApi';
import {
  TournamentPageResponse,
  mapTournamentStatus,
  mapToBackendStatus,
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

  // Fetch user's registered tournaments
  useEffect(() => {
    if (token && userId) {
      fetchUserTournaments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId]);

  // Fetch tournaments from API - only after token is loaded
  useEffect(() => {
    // Skip if we're still loading the token on client side
    if (typeof window !== 'undefined') {
      fetchTournaments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, token]);

  async function fetchUserTournaments() {
    if (!userId) return;

    try {
      const response = await apiFetch(`/api/users/me/history/tournaments?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const ids = new Set<number>(data.map((t: { tournamentId: number }) => t.tournamentId));
        setRegisteredTournamentIds(ids);
      }
    } catch (error) {
      console.error('Failed to fetch user tournaments:', error);
    }
  }

  async function fetchTournaments() {
    setIsLoading(true);
    try {
      // Check if user is authenticated
      if (!token) {
        console.log('No token available, skipping tournament fetch');
        setIsLoading(false);
        return;
      }

      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: '12',
        sort: 'createDate',
        direction: 'DESC',
      });

      // Add status filter if not 'all'
      const backendStatus = mapToBackendStatus(activeTab);
      if (backendStatus) {
        params.append('status', backendStatus);
      }

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

      // Transform backend DTOs to frontend format
      const tournaments: TournamentCardData[] = data.content.map((dto) => ({
        tournamentId: dto.id.toString(),
        name: dto.name,
        description: dto.description,
        startDate: formatTournamentDate(dto.startDate),
        endDate: formatTournamentDate(dto.endDate),
        status: mapTournamentStatus(dto.status),
        participants: dto.participantCount,
        maxParticipants: 500, // TODO: Add to backend when max participants feature is implemented
        prize: '1000 Points', // TODO: Add to backend when prize field is implemented
        isRegistered: registeredTournamentIds.has(dto.id),
      }));

      setTournamentData({
        stats: {
          tournamentsPlayed: 0, // TODO: Will be fetched from /api/users/self/tournaments
          tournamentsWon: 0,
          bestRank: 0,
          totalPoints: 0,
        },
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

  // Filter tournaments based on active tab
  const filteredTournaments = tournamentData?.tournaments.filter((tournament) => {
    if (activeTab === 'all') return true;
    return tournament.status.toLowerCase() === activeTab;
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
    // TODO: Navigate to tournament details page
    router.push(`/tournaments/${tournamentId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
        <Header
          logoSrc="/logo.png"
          exitVisible={true}
          onExit={() => router.push('/')}
          className="top-0 left-0"
        />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-slate-400">Loading...</div>
        </main>
      </div>
    );
  }

  if (!tournamentData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
        <Header
          logoSrc="/logo.png"
          exitVisible={true}
          onExit={() => router.push('/')}
          className="top-0 left-0"
        />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-slate-400">No tournament data available</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      <Header
        logoSrc="/logo.png"
        exitVisible={true}
        onExit={() => router.push('/')}
        className="top-0 left-0"
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Tournaments</h1>
          <p className="text-slate-400">Join tournaments and compete for prizes!</p>
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
            <span className="text-slate-300">
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
