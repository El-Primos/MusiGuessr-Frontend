'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { SettingsButton } from '@/components/SettingsButton';
import { ProfileSidebar } from '@/components/Profile/ProfileSidebar';
import { ProfileStats } from '@/components/Profile/ProfileStats';
import { GameHistory } from '@/components/Profile/GameHistory';

// Interface definitions
interface ProfileData {
  userId: number;
  userName: string;
  name: string;
  email: string;
  avatar?: string;
  stats: {
    averageScore: number;
    totalGames: number;
    guessAccuracy: number; // percentage
  };
  gameHistory: {
    gameId: string;
    date: string; // "01.01.25"
    mode: 'Normal' | 'Tournament';
    score: number;
  }[];
}

// Mock data - Remove when backend is ready
// Backend integration: Replace with API call
// Expected API endpoint: GET /api/profile/me
// Expected response format: ProfileData
const mockProfileData: ProfileData = {
  userId: 1,
  userName: 'username',
  name: 'Name',
  email: 'user@example.com',
  avatar: undefined, // Will use default avatar
  stats: {
    averageScore: 9999,
    totalGames: 1245,
    guessAccuracy: 87,
  },
  gameHistory: [
    { gameId: '1', date: '01.01.25', mode: 'Normal', score: 213 },
    { gameId: '2', date: '01.01.25', mode: 'Tournament', score: 251 },
    { gameId: '3', date: '31.12.24', mode: 'Normal', score: 198 },
    { gameId: '4', date: '30.12.24', mode: 'Tournament', score: 312 },
  ],
};

export default function ProfilePage() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Backend integration - Replace with API call
  // useEffect(() => {
  //   fetchProfileData().then(setProfileData).finally(() => setIsLoading(false));
  // }, []);

  useEffect(() => {
    // Mock: Simulate API call
    setTimeout(() => {
      setProfileData(mockProfileData);
      setIsLoading(false);
    }, 500);
  }, []);

  // Check if user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        setIsAuthenticated(Boolean(parsed && parsed.id && parsed.username));
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  // Redirect to login if not authenticated (after loading)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth?mode=login');
      return;
    }
  }, [isLoading, isAuthenticated, router]);

  // Don't render if not authenticated (will redirect)
  if (!isLoading && !isAuthenticated) {
    return null;
  }

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

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
        <Header
          logoSrc="/logo.png"
          exitVisible={true}
          onExit={() => router.push('/')}
          className="top-0 left-0"
        />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-slate-400">Profile not found</div>
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
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Left Panel - Profile Sidebar */}
                <div className="w-full lg:w-80 flex-shrink-0">
                  <ProfileSidebar
                    profileData={profileData}
                    isOwnProfile={true}
                    isAuthenticated={isAuthenticated}
                    onProfileUpdate={(updatedData) => {
                      if (profileData) {
                        setProfileData({
                          ...profileData,
                          name: updatedData.name,
                          avatar: updatedData.avatar,
                        });
                      }
                    }}
                  />
                </div>

          {/* Right Panel - Statistics and Game History */}
          <div className="flex-1">
            <div className="space-y-6">
              {/* Statistics */}
              <ProfileStats stats={profileData.stats} />

              {/* Game History */}
              <GameHistory gameHistory={profileData.gameHistory} />
            </div>
          </div>
        </div>
      </main>

      <SettingsButton />
    </div>
  );
}

