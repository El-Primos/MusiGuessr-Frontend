'use client';

import { useState, useEffect } from 'react';
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
  const [hasUser, setHasUser] = useState<boolean>(false);

  // Check authentication
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return setHasUser(false);
      const parsed = JSON.parse(raw);
      setHasUser(Boolean(parsed && parsed.userId && parsed.userName));
    } catch {
      setHasUser(false);
    }
  }, []);

  // TODO: Add authentication check
  // const isAuthenticated = false; // Will come from auth context/state
  // For now: Use hasUser for authentication check
  const isAuthenticated = hasUser;

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('friends');
    setHasUser(false);
    router.push('/');
  };

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
        rightContent={
          hasUser ? (
            <div className="flex items-center gap-2 mr-2 md:mr-4">
              <button
                onClick={() => router.push("/profile")}
                className="px-2 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 md:gap-2 transition-colors"
                title="View Profile"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-2 md:px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-1 transition-colors"
                title="Logout"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          ) : null
        }
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

