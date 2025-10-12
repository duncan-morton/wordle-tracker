import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function setSession(userId: number, username: string) {
  const cookieStore = await cookies();
  cookieStore.set('session', JSON.stringify({ userId, username }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  if (!session) return null;
  return JSON.parse(session.value);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}