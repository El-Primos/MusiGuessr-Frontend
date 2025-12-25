// Backend TournamentStatus enum: UPCOMING, ACTIVE, FINISHED
export type TournamentStatus = 'UPCOMING' | 'ACTIVE' | 'FINISHED';

// Response from GET /api/tournaments/{id} and POST /api/tournaments
export interface TournamentResponseDTO {
  id: number;
  name: string;
  description: string;
  playlistId: number;
  creatorId: number;
  creatorUsername: string;
  status: TournamentStatus;
  createDate: string; // ISO 8601 OffsetDateTime
  startDate: string | null; // ISO 8601 OffsetDateTime
  endDate: string | null; // ISO 8601 OffsetDateTime
  participantCount: number;
}

// Response from GET /api/tournaments (paginated)
export interface TournamentPageResponse {
  content: TournamentResponseDTO[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// Request body for POST /api/tournaments
export interface TournamentCreateRequestDTO {
  name: string;
  description: string;
  playlistId: number;
  startDate: string; // ISO 8601 OffsetDateTime
  endDate: string; // ISO 8601 OffsetDateTime
}

// Response from GET /api/tournaments/{id}/leaderboard
export interface TournamentLeaderboardEntryDTO {
  rank: number;
  userId: number;
  username: string;
  score: number;
}

// Response from GET /api/tournaments/{id}/participants
export interface TournamentParticipantDTO {
  userId: number;
  username: string;
  score: number;
}

// Helper to map backend status to frontend display status
export function mapTournamentStatus(backendStatus: TournamentStatus): 'Upcoming' | 'Active' | 'Completed' {
  switch (backendStatus) {
    case 'UPCOMING':
      return 'Upcoming';
    case 'ACTIVE':
      return 'Active';
    case 'FINISHED':
      return 'Completed';
  }
}

// Helper to map frontend display status to backend status
export function mapToBackendStatus(displayStatus: 'all' | 'upcoming' | 'active' | 'completed'): TournamentStatus | null {
  switch (displayStatus) {
    case 'upcoming':
      return 'UPCOMING';
    case 'active':
      return 'ACTIVE';
    case 'completed':
      return 'FINISHED';
    default:
      return null;
  }
}

// Helper to format date for display (DD.MM.YY format)
export function formatTournamentDate(isoDate: string | null): string {
  if (!isoDate) return 'TBA';
  
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  
  return `${day}.${month}.${year}`;
}
