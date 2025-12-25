/**
 * Leaderboard Service
 * Handles all leaderboard-related API calls
 */

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  playerName: string; // mapped from backend's 'username'
  score: number;
}

/**
 * Fetch global leaderboard
 * @param apiFetch - API fetch function from useApi hook
 */
export async function fetchGlobalLeaderboard(
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<LeaderboardEntry[]> {
  const response = await apiFetch(`/api/leaderboards/global`);

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch global leaderboard: ${errorText}`);
  }

  const data = await response.json();

  // Map backend DTO to frontend format
  // Backend: { rank, userId, username, score }
  // Frontend: { rank, userId, playerName, score }
  // Filter out system user (id: 0)
  return data
    .filter((entry: { rank: number; userId: number; username: string; score: number }) => entry.userId !== 0)
    .map((entry: { rank: number; userId: number; username: string; score: number }, index: number) => ({
      rank: index + 1, // Recalculate rank after filtering
      userId: entry.userId,
      playerName: entry.username || 'Unknown',
      score: entry.score || 0,
    }));
}

/**
 * Fetch friends leaderboard
 * @param apiFetch - API fetch function from useApi hook
 */
export async function fetchFriendsLeaderboard(
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<LeaderboardEntry[]> {
  const response = await apiFetch(`/api/leaderboards/friends`);

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch friends leaderboard: ${errorText}`);
  }

  const data = await response.json();

  // Map backend DTO to frontend format
  // Backend: { rank, userId, username, score }
  // Frontend: { rank, userId, playerName, score }
  // Filter out system user (id: 0)
  return data
    .filter((entry: { rank: number; userId: number; username: string; score: number }) => entry.userId !== 0)
    .map((entry: { rank: number; userId: number; username: string; score: number }, index: number) => ({
      rank: index + 1, // Recalculate rank after filtering
      userId: entry.userId,
      playerName: entry.username || 'Unknown',
      score: entry.score || 0,
    }));
}

