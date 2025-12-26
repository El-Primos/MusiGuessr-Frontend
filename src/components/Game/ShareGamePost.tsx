"use client";

import React, { useMemo } from "react";

export type GameHistoryItem = {
  response?: boolean;
  songName?: string;
  guessedSong?: string;
  guessTime?: number;
  scoreEarned?: number;
  round?: number;
};

export type ShareGamePostData = {
  postId: number;
  userId: number;
  gameHistoryId: number;
  gameScore: number;
  playedAt: string;
  predictions: boolean[];
  gameHistory: Record<string, GameHistoryItem>;
};

export default function ShareGamePost({ data }: { data: ShareGamePostData }) {

  // 1. gameHistory objesini diziye çevir ve round'a göre sırala
  const historyList = useMemo(() => {
    if (!data.gameHistory) return [];
    
    const list = Object.values(data.gameHistory).sort((a, b) => 
      (a.round ?? 0) - (b.round ?? 0)
    );
    
    return list;
  }, [data.gameHistory]);

  // 2. Doğru/Yanlış sayılarını hesapla
  const correctCount = data.predictions?.filter(p => p === true).length ?? 0;
  const wrongCount = (data.predictions?.length ?? 0) - correctCount;

  return (
    <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl p-6 text-white shadow-2xl">
      {/* Header Bölümü */}
      <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold">Oyun Özeti #{data.postId}</h2>
          <p className="text-xs text-white/40">Tarih: {new Date(data.playedAt).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/40 uppercase tracking-widest">Toplam Skor</p>
          <p className="text-3xl font-black text-emerald-400">{data.gameScore}</p> {/** || historyList.reduce((a,b) => a + (b.scoreEarned ?? 0), 0) */}
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-center">
          <p className="text-xs text-emerald-500/60 font-bold">DOĞRU</p>
          <p className="text-xl font-bold text-emerald-400">{correctCount}</p>
        </div>
        <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 text-center">
          <p className="text-xs text-red-500/60 font-bold">YANLIŞ</p>
          <p className="text-xl font-bold text-red-400">{wrongCount}</p>
        </div>
      </div>

      {/* Şarkı Listesi */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white/60 px-1">Şarkı Geçmişi</h3>
        {historyList.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all"
          >
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-white/20">{item.round}</span>
              <div>
                <p className="font-semibold text-sm">{item.songName}</p>
                <p className="text-xs text-white/40">Tahmin: {item.guessedSong}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${item.response ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.response ? `+${item.scoreEarned}` : '0'}
              </p>
              <p className="text-[10px] text-white/20">{item.guessTime} saniye</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t border-white/5 text-center">
        <p className="text-[10px] text-white/20 tracking-tighter italic">MusiGuessr • 2025</p>
      </div>
    </div>
  );
}