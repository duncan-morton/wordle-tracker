import { NextRequest, NextResponse } from 'next/server';
import { sql, getCurrentWeekBounds } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const { start } = getCurrentWeekBounds();
    const weekStart = start.toISOString().split('T')[0];
    
    const result = await sql`
      SELECT sw.id, sw.word, sw.week_start,
             to_char(sw.created_at, 'YYYY-MM-DD') as created_at,
             u.display_name as chosen_by_name
      FROM starting_words sw
      JOIN users u ON sw.chosen_by = u.id
      WHERE sw.week_start = ${weekStart}::date
      ORDER BY sw.created_at DESC
      LIMIT 1
    `;
    
    return NextResponse.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching starting word:', error);
    return NextResponse.json({ error: 'Failed to fetch starting word' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { word } = await request.json();
    
    // Validate word length
    if (!word || word.length !== 5) {
      return NextResponse.json({ error: 'Word must be exactly 5 characters' }, { status: 400 });
    }
    
    // Check if word was used before
    const existing = await sql`
      SELECT id FROM starting_words WHERE LOWER(word) = LOWER(${word})
    `;
    
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'This word has already been used' }, { status: 400 });
    }
    
    const { start } = getCurrentWeekBounds();
    const weekStart = start.toISOString().split('T')[0];
    
    const result = await sql`
      INSERT INTO starting_words (word, chosen_by, week_start)
      VALUES (${word.toUpperCase()}, ${session.userId}, ${weekStart}::date)
      RETURNING id, word, week_start, chosen_by
    `;
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving starting word:', error);
    return NextResponse.json({ error: 'Failed to save starting word' }, { status: 500 });
  }
}