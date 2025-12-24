'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/useApi';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

interface Stats {
  totalUsers: number;
  totalArtists: number;
  totalGenres: number;
  totalMusic: number;
  totalPlaylists: number;
  totalTournaments: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { apiFetch } = useApi(API_BASE);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [users, artists, genres, music, playlists, tournaments] =
        await Promise.all([
          apiFetch('/api/users').then((r) => r.json()),
          apiFetch('/api/artists').then((r) => r.json()),
          apiFetch('/api/genres').then((r) => r.json()),
          apiFetch('/api/musics').then((r) => r.json()),
          apiFetch('/api/playlists').then((r) => r.json()),
          apiFetch('/api/tournaments').then((r) => r.json()),
        ]);

      setStats({
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalArtists: Array.isArray(artists) ? artists.length : 0,
        totalGenres: Array.isArray(genres) ? genres.length : 0,
        totalMusic: Array.isArray(music) ? music.length : 0,
        totalPlaylists: Array.isArray(playlists) ? playlists.length : 0,
        totalTournaments: Array.isArray(tournaments) ? tournaments.length : 0,
      });
    } catch (err: unknown) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats
    ? [
        {
          title: 'Total Users',
          value: stats.totalUsers,
          icon: '👥',
          color: 'from-blue-500 to-blue-600',
          link: '/admin/users',
        },
        {
          title: 'Total Artists',
          value: stats.totalArtists,
          icon: '🎤',
          color: 'from-purple-500 to-purple-600',
          link: '/admin/artist',
        },
        {
          title: 'Total Genres',
          value: stats.totalGenres,
          icon: '🎵',
          color: 'from-pink-500 to-pink-600',
          link: '/admin/genre',
        },
        {
          title: 'Total Songs',
          value: stats.totalMusic,
          icon: '🎶',
          color: 'from-green-500 to-green-600',
          link: '/admin/musicUpload',
        },
        {
          title: 'Total Playlists',
          value: stats.totalPlaylists,
          icon: '📝',
          color: 'from-yellow-500 to-yellow-600',
          link: '/admin/playlist',
        },
        {
          title: 'Total Tournaments',
          value: stats.totalTournaments,
          icon: '🏆',
          color: 'from-red-500 to-red-600',
          link: '/admin/tournament',
        },
      ]
    : [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">
          Welcome to the MusiGuessr admin control panel
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading statistics...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {!loading && !error && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card) => (
            <div
              key={card.title}
              onClick={() => router.push(card.link)}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`text-4xl p-3 rounded-lg bg-gradient-to-br ${card.color} shadow-lg`}
                >
                  {card.icon}
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold group-hover:text-blue-400 transition-colors">
                    {card.value}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>View details</span>
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {!loading && !error && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/admin/musicUpload')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span>⬆️</span>
              Upload Music
            </button>
            <button
              onClick={() => router.push('/admin/tournament')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span>🏆</span>
              Create Tournament
            </button>
            <button
              onClick={() => router.push('/admin/playlist')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span>📝</span>
              Manage Playlists
            </button>
            <button
              onClick={() => router.push('/admin/users')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span>👥</span>
              Manage Users
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
