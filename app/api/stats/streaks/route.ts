import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all scores ordered by user and date
    const result = await sql`
      SELECT 
        u.id as user_id,
        u.username,
        u.display_name,
        s.date,
        s.score
      FROM users u
      LEFT JOIN scores s ON u.id = s.user_id
      ORDER BY u.id, s.date DESC
    `;

    // Calculate streaks for each user
    interface UserStreak {
      username: string;
      displayName: string;
      currentStreak: number;
      longestStreak: number;
    }

    const userStreaks: { [key: string]: UserStreak } = {};
    let currentUserId: number | null = null;
    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate: Date | null = null;
    let todayChecked = false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const row of result.rows) {
      // New user - save previous user's streaks
      if (currentUserId !== null && currentUserId !== row.user_id) {
        const username = result.rows.find(r => r.user_id === currentUserId)?.username;
        const displayName = result.rows.find(r => r.user_id === currentUserId)?.display_name;
        
        if (username) {
          userStreaks[username] = {
            username,
            displayName,
            currentStreak: todayChecked ? currentStreak : 0, // Only count if played today or yesterday
            longestStreak
          };
        }

        // Reset for new user
        currentStreak = 0;
        longestStreak = 0;
        lastDate = null;
        todayChecked = false;
      }

      currentUserId = row.user_id;

      if (!row.date) continue;

      const scoreDate = new Date(row.date + 'T12:00:00');
      scoreDate.setHours(0, 0, 0, 0);

      // Check if this is today or yesterday
      const diffDays = Math.floor((today.getTime() - scoreDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        todayChecked = true;
      }

      if (lastDate === null) {
        // First score for this user
        currentStreak = 1;
        longestStreak = 1;
      } else {
        const dayDiff = Math.floor((lastDate.getTime() - scoreDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          // Consecutive day
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          // Streak broken
          currentStreak = 1;
        }
      }

      lastDate = scoreDate;
    }

    // Save last user's streaks
    if (currentUserId !== null) {
      const username = result.rows.find(r => r.user_id === currentUserId)?.username;
      const displayName = result.rows.find(r => r.user_id === currentUserId)?.display_name;
      
      if (username) {
        userStreaks[username] = {
          username,
          displayName,
          currentStreak: todayChecked ? currentStreak : 0,
          longestStreak
        };
      }
    }

    return NextResponse.json(Object.values(userStreaks));
  } catch (error) {
    console.error('Error calculating streaks:', error);
    return NextResponse.json({ error: 'Failed to calculate streaks' }, { status: 500 });
  }
}