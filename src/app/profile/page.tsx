'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { SettingsButton } from '@/components/SettingsButton';
import { FriendRequestsButton } from '@/components/FriendRequests/FriendRequestsButton';
import { ProfileSidebar } from '@/components/Profile/ProfileSidebar';
import { ProfileStats } from '@/components/Profile/ProfileStats';
import { GameHistory } from '@/components/Profile/GameHistory';
import { useApi } from '@/lib/useApi';
import { fetchOwnProfile, fetchUserGameHistory, ProfileData } from '@/services/profileService';
import { Toast } from '@/components/Toast';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function ProfilePage() {
  const router = useRouter();
  const { apiFetch } = useApi(API_BASE);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, isVisible: false })), 3000);
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Check if user is authenticated
        const raw = localStorage.getItem('user');
        console.log('Raw user data from localStorage:', raw);
        
        if (!raw) {
          console.log('No user data found, redirecting to login');
          router.push('/auth?mode=login');
          return;
        }

        const parsed = JSON.parse(raw);
        console.log('Parsed user data:', parsed);
        
        const userId = parsed?.userId || parsed?.id;
        const userName = parsed?.username || parsed?.userName;
        
        console.log('Extracted userId:', userId, 'userName:', userName);
        
        const authenticated = Boolean(userId && userName);
        setIsAuthenticated(authenticated);
        
        if (!authenticated) {
          console.log('User not authenticated (missing userId or userName), redirecting to login');
          router.push('/auth?mode=login');
          return;
        }

        console.log('User authenticated, fetching profile for userId:', userId);

        // Fetch profile data from API
        setIsLoading(true);
        setError(null);
        
        const data = await fetchOwnProfile(userId, apiFetch);
        console.log('Profile data fetched:', data);
        setProfileData(data);
        
        // Optionally fetch game history
        try {
          const history = await fetchUserGameHistory(userId, apiFetch);
          setProfileData(prev => prev ? { ...prev, gameHistory: history } : prev);
        } catch (err) {
          console.error('Failed to load game history:', err);
          // Non-critical, continue without game history
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        
        // Only redirect to login if it's an authentication error
        // Don't remove token immediately - let user try again
        if (err instanceof Error && (err.message.includes('401') || err.message.includes('Unauthorized'))) {
          console.log('Unauthorized error detected');
          showToast('Authentication failed. Please login again.', 'error');
          // Wait a bit before removing token and redirecting
          setTimeout(() => {
            localStorage.removeItem('user');
            router.push('/auth?mode=login');
          }, 2000);
        } else {
          // For other errors, just show the error but stay on the page
          showToast('Failed to load profile. Please try again.', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [router, apiFetch]);

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

  if (error && !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
        <Header
          logoSrc="/logo.png"
          exitVisible={true}
          onExit={() => router.push('/')}
          className="top-0 left-0"
        />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
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
        rightContent={
          isAuthenticated ? (
            <div className="flex items-center gap-2 mr-2 md:mr-4">
              <FriendRequestsButton apiFetch={apiFetch} variant="inline" />
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
              isOwnProfile={true}
              isAuthenticated={isAuthenticated}
              apiFetch={apiFetch}
              onProfileUpdate={async (updatedData) => {
                if (profileData) {
                  console.log('Updating profile data:', updatedData);
                  
                  // If avatar was updated, refresh profile data from backend to get the latest URL
                  if (updatedData.avatar && updatedData.avatar !== profileData.avatar) {
                    try {
                      const raw = localStorage.getItem('user');
                      if (raw) {
                        const parsed = JSON.parse(raw);
                        const userId = parsed?.userId || parsed?.id;
                        if (userId) {
                          // Wait a bit for backend to process
                          await new Promise(resolve => setTimeout(resolve, 500));
                          
                          const refreshedData = await fetchOwnProfile(userId, apiFetch);
                          console.log('Refreshed profile data:', refreshedData);
                          console.log('Refreshed avatar URL:', refreshedData.avatar);
                          
                          // Update with refreshed data
                          setProfileData(prev => ({
                            ...refreshedData,
                            gameHistory: prev?.gameHistory || [], // Keep existing game history
                            avatar: refreshedData.avatar || updatedData.avatar, // Use refreshed avatar
                          }));
                          console.log('Profile data state updated with avatar:', refreshedData.avatar);
                        }
                      }
                    } catch (err) {
                      console.error('Failed to refresh profile:', err);
                      // Fallback to immediate update
                      setProfileData({
                        ...profileData,
                        name: updatedData.name,
                        avatar: updatedData.avatar,
                      });
                    }
                  } else {
                    // Just update name, no avatar change
                    setProfileData({
                      ...profileData,
                      name: updatedData.name,
                      avatar: updatedData.avatar || profileData.avatar,
                    });
                  }
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
              <GameHistory gameHistory={profileData.gameHistory} apiFetch={apiFetch} />
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

