"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircularCountdown } from "@/components/Game/CircularCountdown";
import { Header } from "@/components/Header";
import { MusicPlayer } from "@/components/Game/MusicPlayer";
import { MusicSearch, type Track } from "@/components/Game/MusicSearch";
import { useApi } from "@/lib/useApi";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function Game() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playlistId = searchParams?.get('playlist');
  const tournamentId = searchParams?.get('tournament');
  const existingGameId = searchParams?.get('gameId');
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
  
  // Answer Modal State
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [answerData, setAnswerData] = useState<{
    correct: boolean;
    skipped: boolean;
    earnedScore: number;
    correctMusic: {
      id: number;
      name: string;
      artist: string;
      genre: string;
    } | null;
  } | null>(null);

  const gameplayDuration = 30;

  /**
   * 1. Oyunu Oluştur ve Başlat
   * Backend: POST /api/games -> POST /api/games/{id}/start
   * OR: Use existing game ID if provided (for tournaments)
   */
  const handleStartGame = useCallback(async () => {
    setLoading(true);
    try {
      let gameIdToUse: number;

      // If we have an existing game ID (from tournament), use it
      if (existingGameId) {
        gameIdToUse = parseInt(existingGameId);
        console.log('Using existing game ID:', gameIdToUse);
      } else {
        // Otherwise, create a new game
        const createBody = playlistId ? JSON.stringify({ playlistId: parseInt(playlistId) }) : "";
        
        const createRes = await apiFetch("/api/games", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json" 
          },
          body: createBody,
        });
        
        console.log('Creating game with playlist:', playlistId, 'tournament:', tournamentId);

        if (!createRes.ok) {
          const errorText = await createRes.text();
          console.error("Backend Error:", errorText);
          throw new Error("Oyun oluşturulamadı");
        }

        const gameData = await createRes.json();
        gameIdToUse = gameData.id;
      }
      
      // Start the game (works for both new and existing games)
      const startRes = await apiFetch(`/api/games/${gameIdToUse}/start`, { 
        method: "POST",
        headers: {
          "Accept": "application/json"
        },
      });

      if (!startRes.ok) {
        const errorText = await startRes.text();
        console.error("Start game error:", errorText);
        throw new Error("Oyun başlatılamadı");
      }
      
      const startData = await startRes.json();

      setGameId(gameIdToUse);
      setAudioSrc(startData.nextPreviewUrl);
      setTotalRounds(startData.totalRounds);
      setCurrentRound(startData.currentRound);
      setTotalScore(0);
      setGameStarted(true);
      setRoundStartTime(Date.now());
    } catch (err) {
      console.error("Başlatma hatası detay:", err);
      const errorMessage = err instanceof Error ? err.message : "Oyun başlatılırken bir hata oluştu.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, playlistId, tournamentId, existingGameId]);

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
        
        // Fetch correct music details
        let correctMusic = null;
        if (data.correctMusicId) {
          try {
            const musicRes = await apiFetch(`/api/musics/${data.correctMusicId}`);
            if (musicRes.ok) {
              correctMusic = await musicRes.json();
            }
          } catch (err) {
            console.error("Error fetching music details:", err);
          }
        }
        
        // Show answer modal
        setAnswerData({
          correct: data.correct,
          skipped: false,
          earnedScore: data.earnedScore,
          correctMusic: correctMusic ? {
            id: correctMusic.id,
            name: correctMusic.name,
            artist: correctMusic.artist?.name || "Unknown",
            genre: correctMusic.genre?.name || "Unknown"
          } : null
        });
        setShowAnswerModal(true);
        
        // Store data for later transition
        (window as any).__pendingRoundData = data;
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
      
      console.log('Skip response data:', data);
      
      // Fetch correct music details
      let correctMusic = null;
      if (data.correctMusicId) {
        console.log('Fetching music details for ID:', data.correctMusicId);
        try {
          const musicRes = await apiFetch(`/api/musics/${data.correctMusicId}`);
          console.log('Music API response status:', musicRes.status);
          if (musicRes.ok) {
            correctMusic = await musicRes.json();
            console.log('Fetched music details:', correctMusic);
          } else {
            const errorText = await musicRes.text();
            console.error('Failed to fetch music details:', errorText);
          }
        } catch (err) {
          console.error("Error fetching music details:", err);
        }
      } else {
        console.warn('No correctMusicId in skip response');
      }
      
      // Show answer modal
      setAnswerData({
        correct: false,
        skipped: true,
        earnedScore: 0,
        correctMusic: correctMusic ? {
          id: correctMusic.id,
          name: correctMusic.name,
          artist: correctMusic.artist?.name || "Unknown",
          genre: correctMusic.genre?.name || "Unknown"
        } : null
      });
      setShowAnswerModal(true);
      
      // Store data for later transition
      (window as any).__pendingRoundData = data;
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
   * Continue to next round after viewing answer
   */
  const handleContinue = () => {
    setShowAnswerModal(false);
    const data = (window as any).__pendingRoundData;
    if (data) {
      handleRoundTransition(data);
      (window as any).__pendingRoundData = null;
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
        onExit={() => router.push(tournamentId ? `/tournaments/${tournamentId}` : "/")}
      />

      {showAnswerModal && answerData && (
        <AnswerModal
          correct={answerData.correct}
          skipped={answerData.skipped}
          earnedScore={answerData.earnedScore}
          correctMusic={answerData.correctMusic}
          onContinue={handleContinue}
        />
      )}

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

            <button
              onClick={handleSkip}
              className="px-8 py-3 rounded-xl bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold transition-all border border-slate-300 dark:border-slate-600/50 hover:border-slate-400 dark:hover:border-slate-500"
            >
              Skip
            </button>

            <div className="mt-4 px-6 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xl shadow-lg shadow-emerald-500/10">
              SCORE: {totalScore}
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
          onContinue={() => router.push(tournamentId ? `/tournaments/${tournamentId}` : "/")}
        />
      )}
    </div>
  );
}

