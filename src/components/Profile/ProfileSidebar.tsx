'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/Button';
import { EditProfileModal } from './EditProfileModal';
import Image from 'next/image';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/Toast';

interface ProfileData {
  userId: number;
  userName: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ProfileSidebarProps {
  profileData: ProfileData;
  isOwnProfile: boolean;
  isAuthenticated: boolean;
  apiFetch?: (path: string, init?: RequestInit) => Promise<Response>;
  friendshipStatus?: 'none' | 'pending' | 'friend'; // For other user's profile
  onAddFriend?: () => void;
  onRemoveFriend?: () => void;
  onCancelRequest?: () => void;
  onProfileUpdate?: (updatedData: { name: string; avatar?: string }) => void;
}

export const ProfileSidebar = ({
  profileData,
  isOwnProfile,
  isAuthenticated,
  apiFetch,
  friendshipStatus = 'none',
  onAddFriend,
  onRemoveFriend,
  onCancelRequest,
  onProfileUpdate,
}: ProfileSidebarProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profileData.name);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  // Update editedName when profileData.name changes
  useEffect(() => {
    if (!isEditingName) {
      setEditedName(profileData.name);
    }
  }, [profileData.name, isEditingName]);

  // Debug: Log avatar changes
  useEffect(() => {
    console.log('ProfileSidebar - profileData.avatar changed:', profileData.avatar);
  }, [profileData.avatar]);

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${profileData.userId}`;
    navigator.clipboard.writeText(profileUrl);
    showToast('Profile link copied!', 'success');
  };

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showToast('Image size must be less than 5MB', 'error');
      return;
    }

    if (!apiFetch) {
      showToast('API not available', 'error');
      return;
    }

    setIsUploadingPicture(true);
    try {
      showToast('Uploading profile picture...', 'info');
      
      const { uploadProfileImage } = await import('@/services/profileService');
      const updatedUser = await uploadProfileImage(file, apiFetch);

      console.log('Updated user from backend:', updatedUser);
      console.log('Profile picture URL:', updatedUser.profilePictureUrl);

      // Update local state with the new profile picture URL
      if (onProfileUpdate) {
        onProfileUpdate({
          name: profileData.name,
          avatar: updatedUser.profilePictureUrl || profileData.avatar,
        });
      }

      showToast('Profile picture updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
      showToast(
        err instanceof Error ? err.message : 'Failed to upload profile picture',
        'error'
      );
    } finally {
      setIsUploadingPicture(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleNameSave = async () => {
    if (!editedName.trim() || editedName.trim() === profileData.name) {
      setIsEditingName(false);
      return;
    }

    if (!apiFetch) {
      showToast('API not available', 'error');
      return;
    }

    try {
      const { updateProfile } = await import('@/services/profileService');
      const updatedUser = await updateProfile(
        { name: editedName.trim() },
        apiFetch
      );

      // Update local state
      if (onProfileUpdate) {
        onProfileUpdate({
          name: updatedUser.name,
          avatar: updatedUser.profilePictureUrl || profileData.avatar,
        });
      }

      showToast('Name updated successfully!', 'success');
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to update name:', err);
      showToast(
        err instanceof Error ? err.message : 'Failed to update name',
        'error'
      );
      // Revert to original name on error
      setEditedName(profileData.name);
    }
  };

  const handleNameCancel = () => {
    setEditedName(profileData.name);
    setIsEditingName(false);
  };

  return (
    <>
      <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-blue-900/60 bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 p-6 shadow-sm">
        {/* Profile Picture */}
        <div className="flex justify-center mb-4 relative">
          <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-blue-900/40 flex items-center justify-center overflow-hidden relative">
            {profileData.avatar ? (
              <Image
                key={profileData.avatar} // Force re-render when avatar URL changes
                src={`${profileData.avatar}?t=${Date.now()}`} // Add timestamp to bypass cache
                alt={profileData.name}
                className="absolute inset-0 w-full h-full object-cover rounded-full"
                onError={(e) => {
                  console.error('Failed to load image:', profileData.avatar);
                  console.error('Error event:', e);
                  // Try loading without timestamp
                  const img = e.currentTarget;
                  if (!img.src.includes('?t=')) {
                    // Already tried without timestamp, show error state
                    img.style.opacity = '0.5';
                  } else {
                    // Try without timestamp
                    img.src = profileData.avatar;
                  }
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', profileData.avatar);
                }}
              />
            ) : (
              <div className="text-4xl text-slate-500 dark:text-slate-400">
                {profileData.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {isOwnProfile && (
            <label 
              className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-950 transition-colors ${
                isUploadingPicture 
                  ? 'bg-slate-600 cursor-not-allowed opacity-50' 
                  : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              }`} 
              title={isUploadingPicture ? 'Uploading...' : 'Change picture'}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handlePictureChange}
                disabled={isUploadingPicture}
                className="hidden"
              />
              {isUploadingPicture ? (
                <svg
                  className="w-4 h-4 text-white animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </label>
          )}
        </div>

        {/* Name */}
        <div className="text-center mb-2 flex items-center justify-center gap-2">
          {isOwnProfile && isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNameSave();
                  } else if (e.key === 'Escape') {
                    handleNameCancel();
                  }
                }}
                className="text-2xl font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-blue-900/40 rounded px-2 py-1 focus:outline-none focus:border-blue-500 text-center"
                autoFocus
              />
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{profileData.name}</h2>
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  title="Edit name"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>

        {/* Username */}
        <div className="text-center mb-6">
          <p className="text-slate-500 dark:text-slate-400">@{profileData.userName}</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {isOwnProfile ? (
            <>
              <Button
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                onClick={handleShareProfile}
              >
                Share Profile
              </Button>
              <Button
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Profile
              </Button>
              <Button
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                onClick={() => {
                  localStorage.removeItem('user');
                  window.location.href = '/';
                }}
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
                Logout
              </Button>
            </>
          ) : (
            <>
              {!isAuthenticated ? (
                <Button
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  onClick={() => {
                    // TODO: Navigate to login
                    window.location.href = '/auth?mode=login';
                  }}
                >
                  Login to add friend
                </Button>
              ) : friendshipStatus === 'friend' ? (
                <Button
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                  onClick={onRemoveFriend}
                >
                  Remove Friend
                </Button>
              ) : friendshipStatus === 'pending' ? (
                <Button
                  className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold"
                  onClick={onCancelRequest}
                >
                  Cancel Request
                </Button>
              ) : (
                <Button
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  onClick={onAddFriend}
                >
                  Add Friend
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && apiFetch && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profileData={profileData}
          apiFetch={apiFetch}
          onSave={onProfileUpdate}
        />
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
};

