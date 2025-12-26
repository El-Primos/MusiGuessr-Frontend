// Shared utility functions for tournament date and status calculations

export type TournamentStatus = 'Upcoming' | 'Active' | 'Completed';

/**
 * Parse date string in DD.MM.YY format to Date object
 */
export function parseDateString(dateStr: string): Date | null {
  try {
    const [day, month, year] = dateStr.split('.');
    // Assuming "YY" format means 20YY (e.g., "25" -> 2025)
    const fullYear = parseInt(year) < 100 ? 2000 + parseInt(year) : parseInt(year);
    return new Date(fullYear, parseInt(month) - 1, parseInt(day));
  } catch {
    return null;
  }
}

/**
 * Calculate actual tournament status based on start and end dates
 */
export function calculateTournamentStatus(startDate: string, endDate: string): TournamentStatus {
  const now = new Date();
  const startDateParsed = parseDateString(startDate);
  const endDateParsed = parseDateString(endDate);
  
  const hasStarted = startDateParsed ? startDateParsed <= now : false;
  const hasEnded = endDateParsed ? endDateParsed < now : false;
  
  return hasEnded ? 'Completed' : hasStarted ? 'Active' : 'Upcoming';
}

/**
 * Check if tournament has started
 */
export function hasTournamentStarted(startDate: string): boolean {
  const now = new Date();
  const startDateParsed = parseDateString(startDate);
  return startDateParsed ? startDateParsed <= now : false;
}

/**
 * Check if tournament has ended
 */
export function hasTournamentEnded(endDate: string): boolean {
  const now = new Date();
  const endDateParsed = parseDateString(endDate);
  return endDateParsed ? endDateParsed < now : false;
}
