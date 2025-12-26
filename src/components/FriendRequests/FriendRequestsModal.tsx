'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/Toast';
import { getIncomingRequests, getFriends, acceptRequest, discardRequest, markInboxSeen, removeFriend } from '@/services/friendsService';

interface FriendRequest {
  requesterId: number;
  requesterUsername: string;
  pending: boolean;
  accepted: boolean;
}

interface Friend {
  userId: number;
  username: string;
}

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestCount?: number;
  friendCount?: number;
  apiFetch?: (path: string, init?: RequestInit) => Promise<Response>;
}

type TabType = 'requests' | 'friends';

export const FriendRequestsModal = ({ isOpen, onClose, apiFetch }: FriendRequestsModalProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const loadData = useCallback(async () => {
    if (!apiFetch) return;

    setIsLoading(true);
    try {
      const [incomingRequests, friendsList] = await Promise.all([
        getIncomingRequests(apiFetch).catch(() => []),
        getFriends(apiFetch).catch(() => []),
      ]);

      setRequests(incomingRequests);
      setFriends(friendsList);
    } catch (err) {
      console.error('Failed to load friends data:', err);
      showToast('Failed to load friends data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && apiFetch) {
      loadData();
      // Mark inbox as seen when opening
      markInboxSeen(apiFetch).catch(err => console.error('Failed to mark inbox as seen:', err));
    }
  }, [isOpen, apiFetch, loadData]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, isVisible: false })), 3000);
  };

  const handleAccept = async (request: FriendRequest) => {
    if (!apiFetch) {
      showToast('API not available', 'error');
      return;
    }

    try {
      await acceptRequest(request.requesterId, apiFetch);
      setRequests(prev => prev.filter(r => r.requesterId !== request.requesterId));
      // Reload friends list to include the new friend
      const friendsList = await getFriends(apiFetch);
      setFriends(friendsList);
      showToast(`${request.requesterUsername} is now your friend!`, 'success');
    } catch (err) {
      console.error('Failed to accept request:', err);
      showToast(err instanceof Error ? err.message : 'Failed to accept request', 'error');
    }
  };

  const handleDeny = async (request: FriendRequest) => {
    if (!apiFetch) {
      showToast('API not available', 'error');
      return;
    }

    try {
      await discardRequest(request.requesterId, apiFetch);
      setRequests(prev => prev.filter(r => r.requesterId !== request.requesterId));
      showToast('Friend request declined', 'info');
    } catch (err) {
      console.error('Failed to discard request:', err);
      showToast(err instanceof Error ? err.message : 'Failed to decline request', 'error');
    }
  };

  const handleRemoveFriend = async (friend: Friend) => {
    if (!apiFetch) {
      showToast('API not available', 'error');
      return;
    }

    try {
      await removeFriend(friend.userId, apiFetch);
      setFriends(prev => prev.filter(f => f.userId !== friend.userId));
      showToast(`${friend.username} removed from friends`, 'success');
    } catch (err) {
      console.error('Failed to remove friend:', err);
      showToast(err instanceof Error ? err.message : 'Failed to remove friend', 'error');
    }
  };

  const handleViewProfile = (userId: number) => {
    router.push(`/profile/${userId}`);
    onClose();
  };

  const getDisplayName = (username: string): string => {
    // Backend only provides username, use it as display name
    return username;
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
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                      <p className="text-slate-400 text-sm mt-2">Loading requests...</p>
                    </div>
                  ) : (
                    requests.map((request) => (
                      <div
                        key={request.requesterId}
                        className="bg-slate-800/50 rounded-lg p-4 border border-blue-900/30 hover:border-blue-900/60 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <button
                            onClick={() => handleViewProfile(request.requesterId)}
                            className="flex-shrink-0"
                          >
                            <div className="w-12 h-12 rounded-full bg-slate-700 border border-blue-900/40 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors">
                              <span className="text-xl text-slate-400">
                                {getDisplayName(request.requesterUsername).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </button>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => handleViewProfile(request.requesterId)}
                              className="text-left hover:underline"
                            >
                              <h3 className="text-white font-semibold truncate">
                                {getDisplayName(request.requesterUsername)}
                              </h3>
                              <p className="text-slate-400 text-sm truncate">
                                @{request.requesterUsername}
                              </p>
                            </button>

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
                    ))
                  )}
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
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                      <p className="text-slate-400 text-sm mt-2">Loading friends...</p>
                    </div>
                  ) : (
                    friends.map((friend) => (
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
                              <span className="text-xl text-slate-400">
                                {getDisplayName(friend.username).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </button>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => handleViewProfile(friend.userId)}
                              className="text-left hover:underline"
                            >
                              <h3 className="text-white font-semibold truncate">
                                {getDisplayName(friend.username)}
                              </h3>
                              <p className="text-slate-400 text-sm truncate">
                                @{friend.username}
                              </p>
                            </button>

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
                    ))
                  )}
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
