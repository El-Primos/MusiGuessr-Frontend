'use client';

import { useState } from 'react';
import { FriendRequestsModal } from './FriendRequestsModal';

interface FriendRequestsButtonProps {
  requestCount?: number;
  friendCount?: number;
}

export const FriendRequestsButton = ({ requestCount = 0, friendCount = 0 }: FriendRequestsButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed top-4 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 flex items-center gap-2"
        title="Friends & Requests"
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {requestCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {requestCount > 9 ? '9+' : requestCount}
          </span>
        )}
      </button>

      <FriendRequestsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        requestCount={requestCount}
        friendCount={friendCount}
      />
    </>
  );
};
