/**
 * Friends Service
 * Handles all friend-related API calls
 */

export interface FriendRequest {
  requesterId: number;
  requesterUsername: string;
  pending: boolean;
  accepted: boolean;
}

export interface Friend {
  userId: number;
  username: string;
}

export interface FriendData {
  userId: number;
  userName: string;
  name: string;
  avatar?: string;
}

/**
 * Send a follow request to a user
 * @param targetUserId - The user ID to send request to
 * @param apiFetch - API fetch function from useApi hook
 * @returns Object with success status and optional error code
 */
export async function sendFollowRequest(
  targetUserId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<{ success: boolean; message?: string; errorCode?: number }> {
  const response = await apiFetch(`/api/followings/request?targetUserId=${targetUserId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    // Return error code so caller can handle "already sent" case
    return { 
      success: false, 
      message: errorText,
      errorCode: response.status 
    };
  }

  return { success: true, message: await response.text() };
}

/**
 * Get incoming follow requests
 * @param apiFetch - API fetch function from useApi hook
 */
export async function getIncomingRequests(
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<FriendRequest[]> {
  const response = await apiFetch('/api/followings/incoming');

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch incoming requests: ${errorText}`);
  }

  const data = await response.json();
  return data.map((req: { requesterId: number; requesterUsername: string; pending: boolean; accepted: boolean }) => ({
    requesterId: req.requesterId,
    requesterUsername: req.requesterUsername || '',
    pending: req.pending || false,
    accepted: req.accepted || false,
  }));
}

/**
 * Get accepted friends list
 * @param apiFetch - API fetch function from useApi hook
 */
export async function getFriends(
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<Friend[]> {
  const response = await apiFetch('/api/followings/friends');

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch friends: ${errorText}`);
  }

  const data = await response.json();
  return data.map((friend: { userId: number; username: string }) => ({
    userId: friend.userId,
    username: friend.username || '',
  }));
}

/**
 * Accept a follow request
 * @param requesterId - The user ID who sent the request
 * @param apiFetch - API fetch function from useApi hook
 */
export async function acceptRequest(
  requesterId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<{ success: boolean; message?: string }> {
  const response = await apiFetch(`/api/followings/accept?requesterId=${requesterId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to accept request: ${errorText}`);
  }

  return { success: true, message: await response.text() };
}

/**
 * Discard (reject) a follow request
 * @param requesterId - The user ID who sent the request
 * @param apiFetch - API fetch function from useApi hook
 */
export async function discardRequest(
  requesterId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<{ success: boolean; message?: string }> {
  const response = await apiFetch(`/api/followings/discard?requesterId=${requesterId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to discard request: ${errorText}`);
  }

  return { success: true, message: await response.text() };
}

/**
 * Mark inbox as seen
 * @param apiFetch - API fetch function from useApi hook
 */
export async function markInboxSeen(
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<void> {
  const response = await apiFetch('/api/followings/inbox/seen', {
    method: 'POST',
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to mark inbox as seen: ${errorText}`);
  }
}

/**
 * Add a friend (alias for sendFollowRequest)
 * @param userId - The user ID to add as friend
 * @param apiFetch - API fetch function from useApi hook
 */
export async function addFriend(
  userId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<{ success: boolean; message?: string; errorCode?: number }> {
  return sendFollowRequest(userId, apiFetch);
}

/**
 * Remove a friend (unfriend)
 * @param friendId - The user ID to unfriend
 * @param apiFetch - API fetch function from useApi hook
 * @returns Success status and message
 */
export async function removeFriend(
  friendId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<{ success: boolean; message?: string }> {
  const response = await apiFetch(`/api/followings/unfriend?friendId=${friendId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to remove friend: ${errorText}`);
  }

  return { success: true, message: await response.text() };
}

/**
 * Check if a user is a friend (mutual following)
 * @param userId - The user ID to check
 * @param apiFetch - API fetch function from useApi hook
 */
export async function checkFriendship(
  userId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<{ isFriend: boolean }> {
  try {
    const friends = await getFriends(apiFetch);
    const isFriend = friends.some(f => f.userId === userId);
    return { isFriend };
  } catch (err) {
    console.error('Failed to check friendship:', err);
    return { isFriend: false };
  }
}

/**
 * Check friendship status including pending requests
 * Returns: 'none' | 'pending' | 'friend'
 * Note: This checks if user is a friend, and also checks incoming requests
 * to see if the other user sent us a request (which means we might have sent one too)
 */
export async function checkFriendshipStatus(
  userId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<'none' | 'pending' | 'friend'> {
  try {
    // First check if they're friends
    const { isFriend } = await checkFriendship(userId, apiFetch);
    if (isFriend) {
      return 'friend';
    }

    // Check incoming requests - if the other user sent us a request,
    // it means we might have a pending request to them
    // We check incoming requests to potentially determine relationship status
    // but currently rely on localStorage for outgoing requests tracking
    await getIncomingRequests(apiFetch);
    
    // If we have an incoming request from them, it's likely we sent one too
    // But we can't be 100% sure without backend endpoint for outgoing requests
    // So we'll rely on localStorage for now
    return 'none';
  } catch (err) {
    console.error('Failed to check friendship status:', err);
    return 'none';
  }
}

/**
 * Get the current user's friends list (alias for getFriends)
 * @param apiFetch - API fetch function from useApi hook
 */
export async function getFriendsList(
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<FriendData[]> {
  const friends = await getFriends(apiFetch);
  // Backend only returns userId and username, not name/avatar
  // Would need to fetch user details separately if needed
  return friends.map(f => ({
    userId: f.userId,
    userName: f.username,
    name: f.username, // Fallback to username if name not available
    avatar: undefined,
  }));
}
