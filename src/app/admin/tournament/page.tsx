'use client';

import TournamentCreate from '@/components/AdminOps/TournamentCreate';
import TournamentManage from '@/components/AdminOps/TournamentManage';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function TournamentPage() {
  const [activeTab, setActiveTab] = useState<'manage' | 'create'>('manage');

  return (
    <div className="p-8">
      {/* Tabs */}
      <div className="mb-6 border-b border-slate-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'manage'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Manage Tournaments
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'create'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Tournament
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'manage' ? (
        <TournamentManage
          apiBase={API_BASE}
          playlistEditPath="/admin/playlists"
          endpoints={{
            // eğer backend farklıysa örnek:
            // update: (id)=>`/api/tournaments/${id}/update-time`,
            // del: (id)=>`/api/tournaments/${id}`,
            // participantRemove: (tid, uid)=>`/api/tournaments/${tid}/participants/${uid}`,
          }}
        />
      ) : (
        <TournamentCreate apiBase={API_BASE} onCreated={() => setActiveTab('manage')} />
      )}
    </div>
  );
}
