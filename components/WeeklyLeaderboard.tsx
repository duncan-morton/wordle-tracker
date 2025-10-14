'use client';

import { useEffect, useState } from 'react';
import { getCurrentWeekBounds } from '@/lib/db';

interface Score {
  id: number;
  user_id: number;
  wordle_number: number;
  score: number;
  date: string;
  display_name: string;
  username: string;
}

interface PlayerWeekScore {
  displayName: string;
  username: string;
  scores: { [key: string]: number };
  total: number;
}

export default function WeeklyLeaderboard({ refresh }: { refresh?: number }) {
  const [leaderboard, setLeaderboard] = useState<PlayerWeekScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekDays, setWeekDays] = useState<string[]>([]);
  const [isWeekComplete, setIsWeekComplete] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [refresh]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { start, end } = getCurrentWeekBounds();
      const weekStart = start.toISOString().split('T')[0];
      const weekEnd = end.toISOString().split('T')[0];

      const res = await fetch(`/api/scores?weekStart=${weekStart}&weekEnd=${weekEnd}`);
      const scores: Score[] = await res.json();

      // Generate days of the week starting from Sunday
      const days: string[] = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        const year = day.getFullYear();
        const month = String(day.getMonth() + 1).padStart(2, '0');
        const date = String(day.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${date}`;
        days.push(dateStr);
      }
      setWeekDays(days);

      // Check if week is complete (is today Saturday or later?)
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const lastDayOfWeek = days[6]; // Saturday
      setIsWeekComplete(todayStr > lastDayOfWeek);

      // Group scores by player
      const playerMap: { [key: string]: PlayerWeekScore } = {};
      
      scores.forEach((score) => {
        if (!playerMap[score.username]) {
          playerMap[score.username] = {
            displayName: score.display_name,
            username: score.username,
            scores: {},
            total: 0,
          };
        }
        let scoreDate: string;
        if (score.date.includes('T')) {
          scoreDate = score.date.split('T')[0];
        } else {
          scoreDate = score.date;
        }
        playerMap[score.username].scores[scoreDate] = score.score;
        playerMap[score.username].total += score.score;
      });

      const leaderboardArray = Object.values(playerMap).sort((a, b) => a.total - b.total);
      setLeaderboard(leaderboardArray);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'bg-gray-700 text-gray-500';
    if (score <= 3) return 'bg-green-600 text-white';
    if (score <= 5) return 'bg-yellow-600 text-white';
    return 'bg-red-600 text-white';
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString + 'T12:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  if (loading) {
    return <div className="text-white">Loading leaderboard...</div>;
  }

  const winner = leaderboard[0];

  return (
    <div className="space-y-4">

      {/* Leaderboard Table */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">
          Weekly Leaderboard - Week of {weekDays[0] ? new Date(weekDays[0] + 'T12:00:00').toLocaleDateString('en-GB') : ''}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-gray-300 font-medium">Rank</th>
                <th className="px-4 py-3 text-gray-300 font-medium">Player</th>
                {weekDays.map((day) => (
                  <th key={day} className="px-2 py-3 text-center text-gray-300 font-medium text-sm">
                    {getDayName(day)}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-gray-300 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player, index) => (
                <tr key={player.username} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="px-4 py-3 text-white font-medium">
                    {index === 0 && '🏆'} 
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {' '}{index + 1}
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{player.displayName}</td>
                  {weekDays.map((day) => (
                    <td key={day} className="px-2 py-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getScoreColor(player.scores[day])}`}>
                        {player.scores[day] || '-'}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-4 py-1 rounded font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-green-600 text-white'
                    }`}>
                      {player.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leaderboard.length === 0 && (
          <p className="text-gray-400 text-center py-8">No scores yet this week. Be the first to add one!</p>
        )}
      </div>
    </div>
  );
}