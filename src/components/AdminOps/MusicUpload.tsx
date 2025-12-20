"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useS3Upload } from "../../hooks/useS3Upload";

type UploadConfirmReq = {
  name: string;
  genre_id: number;
  artist_id: number;
  key: string;
};

type UploadConfirmRes = {
  message: string;
  id: number;
  name: string;
  url: string;
};

type Props = {
  apiBase?: string;
  onSuccess?: (music: UploadConfirmRes) => void;
};

type Artist = { id: number; name: string };
type Genre = { id: number; name: string; message?: string };

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export default function MusicUpload({ apiBase = "", onSuccess }: Props) {
  // Song & file
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Lists
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Artist search + selection
  const [artistQuery, setArtistQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [artistOpen, setArtistOpen] = useState(false);

  // Genre search + selection
  const [genreQuery, setGenreQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [genreOpen, setGenreOpen] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadConfirmRes | null>(null);

  const { upload, loading: uploading, stage, error: uploadError } = useS3Upload({
    apiBase,
    uploadUrlPath: "/api/musics/upload-url",
  });

  function isError(e: unknown): e is Error {
    return e instanceof Error;
  }

  // ---- fetch artists & genres once
  useEffect(() => {
    let cancelled = false;


    async function loadLists() {
      setLoadingLists(true);
      setListError(null);
      try {
        const [aRes, gRes] = await Promise.all([
          fetch(`${apiBase}/api/artists`, { headers: { accept: "*/*" } }),
          fetch(`${apiBase}/api/genres`, { headers: { accept: "*/*" } }),
        ]);

        const aText = await aRes.text();
        const gText = await gRes.text();

        if (!aRes.ok) {
          const parsed = safeJsonParse(aText);
          throw new Error(parsed?.message || `GET /api/artists failed (${aRes.status})`);
        }
        if (!gRes.ok) {
          const parsed = safeJsonParse(gText);
          throw new Error(parsed?.message || `GET /api/genres failed (${gRes.status})`);
        }

        const aJson = safeJsonParse(aText) as Artist[] | null;
        const gJson = safeJsonParse(gText) as Genre[] | null;

        if (!Array.isArray(aJson)) throw new Error("Artists response is not an array");
        if (!Array.isArray(gJson)) throw new Error("Genres response is not an array");

        if (!cancelled) {
          setArtists(aJson);
          setGenres(gJson);
        }
      } catch (e: unknown) {
        if (cancelled) return;

        if (e instanceof Error) {
          setListError(e.message);
        } else {
          setListError("Failed to load artists/genres");
        }
      } finally {
              if (!cancelled) setLoadingLists(false);
      }
    }

    loadLists();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const inferredName = useMemo(() => {
    if (name.trim()) return name.trim();
    if (!file) return "";
    return file.name.replace(/\.[^/.]+$/, "");
  }, [name, file]);

  const filteredArtists = useMemo(() => {
    const q = normalize(artistQuery);
    if (!q) return artists.slice(0, 20);
    return artists
      .filter((a) => normalize(a.name).includes(q))
      .slice(0, 20);
  }, [artists, artistQuery]);

  const filteredGenres = useMemo(() => {
    const q = normalize(genreQuery);
    if (!q) return genres.slice(0, 20);
    return genres
      .filter((g) => normalize(g.name).includes(q))
      .slice(0, 20);
  }, [genres, genreQuery]);

  const canSubmit = useMemo(() => {
    return (
      inferredName.length > 0 &&
      file != null &&
      selectedArtist?.id != null &&
      selectedGenre?.id != null &&
      !uploading &&
      !confirming &&
      !loadingLists
    );
  }, [inferredName, file, selectedArtist, selectedGenre, uploading, confirming, loadingLists]);

  async function confirmUpload(payload: UploadConfirmReq): Promise<UploadConfirmRes> {
    const res = await fetch(`${apiBase}/api/musics/upload-confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) {
      const parsed = safeJsonParse(text);
      throw new Error(
        parsed?.message ||
          `upload-confirm failed (${res.status}): ${text || res.statusText}`
      );
    }

    const parsed = safeJsonParse(text) as UploadConfirmRes | null;
    if (!parsed?.id || !parsed?.url) {
      throw new Error("upload-confirm response missing id/url");
    }
    return parsed;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setConfirmError(null);
    setResult(null);

    if (!file) {
      setConfirmError("Lütfen bir dosya seç.");
      return;
    }
    if (!selectedArtist) {
      setConfirmError("Lütfen bir artist seç.");
      return;
    }
    if (!selectedGenre) {
      setConfirmError("Lütfen bir genre seç.");
      return;
    }

    try {
      // 1) S3 upload
      const { key } = await upload({ name: inferredName, file });

      // 2) confirm
      setConfirming(true);
      const confirmRes = await confirmUpload({
        name: inferredName,
        genre_id: selectedGenre.id,
        artist_id: selectedArtist.id,
        key,
      });

      setResult(confirmRes);
      onSuccess?.(confirmRes);
    } catch (err: unknown) {
      if (isError(err) && err.message !== "Upload cancelled") {
        setConfirmError(err.message);
      }
    } finally {
      setConfirming(false);
    }
  }

  const statusText =
    stage === "requesting_url"
      ? "Upload URL alınıyor..."
      : stage === "uploading"
      ? "Dosya yükleniyor..."
      : confirming
      ? "Backend'e kaydediliyor..."
      : null;

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Add Music</h2>
        <p className="mt-1 text-sm text-slate-500">
          Artist/Genre ismini yaz → seç → upload.
        </p>
      </div>

      {listError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {listError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Song name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Song Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={file ? file.name.replace(/\.[^/.]+$/, "") : "e.g. Gül Döktüm Yollarına"}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500">
            If empty, autofill from file name
          </p>
        </div>

        {/* Artist + Genre search */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Artist */}
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Artist
            </label>

            <input
              value={artistQuery}
              onChange={(e) => {
                setArtistQuery(e.target.value);
                setArtistOpen(true);
                setSelectedArtist(null);
              }}
              onFocus={() => setArtistOpen(true)}
              placeholder={loadingLists ? "Loading..." : "Type artist name (e.g. Tarkan)"}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-slate-400"
            />

            {selectedArtist && (
              <div className="mt-1 text-xs text-slate-600">
                Selected: <span className="font-medium">{selectedArtist.name}</span> (id:{" "}
                {selectedArtist.id})
              </div>
            )}

            {artistOpen && !loadingLists && (
              <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {filteredArtists.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500">No match</div>
                ) : (
                  <ul className="max-h-56 overflow-auto">
                    {filteredArtists.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedArtist(a);
                            setArtistQuery(a.name);
                            setArtistOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                        >
                          {a.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div
              className="pointer-events-none absolute inset-0"
              onClick={() => {}}
            />
            <div className="mt-1 text-xs text-slate-500">
              Select from list
            </div>
          </div>

          {/* Genre */}
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Genre
            </label>

            <input
              value={genreQuery}
              onChange={(e) => {
                setGenreQuery(e.target.value);
                setGenreOpen(true);
                setSelectedGenre(null);
              }}
              onFocus={() => setGenreOpen(true)}
              placeholder={loadingLists ? "Loading..." : "Type genre name (e.g. Pop)"}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-slate-400"
            />

            {selectedGenre && (
              <div className="mt-1 text-xs text-slate-600">
                Selected: <span className="font-medium">{selectedGenre.name}</span> (id:{" "}
                {selectedGenre.id})
              </div>
            )}

            {genreOpen && !loadingLists && (
              <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {filteredGenres.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500">No match</div>
                ) : (
                  <ul className="max-h-56 overflow-auto">
                    {filteredGenres.map((g) => (
                      <li key={g.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGenre(g);
                            setGenreQuery(g.name);
                            setGenreOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                        >
                          {g.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-1 text-xs text-slate-500">
              Select from list
            </div>
          </div>
        </div>

        {/* File */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            File
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
            />
            {file && (
              <div className="text-xs text-slate-500 sm:text-right">
                <div className="font-medium text-slate-700">{file.name}</div>
                <div>
                  {formatBytes(file.size)} • {file.type || "unknown"}
                </div>
              </div>
            )}
          </div>
        </div>

        {(uploadError || confirmError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {uploadError || confirmError}
          </div>
        )}

        {statusText && !(uploadError || confirmError) && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {statusText}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading || confirming ? "Uploading..." : "Add"}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-semibold text-emerald-900">Created ✅</div>
          <div className="mt-2 text-sm text-emerald-900/90">
            <div>
              <span className="font-medium">ID:</span> {result.id}
            </div>
            <div>
              <span className="font-medium">Name:</span> {result.name}
            </div>
            <div className="break-all">
              <span className="font-medium">URL:</span>{" "}
              <a href={result.url} target="_blank" rel="noreferrer" className="underline">
                {result.url}
              </a>
            </div>
          </div>

          <div className="mt-3">
            <audio controls className="w-full">
              <source src={result.url} />
            </audio>
          </div>
        </div>
      )}
    </div>
  );
}
