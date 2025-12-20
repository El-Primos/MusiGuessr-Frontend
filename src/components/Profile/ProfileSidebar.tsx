'use client';

import { useState } from 'react';
import Image from 'next/image';
import Button from '@/components/Button';
import { EditProfileModal } from './EditProfileModal';
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
  isFriend?: boolean; // For other user's profile
  onAddFriend?: () => void;
  onRemoveFriend?: () => void;
  onProfileUpdate?: (updatedData: { name: string; avatar?: string }) => void;
}

export const ProfileSidebar = ({
  profileData,
  isOwnProfile,
  isAuthenticated,
  isFriend,
  onAddFriend,
  onRemoveFriend,
  onProfileUpdate,
}: ProfileSidebarProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profileData.name);
  const { toast, showToast, hideToast } = useToast();

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${profileData.userId}`;
    navigator.clipboard.writeText(profileUrl);
    showToast('Profile link copied!', 'success');
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imagePreview = reader.result as string;
        if (onProfileUpdate) {
          onProfileUpdate({
            name: profileData.name,
            avatar: imagePreview,
          });
        }
        showToast('Picture updated!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== profileData.name) {
      if (onProfileUpdate) {
        onProfileUpdate({
          name: editedName.trim(),
          avatar: profileData.avatar,
        });
      }
      showToast('Name updated!', 'success');
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditedName(profileData.name);
    setIsEditingName(false);
  };

  return (
    <>
      <div className="rounded-lg overflow-hidden border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-6">
        {/* Profile Picture */}
        <div className="flex justify-center mb-4 relative">
          <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-blue-900/40 flex items-center justify-center overflow-hidden relative">
            {profileData.avatar ? (
              <Image
                src={profileData.avatar}
                alt={profileData.name}
                fill
                className="object-cover rounded-full"
                unoptimized
              />
            ) : (
              <div className="text-4xl text-slate-400">
                {profileData.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {isOwnProfile && (
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center border-2 border-slate-950 transition-colors cursor-pointer" title="Change picture">
              <input
                type="file"
                accept="image/*"
                onChange={handlePictureChange}
                className="hidden"
              />
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
                className="text-2xl font-bold text-white bg-slate-800 border border-blue-900/40 rounded px-2 py-1 focus:outline-none focus:border-blue-500 text-center"
                autoFocus
              />
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white">{profileData.name}</h2>
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
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
          <p className="text-slate-400">@{profileData.userName}</p>
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
                  localStorage.removeItem('friends');
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
              ) : isFriend ? (
                <Button
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                  onClick={onRemoveFriend}
                >
                  Remove Friend
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
      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profileData={profileData}
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

