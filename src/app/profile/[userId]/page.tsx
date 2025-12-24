'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { SettingsButton } from '@/components/SettingsButton';
import { ProfileSidebar } from '@/components/Profile/ProfileSidebar';
import { ProfileStats } from '@/components/Profile/ProfileStats';
import { GameHistory } from '@/components/Profile/GameHistory';
import { Toast } from '@/components/Toast';

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
// Expected API endpoint: GET /api/profile/:userId
// Expected response format: ProfileData
const getMockProfileData = (userId: number): ProfileData => ({
  userId,
  userName: `user${userId}`,
  name: `User ${userId}`,
  email: `user${userId}@example.com`,
  avatar: undefined,
  stats: {
    averageScore: 8500,
    totalGames: 987,
    guessAccuracy: 82,
  },
  gameHistory: [
    { gameId: '1', date: '01.01.25', mode: 'Normal', score: 198 },
    { gameId: '2', date: '31.12.24', mode: 'Tournament', score: 245 },
    { gameId: '3', date: '30.12.24', mode: 'Normal', score: 167 },
  ],
});

export default function OtherUserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.userId as string, 10);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Check authentication
  useEffect(() => {
    try {
      console.log("aaaaaa");
      const raw = localStorage.getItem('user');
      console.log(raw);
      if (raw) {
        const parsed = JSON.parse(raw);
        
        setIsAuthenticated(Boolean(parsed && parsed.id && parsed.username));
        setCurrentUserId(parsed.id);
      } else {
        setIsAuthenticated(false);
        setCurrentUserId(null);
      }
    } catch {
      setIsAuthenticated(false);
      setCurrentUserId(null);
    }
  }, []);

  // Check if viewing own profile
  useEffect(() => {
    if (currentUserId && userId === currentUserId) {
      router.push('/profile');
    }
  }, [currentUserId, userId, router]);

  // TODO: Backend integration - Replace with API call
  // useEffect(() => {
  //   fetchProfileData(userId).then(setProfileData).finally(() => setIsLoading(false));
  //   checkFriendship(userId).then(setIsFriend);
  // }, [userId]);

  useEffect(() => {
    // Mock: Simulate API call
    setTimeout(() => {
      setProfileData(getMockProfileData(userId));
      // Mock: Check if friend from localStorage
      try {
        const friendsList = localStorage.getItem('friends');
        if (friendsList) {
          const friends = JSON.parse(friendsList) as number[];
          setIsFriend(friends.includes(userId));
        } else {
          setIsFriend(false);
        }
      } catch {
        setIsFriend(false);
      }
      setIsLoading(false);
    }, 500);
  }, [userId]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, isVisible: false })), 3000);
  };

  const handleAddFriend = () => {
    // TODO: Backend integration - POST /api/friends/:userId
    console.log('Adding friend:', userId);
    
    // Mock: Save to localStorage
    try {
      const friendsList = localStorage.getItem('friends');
      const friends = friendsList ? (JSON.parse(friendsList) as number[]) : [];
      if (!friends.includes(userId)) {
        friends.push(userId);
        localStorage.setItem('friends', JSON.stringify(friends));
      }
    } catch {
      // Handle error silently
    }
    
    setIsFriend(true);
    showToast('Friend added!', 'success');
  };

  const handleRemoveFriend = () => {
    // TODO: Backend integration - DELETE /api/friends/:userId
    console.log('Removing friend:', userId);
    
    // Mock: Remove from localStorage
    try {
      const friendsList = localStorage.getItem('friends');
      if (friendsList) {
        const friends = JSON.parse(friendsList) as number[];
        const updatedFriends = friends.filter((id) => id !== userId);
        localStorage.setItem('friends', JSON.stringify(updatedFriends));
      }
    } catch {
      // Handle error silently
    }
    
    setIsFriend(false);
    showToast('Friend removed!', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('friends');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
        <Header
          logoSrc="/logo.png"
          exitVisible={true}
          onExit={() => router.push('/')}
          className="top-0 left-0"
          rightContent={
            isAuthenticated ? (
              <div className="flex items-center gap-2 mr-2 md:mr-4">
                <button
                  onClick={() => router.push("/profile")}
                  className="px-2 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 md:gap-2 transition-colors"
                  title="View My Profile"
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
                  <span className="hidden sm:inline">My Profile</span>
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
          rightContent={
            isAuthenticated ? (
              <div className="flex items-center gap-2 mr-2 md:mr-4">
                <button
                  onClick={() => router.push("/profile")}
                  className="px-2 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 md:gap-2 transition-colors"
                  title="View My Profile"
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
                  <span className="hidden sm:inline">My Profile</span>
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
        rightContent={
          isAuthenticated ? (
            <div className="flex items-center gap-2 mr-2 md:mr-4">
              <button
                onClick={() => router.push("/profile")}
                className="px-2 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 md:gap-2 transition-colors"
                title="View My Profile"
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
                <span className="hidden sm:inline">My Profile</span>
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Left Panel - Profile Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <ProfileSidebar
              profileData={profileData}
              isOwnProfile={false}
              isAuthenticated={isAuthenticated}
              isFriend={isFriend}
              onAddFriend={handleAddFriend}
              onRemoveFriend={handleRemoveFriend}
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

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}

