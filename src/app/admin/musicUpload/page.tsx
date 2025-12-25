'use client';

import MusicUpdate from '@/components/AdminOps/MusicUpdate';
import MusicUpload from '@/components/AdminOps/MusicUpload';
import TournamentManage from '@/components/AdminOps/TournamentManage';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function MusicUploadPage() {
  const [activeTab, setActiveTab] = useState<'add' | 'update'>('add');
  
  return (
    <div className="p-8">
      {/* Tabs */}
      <div className="mb-6 border-b border-slate-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'add'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Add Music
          </button>
          <button
            onClick={() => setActiveTab('update')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'update'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Update Music
          </button>
        </div>
      </div>

      {/** 
       * We may add that to header?
        rightContent={
          hasUser ? (
            <div className="flex items-center gap-2 mr-2 md:mr-4">
              <button
                onClick={() => router.push("/profile")}
                className="px-2 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 md:gap-2 transition-colors"
                title="View Profile"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="hidden sm:inline">Profile</span>
              </button>
            </div>
          ) : null
          
      }
      */}

      {activeTab === 'add' ? (     
          <MusicUpload apiBase={API_BASE} />
        ) : (
          <MusicUpdate apiBase={API_BASE} />
        )}
    </div>
  );
}
