'use client';

import { useState, useEffect } from 'react';
import ScoreEntry from '@/components/ScoreEntry';
import WeeklyLeaderboard from '@/components/WeeklyLeaderboard';
import AllTimeStats from '@/components/AllTimeStats';
import StartingWord from '@/components/StartingWord';
import WeeklyPodium from '@/components/WeeklyPodium';

type Tab = 'weekly' | 'all-time' | 'podium' | 'starting-word';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('weekly');
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<string>('');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.displayName) {
        setCurrentUser(data.displayName);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleScoreSubmitted = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-400">
              {currentUser && (
                <>
                  Logged in as <span className="text-green-500 font-medium">{currentUser}</span>
                </>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm"
            >
              Logout
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">
              🏆 Wordle Nerdles Leaderboard 🤓
            </h1>
            <p className="text-gray-400">Track your daily Wordle scores</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'weekly'
                ? 'text-white border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActiveTab('all-time')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'all-time'
                ? 'text-white border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setActiveTab('podium')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'podium'
                ? 'text-white border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Podium
          </button>
          <button
            onClick={() => setActiveTab('starting-word')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'starting-word'
                ? 'text-white border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Starting Word
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'weekly' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ScoreEntry onScoreSubmitted={handleScoreSubmitted} />
            </div>
            <div className="lg:col-span-2">
              <WeeklyLeaderboard refresh={refreshKey} />
            </div>
          </div>
        )}

        {activeTab === 'all-time' && (
          <div>
            <AllTimeStats />
          </div>
        )}

        {activeTab === 'podium' && (
          <div>
            <WeeklyPodium />
          </div>
        )}

        {activeTab === 'starting-word' && (
          <div className="max-w-2xl mx-auto">
            <StartingWord />
          </div>
        )}
      </div>
    </div>
  );
}