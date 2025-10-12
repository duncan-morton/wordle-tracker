-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  wordle_number INTEGER NOT NULL,
  score INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, wordle_number)
);

-- Starting words table
CREATE TABLE IF NOT EXISTS starting_words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(5) NOT NULL UNIQUE,
  chosen_by INTEGER REFERENCES users(id),
  week_start DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);