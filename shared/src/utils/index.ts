/**
 * Utils — Common utilities
 */

/**
 * Get current timestamp (milliseconds since epoch)
 */
export function now(): number {
  return Date.now();
}

/**
 * Generate a unique ID (UUID v4-like, using crypto.randomUUID if available)
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + random
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Format date as ISO 8601 (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Parse ISO date string to Date
 */
export function parseDate(iso: string): Date {
  return new Date(iso);
}
