'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from '@/components/Button';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/Toast';
import { updateProfile, uploadProfileImage } from '@/services/profileService';

interface ProfileData {
  userId: number;
  userName: string;
  name: string;
  email: string;
  avatar?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData;
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onSave?: (updatedData: { name: string; avatar?: string }) => void;
}

export const EditProfileModal = ({ isOpen, onClose, profileData, apiFetch, onSave }: EditProfileModalProps) => {
  const [name, setName] = useState(profileData.name);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(profileData.avatar || null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName(profileData.name);
      setPassword('');
      setConfirmPassword('');
      setSelectedImage(null);
      setImagePreview(profileData.avatar || null);
    }
  }, [isOpen, profileData]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validate password if provided
    if (password && password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password && password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let newAvatarUrl: string | undefined = profileData.avatar;
      
      // Upload image if selected
      if (selectedImage) {
        try {
          const uploadResult = await uploadProfileImage(selectedImage, apiFetch);
          newAvatarUrl = uploadResult.avatarUrl;
        } catch (err) {
          console.error('Failed to upload image:', err);
          showToast('Failed to upload profile picture', 'error');
          // Continue with other updates even if image upload fails
        }
      }
      
      // Update profile data
      const updateData: { name?: string; password?: string } = {};
      if (name !== profileData.name) {
        updateData.name = name;
      }
      if (password) {
        updateData.password = password;
      }
      
      if (Object.keys(updateData).length > 0 || selectedImage) {
        await updateProfile(updateData, apiFetch);
      }
      
      // Update parent component with new data
      if (onSave) {
        onSave({
          name,
          avatar: newAvatarUrl,
        });
      }
      
      showToast('Profile updated successfully!', 'success');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      showToast(
        err instanceof Error ? err.message : 'Failed to update profile',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg border border-blue-900/60 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col lg:flex-row">
          {/* Left Panel - Display */}
          <div className="lg:w-80 p-6 border-b lg:border-b-0 lg:border-r border-blue-900/40 bg-slate-950/50">
            <div className="flex flex-col items-center">
              {/* Profile Picture */}
              <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-blue-900/40 flex items-center justify-center overflow-hidden mb-4 relative">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt={profileData.name}
                    fill
                    className="object-cover rounded-full"
                    unoptimized
                  />
                ) : (
                  <div className="text-4xl text-slate-400">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <h3 className="text-xl font-bold text-white mb-1">{name}</h3>

              {/* Username */}
              <p className="text-slate-400">@{profileData.userName}</p>
            </div>
          </div>

          {/* Right Panel - Edit Form */}
          <div className="flex-1 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-2">
                  Name:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter name"
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                      input?.focus();
                    }}
                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
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
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-2">
                  Password:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter new password"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-2">
                  Confirm:
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Confirm new password"
                />
              </div>

              {/* Picture */}
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-2">
                  Picture:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="picture-upload"
                  />
                  <Button
                    className="px-4 py-2 bg-slate-800 border border-blue-900/40 text-white rounded-lg font-semibold hover:bg-slate-700"
                    onClick={() => {
                      document.getElementById('picture-upload')?.click();
                    }}
                  >
                    Select Image
                  </Button>
                  <button
                    onClick={() => {
                      document.getElementById('picture-upload')?.click();
                    }}
                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                    title="Edit picture"
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
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <Button
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

