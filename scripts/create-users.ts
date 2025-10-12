import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';

async function createUsers() {
  const users = [
    { username: 'alistari', displayName: 'Alistair', password: 'wordle123' },
    { username: 'alex', displayName: 'Alex', password: 'wordle123' },
    { username: 'claire', displayName: 'Claire', password: 'wordle123' },
    { username: 'duncan', displayName: 'Duncan', password: 'wordle123' },
    { username: 'eloise', displayName: 'Eloise', password: 'wordle123' },
    { username: 'snakey', displayName: 'Joe', password: 'wordle123' },
    { username: 'pete', displayName: 'Pete', password: 'wordle123' },
    { username: 'rob', displayName: 'Rob', password: 'wordle123' },
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    
    try {
      await sql`
        INSERT INTO users (username, display_name, password_hash)
        VALUES (${user.username}, ${user.displayName}, ${passwordHash})
        ON CONFLICT (username) DO NOTHING
      `;
      console.log(`✓ Created user: ${user.username}`);
    } catch (error) {
      console.error(`✗ Failed to create user: ${user.username}`, error);
    }
  }
  
  console.log('\nAll users created! Default password for all: wordle123');
}

createUsers();