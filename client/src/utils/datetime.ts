/**
 * Formats a Date for an <input type="datetime-local"> in the user's own time zone.
 * (toISOString() is UTC, which showed times 5½ hours off in India and made
 * new listings expire early once read back as local time.)
 */
export function toLocalInputValue(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
