"use client";

import { useEffect, useRef, useState } from "react";

interface MusicPlayerProps {
  src: string;          // audio URL
  title?: string;
  artist?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export const MusicPlayer = ({
  src,
  autoPlay = false,
  onEnded,
}: MusicPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  // When src or autoPlay changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let hasInteractionListener = false;

    const removeInteractionListeners = () => {
      if (!hasInteractionListener) return;
      document.removeEventListener("pointerdown", resumePlayback);
      document.removeEventListener("keydown", resumePlayback);
      hasInteractionListener = false;
    };

    function resumePlayback() {
      if (!audio) return;
      audio
        .play()
        .then(() => {
          removeInteractionListeners();
        })
        .catch(() => {
        });
    }

    setCurrentTime(0);
    setDuration(0);

    if (autoPlay) {
      audio.pause();
      audio.currentTime = 0;
      audio
        .play()
        .then(() => {
          removeInteractionListeners();
        })
        .catch(() => {
          document.addEventListener("pointerdown", resumePlayback);
          document.addEventListener("keydown", resumePlayback);
          hasInteractionListener = true;
        });
    } else {
      audio.pause();
      removeInteractionListeners();
    }

    return () => {
      removeInteractionListeners();
    };
  }, [src, autoPlay]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);

    if (
      Number.isFinite(audio.duration) &&
      audio.duration > 0 &&
      audio.duration !== duration
    ) {
      setDuration(audio.duration);
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const metaDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
    setDuration(metaDuration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Number(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleEnded = () => {
    onEnded?.();
  };

  const effectiveDuration = duration > 0 ? duration : Math.max(currentTime, 1);
  // const progressPercent = Math.min(100, (currentTime / effectiveDuration) * 100);

  return (
    <div className="w-full m-0 p-0">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoPlay}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Slider + Time     */}
      <div className="flex flex-col gap-1">
        <div className="relative w-full">
          <input
            type="range"
            min={0}
            max={effectiveDuration}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="
              w-full appearance-none
              bg-transparent
              [&::-webkit-slider-runnable-track]:h-1
              [&::-webkit-slider-runnable-track]:rounded-full
              [&::-webkit-slider-runnable-track]:bg-slate-700
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-blue-400
              [&::-webkit-slider-thumb]:mt-[-4px]
              cursor-pointer
            "
          />
        </div>

        


        <div className="flex justify-between text-[11px] text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
 
    </div>
  );
};
