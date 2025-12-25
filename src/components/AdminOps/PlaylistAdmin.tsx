"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import { MusicItem } from "@/dto/common.dto";

type Props = { apiBase: string };

type Playlist = {
  id: number;
  name: string;
  ownerId?: number;
  createdAt?: string;
  message?: string;
};

type ReorderItem = { songId: number; position: number };

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

export default function PlaylistAdmin({ apiBase }: Props) {
  const { token, apiFetch } = useApi(apiBase);

  // playlists list
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listErr, setListErr] = useState<string | null>(null);

  // create palylist
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);


  const [plistQuery, setPlistQuery] = useState("");
  const [plistPage, setPlistPage] = useState(1);
  const [plistPageSize, setPlistPageSize] = useState(10);

  // selected playlist
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // details: songs
  const [songs, setSongs] = useState<MusicItem[]>([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [songsErr, setSongsErr] = useState<string | null>(null);

  // name edit
  const [nameEditing, setNameEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  // delete playlist
  const [deletingPlaylistId, setDeletingPlaylistId] = useState<number | null>(null);

  // add songs
  const [allMusics, setAllMusics] = useState<MusicItem[]>([]);
  const [musicsLoading, setMusicsLoading] = useState(false);
  const [musicSearch, setMusicSearch] = useState("");
  const [addSelected, setAddSelected] = useState<Record<number, boolean>>({});
  const [addingSongs, setAddingSongs] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);

  const [musicPage, setMusicPage] = useState(1);
  const [musicPageSize, setMusicPageSize] = useState(10);


  // reorder
  const [reordering, setReordering] = useState(false);
  const [reorderErr, setReorderErr] = useState<string | null>(null);

  // advanced search part:
  const [filterArtistId, setFilterArtistId] = useState<number | "all">("all");
  const [filterGenreId, setFilterGenreId] = useState<number | "all">("all");

  const artistOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of allMusics) {
      if (m.artist?.id && m.artist?.name) map.set(m.artist.id, m.artist.name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allMusics]);

  const genreOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of allMusics) {
      if (m.genre?.id && m.genre?.name) map.set(m.genre.id, m.genre.name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allMusics]);



  const selectedPlaylist = useMemo(
    () => playlists.find((p) => p.id === selectedId) ?? null,
    [playlists, selectedId]
  );

  async function createPlaylist(payload: { name: string; ownerId: number }) {
    const res = await apiFetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) {
      const parsed = safeJsonParse(text);
      throw new Error(parsed?.message || `POST /api/playlists failed (${res.status})`);
    }

    const json = safeJsonParse(text) as Playlist | null;
    if (!json?.id) throw new Error("Invalid create playlist response");
    return json;
  }

  function getOwnerIdFallback(): number {
    const raw = localStorage.getItem("user");
    if (!raw) return 1;

    const parsed = safeJsonParse(raw) as { id?: number; userId?: number } | null;
    const id = parsed?.id ?? parsed?.userId;
    return typeof id === "number" && id > 0 ? id : 1;
  }

  async function handleCreatePlaylist() {
    const name = createName.trim();
    if (!name) {
      setCreateErr("Playlist name cannot be empty.");
      return;
    }

    setCreating(true);
    setCreateErr(null);

    try {
      const ownerId = getOwnerIdFallback();
      const created = await createPlaylist({ name, ownerId });

      // listeyi güncelle, seçili yap
      setPlaylists((cur) => [created, ...cur].sort((a, b) => b.id - a.id));
      setSelectedId(created.id);

      setCreateOpen(false);
      setCreateName("");
    } catch (e: unknown) {
      setCreateErr(isError(e) ? e.message : "Failed to create playlist");
    } finally {
      setCreating(false);
    }
  }


  function getUserIdFromStorage(): number | null {
    if (!localStorage.getItem("user")) return null;

    const parsed = safeJsonParse(localStorage.getItem("user")!) as
      | { id?: number; userId?: number }
      | null;

    const id = parsed?.id ?? parsed?.userId;
    if (typeof id === "number" && id > 0) return id;

    return null;
  }

  const fetchPlaylists = useCallback(async () => {
    setListLoading(true);
    setListErr(null);

    try {
      const ownerId = getUserIdFromStorage();
      if (!ownerId) throw new Error("User not found. Please login again.");

      // name filter + UI pagination (limit/offset backend’e de gönderebilirsin ama şimdilik gerek yok)
      const qs = new URLSearchParams();
      qs.set("ownerId", String(ownerId));

      const q = plistQuery.trim();
      if (q) qs.set("name", q);

      const res = await apiFetch(`/api/playlists?${qs.toString()}`);
      const text = await res.text();

      if (!res.ok) {
        const parsed = safeJsonParse(text);
        throw new Error(parsed?.message || `GET /api/playlists failed (${res.status})`);
      }

      const data = safeJsonParse(text) as Playlist[] | null;
      if (!Array.isArray(data)) throw new Error("Invalid /api/playlists response (not an array)");

      data.sort((a, b) => b.id - a.id);
      setPlaylists(data);

      // seçili playlist yoksa ilkini seç
      if (data.length > 0 && selectedId == null) {
        setSelectedId(data[0].id);
      }
      // seçili playlist artık yoksa (silindi vs) ilkine dön
      if (data.length > 0 && selectedId != null && !data.some((p) => p.id === selectedId)) {
        setSelectedId(data[0].id);
      }
      if (data.length === 0) {
        setSelectedId(null);
      }
    } catch (e: unknown) {
      setListErr(isError(e) ? e.message : "Failed to load playlists");
    } finally {
      setListLoading(false);
    }
  }, [apiFetch, selectedId, plistQuery]);


  const fetchPlaylistSongs = useCallback(
    async (playlistId: number) => {
      setSongsLoading(true);
      setSongsErr(null);
      try {
        const res = await apiFetch(`/api/playlists/${playlistId}/songs`);
        const text = await res.text();

        if (!res.ok) {
          const parsed = safeJsonParse(text);
          throw new Error(
            parsed?.message || `GET /api/playlists/${playlistId}/songs failed (${res.status})`
          );
        }

        const data = safeJsonParse(text) as MusicItem[] | null;
        if (!Array.isArray(data)) throw new Error("Invalid playlist songs response (not an array)");

        // order backend nasıl dönüyorsa onu koruyalım; reorder sonrası zaten backend sıralı dönecek
        setSongs(data);
      } catch (e: unknown) {
        setSongsErr(isError(e) ? e.message : "Failed to load playlist songs");
      } finally {
        setSongsLoading(false);
      }
    },
    [apiFetch]
  );

  const fetchAllMusics = useCallback(async () => {
    setMusicsLoading(true);
    setAddErr(null);
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
      setAllMusics(data);
    } catch (e: unknown) {
      setAddErr(isError(e) ? e.message : "Failed to load musics");
    } finally {
      setMusicsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!token) return;
    fetchPlaylists();
    fetchAllMusics();
  }, [token, fetchPlaylists, fetchAllMusics]);

  useEffect(() => {
    if (!token) return;
    if (selectedId == null) return;

    fetchPlaylistSongs(selectedId);

    // name draft sync
    const p = playlists.find((x) => x.id === selectedId);
    setNameDraft(p?.name ?? "");
    setNameEditing(false);

    // add selection reset
    setAddSelected({});
    setMusicSearch("");
    setAddErr(null);
    setReorderErr(null);
    setSongsErr(null);
  }, [token, selectedId, fetchPlaylistSongs, playlists]);

  // UI list filtering + pagination
  const filteredPlaylists = useMemo(() => {
    const q = normalize(plistQuery);
    if (!q) return playlists;
    return playlists.filter((p) => `${p.id} ${p.name}`.toLowerCase().includes(q));
  }, [playlists, plistQuery]);

  const plistTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredPlaylists.length / plistPageSize)),
    [filteredPlaylists.length, plistPageSize]
  );

  useEffect(() => {
    if (plistPage > plistTotalPages) setPlistPage(plistTotalPages);
    }, [plistPage, plistTotalPages]);

    const plistPageItems = useMemo(() => {
      const start = (plistPage - 1) * plistPageSize;
      return filteredPlaylists.slice(start, start + plistPageSize);
    }, [filteredPlaylists, plistPage, plistPageSize]);



  // existing song ids in playlist
  const existingSongIds = useMemo(() => new Set(songs.map((s) => s.id)), [songs]);

  const filteredMusics = useMemo(() => {
    const q = normalize(musicSearch);

    return allMusics.filter((m) => {
      // playlistte olanları istersen listede gösterip disabled yapıyorduk;
      // burada komple saklamak istersen:
      // if (existingSongIds.has(m.id)) return false;

      if (filterArtistId !== "all" && m.artist?.id !== filterArtistId) return false;
      if (filterGenreId !== "all" && m.genre?.id !== filterGenreId) return false;

      if (!q) return true;

      const hay = [
        String(m.id),
        m.name ?? "",
        m.artist?.name ?? "",
        m.genre?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [allMusics, musicSearch, filterArtistId, filterGenreId]);


  const musicTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredMusics.length / musicPageSize)),
    [filteredMusics.length, musicPageSize]
  );

  useEffect(() => {
    if (musicPage > musicTotalPages) setMusicPage(musicTotalPages);
  }, [musicPage, musicTotalPages]);

  const pagedMusicsToAdd = useMemo(() => {
    const start = (musicPage - 1) * musicPageSize;
    return filteredMusics.slice(start, start + musicPageSize);
  }, [filteredMusics, musicPage, musicPageSize]);

  // pagination reset
  useEffect(() => {
    setMusicPage(1);
  }, [musicSearch, filterArtistId, filterGenreId]);



  const selectedToAddIds = useMemo(
    () => Object.entries(addSelected).filter(([, v]) => v).map(([k]) => Number(k)),
    [addSelected]
  );

  async function updatePlaylistName(playlistId: number, name: string) {
    const res = await apiFetch(`/api/playlists/${playlistId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const text = await res.text();
    if (!res.ok) {
      const parsed = safeJsonParse(text);
      throw new Error(parsed?.message || `PATCH /api/playlists/${playlistId} failed (${res.status})`);
    }

    const updated = safeJsonParse(text) as Playlist | null;
    if (!updated?.id) throw new Error("Invalid playlist patch response");
    return updated;
  }

  async function deletePlaylist(playlistId: number) {
    const res = await apiFetch(`/api/playlists/${playlistId}`, { method: "DELETE" });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      const parsed = safeJsonParse(text);
      throw new Error(parsed?.message || `DELETE /api/playlists/${playlistId} failed (${res.status})`);
    }
  }

  async function removeSongFromPlaylist(playlistId: number, songId: number) {
    const res = await apiFetch(`/api/playlists/${playlistId}/songs/${songId}`, { method: "DELETE" });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      const parsed = safeJsonParse(text);
      throw new Error(
        parsed?.message || `DELETE /api/playlists/${playlistId}/songs/${songId} failed (${res.status})`
      );
    }
  }

  async function addSongToPlaylist(playlistId: number, songId: number, position: number) {
    const res = await apiFetch(`/api/playlists/${playlistId}/songs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songId, position }),
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      const parsed = safeJsonParse(text);
      throw new Error(parsed?.message || `POST /api/playlists/${playlistId}/songs failed (${res.status})`);
    }
  }

  async function reorderPlaylist(playlistId: number, newSongs: MusicItem[]) {
    const items: ReorderItem[] = newSongs.map((s, idx) => ({ songId: s.id, position: idx + 1 }));

    const res = await apiFetch(`/api/playlists/${playlistId}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      const parsed = safeJsonParse(text);
      throw new Error(parsed?.message || `POST /api/playlists/${playlistId}/reorder failed (${res.status})`);
    }
  }

  async function handleSaveName() {
    if (!selectedPlaylist) return;
    const nextName = nameDraft.trim();
    if (!nextName) {
      setSongsErr("Playlist name cannot be empty.");
      return;
    }

    setNameSaving(true);
    setSongsErr(null);
    try {
      const updated = await updatePlaylistName(selectedPlaylist.id, nextName);
      setPlaylists((cur) => cur.map((p) => (p.id === updated.id ? { ...p, name: updated.name } : p)));
      setNameEditing(false);
    } catch (e: unknown) {
      setSongsErr(isError(e) ? e.message : "Failed to update playlist name");
    } finally {
      setNameSaving(false);
    }
  }

  async function handleDeletePlaylist() {
    if (!selectedPlaylist) return;
    const id = selectedPlaylist.id;

    setDeletingPlaylistId(id);
    setListErr(null);

    // optimistic UI
    const prev = playlists;
    setPlaylists((cur) => cur.filter((p) => p.id !== id));
    setSelectedId(null);

    try {
      await deletePlaylist(id);
      // refresh list + reselect
      await fetchPlaylists();
    } catch (e: unknown) {
      setPlaylists(prev);
      setListErr(isError(e) ? e.message : "Failed to delete playlist");
      setSelectedId(id);
    } finally {
      setDeletingPlaylistId(null);
    }
  }

  async function handleRemoveSong(songId: number) {
    if (!selectedPlaylist) return;
    const pid = selectedPlaylist.id;

    setSongsErr(null);
    const prev = songs;
    setSongs((cur) => cur.filter((x) => x.id !== songId));

    try {
      await removeSongFromPlaylist(pid, songId);
      // backend order/positions doğru kalsın diye: reorder çağırmak istersen burada da yapabilirsin.
      // Şimdilik sadece refresh:
      await fetchPlaylistSongs(pid);
    } catch (e: unknown) {
      setSongs(prev);
      setSongsErr(isError(e) ? e.message : "Failed to remove song");
    }
  }

  async function handleAddSelectedSongs() {
    if (!selectedPlaylist) return;
    const pid = selectedPlaylist.id;

    const unique = Array.from(new Set(selectedToAddIds))
      .filter((id) => !existingSongIds.has(id));

    if (unique.length === 0) {
      setAddErr("No new songs selected (maybe already in playlist).");
      return;
    }

    setAddingSongs(true);
    setAddErr(null);

    try {
      // IMPORTANT: sequential (senin sorunu çözen yaklaşım)
      // Position'ı mevcut şarkı sayısından başlayarak artırıyoruz
      let currentPosition = songs.length + 1;
      for (const songId of unique) {
        await addSongToPlaylist(pid, songId, currentPosition);
        currentPosition++;
      }
      await fetchPlaylistSongs(pid);
      setAddSelected({});
      setMusicSearch("");
    } catch (e: unknown) {
      setAddErr(isError(e) ? e.message : "Failed to add songs");
    } finally {
      setAddingSongs(false);
    }
  }

  function moveSong(index: number, dir: -1 | 1) {
    if (!selectedPlaylist) return;
    const pid = selectedPlaylist.id;

    const next = songs.slice();
    const j = index + dir;
    if (j < 0 || j >= next.length) return;

    // swap
    [next[index], next[j]] = [next[j], next[index]];
    setSongs(next);

    // persist reorder (sequential değil, tek request)
    (async () => {
      setReordering(true);
      setReorderErr(null);
      try {
        await reorderPlaylist(pid, next);
        // backend'e göre tekrar çekmek istersen:
        await fetchPlaylistSongs(pid);
      } catch (e: unknown) {
        setReorderErr(isError(e) ? e.message : "Reorder failed");
        await fetchPlaylistSongs(pid); // rollback
      } finally {
        setReordering(false);
      }
    })();
  }

  return (
    <div className="w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Playlists</h2>
        <button
          type="button"
          onClick={fetchPlaylists}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {/* Errors */}
      {(listErr || songsErr || addErr || reorderErr) && (
        <div className="mt-4 space-y-2">
          {listErr && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {listErr}
            </div>
          )}
          {songsErr && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {songsErr}
            </div>
          )}
          {addErr && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {addErr}
            </div>
          )}
          {reorderErr && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {reorderErr}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT: playlist list */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3">
              <div className="flex gap-2">
                <input
                  value={plistQuery}
                  onChange={(e) => {
                    setPlistQuery(e.target.value);
                    setPlistPage(1);
                  }}
                  placeholder="Search playlists..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                <select
                  value={plistPageSize}
                  onChange={(e) => {
                    setPlistPageSize(Number(e.target.value));
                    setPlistPage(1);
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                >
                  {[5, 10, 20].map((n) => (
                    <option key={n} value={n}>
                      {n}/p
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setCreateErr(null);
                    setCreateName("");
                    setCreateOpen(true);
                  }}
                  className="h-10 whitespace-nowrap rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
                >
                  +
                </button>
              </div>
              {createErr && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {createErr}
                </div>
              )}
            </div>

            {listLoading ? (
              <div className="px-4 py-4 text-sm text-slate-600">Loading playlists...</div>
            ) : plistPageItems.length === 0 ? (
              <div className="px-4 py-4 text-sm text-slate-600">No playlists.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {plistPageItems.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={[
                        "w-full text-left px-4 py-3 hover:bg-slate-50",
                        selectedId === p.id ? "bg-slate-100" : "bg-white",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
                          <div className="text-xs text-slate-500">ID: {p.id}</div>
                        </div>
                        <span className="text-xs text-slate-400">{">"}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPlistPage((x) => Math.max(1, x - 1))}
                disabled={plistPage === 1}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <div className="text-sm text-slate-700">
                {plistPage} / {plistTotalPages}
              </div>
              <button
                type="button"
                onClick={() => setPlistPage((x) => Math.min(plistTotalPages, x + 1))}
                disabled={plistPage === plistTotalPages}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: selected playlist detail */}
        <div className="lg:col-span-2">
          {!selectedPlaylist ? (
            <div className="rounded-2xl border border-slate-200 p-6 text-sm text-slate-600">
              Select a playlist.
            </div>
          ) : (
            <div className="space-y-4">
              {/* header / name edit / delete */}
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">Playlist ID: {selectedPlaylist.id}</div>

                    {!nameEditing ? (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="text-lg font-semibold truncate">{selectedPlaylist.name}</div>
                        <button
                          type="button"
                          onClick={() => setNameEditing(true)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
                        >
                          Edit name
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSaveName}
                            disabled={nameSaving}
                            className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                          >
                            {nameSaving ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNameEditing(false);
                              setNameDraft(selectedPlaylist.name);
                            }}
                            disabled={nameSaving}
                            className="h-10 rounded-xl border border-slate-200 px-4 text-sm hover:bg-slate-50 disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleDeletePlaylist}
                    disabled={deletingPlaylistId === selectedPlaylist.id}
                    className="h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    {deletingPlaylistId === selectedPlaylist.id ? "Deleting..." : "Delete playlist"}
                  </button>
                </div>
              </div>

              {/* Add songs */}
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Add songs</div>
                    <div className="text-xs text-slate-500">
                      Select musics and add sequentially (no 500).
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSelectedSongs}
                    disabled={addingSongs || selectedToAddIds.length === 0}
                    className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {addingSongs ? "Adding..." : `Add (${selectedToAddIds.length})`}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    value={musicSearch}
                    onChange={(e) => setMusicSearch(e.target.value)}
                    placeholder="Search (name / artist / genre / id)"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />

                  <select
                    value={filterArtistId === "all" ? "all" : String(filterArtistId)}
                    onChange={(e) =>
                      setFilterArtistId(e.target.value === "all" ? "all" : Number(e.target.value))
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                  >
                    <option value="all">All artists</option>
                    {artistOptions.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterGenreId === "all" ? "all" : String(filterGenreId)}
                    onChange={(e) =>
                      setFilterGenreId(e.target.value === "all" ? "all" : Number(e.target.value))
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                  >
                    <option value="all">All genres</option>
                    {genreOptions.map((g) => (
                      <option key={g.id} value={String(g.id)}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2 flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMusicSearch("");
                      setFilterArtistId("all");
                      setFilterGenreId("all");
                    }}
                    className="h-9 rounded-xl border border-slate-200 px-3 text-sm hover:bg-slate-50"
                  >
                    Clear filters
                  </button>

                  <button
                    type="button"
                    onClick={fetchAllMusics}
                    className="h-9 rounded-xl border border-slate-200 px-3 text-sm hover:bg-slate-50"
                  >
                    Reload
                  </button>
                </div>


                {musicsLoading ? (
                  <div className="mt-3 text-sm text-slate-600">Loading musics...</div>
                ) : (
                  <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-slate-200">
                    <ul className="divide-y divide-slate-100">
                      {pagedMusicsToAdd.map((m) => {

                        const disabled = existingSongIds.has(m.id);
                        const checked = !!addSelected[m.id];

                        return (
                          <li key={m.id} className="px-3 py-2">
                            <label className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                disabled={disabled}
                                checked={checked}
                                onChange={() => setAddSelected((cur) => ({ ...cur, [m.id]: !cur[m.id] }))}
                                className="mt-1"
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {m.name}{" "}
                                  {disabled && (
                                    <span className="ml-2 text-xs text-slate-400">(already in playlist)</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                  #{m.id} • {m.artist?.name ?? "-"} • {m.genre?.name ?? "-"}
                                </div>
                              </div>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => setMusicPage(p => Math.max(1, p - 1))}
                  disabled={musicPage === 1}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Prev
                </button>

                <div className="text-sm text-slate-600">
                  {musicPage} / {musicTotalPages}
                </div>

                <button
                  onClick={() => setMusicPage(p => Math.min(musicTotalPages, p + 1))}
                  disabled={musicPage === musicTotalPages}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>


              {/* Songs list + reorder + remove */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold">Playlist songs</div>
                    <div className="text-xs text-slate-500">
                      Reorder with ↑/↓ (calls /reorder). {reordering ? "Reordering..." : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchPlaylistSongs(selectedPlaylist.id)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Refresh songs
                  </button>
                </div>

                {songsLoading ? (
                  <div className="px-4 py-4 text-sm text-slate-600">Loading songs...</div>
                ) : songs.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-slate-600">No songs in this playlist.</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {songs.map((s, idx) => (
                      <li key={s.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {idx + 1}. {s.name}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              #{s.id} • {s.artist?.name ?? "-"} • {s.genre?.name ?? "-"}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveSong(idx, -1)}
                              disabled={idx === 0 || reordering}
                              className="h-9 w-9 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSong(idx, 1)}
                              disabled={idx === songs.length - 1 || reordering}
                              className="h-9 w-9 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                              title="Move down"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSong(s.id)}
                              className="h-9 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700 hover:bg-red-100"
                              title="Remove"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-slate-900">Create playlist</div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. 90s Turkish Pop"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePlaylist}
                disabled={creating || !createName.trim()}
                className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
