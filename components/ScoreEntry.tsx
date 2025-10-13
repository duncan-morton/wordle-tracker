'use client';

import { useState, useEffect } from 'react';

interface StartingWordData {
  word: string;
  chosen_by_name: string;
}

export default function ScoreEntry({ onScoreSubmitted }: { onScoreSubmitted?: () => void }) {
  const [score, setScore] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [wordleNumber, setWordleNumber] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [startingWord, setStartingWord] = useState<StartingWordData | null>(null);

  useEffect(() => {
    // Calculate Wordle number based on selected date
    const selectedDate = new Date(date);
    const startDate = new Date('2021-06-19');
    const diffTime = Math.abs(selectedDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setWordleNumber(diffDays);
  }, [date]);

  useEffect(() => {
    fetchStartingWord();
  }, []);

  const fetchStartingWord = async () => {
    try {
      const res = await fetch('/api/starting-words');
      const data = await res.json();
      setStartingWord(data);
    } catch (error) {
      console.error('Error fetching starting word:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordleNumber,
          score,
          date,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Score saved successfully!' });
        if (onScoreSubmitted) onScoreSubmitted();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to save score' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-4">Add Score</h2>
      
      {/* Show current starting word */}
      {startingWord && (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg border border-gray-600 text-center">
          <p className="text-xs text-gray-400 mb-1">This Week&apos;s Starting Word</p>
          <p className="text-2xl font-bold text-green-500 tracking-wider">{startingWord.word}</p>
          <p className="text-xs text-gray-400 mt-1">by {startingWord.chosen_by_name}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Wordle Number
          </label>
          <input
            type="number"
            value={wordleNumber}
            onChange={(e) => setWordleNumber(Number(e.target.value))}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <p className="text-sm text-gray-400 mt-1">Auto-calculated, but you can edit if needed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Score
          </label>
          <select
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value={1}>1 - Ace! 🎯</option>
            <option value={2}>2 - Excellent! 🌟</option>
            <option value={3}>3 - Great! ✨</option>
            <option value={4}>4 - Good 👍</option>
            <option value={5}>5 - Not bad 😊</option>
            <option value={6}>6 - Close call! 😅</option>
            <option value={10}>Bust (Failed) ❌</option>
          </select>
        </div>

        {message && (
          <div className={`px-4 py-2 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500 text-green-500'
              : 'bg-red-500/10 border border-red-500 text-red-500'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Score'}
        </button>
      </form>
    </div>
  );
}