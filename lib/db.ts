import { sql } from '@vercel/postgres';

export { sql };

// Helper to get current Wordle number
export function getCurrentWordleNumber(): number {
  const startDate = new Date('2021-06-19'); // Wordle #1
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Helper to get week bounds (Sunday to Saturday)
export function getCurrentWeekBounds(): { start: Date; end: Date } {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate days to subtract to get to Sunday
  const start = new Date(today);
  start.setDate(today.getDate() - day);
  start.setHours(0, 0, 0, 0);
  
  // End is 6 days after start (Saturday)
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}