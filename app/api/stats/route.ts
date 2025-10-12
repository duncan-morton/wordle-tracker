import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all-time stats for each player
    const result = await sql`
      SELECT 
        u.username,
        u.display_name,
        COUNT(s.id) as games_played,
        ROUND(AVG(s.score)::numeric, 2) as avg_score,
        MIN(s.score) as best_score,
        MAX(s.score) as worst_score,
        SUM(CASE WHEN s.score <= 3 THEN 1 ELSE 0 END) as excellent_count,
        SUM(CASE WHEN s.score = 10 THEN 1 ELSE 0 END) as bust_count
      FROM users u
      LEFT JOIN scores s ON u.id = s.user_id
      GROUP BY u.id, u.username, u.display_name
      ORDER BY avg_score ASC, games_played DESC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}