'use client';

import { useEffect, useState } from 'react';

interface PlayerStats {
  username: string;
  display_name: string;
  games_played: number;
  avg_score: number;
  best_score: number;
  worst_score: number;
  excellent_count: number;
  bust_count: number;
  best_weekly_score: number | null;
}

interface PlayerStreak {
  username: string;
  displayName: string;
  currentStreak: number;
  longestStreak: number;
}

export default function AllTimeStats() {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [streaks, setStreaks] = useState<PlayerStreak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchStreaks();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreaks = async () => {
    try {
      const res = await fetch('/api/stats/streaks');
      const data = await res.json();
      setStreaks(data);
    } catch (error) {
      console.error('Error fetching streaks:', error);
    }
  };

  const getStreakForUser = (username: string) => {
    return streaks.find(s => s.username === username);
  };

  if (loading) {
    return <div className="text-white">Loading stats...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Highlight Cards - 3 columns */}
      {streaks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Streak */}
          <div className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-lg p-6 text-center border border-orange-400">
            <div className="text-3xl mb-2">🔥</div>
            <h3 className="text-lg font-medium text-orange-100 mb-1">Longest Current Streak</h3>
            {(() => {
              const topStreak = [...streaks].sort((a, b) => b.currentStreak - a.currentStreak)[0];
              return (
                <>
                  <p className="text-3xl font-bold text-white">{topStreak.displayName}</p>
                  <p className="text-xl text-orange-100">{topStreak.currentStreak} days</p>
                </>
              );
            })()}
          </div>

          {/* Best All-Time Streak */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg p-6 text-center border border-purple-400">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="text-lg font-medium text-purple-100 mb-1">Best All-Time Streak</h3>
            {(() => {
              const bestStreak = [...streaks].sort((a, b) => b.longestStreak - a.longestStreak)[0];
              return (
                <>
                  <p className="text-3xl font-bold text-white">{bestStreak.displayName}</p>
                  <p className="text-xl text-purple-100">{bestStreak.longestStreak} days</p>
                </>
              );
            })()}
          </div>

          {/* Best Weekly Score */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg p-6 text-center border border-blue-400">
            <div className="text-3xl mb-2">🏅</div>
            <h3 className="text-lg font-medium text-blue-100 mb-1">Best Weekly Score</h3>
            {(() => {
              const bestWeek = [...stats].filter(s => s.best_weekly_score).sort((a, b) => (a.best_weekly_score || 999) - (b.best_weekly_score || 999))[0];
              return bestWeek && bestWeek.best_weekly_score ? (
                <>
                  <p className="text-3xl font-bold text-white">{bestWeek.display_name}</p>
                  <p className="text-xl text-blue-100">{bestWeek.best_weekly_score} points</p>
                </>
              ) : (
                <p className="text-lg text-blue-100">No data yet</p>
              );
            })()}
          </div>
        </div>
      )}

      {/* All-Time Stats Table */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">All-Time Statistics</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-gray-300 font-medium">Rank</th>
                <th className="px-4 py-3 text-gray-300 font-medium">Player</th>
                <th className="px-4 py-3 text-center text-gray-300 font-medium">Games</th>
                <th className="px-4 py-3 text-center text-gray-300 font-medium">Avg</th>
                <th className="px-4 py-3 text-center text-gray-300 font-medium">Best</th>
                <th className="px-4 py-3 text-center text-gray-300 font-medium">Worst</th>
                <th className="px-4 py-3 text-center text-gray-300 font-medium">Best Week</th>
                <th className="px-4 py-3 text-center text-gray-300 font-medium">⭐ ≤3</th>
                <th className="px-4 py-3 text-center text-gray-300 font-medium">❌ Busts</th>
                <th className="px-4 py-3 text-center text-gray-300 font-medium">🔥 Streak</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((player, index) => {
                const streak = getStreakForUser(player.username);
                return (
                  <tr key={player.username} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3 text-white font-medium">
                      {index === 0 && '👑'} {index + 1}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{player.display_name}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{player.games_played || 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${
                        !player.avg_score ? 'text-gray-500' :
                        player.avg_score <= 3.5 ? 'text-green-500' :
                        player.avg_score <= 4.5 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {player.avg_score ? player.avg_score : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-green-500 font-bold">
                        {player.best_score || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-red-500 font-bold">
                        {player.worst_score || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-blue-500 font-bold">
                        {player.best_weekly_score || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">{player.excellent_count || 0}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{player.bust_count || 0}</td>
                    <td className="px-4 py-3 text-center">
                      {streak && (
                        <div className="text-center">
                          <div className="text-orange-500 font-bold">{streak.currentStreak}</div>
                          <div className="text-xs text-gray-500">({streak.longestStreak} max)</div>
                        </div>
                      )}
                      {!streak && <span className="text-gray-500">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {stats.length === 0 && (
          <p className="text-gray-400 text-center py-8">No stats available yet. Start playing!</p>
        )}
      </div>
    </div>
  );
}