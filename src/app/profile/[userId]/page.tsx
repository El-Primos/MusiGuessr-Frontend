'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { SettingsButton } from '@/components/SettingsButton';
import { FriendRequestsButton } from '@/components/FriendRequests/FriendRequestsButton';
import { ProfileSidebar } from '@/components/Profile/ProfileSidebar';
import { ProfileStats } from '@/components/Profile/ProfileStats';
import { GameHistory } from '@/components/Profile/GameHistory';
import { Toast } from '@/components/Toast';
import { useApi } from '@/lib/useApi';
import { fetchUserProfile, ProfileData } from '@/services/profileService';
import { addFriend, removeFriend, checkFriendship } from '@/services/friendsService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function OtherUserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.userId as string, 10);
  const { apiFetch, token } = useApi(API_BASE);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        const hasToken = Boolean(token);
        // Support both userId/userName and id/username formats
        const userId = parsed.userId || parsed.id;
        const userName = parsed.userName || parsed.username;
        const hasUserData = Boolean(userId && userName);
        setIsAuthenticated(hasToken && hasUserData);
        setCurrentUserId(userId);
      } else {
        setIsAuthenticated(false);
        setCurrentUserId(null);
      }
    } catch {
      setIsAuthenticated(false);
      setCurrentUserId(null);
    }
  }, [token]);

  // Check if viewing own profile
  useEffect(() => {
    if (currentUserId && userId === currentUserId) {
      router.push('/profile');
    }
  }, [currentUserId, userId, router]);

  // Load user profile and friendship status
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch user profile
        const data = await fetchUserProfile(userId, apiFetch);
        setProfileData(data);
        
        // Check friendship status if authenticated
        if (isAuthenticated) {
          try {
            const { isFriend: friendStatus } = await checkFriendship(userId, apiFetch);
            setIsFriend(friendStatus);
          } catch (err) {
            console.error('Failed to check friendship:', err);
            // Non-critical error, continue without friendship status
          }
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        showToast('Failed to load profile. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [userId, apiFetch, isAuthenticated]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, isVisible: false })), 3000);
  };

  const handleAddFriend = async () => {
    try {
      await addFriend(userId, apiFetch);
      setIsFriend(true);
      showToast('Friend added!', 'success');
    } catch (err) {
      console.error('Failed to add friend:', err);
      showToast(
        err instanceof Error ? err.message : 'Failed to add friend',
        'error'
      );
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await removeFriend(userId, apiFetch);
      setIsFriend(false);
      showToast('Friend removed!', 'success');
    } catch (err) {
      console.error('Failed to remove friend:', err);
      showToast(
        err instanceof Error ? err.message : 'Failed to remove friend',
        'error'
      );
    }
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
                  <span className="hidden sm:inline">Profile</span>
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
                  <span className="hidden sm:inline">Profile</span>
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
              <FriendRequestsButton apiFetch={apiFetch} variant="inline" />
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
                <span className="hidden sm:inline">Profile</span>
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
              apiFetch={apiFetch}
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

