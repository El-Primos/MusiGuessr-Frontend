
export function getUserId(): number | null {
  if (typeof window === 'undefined') return null;
  
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed.id || null;
  } catch {
    return null;
  }
}