"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useApi } from "@/lib/useApi";

export interface Track {
  id: number;
  artist: string;
  title: string;
}

interface MusicSearchProps {
  onSelect?: (track: Track) => void;
  resetSignal?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export const MusicSearch = ({ onSelect, resetSignal = 0 }: MusicSearchProps) => {
  const [query, setQuery] = useState("");
  const [allMusics, setAllMusics] = useState<Track[]>([]); // Tüm müzik havuzu
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { apiFetch } = useApi(API_BASE);

  // 1. ADIM: Tüm müzikleri tek seferde çek (Mount olduğunda)
  useEffect(() => {
    const fetchAllMusics = async () => {
      setIsLoading(true);
      try {
        // Tüm müzikleri çekmek için size'ı yine de yüksek tutalım
        const res = await apiFetch(`/api/musics?limit=1000`);
        const data = await res.json();
        
        // --- KRİTİK DÜZELTME BAŞLANGICI ---
        // Eğer data bir array ise direkt onu kullan, değilse data.content'i kullan
        const rawList = Array.isArray(data) ? data : (data.content || []);
        
        console.log("Ham liste uzunluğu:", rawList.length);

        const formatted: Track[] = rawList.map((m: any) => ({
          id: m.id,
          title: m.name, // Backend 'name' gönderiyor, biz 'title' olarak eşliyoruz
          artist: m.artist?.name || "Bilinmeyen Sanatçı"
        }));
        // --- KRİTİK DÜZELTME BİTİŞİ ---

        setAllMusics(formatted);
        console.log("allMusics güncellendi, toplam:", formatted.length);
      } catch (err) {
        console.error("Müzikler yüklenemedi:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllMusics();
  }, [apiFetch]);

  // 2. ADIM: Raund değiştiğinde kutuyu temizle
  useEffect(() => {
    setQuery("");
    inputRef.current?.focus();
  }, [resetSignal]);

  // 3. ADIM: Frontend tarafında filtreleme (Performans için useMemo)
  const filteredResults = useMemo(() => {
    console.log("query değişti");
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];

    return allMusics.filter(
      (m) =>
        m.title.toLowerCase().includes(q) || 
        m.artist.toLowerCase().includes(q)
    ).slice(0, 10); // Sadece ilk 10 sonucu göster
  }, [query, allMusics]);

  return (
    <div className="w-full max-w-md relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={isLoading ? "Yükleniyor..." : "Şarkı ara..."}
          disabled={isLoading}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-blue-900 outline-none focus:ring-2 ring-blue-500 disabled:opacity-50 text-slate-900 dark:text-white placeholder:text-slate-400"
        />
        {isLoading && (
          <div className="absolute right-3 top-3 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        )}
      </div>

      {query && !isLoading && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden z-50 max-h-60 overflow-y-auto shadow-2xl">
          {filteredResults.map((track) => (
            <div
              key={track.id}
              onClick={() => {
                onSelect?.(track);
                setQuery(""); // Seçtikten sonra temizle
              }}
              className="px-4 py-3 hover:bg-blue-100 dark:hover:bg-blue-600/20 cursor-pointer border-b border-slate-200 dark:border-slate-800 last:border-none"
            >
              <div className="font-bold text-blue-700 dark:text-blue-100">{track.title}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{track.artist}</div>
            </div>
          ))}
          {filteredResults.length === 0 && (
            <div className="p-4 text-slate-500 text-sm">Sonuç bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  );
};