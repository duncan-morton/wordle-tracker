import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sql`
      SELECT sw.id, sw.word, sw.week_start,
             to_char(sw.created_at, 'YYYY-MM-DD') as created_at,
             u.display_name as chosen_by_name
      FROM starting_words sw
      JOIN users u ON sw.chosen_by = u.id
      ORDER BY sw.week_start DESC
      LIMIT 10
    `;
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching starting word history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}