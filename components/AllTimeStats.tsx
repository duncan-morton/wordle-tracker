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
}

export default function AllTimeStats() {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
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

  if (loading) {
    return <div className="text-white">Loading stats...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">All-Time Statistics</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-gray-300 font-medium">Rank</th>
              <th className="px-4 py-3 text-gray-300 font-medium">Player</th>
              <th className="px-4 py-3 text-center text-gray-300 font-medium">Games</th>
              <th className="px-4 py-3 text-center text-gray-300 font-medium">Avg Score</th>
              <th className="px-4 py-3 text-center text-gray-300 font-medium">Best</th>
              <th className="px-4 py-3 text-center text-gray-300 font-medium">Worst</th>
              <th className="px-4 py-3 text-center text-gray-300 font-medium">Excellent (≤3)</th>
              <th className="px-4 py-3 text-center text-gray-300 font-medium">Busts</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((player, index) => (
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
                <td className="px-4 py-3 text-center text-gray-300">{player.excellent_count || 0}</td>
                <td className="px-4 py-3 text-center text-gray-300">{player.bust_count || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stats.length === 0 && (
        <p className="text-gray-400 text-center py-8">No stats available yet. Start playing!</p>
      )}
    </div>
  );
}