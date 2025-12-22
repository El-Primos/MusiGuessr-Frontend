"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";

type Genre = { id: number; name: string; message?: string };
type Artist = { id: number; name: string; message?: string };

export type MusicItem = {
  id: number;
  name: string;
  url: string;
  genre: Genre;
  artist: Artist;
};

type Props = {
  apiBase: string;
};

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function isError(e: unknown): e is Error {
  return e instanceof Error;
}

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20h9"
      />
      <path
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"
      />
    </svg>
  );
}

export default function MusicListAdmin({ apiBase }: Props) {
  const { token, apiFetch } = useApi(apiBase);

  // main list
  const [items, setItems] = useState<MusicItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // artists/genres for editing
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // search + pagination
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // edit state (single-row edit)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [editName, setEditName] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [genreQuery, setGenreQuery] = useState("");
  const [artistOpen, setArtistOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);

  async function fetchMusics() {
    setLoading(true);
    setErr(null);

    try {
      const res = await apiFetch("/api/musics");
      const text = await res.text();

      if (!res.ok) {
        const parsed = safeJsonParse(text);
        throw new Error(parsed?.message || `GET /api/musics failed (${res.status})`);
      }

      const data = safeJsonParse(text) as MusicItem[] | null;
      if (!Array.isArray(data)) throw new Error("Invalid /api/musics response (not an array)");

      data.sort((a, b) => b.id - a.id);
      setItems(data);
    } catch (e: unknown) {
      setErr(isError(e) ? e.message : "Failed to load musics");
    } finally {
      setLoading(false);
    }
  }

  async function fetchArtistsGenres() {
    setLoadingLists(true);
    setErr(null);

    try {
      const [aRes, gRes] = await Promise.all([apiFetch("/api/artists"), apiFetch("/api/genres")]);

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

      setArtists(aJson);
      setGenres(gJson);
    } catch (e: unknown) {
      setErr(isError(e) ? e.message : "Failed to load artists/genres");
    } finally {
      setLoadingLists(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    fetchMusics();
    fetchArtistsGenres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, token]);

  const filtered = useMemo(() => {
    const query = normalize(q);
    if (!query) return items;

    return items.filter((m) => {
      const hay = [String(m.id), m.name ?? "", m.artist?.name ?? "", m.genre?.name ?? "", m.url ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [items, q]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [
    filtered.length,
    pageSize,
  ]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const filteredArtists = useMemo(() => {
    const query = normalize(artistQuery);
    const src = artists;
    if (!query) return src.slice(0, 20);
    return src.filter((a) => normalize(a.name).includes(query)).slice(0, 20);
  }, [artists, artistQuery]);

  const filteredGenres = useMemo(() => {
    const query = normalize(genreQuery);
    const src = genres;
    if (!query) return src.slice(0, 20);
    return src.filter((g) => normalize(g.name).includes(query)).slice(0, 20);
  }, [genres, genreQuery]);

  function startEdit(item: MusicItem) {
    setErr(null);
    setEditingId(item.id);

    setEditName(item.name ?? "");
    setSelectedArtist(item.artist ? { id: item.artist.id, name: item.artist.name } : null);
    setSelectedGenre(item.genre ? { id: item.genre.id, name: item.genre.name } : null);

    setArtistQuery(item.artist?.name ?? "");
    setGenreQuery(item.genre?.name ?? "");

    setArtistOpen(false);
    setGenreOpen(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setSavingId(null);
    setEditName("");
    setSelectedArtist(null);
    setSelectedGenre(null);
    setArtistQuery("");
    setGenreQuery("");
    setArtistOpen(false);
    setGenreOpen(false);
  }

  async function saveEdit(id: number) {
    if (!selectedArtist || !selectedGenre) {
      setErr("Please select artist and genre.");
      return;
    }
    if (!editName.trim()) {
      setErr("Music name cannot be empty.");
      return;
    }

    setSavingId(id);
    setErr(null);

    const prev = items;

    const patchedLocal: MusicItem[] = items.map((m) =>
      m.id === id
        ? {
            ...m,
            name: editName.trim(),
            artist: { ...m.artist, id: selectedArtist.id, name: selectedArtist.name },
            genre: { ...m.genre, id: selectedGenre.id, name: selectedGenre.name },
          }
        : m
    );
    setItems(patchedLocal);

    try {
      const res = await apiFetch(`/api/musics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          artist_id: selectedArtist.id,
          genre_id: selectedGenre.id,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        const parsed = safeJsonParse(text);
        throw new Error(parsed?.message || `PATCH /api/musics/${id} failed (${res.status})`);
      }

      const updated = safeJsonParse(text) as MusicItem | null;
      if (!updated?.id) {
        await fetchMusics();
      } else {
        setItems((cur) => cur.map((m) => (m.id === id ? updated : m)).sort((a, b) => b.id - a.id));
      }

      cancelEdit();
    } catch (e: unknown) {
      setItems(prev);
      setErr(isError(e) ? e.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteMusic(id: number) {
    const prev = items;
    setDeletingId(id);
    setErr(null);

    setItems((cur) => cur.filter((x) => x.id !== id));

    try {
      const res = await apiFetch(`/api/musics/${id}`, { method: "DELETE" });

      const text = await res.text().catch(() => "");
      if (!res.ok) {
        const parsed = safeJsonParse(text);
        throw new Error(parsed?.message || `DELETE /api/musics/${id} failed (${res.status})`);
      }
    } catch (e: unknown) {
      setItems(prev);
      setErr(isError(e) ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="">
          <h2 className="text-xl font-semibold">Musics</h2>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by id / name / artist / genre..."
            className="w-full sm:w-80 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
          />

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchMusics}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {loadingLists && (
        <div className="mt-3 text-xs text-slate-500">
          Loading artists/genres...
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
          <div className="col-span-1">ID</div>
          <div className="col-span-4">Name</div>
          <div className="col-span-3">Artist</div>
          <div className="col-span-1">Genre</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-600">Loading...</div>
        ) : pageItems.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-600">No items.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pageItems.map((m) => {
              const isEditing = editingId === m.id;
              const isBusy = deletingId === m.id || savingId === m.id;

              return (
                <li key={m.id} className="grid grid-cols-12 items-start px-4 py-3 gap-y-2">
                  <div className="col-span-1 font-mono text-sm text-slate-700 pt-1">
                    {m.id}
                  </div>

                  {/* NAME */}
                  <div className="col-span-4">
                    {isEditing ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-1 text-sm outline-none focus:border-slate-400"
                        placeholder="Music name"
                      />
                    ) : (
                      <>
                        <div className="font-medium text-slate-900">{m.name}</div>
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 block truncate text-xs text-slate-500 underline"
                          title={m.url}
                        >
                          {m.url}
                        </a>
                      </>
                    )}
                  </div>

                  {/* ARTIST */}
                  <div className="col-span-3 relative">
                    {isEditing ? (
                      <>
                        <input
                          value={artistQuery}
                          onChange={(e) => {
                            setArtistQuery(e.target.value);
                            setSelectedArtist(null);
                            setArtistOpen(true);
                          }}
                          onFocus={() => setArtistOpen(true)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-1 text-sm outline-none focus:border-slate-400"
                          placeholder="Type artist name..."
                        />
                        {artistOpen && (
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
                        <div className="mt-1 text-[11px] text-slate-500">
                          Selected:{" "}
                          <span className="font-medium">
                            {selectedArtist?.name ?? "-"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="pt-1 text-sm text-slate-700">{m.artist?.name ?? "-"}</div>
                    )}
                  </div>

                  {/* GENRE */}
                  <div className="col-span-1 relative min-w-0">
                    {isEditing ? (
                      <>
                        <input
                          value={genreQuery}
                          onChange={(e) => {
                            setGenreQuery(e.target.value);
                            setSelectedGenre(null);
                            setGenreOpen(true);
                          }}
                          onFocus={() => setGenreOpen(true)}
                          className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-1 text-sm outline-none focus:border-slate-400"
                          placeholder="Type genre name..."
                        />
                        {genreOpen && (
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
                        <div className="mt-1 text-[11px] text-slate-500">
                          Selected:{" "}
                          <span className="font-medium">
                            {selectedGenre?.name ?? "-"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="pt-1 text-sm text-slate-700">{m.genre?.name ?? "-"}</div>
                    )}
                  </div>

                  {/* ACTIONS */}
           
                  <div className="col-span-3 flex sm:justify-end gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(m.id)}
                          disabled={isBusy}
                          className="rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                          {savingId === m.id ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isBusy}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(m)}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-2.5 py-1.5 text-slate-700 hover:bg-slate-50"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteMusic(m.id)}
                          disabled={deletingId === m.id}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                          {deletingId === m.id ? "Deleting..." : "Delete"}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          Showing{" "}
          <span className="font-medium text-slate-900">
            {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}
          </span>{" "}
          -{" "}
          <span className="font-medium text-slate-900">
            {Math.min(page * pageSize, filtered.length)}
          </span>{" "}
          of <span className="font-medium text-slate-900">{filtered.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            First
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Prev
          </button>

          <div className="text-sm text-slate-700">
            Page <span className="font-medium">{page}</span> /{" "}
            <span className="font-medium">{totalPages}</span>
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}
