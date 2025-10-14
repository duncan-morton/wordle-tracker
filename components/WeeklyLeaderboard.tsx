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
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

  useEffect(() => {
    fetchLeaderboard();
  }, [refresh, weekOffset]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { start, end } = getCurrentWeekBounds();

      // Apply week offset
      const adjustedStart = new Date(start);
      adjustedStart.setDate(start.getDate() + (weekOffset * 7));

      const adjustedEnd = new Date(end);
      adjustedEnd.setDate(end.getDate() + (weekOffset * 7));

      // Format dates in local timezone
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const weekStart = formatLocalDate(adjustedStart);
      const weekEnd = formatLocalDate(adjustedEnd);

      const res = await fetch(`/api/scores?weekStart=${weekStart}&weekEnd=${weekEnd}`);
      const scores: Score[] = await res.json();

      // Generate days of the week starting from Sunday
      const days: string[] = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(adjustedStart);
        day.setDate(adjustedStart.getDate() + i);
        const year = day.getFullYear();
        const month = String(day.getMonth() + 1).padStart(2, '0');
        const date = String(day.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${date}`;
        days.push(dateStr);
      }
      setWeekDays(days);

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

  const goToPreviousWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const goToNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const goToCurrentWeek = () => {
    setWeekOffset(0);
  };

  if (loading) {
    return <div className="text-white">Loading leaderboard...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Leaderboard Table */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">
            Weekly Leaderboard
          </h2>
          
          {/* Week Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousWeek}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
              title="Previous week"
            >
              ← Prev
            </button>
            
            <div className="text-center">
              <div className="text-sm text-gray-400">
                {weekOffset === 0 ? 'Current Week' : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago`}
              </div>
              <div className="text-sm text-white font-medium">
                {weekDays[0] ? new Date(weekDays[0] + 'T12:00:00').toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short'
                }) : ''} - {weekDays[6] ? new Date(weekDays[6] + 'T12:00:00').toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }) : ''}
              </div>
            </div>

            <button
              onClick={goToNextWeek}
              disabled={weekOffset === 0}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next week"
            >
              Next →
            </button>
          </div>
        </div>

        {weekOffset !== 0 && (
          <div className="mb-4">
            <button
              onClick={goToCurrentWeek}
              className="text-sm text-green-500 hover:text-green-400 underline"
            >
              ← Back to Current Week
            </button>
          </div>
        )}

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
          <p className="text-gray-400 text-center py-8">No scores for this week</p>
        )}
      </div>
    </div>
  );
}