const StartModal = ({ onStart, loading }: { onStart: () => void; loading: boolean }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-sm px-4">
    <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center shadow-2xl">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">MusiGuessr</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
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
        <div className="text-6xl font-black text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
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

const AnswerModal = ({
  correct,
  skipped,
  earnedScore,
  correctMusic,
  onContinue,
}: {
  correct: boolean;
  skipped: boolean;
  earnedScore: number;
  correctMusic: { id: number; name: string; artist: string; genre: string } | null;
  onContinue: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-black/95 backdrop-blur-md px-4">
    <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center shadow-2xl">
      {/* Correct/Wrong/Skipped Icon */}
      <div className={`mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full ${
        correct ? 'bg-green-500/20 text-green-500 dark:text-green-400' : skipped ? 'bg-yellow-500/20 text-yellow-500 dark:text-yellow-400' : 'bg-red-500/20 text-red-500 dark:text-red-400'
      }`}>
        {correct ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : skipped ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      {/* Result Text */}
      <h2 className={`text-3xl font-bold mb-2 ${
        correct ? 'text-green-500 dark:text-green-400' : skipped ? 'text-yellow-500 dark:text-yellow-400' : 'text-red-500 dark:text-red-400'
      }`}>
        {correct ? 'Doğru!' : skipped ? 'Pas Geçildi!' : 'Yanlış!'}
      </h2>

      {/* Score */}
      {correct && (
        <p className="text-yellow-500 dark:text-yellow-400 font-bold text-xl mb-4">
          +{earnedScore} puan
        </p>
      )}

      {/* Correct Song Details */}
      {correctMusic ? (
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">Doğru Şarkı:</p>
          <div className="space-y-2 text-left">
            <div>
              <span className="text-blue-600 dark:text-blue-400 text-sm">Şarkı: </span>
              <span className="text-slate-900 dark:text-white font-semibold">{correctMusic.name}</span>
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-400 text-sm">Sanatçı: </span>
              <span className="text-slate-900 dark:text-white font-semibold">{correctMusic.artist}</span>
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-400 text-sm">Tür: </span>
              <span className="text-slate-900 dark:text-white font-semibold">{correctMusic.genre}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Şarkı bilgisi yükleniyor...</p>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={onContinue}
        className="w-full rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white transition-all hover:bg-blue-500 active:scale-95"
      >
        Devam Et
      </button>
    </div>
  </div>
);