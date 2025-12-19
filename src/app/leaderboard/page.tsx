'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { SettingsButton } from '@/components/SettingsButton';
import { LeaderboardTabs } from '@/components/Leaderboard/LeaderboardTabs';
import { LeaderboardTable } from '@/components/Leaderboard/LeaderboardTable';

// Interface definition
interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
}

// Mock data - Remove when backend is ready
// Backend integration: Replace with API call
// Expected API endpoint: GET /api/leaderboard?type=global|friends
// Expected response format: LeaderboardEntry[]
const mockGlobalData: LeaderboardEntry[] = [
  { rank: 1, playerName: "nambaone", score: 123223 },
  { rank: 2, playerName: "insan2", score: 1232 },
  { rank: 3, playerName: "numerotres", score: 299 },
  { rank: 4, playerName: "player4", score: 150 },
  { rank: 5, playerName: "player5", score: 100 },
  { rank: 24, playerName: "Your name", score: 22 },
];

const mockFriendsData: LeaderboardEntry[] = [
  { rank: 1, playerName: "friend1", score: 5000 },
  { rank: 2, playerName: "friend2", score: 3000 },
  { rank: 3, playerName: "friend3", score: 2000 },
];

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');

  // TODO: Add authentication check
  // const isAuthenticated = false; // Will come from auth context/state
  // For now: Assume not authenticated (will be replaced with actual auth check)
  const isAuthenticated = false;

  // Select data based on active tab
  // TODO: Backend integration - Replace with API call using useEffect
  // Example: const [data, setData] = useState<LeaderboardEntry[]>([]);
  // useEffect(() => { fetchLeaderboard(activeTab).then(setData); }, [activeTab]);
  let currentData = activeTab === 'global' ? mockGlobalData : mockFriendsData;
  
  // Filter out "Your name" entry if user is not authenticated
  // In real implementation, backend will handle this based on auth token
  if (activeTab === 'global' && !isAuthenticated) {
    currentData = currentData.filter(entry => entry.playerName !== 'Your name');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      <Header
        logoSrc="/logo.png"
        exitVisible={true}
        onExit={() => router.push('/')}
        className="top-0 left-0"
      />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
        
        {/* Tab buttons */}
        <LeaderboardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Leaderboard Table */}
        <LeaderboardTable
          data={currentData}
          activeTab={activeTab}
          isAuthenticated={isAuthenticated}
        />
      </main>

      <SettingsButton />
    </div>
  );
}

