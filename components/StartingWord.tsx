'use client';

import { useState, useEffect } from 'react';

interface StartingWordData {
  id: number;
  word: string;
  chosen_by_name: string;
  week_start: string;
}

export default function StartingWord({ onWordSet }: { onWordSet?: () => void }) {
  const [currentWord, setCurrentWord] = useState<StartingWordData | null>(null);
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchCurrentWord();
  }, []);

  const fetchCurrentWord = async () => {
    try {
      const res = await fetch('/api/starting-words');
      const data = await res.json();
      setCurrentWord(data);
    } catch (error) {
      console.error('Error fetching starting word:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate word is 5 characters and only letters
    if (newWord.length !== 5) {
      setMessage({ type: 'error', text: 'Word must be exactly 5 characters' });
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z]+$/.test(newWord)) {
      setMessage({ type: 'error', text: 'Word must contain only letters' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/starting-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: newWord }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Starting word set successfully!' });
        setNewWord('');
        fetchCurrentWord();
        if (onWordSet) onWordSet();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to set starting word' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Starting Word */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl">💡</span>
          <h2 className="text-2xl font-bold text-white">This Week's Starting Word</h2>
        </div>
        {currentWord ? (
          <>
            <div className="text-5xl font-bold text-green-500 mb-2 tracking-wider">
              {currentWord.word}
            </div>
            <p className="text-gray-400">Chosen by {currentWord.chosen_by_name}</p>
          </>
        ) : (
          <p className="text-gray-400 text-lg">No starting word set for this week yet!</p>
        )}
      </div>

      {/* Set New Starting Word */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Set Starting Word</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Starting Word (5 letters)
            </label>
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value.toUpperCase())}
              maxLength={5}
              placeholder="CRANE"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <p className="text-sm text-gray-400 mt-1">
              Must be 5 letters and not previously used
            </p>
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
            {loading ? 'Setting...' : 'Set Starting Word'}
          </button>
        </form>
      </div>
    </div>
  );
}