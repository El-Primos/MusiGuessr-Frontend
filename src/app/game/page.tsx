"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircularCountdown } from "@/components/Game/CircularCountdown";
import { Header } from "@/components/Game/Header";
import { MusicPlayer } from "@/components/Game/MusicPlayer";
import { MusicSearch, type Track } from "@/components/Game/MusicSearch";

// Example metrics for search and listen music
interface PlayingTrack {
  id: number;
  src: string;
  second: number;
  artist: string;
  title: string;
}

const searchTracks: Track[] = [
  { id: 1, artist: "Coldplay", title: "Fix You" },
  { id: 2, artist: "Coldplay", title: "Yellow" },
  { id: 3, artist: "Daft Punk", title: "Get Lucky" },
  { id: 4, artist: "The Weeknd", title: "Blinding Lights" },
  { id: 5, artist: "Taylor Swift", title: "Love Story" },
  { id: 6, artist: "Ed Sheeran", title: "Shape of You" },
  { id: 7, artist: "Radiohead", title: "Creep" },
  { id: 8, artist: "Arctic Monkeys", title: "Do I Wanna Know?" },
  { id: 9, artist: "Mor ve Ötesi", title: "Cambaz" },
  { id: 10, artist: "AI", title: "Moonlit" },
];

const playingTracks: PlayingTrack[] = [
  {
    id: 1,
    src: "/audio/moonlit.mp3",
    second: 0,
    artist: "AI",
    title: "Moonlit",
  },
  {
    id: 2,
    src: "/audio/cambaz.mp3",
    second: 0,
    artist: "Mor ve Ötesi",
    title: "Cambaz",
  },
];

export default function Game() {
  const router = useRouter();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [predict_true, setPredictTrue] = useState(0);
  const [predict_false, setPredictFalse] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const gameplayDuration = 30;

  const currentPlayingTrack =
    currentTrackIndex < playingTracks.length
      ? playingTracks[currentTrackIndex]
      : null;

  const audioSrc = useMemo(() => {
    if (!currentPlayingTrack) return "";
    return currentPlayingTrack.src.startsWith("/")
      ? currentPlayingTrack.src
      : `/${currentPlayingTrack.src}`;
  }, [currentPlayingTrack]);

  const advanceToNextTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => {
      const next = prev + 1;
      if (next >= playingTracks.length) {
        setGameOver(true);
        return playingTracks.length;
      }
      return next;
    });
  }, []);

  const handleGuess = useCallback(
    (track: Track) => {
      if (!currentPlayingTrack || gameOver || !gameStarted) return;

      const isCorrect =
        track.title.toLowerCase() === currentPlayingTrack.title.toLowerCase() &&
        track.artist.toLowerCase() === currentPlayingTrack.artist.toLowerCase();

      if (isCorrect) {
        setPredictTrue((prev) => prev + 1);
      } else {
        setPredictFalse((prev) => prev + 1);
      }

      advanceToNextTrack();
    },
    [advanceToNextTrack, currentPlayingTrack, gameOver, gameStarted]
  );

  const handleTrackExpired = useCallback(() => {
    if (!currentPlayingTrack || gameOver) return;
    setPredictFalse((prev) => prev + 1);
    advanceToNextTrack();
  }, [advanceToNextTrack, currentPlayingTrack, gameOver]);

  const handleCountdownComplete = useCallback(() => {
    if (!gameStarted) return;
    setTimerFinished(true);
    setGameOver(true);
    setCurrentTrackIndex(playingTracks.length);
  }, [gameStarted]);

  const handleStartGame = useCallback(() => {
    setPredictTrue(0);
    setPredictFalse(0);
    setCurrentTrackIndex(0);
    setTimerFinished(false);
    setGameOver(false);
    setGameStarted(true);
  }, []);

  const handleExitGame = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      <Header
        logoSrc="/logo.png"
        onExit={() => console.log("EXIT")}
        className="top-0 left-0"
      />

      <main className="pt-1 pb-1 px-4 max-w-5xl mx-auto">
        <section className="flex flex-col items-center gap-2">
          {gameStarted && (
            <CircularCountdown
              duration={gameplayDuration}
              onComplete={handleCountdownComplete}
            />
          )}

          {gameStarted && currentPlayingTrack && (
            <MusicPlayer
              key={currentPlayingTrack.id}
              src={audioSrc}
              title={currentPlayingTrack.title}
              artist={currentPlayingTrack.artist}
              autoPlay
              onEnded={handleTrackExpired}
            />
          )}

          {gameStarted && (
            <div className="flex gap-6 text-sm font-semibold tracking-wide">
              <div className="rounded-full border border-emerald-400/60 px-2 py-1 text-emerald-300">
                Doğru Tahmin: {predict_true}
              </div>
              <div className="rounded-full border border-rose-400/60 px-2 py-1 text-rose-300">
                Yanlış Tahmin: {predict_false}
              </div>
            </div>
          )}
        </section>

        {gameStarted && (
          <MusicSearch tracks={searchTracks} onSelect={handleGuess} />
        )}
      </main>

      {!gameStarted && !gameOver && (
        <StartModal onStart={handleStartGame} />
      )}

      {gameOver && (
        <ResultModal
          predict_true={predict_true}
          predict_false={predict_false}
          timerFinished={timerFinished}
          onContinue={handleExitGame}
        />
      )}
    </div>
  );
}

const StartModal = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 text-center shadow-2xl">
        <p className="text-sm uppercase tracking-widest text-blue-300">
          MusiGuessr
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">Oyuna Başla</h2>
        <p className="mt-3 text-slate-300 text-sm">
          Şarkıyı dinle, doğru tahmini yap ve süre dolmadan tüm şarkıları bil.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-6 w-full rounded-xl bg-emerald-500 py-2 text-base font-semibold text-white transition-colors hover:bg-emerald-400"
        >
          Oyunu Başlat
        </button>
      </div>
    </div>
  );
};

interface ResultModalProps {
  predict_true: number;
  predict_false: number;
  onContinue: () => void;
  timerFinished: boolean;
}

const ResultModal = ({
  predict_true,
  predict_false,
  onContinue,
  timerFinished,
}: ResultModalProps) => {
  const statusText = timerFinished ? "Süre doldu" : "Tüm şarkılar tamamlandı";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 text-center shadow-2xl">
        <p className="text-sm uppercase tracking-widest text-blue-300">{statusText}</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Skorun</h2>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 py-2 text-lg text-emerald-200">
            Doğru: {predict_true}
          </div>
          <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 py-2 text-lg text-rose-200">
            Yanlış: {predict_false}
          </div>
        </div>

        <button
          type="button"
          onClick={() => console.log("Paylaşıldı")}
          className="mt-6 w-full rounded-xl bg-blue-600 py-2 text-base font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Paylaş
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-xl bg-blue-600 py-2 text-base font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
};
