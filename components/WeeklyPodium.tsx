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
  total: number;
  rank: number;
}

export default function WeeklyPodium() {
  const podiumRef = useRef<HTMLDivElement>(null);
  const [players, setPlayers] = useState<PlayerWeekScore[]>([]);
  const [weekStart, setWeekStart] = useState<string>('');
  const [startingWord, setStartingWord] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { start, end } = getCurrentWeekBounds();
      const weekStartStr = start.toISOString().split('T')[0];
      const weekEndStr = end.toISOString().split('T')[0];
      setWeekStart(weekStartStr);

      const res = await fetch(`/api/scores?weekStart=${weekStartStr}&weekEnd=${weekEndStr}`);
      const scores: Score[] = await res.json();

      // Fetch starting word
      const wordRes = await fetch('/api/starting-words');
      const wordData = await wordRes.json();
      if (wordData && wordData.word) {
        setStartingWord(wordData.word);
      }

      // Group scores by player
      const playerMap: { [key: string]: { displayName: string; total: number } } = {};
      
      scores.forEach((score) => {
        if (!playerMap[score.username]) {
          playerMap[score.username] = {
            displayName: score.display_name,
            total: 0,
          };
        }
        playerMap[score.username].total += score.score;
      });

      const leaderboardArray = Object.keys(playerMap)
        .map((username) => ({
          displayName: playerMap[username].displayName,
          username,
          total: playerMap[username].total,
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

  const handleShare = async () => {
    if (!podiumRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(podiumRef.current, {
        backgroundColor: '#1f2937',
        scale: 2,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `wordle-leaderboard-${weekStart}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  if (loading) {
    return <div className="text-white">Loading podium...</div>;
  }

  const top3 = players.slice(0, 3);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Weekly Podium</h3>
        <button
          onClick={handleShare}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
        >
          📸 Download Image
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
  );
}