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

// Mock data - Remove when backend is ready
// Backend integration: Replace with API call
// Expected API endpoint: GET /api/tournaments
// Expected response format: TournamentData
const mockTournamentData: TournamentData = {
  stats: {
    tournamentsPlayed: 42,
    tournamentsWon: 8,
    bestRank: 1,
    totalPoints: 15420,
  },
  tournaments: [
    {
      tournamentId: '1',
      name: 'Winter Championship 2025',
      description: 'Compete for the ultimate winter music champion title!',
      startDate: '25.12.24',
      endDate: '05.01.25',
      status: 'Active',
      participants: 456,
      maxParticipants: 500,
      prize: '1000 Points',
      isRegistered: true,
    },
    {
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
    },
    {
      tournamentId: '3',
      name: 'Holiday Classics',
      description: 'Test your knowledge of holiday music!',
      startDate: '15.12.24',
      endDate: '24.12.24',
      status: 'Completed',
      participants: 500,
      maxParticipants: 500,
      prize: '750 Points',
      isRegistered: true,
    },
    {
      tournamentId: '4',
      name: 'Spring Preview Tournament',
      description: 'Get ready for spring with this preview tournament.',
      startDate: '15.01.25',
      endDate: '22.01.25',
      status: 'Upcoming',
      participants: 89,
      maxParticipants: 300,
      prize: '400 Points',
      isRegistered: false,
    },
  ],
};

export default function TournamentsPage() {
  const router = useRouter();
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');
  const { toast, showToast, hideToast } = useToast();

  // TODO: Backend integration - Replace with API call
  // useEffect(() => {
  //   fetchTournamentData().then(setTournamentData).finally(() => setIsLoading(false));
  // }, []);

  useEffect(() => {
    // Mock: Simulate API call
    setTimeout(() => {
      setTournamentData(mockTournamentData);
      setIsLoading(false);
    }, 500);
  }, []);

  // Filter tournaments based on active tab
  const filteredTournaments = tournamentData?.tournaments.filter((tournament) => {
    if (activeTab === 'all') return true;
    return tournament.status.toLowerCase() === activeTab;
  }) || [];

  // Handle joining a tournament
  const handleJoinTournament = (tournamentId: string) => {
    // TODO: Backend integration - Call API to join tournament
    // Expected API endpoint: POST /api/tournaments/:tournamentId/join
    showToast('Successfully joined tournament!', 'success');
    
    // Update local state to reflect registration
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
  };

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
