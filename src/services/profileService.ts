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
  return {
    userId: data.id,
    userName: data.username,
    name: data.name,
    email: data.email,
    avatar: data.profilePictureUrl || undefined, // Map profilePictureUrl to avatar
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
    avatar: data.profilePictureUrl || undefined, // Map profilePictureUrl to avatar
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
 * Get presign URL for profile picture upload
 * @param fileName - Name of the file to upload
 * @param contentType - MIME type of the file (e.g., 'image/jpeg')
 * @param apiFetch - API fetch function from useApi hook
 * @returns Presign response with uploadUrl and key
 */
export async function getProfilePicturePresignUrl(
  fileName: string,
  contentType: string,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<{ message: string; key: string; uploadUrl: string }> {
  const response = await apiFetch('/api/users/me/profile-picture/presign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileName, contentType }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to get presign URL: ${errorText}`);
  }

  return response.json();
}

/**
 * Upload file to S3 using presign URL
 * @param file - File to upload
 * @param uploadUrl - Presign URL from backend
 * @returns Promise that resolves when upload is complete
 */
async function uploadFileToS3(file: File, uploadUrl: string): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file to S3: ${response.statusText}`);
  }
}

/**
 * Confirm profile picture upload
 * @param key - S3 key from presign response
 * @param apiFetch - API fetch function from useApi hook
 * @returns Updated user data with profilePictureUrl
 */
export async function confirmProfilePicture(
  key: string,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<UserResponseDTO> {
  const response = await apiFetch('/api/users/me/profile-picture/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to confirm profile picture: ${errorText}`);
  }

  return response.json();
}

/**
 * Upload a profile picture
 * This function handles the complete flow:
 * 1. Get presign URL from backend
 * 2. Upload file to S3
 * 3. Confirm upload with backend
 * @param file - File to upload
 * @param apiFetch - API fetch function from useApi hook
 * @returns Updated user data with profilePictureUrl
 */
export async function uploadProfileImage(
  file: File,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<UserResponseDTO> {
  // Step 1: Get presign URL
  const presignResponse = await getProfilePicturePresignUrl(
    file.name,
    file.type,
    apiFetch
  );

  // Step 2: Upload file to S3
  await uploadFileToS3(file, presignResponse.uploadUrl);

  // Step 3: Confirm upload with backend
  const updatedUser = await confirmProfilePicture(presignResponse.key, apiFetch);

  return updatedUser;
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
