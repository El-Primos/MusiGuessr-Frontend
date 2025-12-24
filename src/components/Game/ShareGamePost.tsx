'use client';

import React, { useMemo } from 'react';

type GameHistoryItem = {
  Response: boolean;
  songName?: string;   // bazen songName
  song_name?: string;  // bazen song_name
};

export type ShareGamePostData = {
  gameId: number;
  gameScore: number;
  playedAt: string;
  truePredict: number;
  falsePredict: number;
  gameHistory: Record<string, GameHistoryItem>;
};

function formatSongName(it: GameHistoryItem) {
  return it.songName ?? it.song_name ?? 'Unknown Song';
}

export default function ShareGamePost({ data }: { data: ShareGamePostData }) {
  const historyEntries = useMemo(
    () => Object.entries(data.gameHistory ?? {}),
    [data.gameHistory]
  );

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-6 py-6 shadow-lg text-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">MusiGuessr • Game #{data.gameId}</h2>
          <p className="text-white/60 text-sm mt-1">Played at: {data.playedAt}</p>
        </div>

        <div className="text-right">
          <div className="text-white/60 text-sm">Score</div>
          <div className="text-3xl font-bold">{data.gameScore}</div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
          <div className="text-white/60 text-sm">True predictions</div>
          <div className="text-xl font-semibold mt-1">{data.truePredict}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
          <div className="text-white/60 text-sm">False predictions</div>
          <div className="text-xl font-semibold mt-1">{data.falsePredict}</div>
        </div>
      </div>

      {/* History */}
      <div className="mt-6">
        <div className="text-white/70 text-sm font-semibold mb-2">Game history</div>

        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-12 bg-slate-900/60 text-white/70 text-xs font-semibold">
            <div className="col-span-2 px-3 py-2">#</div>
            <div className="col-span-8 px-3 py-2">Song</div>
            <div className="col-span-2 px-3 py-2 text-right">Result</div>
          </div>

          <div className="divide-y divide-white/10">
            {historyEntries.map(([key, item], idx) => {
              const ok = Boolean(item.Response);
              return (
                <div
                  key={key}
                  className="grid grid-cols-12 bg-slate-950/40 hover:bg-slate-900/40"
                >
                  <div className="col-span-2 px-3 py-3 text-white/60 text-sm">
                    {idx + 1}
                  </div>
                  <div className="col-span-8 px-3 py-3 text-sm font-medium">
                    {formatSongName(item)}
                    <span className="ml-2 text-xs text-white/40">({key})</span>
                  </div>
                  <div className="col-span-2 px-3 py-3 text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold border ${
                        ok
                          ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
                          : 'bg-red-500/15 text-red-200 border-red-500/30'
                      }`}
                    >
                      {ok ? 'TRUE' : 'FALSE'}
                    </span>
                  </div>
                </div>
              );
            })}

            {historyEntries.length === 0 && (
              <div className="px-3 py-4 text-white/60 text-sm">
                No history found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer action (şimdilik sadece görsel) */}
      <div className="mt-6 flex items-center justify-between text-xs text-white/40">
        <span>Share link: /share/game/{data.gameId}</span>
        <span>Mock post</span>
      </div>
    </div>
  );
}
