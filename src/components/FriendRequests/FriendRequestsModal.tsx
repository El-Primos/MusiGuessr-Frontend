'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/Toast';

interface FriendRequest {
  id: number;
  userId: number;
  userName: string;
  name: string;
  avatar?: string;
  requestedAt: string;
}

interface Friend {
  userId: number;
  userName: string;
  name: string;
  avatar?: string;
  friendSince: string;
}

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestCount?: number;
  friendCount?: number;
}

// Mock data - Replace with API call when backend is ready
const mockFriendRequests: FriendRequest[] = [
  {
    id: 1,
    userId: 2,
    userName: 'john_doe',
    name: 'John Doe',
    avatar: undefined,
    requestedAt: '2 hours ago',
  },
  {
    id: 2,
    userId: 3,
    userName: 'jane_smith',
    name: 'Jane Smith',
    avatar: undefined,
    requestedAt: '5 hours ago',
  },
  {
    id: 3,
    userId: 4,
    userName: 'music_lover',
    name: 'Music Lover',
    avatar: undefined,
    requestedAt: '1 day ago',
  },
];

const mockFriends: Friend[] = [
  {
    userId: 5,
    userName: 'alex_williams',
    name: 'Alex Williams',
    avatar: undefined,
    friendSince: '3 months ago',
  },
  {
    userId: 6,
    userName: 'sarah_jones',
    name: 'Sarah Jones',
    avatar: undefined,
    friendSince: '6 months ago',
  },
  {
    userId: 7,
    userName: 'mike_brown',
    name: 'Mike Brown',
    avatar: undefined,
    friendSince: '1 year ago',
  },
  {
    userId: 8,
    userName: 'emma_davis',
    name: 'Emma Davis',
    avatar: undefined,
    friendSince: '2 years ago',
  },
];

type TabType = 'requests' | 'friends';

export const FriendRequestsModal = ({ isOpen, onClose, requestCount = 0, friendCount = 0 }: FriendRequestsModalProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [requests, setRequests] = useState<FriendRequest[]>(mockFriendRequests);
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, isVisible: false })), 3000);
  };

  const handleAccept = (request: FriendRequest) => {
    // TODO: Backend integration - POST /api/friends/requests/:id/accept
    console.log('Accepting friend request from:', request.userName);
    
    setRequests(prev => prev.filter(r => r.id !== request.id));
    showToast(`${request.name} is now your friend!`, 'success');
  };

  const handleDeny = (request: FriendRequest) => {
    // TODO: Backend integration - POST /api/friends/requests/:id/deny
    console.log('Denying friend request from:', request.userName);
    
    setRequests(prev => prev.filter(r => r.id !== request.id));
    showToast('Friend request declined', 'info');
  };

  const handleRemoveFriend = (friend: Friend) => {
    // TODO: Backend integration - DELETE /api/friends/:userId
    console.log('Removing friend:', friend.userName);
    
    setFriends(prev => prev.filter(f => f.userId !== friend.userId));
    showToast(`${friend.name} removed from friends`, 'info');
  };

  const handleViewProfile = (userId: number) => {
    router.push(`/profile/${userId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-start justify-end"
        onClick={onClose}
      >
        <div
          className="bg-slate-900 rounded-lg border border-blue-900/60 w-full max-w-md mt-16 mr-4 shadow-xl max-h-[calc(100vh-100px)] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-900 border-b border-blue-900/40 p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Friends & Requests</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
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

          {/* Tabs */}
          <div className="flex border-b border-blue-900/40 bg-slate-900">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'requests'
                  ? 'text-blue-400 bg-slate-800/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              Friend Requests
              {requests.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {requests.length}
                </span>
              )}
              {activeTab === 'requests' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'friends'
                  ? 'text-blue-400 bg-slate-800/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              My Friends
              {friends.length > 0 && (
                <span className="ml-2 text-slate-500">
                  ({friends.length})
                </span>
              )}
              {activeTab === 'friends' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'requests' ? (
              // Friend Requests Tab
              requests.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-slate-600 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="text-slate-400 text-lg">No friend requests</p>
                  <p className="text-slate-500 text-sm mt-2">You&apos;re all caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-slate-800/50 rounded-lg p-4 border border-blue-900/30 hover:border-blue-900/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <button
                          onClick={() => handleViewProfile(request.userId)}
                          className="flex-shrink-0"
                        >
                          <div className="w-12 h-12 rounded-full bg-slate-700 border border-blue-900/40 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors">
                            {request.avatar ? (
                              <Image
                                src={request.avatar}
                                alt={request.name}
                                width={48}
                                height={48}
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <span className="text-xl text-slate-400">
                                {request.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => handleViewProfile(request.userId)}
                            className="text-left hover:underline"
                          >
                            <h3 className="text-white font-semibold truncate">
                              {request.name}
                            </h3>
                            <p className="text-slate-400 text-sm truncate">
                              @{request.userName}
                            </p>
                          </button>
                          <p className="text-slate-500 text-xs mt-1">
                            {request.requestedAt}
                          </p>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleAccept(request)}
                              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeny(request)}
                              className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold text-sm transition-colors"
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // My Friends Tab
              friends.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-slate-600 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="text-slate-400 text-lg">No friends yet</p>
                  <p className="text-slate-500 text-sm mt-2">Start adding friends to see them here!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div
                      key={friend.userId}
                      className="bg-slate-800/50 rounded-lg p-4 border border-blue-900/30 hover:border-blue-900/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <button
                          onClick={() => handleViewProfile(friend.userId)}
                          className="flex-shrink-0"
                        >
                          <div className="w-12 h-12 rounded-full bg-slate-700 border border-blue-900/40 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors">
                            {friend.avatar ? (
                              <Image
                                src={friend.avatar}
                                alt={friend.name}
                                width={48}
                                height={48}
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <span className="text-xl text-slate-400">
                                {friend.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => handleViewProfile(friend.userId)}
                            className="text-left hover:underline"
                          >
                            <h3 className="text-white font-semibold truncate">
                              {friend.name}
                            </h3>
                            <p className="text-slate-400 text-sm truncate">
                              @{friend.userName}
                            </p>
                          </button>
                          <p className="text-slate-500 text-xs mt-1">
                            Friends since {friend.friendSince}
                          </p>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleViewProfile(friend.userId)}
                              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => handleRemoveFriend(friend)}
                              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-semibold text-sm transition-colors border border-red-600/30"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Footer Note */}
          <div className="border-t border-blue-900/40 p-4 bg-slate-900">
            {activeTab === 'requests' && requests.length > 0 && (
              <p className="text-slate-500 text-xs text-center">
                {requests.length} pending request{requests.length !== 1 ? 's' : ''}
              </p>
            )}
            {activeTab === 'friends' && friends.length > 0 && (
              <p className="text-slate-500 text-xs text-center">
                {friends.length} friend{friends.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </>
  );
};
