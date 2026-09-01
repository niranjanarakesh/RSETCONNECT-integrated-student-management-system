/**
 * Extract dynamic initials from a person's full name.
 * e.g., "Brinda Raj" -> "BR", "Abhinav Krishnan" -> "AK", "Devika Menon" -> "DM"
 */
export function getInitials(name?: string): string {
  if (!name || typeof name !== 'string') return 'BR';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'BR';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  const first = parts[0][0] || '';
  const last = parts[parts.length - 1][0] || '';
  return (first + last).toUpperCase();
}
