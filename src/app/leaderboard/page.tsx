'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { SettingsButton } from '@/components/SettingsButton';
import { LeaderboardTabs } from '@/components/Leaderboard/LeaderboardTabs';
import { LeaderboardTable } from '@/components/Leaderboard/LeaderboardTable';
import { useApi } from '@/lib/useApi';
import { fetchGlobalLeaderboard, fetchFriendsLeaderboard, type LeaderboardEntry, type LeaderboardPeriod } from '@/services/leaderboardService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function LeaderboardPage() {
  const router = useRouter();
  const { apiFetch } = useApi(API_BASE);
  
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [hasUser, setHasUser] = useState<boolean>(false);
  
  // Period is fixed to 'all' for now
  const period: LeaderboardPeriod = 'all';

  // Check authentication and get current user ID
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) {
        setHasUser(false);
        setCurrentUserId(null);
        return;
      }
      const parsed = JSON.parse(raw);
      const userId = parsed?.id || parsed?.userId;
      const userName = parsed?.username || parsed?.userName;
      const authenticated = Boolean(userId && userName);
      setHasUser(authenticated);
      setCurrentUserId(userId || null);
    } catch {
      setHasUser(false);
      setCurrentUserId(null);
    }
  }, []);

  const isAuthenticated = hasUser;

  // Fetch leaderboard data (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setData([]);
      return;
    }

    const loadLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        let result: LeaderboardEntry[];
        
        if (activeTab === 'global') {
          result = await fetchGlobalLeaderboard(period, 100, apiFetch);
        } else {
          // Friends leaderboard - backend endpoint not ready yet
          result = await fetchFriendsLeaderboard(period, 100, apiFetch);
        }

        setData(result);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [activeTab, apiFetch, isAuthenticated, period]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('friends');
    setHasUser(false);
    setCurrentUserId(null);
    router.push('/');
  };

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

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-4"></div>
            <p className="text-slate-400 text-sm">Loading leaderboard...</p>
          </div>
        ) : (
          /* Leaderboard Table */
          <LeaderboardTable
            data={data}
            activeTab={activeTab}
            isAuthenticated={isAuthenticated}
            currentUserId={currentUserId}
          />
        )}
      </main>

      <SettingsButton />
    </div>
  );
}

