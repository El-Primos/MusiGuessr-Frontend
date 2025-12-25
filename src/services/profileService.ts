/**
 * Profile Service
 * Handles all profile-related API calls
 */

export interface GameHistoryEntry {
  gameHistoryId: number;
  gameId: string;
  date: string;
  mode: 'Normal' | 'Tournament';
  score: number;
  playlistId?: number;
  playedAt?: string;
}

export interface ProfileData {
  userId: number;
  userName: string;
  name: string;
  email: string;
  avatar?: string;
  stats: {
    averageScore: number;
    totalGames: number;
    guessAccuracy: number;
  };
  gameHistory: GameHistoryEntry[];
}

export interface UpdateProfileData {
  name?: string;
  password?: string;
}

export interface UserResponseDTO {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  profilePictureUrl?: string;
}

export interface ProfileStats {
  averageScore: number;
  totalGames: number;
  guessAccuracy: number;
}

export interface GameHistoryItem {
  gameHistoryId: number;
  gameId: string; // For backward compatibility, derived from gameHistoryId
  date: string;
  mode: 'Normal' | 'Tournament';
  score: number;
  playlistId?: number;
  playedAt?: string;
}

/**
 * Fetch the current user's profile
 */
export async function fetchOwnProfile(
  userId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<ProfileData> {
  const response = await apiFetch(`/api/users/me/profile?userId=${userId}`);
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch profile: ${errorText}`);
  }
  
  const data = await response.json();
  
  // Map backend DTO to frontend ProfileData
  // Note: Backend doesn't return full profile yet, needs to be implemented
  return {
    userId: data.id,
    userName: data.username,
    name: data.name,
    email: data.email,
    avatar: undefined, // Backend doesn't support avatar yet
    stats: {
      averageScore: data.totalScore || 0,
      totalGames: Number(data.gamesPlayed) || 0,
      guessAccuracy: 0, // Not available in backend yet
    },
    gameHistory: [], // Will be fetched separately
  };
}

/**
 * Fetch another user's profile by userId
 */
export async function fetchUserProfile(
  userId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<ProfileData> {
  const response = await apiFetch(`/api/users/${userId}`);
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch user profile: ${errorText}`);
  }
  
  const data = await response.json();
  
  // Map backend DTO to frontend ProfileData
  return {
    userId: data.id,
    userName: data.username,
    name: data.name,
    email: data.email,
    avatar: undefined, // Backend doesn't support avatar yet
    stats: {
      averageScore: 0, // Not available for other users yet
      totalGames: 0,
      guessAccuracy: 0,
    },
    gameHistory: [], // Not available for other users yet
  };
}

/**
 * Update the current user's profile
 * NOTE: This endpoint is not implemented in the backend yet
 * Expected endpoint: PUT /api/users/me/profile
 */
/**
 * Update user profile (name)
 * @param data - Profile data to update (name)
 * @param apiFetch - API fetch function from useApi hook
 * @returns Updated user data
 */
export async function updateProfile(
  data: UpdateProfileData,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<UserResponseDTO> {
  const response = await apiFetch('/api/users/me', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to update profile: ${errorText}`);
  }
  
  return response.json();
}

/**
 * Upload a profile picture
 * NOTE: This endpoint is not implemented in the backend yet
 * Expected endpoint: POST /api/users/me/avatar
 */
export async function uploadProfileImage(
  file: File, // eslint-disable-line @typescript-eslint/no-unused-vars
  apiFetch: (path: string, init?: RequestInit) => Promise<Response> // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<{ avatarUrl: string }> {
  // TODO: Implement when backend endpoint is ready
  throw new Error('Avatar upload endpoint not implemented in backend yet');
  
  /* Implementation template for when backend is ready:
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await apiFetch('/api/users/me/avatar', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to upload avatar: ${response.statusText}`);
  }
  
  return response.json();
  */
}

/**
 * Fetch user's game history
 * Note: userId parameter is kept for backward compatibility but not used in the request
 */
export async function fetchUserGameHistory(
  userId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<GameHistoryItem[]> {
  // Backend endpoint doesn't need userId parameter, it gets it from the token
  const response = await apiFetch(`/api/users/me/history/games`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch game history: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Map backend GameHistoryDTO to frontend format
  // Backend format: { gameHistoryId, playlistId, totalScore, playedAt }
  return data.map((game: { 
    gameHistoryId?: number; 
    playlistId?: number;
    totalScore?: number; 
    playedAt?: string;
  }) => {
    const playedAtDate = game.playedAt ? new Date(game.playedAt) : new Date();
    return {
      gameHistoryId: game.gameHistoryId || 0,
      gameId: game.gameHistoryId?.toString() || '', // For backward compatibility
      date: playedAtDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      mode: 'Normal' as const, // Backend doesn't distinguish yet
      score: game.totalScore || 0,
      playlistId: game.playlistId,
      playedAt: game.playedAt,
    };
  });
}

/**
 * Fetch user's statistics
 * NOTE: Standalone stats endpoint doesn't exist yet
 * Stats are included in the profile response
 */
export async function fetchUserStats(
  userId: number,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<ProfileStats> {
  // For now, fetch from profile endpoint
  const response = await apiFetch(`/api/users/me/profile?userId=${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    averageScore: data.totalScore || 0,
    totalGames: Number(data.gamesPlayed) || 0,
    guessAccuracy: 0, // Not available yet
  };
}
