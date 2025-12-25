/**
 * Post Service
 * Handles all post-related API calls
 */

export interface PostShareRequest {
  gameHistoryId: number;
}

export interface PostShareResponse {
  postId: number;
  userId: number;
  gameHistoryId: number;
  gameScore: number;
  playedAt: string;
  predictions: boolean[];
  gameHistory: Record<string, any>;
}

/**
 * Share a game history as a post
 * @param gameHistoryId - The game history ID to share
 * @param apiFetch - API fetch function from useApi hook
 */
export async function shareGameHistory(
  gameHistoryId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<PostShareResponse> {
  const response = await apiFetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameHistoryId }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to share game history: ${errorText}`);
  }

  return response.json();
}

/**
 * Get a post by ID
 * @param postId - The post ID
 * @param apiFetch - API fetch function from useApi hook
 */
export async function getPost(
  postId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<PostShareResponse> {
  const response = await apiFetch(`/api/posts/${postId}`);

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch post: ${errorText}`);
  }

  return response.json();
}

/**
 * Get current user's posts
 * @param apiFetch - API fetch function from useApi hook
 */
export async function getMyPosts(
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<PostShareResponse[]> {
  const response = await apiFetch('/api/posts/me');

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch posts: ${errorText}`);
  }

  return response.json();
}

/**
 * Get posts by user ID
 * @param userId - The user ID
 * @param apiFetch - API fetch function from useApi hook
 */
export async function getUserPosts(
  userId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<PostShareResponse[]> {
  const response = await apiFetch(`/api/posts/user/${userId}`);

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch user posts: ${errorText}`);
  }

  return response.json();
}

/**
 * Delete a post (unpost)
 * @param postId - The post ID to delete
 * @param apiFetch - API fetch function from useApi hook
 */
export async function deletePost(
  postId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<void> {
  const response = await apiFetch(`/api/posts/${postId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to delete post: ${errorText}`);
  }
}

