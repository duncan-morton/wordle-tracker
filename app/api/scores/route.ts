import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');
    const weekEnd = searchParams.get('weekEnd');
    
    let query;
    if (weekStart && weekEnd) {
      query = sql`
        SELECT s.id, s.user_id, s.wordle_number, s.score, 
               to_char(s.date, 'YYYY-MM-DD') as date,
               u.display_name, u.username
        FROM scores s
        JOIN users u ON s.user_id = u.id
        WHERE s.date >= ${weekStart}::date AND s.date <= ${weekEnd}::date
        ORDER BY s.date, u.display_name
      `;
    } else {
      query = sql`
        SELECT s.id, s.user_id, s.wordle_number, s.score,
               to_char(s.date, 'YYYY-MM-DD') as date,
               u.display_name, u.username
        FROM scores s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.date DESC
        LIMIT 100
      `;
    }
    
    const result = await query;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { wordleNumber, score, date } = await request.json();
    
    console.log('Received date:', date);
    
    // Validate score
    if (score < 1 || score > 10) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }
    
    // Ensure date is in YYYY-MM-DD format without timezone conversion
    const dateOnly = date.split('T')[0];
    
    const result = await sql`
      INSERT INTO scores (user_id, wordle_number, score, date)
      VALUES (${session.userId}, ${wordleNumber}, ${score}, ${dateOnly}::date)
      ON CONFLICT (user_id, wordle_number)
      DO UPDATE SET score = ${score}, updated_at = NOW()
      RETURNING id, user_id, wordle_number, score, to_char(date, 'YYYY-MM-DD') as date
    `;
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}