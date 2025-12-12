"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface Track {
  id: number;
  artist: string;
  title: string;
}

interface MusicSearchProps {
  tracks: Track[];
  onSelect?: (track: Track) => void;
  resetSignal?: number;
}

export const MusicSearch = ({ tracks, onSelect, resetSignal = 0 }: MusicSearchProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setQuery("");
    inputRef.current?.focus();
  }, [resetSignal]);

  const filteredTracks: Track[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return tracks.filter((track) => {
      const artist = track.artist.toLowerCase();
      const title = track.title.toLowerCase();
      return artist.includes(q) || title.includes(q);
    });
  }, [query, tracks]);

  const showResults = query.trim().length > 0;

  return (
    <div className="max-w-4xl mx-auto p-4 font-sans">

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Şarkı ya da Sanatçı ara..."
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filteredTracks.length > 0) {
              e.preventDefault();
              onSelect?.(filteredTracks[0]);
            }
          }}
          className="
            flex-1 px-3 py-2 rounded-lg 
            bg-slate-950 text-blue-100
            border border-blue-900
            shadow-[0_0_0_1px_rgba(37,99,235,0.4)]
            outline-none
            placeholder-blue-400/50
          "
        />
      </div>

      {/* Input Results */}
      {showResults && (
        <div
          className="
            rounded-xl border border-blue-900/60 p-3
            bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900
            max-h-70 overflow-y-auto
          "
        >
          {filteredTracks.length === 0 ? (
            <div className="text-sm text-gray-400">Sonuç bulunamadı.</div>
          ) : (
            <ul className="list-none m-0 p-0">
              {filteredTracks.map((track) => (
                <li
                  key={track.id}
                  onClick={() => onSelect?.(track)}
                  className="
                    py-2 px-2 border-b border-blue-900/40
                    flex flex-col gap-1 cursor-pointer
                    hover:bg-blue-900/20 active:bg-blue-900/40
                    rounded transition-all duration-150
                  "
                >
                  <span className="font-semibold text-blue-200">
                    {track.title}
                  </span>
                  <span className="text-sm text-blue-300">
                    {track.artist}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
