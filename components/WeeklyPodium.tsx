'use client';

import { useRef, useEffect, useState } from 'react';
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
  rank: number;
}

export default function WeeklyPodium() {
  const podiumRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [players, setPlayers] = useState<PlayerWeekScore[]>([]);
  const [weekStart, setWeekStart] = useState<string>('');
  const [weekDays, setWeekDays] = useState<string[]>([]);
  const [startingWord, setStartingWord] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { start, end } = getCurrentWeekBounds();
      
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const weekStartStr = formatLocalDate(start);
      const weekEndStr = formatLocalDate(end);
      setWeekStart(weekStartStr);

      // Generate days of the week
      const days: string[] = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        days.push(formatLocalDate(day));
      }
      setWeekDays(days);

      const res = await fetch(`/api/scores?weekStart=${weekStartStr}&weekEnd=${weekEndStr}`);
      const scores: Score[] = await res.json();

      // Fetch starting word
      const wordRes = await fetch('/api/starting-words');
      const wordData = await wordRes.json();
      if (wordData && wordData.word) {
        setStartingWord(wordData.word);
      }

      // Group scores by player
      const playerMap: { [key: string]: Omit<PlayerWeekScore, 'rank'> } = {};
      
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

      const leaderboardArray = Object.keys(playerMap)
        .map((username) => ({
          ...playerMap[username],
          rank: 0
        }))
        .sort((a, b) => a.total - b.total)
        .map((player, index) => ({
          ...player,
          rank: index + 1
        }));

      setPlayers(leaderboardArray);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSharePodium = async () => {
    if (!podiumRef.current) return;

    try {
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(podiumRef.current, {
        backgroundColor: '#111827',
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `wordle-podium-${weekStart}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const handleShareBarChart = async () => {
    if (!barChartRef.current) return;

    try {
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(barChartRef.current, {
        backgroundColor: '#111827',
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `wordle-progress-${weekStart}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const handleShareTable = async () => {
    if (!tableRef.current) return;

    try {
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(tableRef.current, {
        backgroundColor: '#111827',
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `wordle-results-${weekStart}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
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
    return <div className="text-white">Loading podium...</div>;
  }

  const top3 = players.slice(0, 3);
  const maxScore = Math.max(...players.map(p => p.total), 1);

  return (
    <div className="space-y-6">
      {/* Podium Card */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Weekly Podium</h3>
          <button
            onClick={handleSharePodium}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
          >
            📸 Download Podium
          </button>
        </div>

        <div ref={podiumRef} className="bg-gray-900 rounded-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">
              🏆 Wordle Nerdles 🤓
            </h2>
            {startingWord ? (
              <div>
                <p className="text-sm text-gray-500 mb-1">Starting Word</p>
                <p className="text-2xl font-bold text-green-500 tracking-wider">{startingWord}</p>
              </div>
            ) : (
              <p className="text-gray-400">
                Week of {weekStart ? new Date(weekStart + 'T12:00:00').toLocaleDateString('en-GB') : ''}
              </p>
            )}
          </div>

          {top3.length >= 3 ? (
            <div className="flex items-end justify-center gap-4 mb-4">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-2">🥈</div>
                  <div className="bg-gray-700 rounded-t-lg px-6 py-4 text-center" style={{ height: '120px' }}>
                    <div className="text-2xl font-bold text-white mb-1">{top3[1].displayName}</div>
                    <div className="text-3xl font-bold text-gray-300">{top3[1].total}</div>
                  </div>
                  <div className="bg-gray-600 w-full text-center py-2 rounded-b-lg">
                    <span className="text-xl font-bold text-white">2nd</span>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <div className="flex flex-col items-center">
                  <div className="text-5xl mb-2">👑</div>
                  <div className="bg-yellow-600 rounded-t-lg px-8 py-6 text-center" style={{ height: '160px' }}>
                    <div className="text-3xl font-bold text-white mb-2">{top3[0].displayName}</div>
                    <div className="text-4xl font-bold text-white">{top3[0].total}</div>
                  </div>
                  <div className="bg-yellow-500 w-full text-center py-2 rounded-b-lg">
                    <span className="text-2xl font-bold text-white">1st</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-2">🥉</div>
                  <div className="bg-gray-700 rounded-t-lg px-6 py-4 text-center" style={{ height: '100px' }}>
                    <div className="text-2xl font-bold text-white mb-1">{top3[2].displayName}</div>
                    <div className="text-3xl font-bold text-orange-400">{top3[2].total}</div>
                  </div>
                  <div className="bg-orange-700 w-full text-center py-2 rounded-b-lg">
                    <span className="text-xl font-bold text-white">3rd</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Need at least 3 players with scores to show podium</p>
          )}
        </div>
      </div>

      {/* Week Progress Bar Chart */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Week Progress</h3>
          <button
            onClick={handleShareBarChart}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
          >
            📸 Download Chart
          </button>
        </div>

        <div ref={barChartRef} className="bg-gray-900 rounded-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              🏆 Wordle Nerdles 🤓
            </h2>
            <p className="text-gray-400">Week-to-Date Scores</p>
            {startingWord && (
              <p className="text-sm text-green-500 mt-1">Starting Word: {startingWord}</p>
            )}
          </div>

          <div className="space-y-3">
            {players.map((player, index) => (
              <div key={player.username} className="flex items-center gap-3">
                <div className="w-12 text-right">
                  <span className="text-lg font-bold text-white">
                    {index === 0 && '🏆'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `${index + 1}`}
                  </span>
                </div>
                <div className="w-24 text-left">
                  <span className="text-white font-medium">{player.displayName}</span>
                </div>
                <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden h-12 flex items-center">
                  <div
                    className={`h-full flex items-center justify-end pr-3 transition-all ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${(player.total / maxScore) * 100}%`, minWidth: '60px' }}
                  >
                    <span className="text-white font-bold text-lg">{player.total}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Results Table */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Full Results</h3>
          <button
            onClick={handleShareTable}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
          >
            📸 Download Table
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <div ref={tableRef}>
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-1">
                🏆 Wordle Nerdles 🤓
              </h2>
              {startingWord && (
                <p className="text-sm text-green-500">Starting Word: {startingWord}</p>
              )}
            </div>

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
                {players.map((player) => (
                  <tr key={player.username} className="border-b border-gray-700">
                    <td className="px-4 py-3 text-white font-medium">
                      {player.rank === 1 && '🏆'} 
                      {player.rank === 2 && '🥈'}
                      {player.rank === 3 && '🥉'}
                      {' '}{player.rank}
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
                        player.rank === 1 ? 'bg-yellow-500 text-white' :
                        player.rank === 2 ? 'bg-gray-400 text-white' :
                        player.rank === 3 ? 'bg-orange-600 text-white' :
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
        </div>
      </div>
    </div>
  );
}