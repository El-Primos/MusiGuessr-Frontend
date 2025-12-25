"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CircularCountdown } from "@/components/Game/CircularCountdown";
import { Header } from "@/components/Header";
import { MusicPlayer } from "@/components/Game/MusicPlayer";
import { MusicSearch, type Track } from "@/components/Game/MusicSearch";
import { useApi } from "@/lib/useApi";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function Game() {
  const router = useRouter();
  const { apiFetch } = useApi(API_BASE);

  // API State
  const [gameId, setGameId] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [totalScore, setTotalScore] = useState(0);

  // UI State
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResetToken, setSearchResetToken] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState<number>(0);

  const gameplayDuration = 30;

  /**
   * 1. Oyunu Oluştur ve Başlat
   * Backend: POST /api/games -> POST /api/games/{id}/start
   */
  const handleStartGame = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Create Game
      // Body kısmını tamamen boş bırakıyoruz (Swagger'daki gibi)
      const createRes = await apiFetch("/api/games", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json" 
        },
        body: "", // {} yerine boş string gönderiyoruz
      });

      if (!createRes.ok) {
        const errorText = await createRes.text();
        console.error("Backend Error:", errorText);
        throw new Error("Oyun oluşturulamadı");
      }

      const gameData = await createRes.json();
      
      // 2. Start Game
      const startRes = await apiFetch(`/api/games/${gameData.id}/start`, { 
        method: "POST",
        body: "" // Burada da body boş olmalı
      });

      if (!startRes.ok) throw new Error("Oyun başlatılamadı");
      
      const startData = await startRes.json();

      setGameId(gameData.id);
      setAudioSrc(startData.nextPreviewUrl);
      setTotalRounds(startData.totalRounds);
      setCurrentRound(startData.currentRound);
      setTotalScore(0);
      setGameStarted(true);
      setRoundStartTime(Date.now());
    } catch (err) {
      console.error("Başlatma hatası detay:", err);
      alert("Oyun başlatılırken bir hata oluştu. Konsolu kontrol edin.");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  /**
   * 2. Tahmin Gönder (Guess)
   * Backend: POST /api/games/{id}/guess
   */
  const handleGuess = useCallback(
    async (track: Track) => {
      if (!gameId || gameOver) return;

      const elapsedMs = Date.now() - roundStartTime;

      try {
        const res = await apiFetch(`/api/games/${gameId}/guess`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            musicId: track.id,
            elapsedMs: elapsedMs,
          }),
        });
        const data = await res.json();
        handleRoundTransition(data);
      } catch (err) {
        console.error("Tahmin hatası:", err);
      }
    },
    [apiFetch, gameId, gameOver, roundStartTime]
  );

  /**
   * 3. Pas Geç veya Zaman Doldu (Skip)
   * Backend: GET /api/games/{id}/skip
   */
  const handleSkip = useCallback(async () => {
    if (!gameId || gameOver) return;

    try {
      const res = await apiFetch(`/api/games/${gameId}/skip`);
      const data = await res.json();
      handleRoundTransition(data);
    } catch (err) {
      console.error("Pas geçme hatası:", err);
    }
  }, [apiFetch, gameId, gameOver]);

  /**
   * Raund geçişlerini yöneten yardımcı fonksiyon
   */
  const handleRoundTransition = (data: any) => {
    setTotalScore(data.totalScore);
    
    if (data.gameFinished) {
      handleFinishGame();
    } else {
      setAudioSrc(data.nextPreviewUrl);
      setCurrentRound(data.nextRound);
      setRoundStartTime(Date.now());
      // Arama kutusunu temizlemek için sinyal gönder
      setSearchResetToken((prev) => prev + 1);
    }
  };

  /**
   * 4. Oyunu Bitir
   * Backend: POST /api/games/{id}/finish
   */
  const handleFinishGame = useCallback(async () => {
    if (!gameId) return;
    try {
      await apiFetch(`/api/games/${gameId}/finish`, { method: "POST" });
    } catch (err) {
      console.error("Oyun kapatma hatası:", err);
    } finally {
      setGameOver(true);
    }
  }, [apiFetch, gameId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black text-slate-900 dark:text-white">
      <Header
        logoSrc="/logo.png"
        exitVisible={true}
        onExit={() => router.push("/")}
      />

      <main className="pt-8 pb-1 px-4 max-w-5xl mx-auto flex flex-col items-center">
        {gameStarted && !gameOver && (
          <section className="w-full flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
               <CircularCountdown
                key={currentRound} 
                duration={gameplayDuration}
                onComplete={handleSkip}
              />
              <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-xs">
                Raund {currentRound} / {totalRounds}
              </span>
            </div>

            <MusicPlayer
              key={audioSrc}
              src={audioSrc}
              autoPlay
              onEnded={handleSkip}
            />

            <div className="w-full max-w-md">
              <MusicSearch
                onSelect={handleGuess}
                resetSignal={searchResetToken}
              />
            </div>

            <div className="mt-4 px-6 py-2 rounded-full border border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xl shadow-lg shadow-emerald-500/10">
              SKOR: {totalScore}
            </div>
          </section>
        )}
      </main>

      {!gameStarted && (
        <StartModal onStart={handleStartGame} loading={loading} />
      )}

      {gameOver && (
        <ResultModal
          score={totalScore}
          onContinue={() => router.push("/")}
        />
      )}
    </div>
  );
}

const StartModal = ({ onStart, loading }: { onStart: () => void; loading: boolean }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-sm px-4">
    <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center shadow-2xl">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">MusiGuessr</h2>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">
        Şarkıları dinle, sanatçıyı bul, en yüksek skoru sen yap!
      </p>
      <button
        onClick={onStart}
        disabled={loading}
        className="w-full rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white transition-all hover:bg-blue-500 hover:scale-[1.02] disabled:opacity-50 active:scale-95"
      >
        {loading ? "Hazırlanıyor..." : "Oyunu Başlat"}
      </button>
    </div>
  </div>
);

const ResultModal = ({ score, onContinue }: { score: number; onContinue: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-black/95 backdrop-blur-md px-4">
    <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center shadow-2xl">
      <p className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-xs mb-2">Oyun Tamamlandı</p>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Final Skorun</h2>
      
      <div className="mb-8 relative">
        <div className="text-6xl font-black text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
          {score}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onContinue}
          className="w-full rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white transition-all hover:bg-blue-500 active:scale-95"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  </div>
);