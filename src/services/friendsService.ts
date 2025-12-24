/**
 * Friends Service
 * Handles all friend-related API calls
 * 
 * NOTE: Friend system is not implemented in the backend yet.
 * All friend endpoints below are placeholders for future implementation.
 */

export interface FriendData {
  userId: number;
  userName: string;
  name: string;
  avatar?: string;
}

/**
 * Add a friend
 * NOTE: Not implemented in backend yet
 * Expected endpoint: POST /api/friends/:userId
 */
export async function addFriend(
  userId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<{ success: boolean; message?: string }> {
  // TODO: Implement when backend endpoint is ready
  console.warn('Friend system not implemented in backend yet');
  throw new Error('Friend system not implemented in backend yet');
}

/**
 * Remove a friend
 * NOTE: Not implemented in backend yet
 * Expected endpoint: DELETE /api/friends/:userId
 */
export async function removeFriend(
  userId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<{ success: boolean; message?: string }> {
  // TODO: Implement when backend endpoint is ready
  console.warn('Friend system not implemented in backend yet');
  throw new Error('Friend system not implemented in backend yet');
}

/**
 * Check if a user is a friend
 * NOTE: Not implemented in backend yet
 * Expected endpoint: GET /api/friends/check/:userId
 */
export async function checkFriendship(
  userId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<{ isFriend: boolean }> {
  // TODO: Implement when backend endpoint is ready
  // For now, return false
  console.warn('Friend system not implemented in backend yet');
  return { isFriend: false };
}

/**
 * Get the current user's friends list
 * NOTE: Not implemented in backend yet
 * Expected endpoint: GET /api/friends
 */
export async function getFriendsList(
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<FriendData[]> {
  // TODO: Implement when backend endpoint is ready
  // For now, return empty array
  console.warn('Friend system not implemented in backend yet');
  return [];
}
