'use client';

import React, { useMemo } from 'react';
import ShareGamePost, { ShareGamePostData } from '@/components/Game/ShareGamePost';

const MOCKS: Record<number, ShareGamePostData> = {
  1: {
    gameId: 1,
    gameScore: 100,
    playedAt: 'a time',
    truePredict: 2,
    falsePredict: 1,
    gameHistory: {
      song1: { Response: true, songName: 'Song 1' },
      song2: { Response: false, song_name: 'Song 2' },
      song3: { Response: true, song_name: 'Song 3' },
    },
  },

  2: {
    gameId: 2,
    gameScore: 60,
    playedAt: 'yesterday 20:30',
    truePredict: 1,
    falsePredict: 2,
    gameHistory: {
      song1: { Response: false, song_name: 'Another Song' },
      song2: { Response: true, songName: 'Hit Track' },
      song3: { Response: false, song_name: 'Old Classic' },
    },
  },
};

export default function ShareGamePage({ params }: { params: { id: string } }) {
  const idNum = Number(params.id);

  const data = useMemo(() => {
    return MOCKS[idNum] ?? {
      gameId: idNum || 0,
      gameScore: 0,
      playedAt: 'unknown',
      truePredict: 0,
      falsePredict: 0,
      gameHistory: {},
    };
  }, [idNum]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white flex items-center justify-center px-4 py-10">
      <ShareGamePost data={data} />
    </div>
  );
}
