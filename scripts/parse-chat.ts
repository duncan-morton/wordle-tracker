import * as fs from 'fs';
import * as path from 'path';

interface GameScore {
  date: string;
  username: string;
  wordleNumber: number;
  score: number;
}

// Map WhatsApp names to usernames
const nameMapping: { [key: string]: string } = {
  'Rob Beasley': 'rob',
  'Claire Allen': 'claire',
  'Eloise': 'eloise',
  'Duncan': 'duncan',
  'Pete Gibbons': 'pete',
  'Big Al Goulding': 'alistair',
  'Alex W': 'alex',
  'Joe Brothwell': 'snake',
};

function parseChat() {
  const chatPath = path.join(process.cwd(), 'wordle-chat.txt');
  const content = fs.readFileSync(chatPath, 'utf-8');
  const lines = content.split('\n');

  const scores: GameScore[] = [];
  const playerFirstGame: { [key: string]: number } = {};
  
  // Build messages with multi-line support
  interface Message {
    date: string;
    name: string;
    text: string;
  }
  
  const messages: Message[] = [];
  let currentMessage: Message | null = null;
  
  const messageStartRegex = /^(\d{2}\/\d{2}\/\d{4}),\s+\d{2}:\d{2}\s+-\s+([^:]+):\s*(.*)$/;
  
  for (const line of lines) {
    const messageMatch = line.match(messageStartRegex);
    
    if (messageMatch) {
      // Save previous message if exists
      if (currentMessage) {
        messages.push(currentMessage);
      }
      
      // Start new message
      currentMessage = {
        date: messageMatch[1],
        name: messageMatch[2],
        text: messageMatch[3] // Content after the colon
      };
    } else if (currentMessage && line.trim()) {
      // Continue previous message (multi-line)
      currentMessage.text += '\n' + line;
    }
  }
  
  // Don't forget the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }
  
  console.log(`Found ${messages.length} messages`);
  
  // Now parse Wordle scores from messages
  const wordleRegex = /Wordle\s+([\d,]+)\s+([X\d])\/6/i;
  
  for (const message of messages) {
    const wordleMatch = message.text.match(wordleRegex);
    
    if (wordleMatch) {
      const [, wordleNumStr, scoreStr] = wordleMatch;
      
      // Find username from name mapping
      let username: string | null = null;
      for (const [fullName, user] of Object.entries(nameMapping)) {
        if (message.name.includes(fullName) || fullName.includes(message.name.trim())) {
          username = user;
          break;
        }
      }

      if (!username) {
        console.log(`Unknown player: ${message.name}`);
        continue;
      }

      // Parse Wordle number (remove comma)
      const wordleNumber = parseInt(wordleNumStr.replace(',', ''));
      
      // Parse score (X = 10)
      const score = scoreStr.toUpperCase() === 'X' ? 10 : parseInt(scoreStr);

      // Convert date from DD/MM/YYYY to YYYY-MM-DD
      const [day, month, year] = message.date.split('/');
      const date = `${year}-${month}-${day}`;

      // Track first game for each player
      if (!playerFirstGame[username] || wordleNumber < playerFirstGame[username]) {
        playerFirstGame[username] = wordleNumber;
      }

      scores.push({ date, username, wordleNumber, score });
    }
  }

  console.log(`Parsed ${scores.length} scores from chat`);
  console.log('Player first games:', playerFirstGame);

  // Find all unique Wordle numbers
  const allWordleNumbers = [...new Set(scores.map(s => s.wordleNumber))].sort((a, b) => a - b);
  console.log(`Games range: ${allWordleNumbers[0]} to ${allWordleNumbers[allWordleNumbers.length - 1]}`);

  // Fill in missing scores (10) for active players
  const completeScores: GameScore[] = [];
  const scoresByGame = new Map<number, Map<string, GameScore>>();

  // Index existing scores
  for (const score of scores) {
    if (!scoresByGame.has(score.wordleNumber)) {
      scoresByGame.set(score.wordleNumber, new Map());
    }
    scoresByGame.get(score.wordleNumber)!.set(score.username, score);
  }

  // For each game, check each player
  for (const wordleNumber of allWordleNumbers) {
    const gameScores = scoresByGame.get(wordleNumber) || new Map();
    
    for (const [username, firstGame] of Object.entries(playerFirstGame)) {
      // Only add missing scores for games after player's first game
      if (wordleNumber >= firstGame) {
        if (gameScores.has(username)) {
          completeScores.push(gameScores.get(username)!);
        } else {
          // Missing score - add as 10
          // Estimate date based on Wordle number
          const startDate = new Date('2021-06-19');
          const gameDate = new Date(startDate);
          gameDate.setDate(startDate.getDate() + wordleNumber - 1);
          const date = gameDate.toISOString().split('T')[0];
          
          completeScores.push({
            date,
            username,
            wordleNumber,
            score: 10
          });
        }
      }
    }
  }

  console.log(`Total scores with missing filled: ${completeScores.length}`);

  // Generate SQL
  generateSQL(completeScores);
}

function generateSQL(scores: GameScore[]) {
  const sqlPath = path.join(process.cwd(), 'scripts', 'import-scores.sql');
  
  let sql = '-- Import historical Wordle scores\n';
  sql += '-- Run this in your Neon SQL Editor\n\n';
  
  sql += 'DO $$\n';
  sql += 'DECLARE\n';
  sql += '  v_user_id INTEGER;\n';
  sql += 'BEGIN\n\n';

  for (const score of scores) {
    sql += `  -- ${score.username}: Wordle ${score.wordleNumber} = ${score.score}\n`;
    sql += `  SELECT id INTO v_user_id FROM users WHERE username = '${score.username}';\n`;
    sql += `  INSERT INTO scores (user_id, wordle_number, score, date)\n`;
    sql += `  VALUES (v_user_id, ${score.wordleNumber}, ${score.score}, '${score.date}'::date)\n`;
    sql += `  ON CONFLICT (user_id, wordle_number) DO NOTHING;\n\n`;
  }

  sql += 'END $$;\n';
  
  fs.writeFileSync(sqlPath, sql);
  console.log(`\nSQL file generated: ${sqlPath}`);
  console.log(`Total INSERT statements: ${scores.length}`);
  console.log('\nNext steps:');
  console.log('1. Open scripts/import-scores.sql');
  console.log('2. Copy all the SQL');
  console.log('3. Go to Neon SQL Editor');
  console.log('4. Paste and run the SQL');
}

parseChat();