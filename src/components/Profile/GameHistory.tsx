'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/Toast';
import { shareGameHistory, deletePost, getMyPosts, type PostShareResponse } from '@/services/postService';
import { type GameHistoryEntry } from '@/services/profileService';

interface GameHistoryProps {
  gameHistory: GameHistoryEntry[];
  apiFetch?: (path: string, init?: RequestInit) => Promise<Response>;
}

export const GameHistory = ({ gameHistory, apiFetch }: GameHistoryProps) => {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [posts, setPosts] = useState<PostShareResponse[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Map gameHistoryId to postId
  const getPostIdForGameHistory = (gameHistoryId: number): number | null => {
    const post = posts.find(p => p.gameHistoryId === gameHistoryId);
    return post ? post.postId : null;
  };

  // Check if a game history is posted
  const isPosted = (gameHistoryId: number): boolean => {
    return getPostIdForGameHistory(gameHistoryId) !== null;
  };

  // Load user's posts on mount
  useEffect(() => {
    if (!apiFetch) {
      setIsLoading(false);
      return;
    }

    const loadPosts = async () => {
      try {
        const userPosts = await getMyPosts(apiFetch);
        setPosts(userPosts);
      } catch (err) {
        console.error('Failed to load posts:', err);
        // Non-critical, continue without posts
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [apiFetch]);

  const handlePost = async (gameHistoryId: number) => {
    if (!apiFetch) {
      showToast('API not available', 'error');
      return;
    }

    setLoadingPosts(prev => ({ ...prev, [gameHistoryId]: true }));
    try {
      const postResponse = await shareGameHistory(gameHistoryId, apiFetch);
      setPosts(prev => [...prev, postResponse]);
      showToast('Game posted successfully!', 'success');
    } catch (err) {
      console.error('Failed to post game:', err);
      showToast(err instanceof Error ? err.message : 'Failed to post game', 'error');
    } finally {
      setLoadingPosts(prev => ({ ...prev, [gameHistoryId]: false }));
    }
  };

  const handleUnpost = async (gameHistoryId: number) => {
    if (!apiFetch) {
      showToast('API not available', 'error');
      return;
    }

    const postId = getPostIdForGameHistory(gameHistoryId);
    if (!postId) {
      showToast('Post not found', 'error');
      return;
    }

    setLoadingPosts(prev => ({ ...prev, [gameHistoryId]: true }));
    try {
      await deletePost(postId, apiFetch);
      setPosts(prev => prev.filter(p => p.postId !== postId));
      showToast('Post removed successfully!', 'success');
    } catch (err) {
      console.error('Failed to unpost:', err);
      showToast(err instanceof Error ? err.message : 'Failed to remove post', 'error');
    } finally {
      setLoadingPosts(prev => ({ ...prev, [gameHistoryId]: false }));
    }
  };

  const handleShare = (gameHistoryId: number) => {
    const postId = getPostIdForGameHistory(gameHistoryId);
    if (!postId) {
      showToast('Post not found', 'error');
      return;
    }

    const shareUrl = `${window.location.origin}/share/game/${postId}`;
    navigator.clipboard.writeText(shareUrl);
    showToast('Share link copied!', 'success');
  };

  if (gameHistory.length === 0) {
    return (
      <div className="rounded-lg overflow-hidden border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
        <div className="bg-slate-950 px-4 py-3 border-b border-blue-900/40">
          <h3 className="text-xl font-bold text-white">Game History</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-slate-400 text-sm">No games played yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
      {/* Header */}
      <div className="bg-slate-950 px-4 py-3 border-b border-blue-900/40">
        <h3 className="text-xl font-bold text-white">Game History</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-900/50 border-b border-blue-900/40">
              <th className="px-4 py-3 text-left text-sm font-semibold text-blue-200">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-blue-200">Mode</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-blue-200">Score</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-blue-200">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-blue-900/40">
            {gameHistory.map((game) => {
              const posted = isPosted(game.gameHistoryId);
              const isLoading = loadingPosts[game.gameHistoryId] || false;

              return (
                <tr
                  key={game.gameHistoryId}
                  className="hover:bg-blue-900/20 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-white">{game.date}</td>
                  <td className="px-4 py-3 text-sm text-blue-200">{game.mode}</td>
                  <td className="px-4 py-3 text-sm text-white font-semibold">
                    {game.score.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {!posted ? (
                        <Button
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-semibold disabled:opacity-50"
                          onClick={() => handlePost(game.gameHistoryId)}
                          disabled={isLoading || !apiFetch}
                        >
                          {isLoading ? 'Posting...' : 'Post'}
                        </Button>
                      ) : (
                        <>
                          <Button
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-semibold"
                            onClick={() => handleShare(game.gameHistoryId)}
                          >
                            Share
                          </Button>
                          <Button
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg font-semibold disabled:opacity-50"
                            onClick={() => handleUnpost(game.gameHistoryId)}
                            disabled={isLoading || !apiFetch}
                          >
                            {isLoading ? 'Removing...' : 'Unpost'}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

