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

export type LeaderboardPeriod = 'all' | 'weekly' | 'monthly';

/**
 * Fetch global leaderboard
 * @param period - Time period: 'all', 'weekly', or 'monthly'
 * @param limit - Maximum number of entries to return (default: 100)
 * @param apiFetch - API fetch function from useApi hook
 */
export async function fetchGlobalLeaderboard(
  period: LeaderboardPeriod = 'all',
  limit: number = 100,
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams({
    period,
    limit: limit.toString(),
  });

  const response = await apiFetch(`/api/leaderboards/global?${params.toString()}`);

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to fetch global leaderboard: ${errorText}`);
  }

  const data = await response.json();

  // Map backend DTO to frontend format
  // Backend: { rank, userId, username, score }
  // Frontend: { rank, userId, playerName, score }
  return data.map((entry: { rank: number; userId: number; username: string; score: number }) => ({
    rank: entry.rank,
    userId: entry.userId,
    playerName: entry.username || 'Unknown',
    score: entry.score || 0,
  }));
}

/**
 * Fetch friends leaderboard
 * NOTE: This endpoint is not implemented in the backend yet.
 * Expected endpoint: GET /api/leaderboards/friends
 * For now, returns empty array
 */
export async function fetchFriendsLeaderboard(
  period: LeaderboardPeriod = 'all', // eslint-disable-line @typescript-eslint/no-unused-vars
  limit: number = 100, // eslint-disable-line @typescript-eslint/no-unused-vars
  apiFetch: (path: string, init?: RequestInit) => Promise<Response> // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<LeaderboardEntry[]> {
  // TODO: Implement when backend endpoint is ready
  // const params = new URLSearchParams({
  //   period,
  //   limit: limit.toString(),
  // });
  // const response = await apiFetch(`/api/leaderboards/friends?${params.toString()}`);
  // ... similar mapping logic

  console.warn('Friends leaderboard endpoint not implemented in backend yet');
  return [];
}

