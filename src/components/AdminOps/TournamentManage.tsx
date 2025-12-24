"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/useApi";

type Props = {
  apiBase: string;

  /**
   * Eğer backend endpointlerin farklıysa override et:
   * - list: GET /api/tournaments? ... (opsiyonel query)
   * - get: GET /api/tournaments/{id}
   * - update: PATCH /api/tournaments/{id}  (body: { startDate, endDate })
   * - del: DELETE /api/tournaments/{id}
   * - participants: GET /api/tournaments/{id}/participants
   * - participantRemove: DELETE /api/tournaments/{id}/participants/{userId}
   */
  endpoints?: Partial<{
    list: string; // default "/api/tournaments"
    get: (id: number) => string; // default (id)=>`/api/tournaments/${id}`
    update: (id: number) => string; // default (id)=>`/api/tournaments/${id}`
    del: (id: number) => string; // default (id)=>`/api/tournaments/${id}`
    participants: (id: number) => string; // default (id)=>`/api/tournaments/${id}/participants`
    participantRemove: (tournamentId: number, userId: number) => string; // default
  }>;

  /**
   * Playlist edit sayfanın route’u:
   * örn: "/admin/playlists" veya "/playlists"
   * (component, ?id= ile yönlendiriyor)
   */
  playlistEditPath?: string; // default "/playlists"
};

type TournamentStatus = "UPCOMING" | "ACTIVE" | "FINISHED";

type Tournament = {
  id: number;
  name: string;
  description?: string;
  playlistId: number;
  creatorId?: number;
  creatorUsername?: string;
  status?: TournamentStatus;
  createDate?: string;
  startDate?: string;
  endDate?: string;
  participantCount?: number;
  coverUrl?: string;
};

type Participant = {
  userId: number;
  username: string;
  score?: number;
};

type Playlist = {
  id: number;
  name: string;
  ownerId: number;
  createdAt?: string;
};

type Music = {
  id: number;
  name: string;
  url?: string;
  genre?: { id: number; name: string };
  artist?: { id: number; name: string };
};

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isError(e: unknown): e is Error {
  return e instanceof Error;
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function toDatetimeLocalValueFromIso(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(
    d.getMinutes()
  )}`;
}

function toIsoFromDatetimeLocal(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString();
}

export default function TournamentManage({
  apiBase,
  endpoints,
  playlistEditPath = "/playlists",
}: Props) {
  const router = useRouter();
  const { token, apiFetch } = useApi(apiBase);

  const ep = useMemo(() => {
    return {
      list: endpoints?.list ?? "/api/tournaments",
      get: endpoints?.get ?? ((id: number) => `/api/tournaments/${id}`),
      update: endpoints?.update ?? ((id: number) => `/api/tournaments/${id}`),
      del: endpoints?.del ?? ((id: number) => `/api/tournaments/${id}`),
      participants: endpoints?.participants ?? ((id: number) => `/api/tournaments/${id}/participants`),
      participantRemove:
        endpoints?.participantRemove ?? ((tid: number, uid: number) => `/api/tournaments/${tid}/participants/${uid}`),
    };
  }, [endpoints]);

  // list state
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listErr, setListErr] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // detail state
  const [detail, setDetail] = useState<Tournament | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState<string | null>(null);

  // participants
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [partLoading, setPartLoading] = useState(false);
  const [partErr, setPartErr] = useState<string | null>(null);

  // playlist view (read-only)
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<Music[]>([]);
  const [plistLoading, setPlistLoading] = useState(false);
  const [plistErr, setPlistErr] = useState<string | null>(null);

  // update form
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [timeError, setTimeError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  // delete tournament
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    setListLoading(true);
    setListErr(null);
    try {
      // OpenAPI’de /api/tournaments sayfalı görünüyor (page/size/sort/direction).
      // Bu component UI paginasyonu yapıyor ama istersen burada query param ekleyebilirsin.
      const res = await apiFetch(ep.list);
      const text = await res.text();

      if (!res.ok) {
        const parsed = safeJsonParse(text);
        throw new Error(parsed?.message || `GET ${ep.list} failed (${res.status})`);
      }

      const parsed = safeJsonParse(text);

      // Tournament list bazen PageTournamentResponseDTO olabilir (content içinde)
      const arr: Tournament[] | null = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.content)
        ? parsed.content
        : null;

      if (!arr) throw new Error("Invalid tournaments response (expected array or {content: []})");

      arr.sort((a, b) => b.id - a.id);
      setTournaments(arr);

      if (arr.length > 0 && selectedId == null) setSelectedId(arr[0].id);
      if (arr.length === 0) setSelectedId(null);
    } catch (e) {
      setListErr(isError(e) ? e.message : "Failed to load tournaments");
    } finally {
      setListLoading(false);
    }
  }, [apiFetch, ep.list, selectedId]);

  const fetchTournamentDetail = useCallback(
    async (id: number) => {
      setDetailLoading(true);
      setDetailErr(null);
      setDetail(null);

      try {
        const res = await apiFetch(ep.get(id));
        const text = await res.text();

        if (!res.ok) {
          const parsed = safeJsonParse(text);
          throw new Error(parsed?.message || `GET tournament failed (${res.status})`);
        }

        const t = safeJsonParse(text) as Tournament | null;
        if (!t?.id) throw new Error("Invalid tournament response");

        setDetail(t);

        // init inputs
        setStartLocal(toDatetimeLocalValueFromIso(t.startDate));
        setEndLocal(toDatetimeLocalValueFromIso(t.endDate));
        setSaveErr(null);
        setSaveOk(null);
        setDeleteErr(null);
      } catch (e) {
        setDetailErr(isError(e) ? e.message : "Failed to load tournament");
      } finally {
        setDetailLoading(false);
      }
    },
    [apiFetch, ep]
  );

  const fetchParticipants = useCallback(
    async (id: number) => {
      setPartLoading(true);
      setPartErr(null);
      setParticipants([]);
      try {
        const res = await apiFetch(ep.participants(id));
        const text = await res.text();

        if (!res.ok) {
          const parsed = safeJsonParse(text);
          throw new Error(parsed?.message || `GET participants failed (${res.status})`);
        }

        const arr = safeJsonParse(text) as Participant[] | null;
        if (!Array.isArray(arr)) throw new Error("Invalid participants response (not array)");

        setParticipants(arr);
      } catch (e) {
        setPartErr(isError(e) ? e.message : "Failed to load participants");
      } finally {
        setPartLoading(false);
      }
    },
    [apiFetch, ep]
  );

  const fetchPlaylistInfo = useCallback(
    async (playlistId: number) => {
      setPlistLoading(true);
      setPlistErr(null);
      setPlaylist(null);
      setPlaylistSongs([]);

      try {
        const [res1, res2] = await Promise.all([
          apiFetch(`/api/playlists/${playlistId}`),
          apiFetch(`/api/playlists/${playlistId}/songs`),
        ]);

        const t1 = await res1.text();
        const t2 = await res2.text();

        if (!res1.ok) {
          const parsed = safeJsonParse(t1);
          throw new Error(parsed?.message || `GET /api/playlists/${playlistId} failed (${res1.status})`);
        }
        if (!res2.ok) {
          const parsed = safeJsonParse(t2);
          throw new Error(parsed?.message || `GET /api/playlists/${playlistId}/songs failed (${res2.status})`);
        }

        const p = safeJsonParse(t1) as Playlist | null;
        const songs = safeJsonParse(t2) as Music[] | null;

        if (!p?.id) throw new Error("Invalid playlist response");
        if (!Array.isArray(songs)) throw new Error("Invalid playlist songs response");

        setPlaylist(p);
        setPlaylistSongs(songs);
      } catch (e) {
        setPlistErr(isError(e) ? e.message : "Failed to load playlist");
      } finally {
        setPlistLoading(false);
      }
    },
    [apiFetch]
  );

  // time validation
  useEffect(() => {
    setTimeError(null);
    if (!startLocal || !endLocal) return;

    const startMs = new Date(startLocal).getTime();
    const endMs = new Date(endLocal).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      setTimeError("Invalid date value.");
      return;
    }
    if (endMs <= startMs) {
      setTimeError("End must be after Start.");
      return;
    }
    // UPCOMING ise min 2 dakika kuralı
    const nowMs = Date.now();
    if ((detail?.status ?? "UPCOMING") === "UPCOMING" && startMs < nowMs + 2 * 60 * 1000) {
      setTimeError("Start time must be at least 2 minutes from now.");
      return;
    }
  }, [startLocal, endLocal, detail?.status]);

  // initial load
  useEffect(() => {
    if (!token) return;
    fetchTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, apiBase]);

  // selection -> load detail + participants + playlist
  useEffect(() => {
    if (!token) return;
    if (!selectedId) return;

    fetchTournamentDetail(selectedId);
    fetchParticipants(selectedId);
  }, [token, selectedId, fetchTournamentDetail, fetchParticipants]);

  // when detail changes -> load playlist
  useEffect(() => {
    if (!detail?.playlistId) return;
    fetchPlaylistInfo(detail.playlistId);
  }, [detail?.playlistId, fetchPlaylistInfo]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return tournaments;
    return tournaments.filter((t) =>
      normalize(`${t.id} ${t.name ?? ""} ${t.status ?? ""} ${t.creatorUsername ?? ""}`).includes(q)
    );
  }, [tournaments, query]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const s = (page - 1) * pageSize;
    return filtered.slice(s, s + pageSize);
  }, [filtered, page, pageSize]);

  const canSaveTimes = useMemo(() => {
    if (!detail?.id) return false;
    if (!startLocal || !endLocal) return false;
    if (timeError) return false;
    return !!token && !saving;
  }, [detail?.id, startLocal, endLocal, timeError, token, saving]);

  const saveTimes = useCallback(async () => {
    if (!detail?.id) return;
    setSaving(true);
    setSaveErr(null);
    setSaveOk(null);

    try {
      const payload = {
        startDate: toIsoFromDatetimeLocal(startLocal),
        endDate: toIsoFromDatetimeLocal(endLocal),
      };

      const res = await apiFetch(ep.update(detail.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        const parsed = safeJsonParse(text);
        throw new Error(
          parsed?.message ||
            `PATCH tournament failed (${res.status}). If your backend doesn't support PATCH, override endpoints.update.`
        );
      }

      const updated = safeJsonParse(text) as Tournament | null;
      // Bazı backendler PATCH sonrası body dönmeyebilir — o yüzden fallback: re-fetch
      if (updated?.id) {
        setDetail(updated);
      } else {
        await fetchTournamentDetail(detail.id);
      }

      setSaveOk("Tournament time updated.");
      // list refresh (status/fields değişebilir)
      fetchTournaments();
    } catch (e) {
      setSaveErr(isError(e) ? e.message : "Failed to update tournament");
    } finally {
      setSaving(false);
    }
  }, [apiFetch, detail?.id, startLocal, endLocal, ep, fetchTournamentDetail, fetchTournaments]);

  const removeParticipant = useCallback(
    async (tournamentId: number, userId: number) => {
      setPartErr(null);
      try {
        const res = await apiFetch(ep.participantRemove(tournamentId, userId), { method: "DELETE" });
        const text = await res.text();
        if (!res.ok) {
          const parsed = safeJsonParse(text);
          throw new Error(
            parsed?.message ||
              `DELETE participant failed (${res.status}). If endpoint differs, override endpoints.participantRemove.`
          );
        }
        // refresh
        fetchParticipants(tournamentId);
      } catch (e) {
        setPartErr(isError(e) ? e.message : "Failed to remove participant");
      }
    },
    [apiFetch, ep, fetchParticipants]
  );

  const deleteTournament = useCallback(async () => {
    if (!detail?.id) return;

    setDeleting(true);
    setDeleteErr(null);
    try {
      const res = await apiFetch(ep.del(detail.id), { method: "DELETE" });
      const text = await res.text();
      if (!res.ok) {
        const parsed = safeJsonParse(text);
        throw new Error(
          parsed?.message || `DELETE tournament failed (${res.status}). If endpoint differs, override endpoints.del.`
        );
      }

      // refresh list & reset detail
      await fetchTournaments();
      setDetail(null);
      setSelectedId(null);
    } catch (e) {
      setDeleteErr(isError(e) ? e.message : "Failed to delete tournament");
    } finally {
      setDeleting(false);
    }
  }, [apiFetch, detail?.id, ep, fetchTournaments]);

  return (
    <div className="w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Tournament Management</h2>
          <p className="mt-1 text-sm text-slate-500">View all tournaments and update selected tournament.</p>
        </div>
        <button
          type="button"
          onClick={fetchTournaments}
          className="h-10 rounded-xl border border-slate-200 px-4 text-sm hover:bg-slate-50"
        >
          Reload
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT: list */}
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">All tournaments</div>
            <div className="text-xs text-slate-500">{filtered.length} total</div>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search (id, name, status, creator)..."
              className="h-10 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
            >
              {[5, 8, 12, 20].map((n) => (
                <option key={n} value={n}>
                  {n}/p
                </option>
              ))}
            </select>
          </div>

          {listErr && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {listErr}
            </div>
          )}

          {listLoading ? (
            <div className="mt-3 text-sm text-slate-600">Loading tournaments...</div>
          ) : (
            <div className="mt-3 space-y-2">
              {pageItems.map((t) => {
                const active = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={[
                      "w-full rounded-2xl border p-3 text-left transition-colors",
                      active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{t.name}</div>
                        <div className={active ? "text-xs text-white/70" : "text-xs text-slate-500"}>
                          #{t.id} • {t.status ?? "-"} • playlist #{t.playlistId}
                        </div>
                        {(t.startDate || t.endDate) && (
                          <div className={active ? "mt-1 text-xs text-white/70" : "mt-1 text-xs text-slate-500"}>
                            {t.startDate ? `Start: ${t.startDate}` : ""}{" "}
                            {t.endDate ? `• End: ${t.endDate}` : ""}
                          </div>
                        )}
                      </div>

                      {active && <span className="rounded-full bg-white/15 px-2 py-1 text-xs">Selected</span>}
                    </div>
                  </button>
                );
              })}

              {pageItems.length === 0 && <div className="text-sm text-slate-600">No tournaments found.</div>}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <div className="text-sm text-slate-600">
              {page} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* RIGHT: detail */}
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="text-sm font-semibold">Selected tournament</div>

          {detailLoading ? (
            <div className="mt-3 text-sm text-slate-600">Loading details...</div>
          ) : detailErr ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {detailErr}
            </div>
          ) : !detail ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              Select a tournament from the list.
            </div>
          ) : (
            <>
              {/* header */}
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{detail.name}</div>
                    <div className="mt-0.5 text-xs text-slate-600">
                      #{detail.id} • {detail.status ?? "-"} • playlist #{detail.playlistId}
                    </div>
                    {detail.description && <div className="mt-1 text-xs text-slate-600">{detail.description}</div>}
                  </div>

                  {detail.coverUrl && (
                    <div className="h-14 w-24 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={detail.coverUrl} alt="cover" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* time update */}
              <div className="mt-4 rounded-2xl border border-slate-200 p-3">
                <div className="text-sm font-semibold">Update time</div>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Start</label>
                    <input
                      type="datetime-local"
                      value={startLocal}
                      onChange={(e) => setStartLocal(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">End</label>
                    <input
                      type="datetime-local"
                      value={endLocal}
                      onChange={(e) => setEndLocal(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                {timeError && <div className="mt-2 text-xs font-medium text-red-600">{timeError}</div>}
                {saveErr && (
                  <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {saveErr}
                  </div>
                )}
                {saveOk && (
                  <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    {saveOk}
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={saveTimes}
                    disabled={!canSaveTimes}
                    className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save times"}
                  </button>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  Not: Eğer backend PATCH desteklemiyorsa, `endpoints.update` ile doğru endpoint ver.
                </div>
              </div>

              {/* participants */}
              <div className="mt-4 rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">Participants</div>
                  <button
                    type="button"
                    onClick={() => fetchParticipants(detail.id)}
                    className="h-9 rounded-xl border border-slate-200 px-3 text-sm hover:bg-slate-50"
                  >
                    Reload
                  </button>
                </div>

                {partErr && (
                  <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {partErr}
                  </div>
                )}

                {partLoading ? (
                  <div className="mt-2 text-sm text-slate-600">Loading participants...</div>
                ) : (
                  <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-slate-200">
                    <ul className="divide-y divide-slate-100">
                      {participants.map((p) => (
                        <li key={p.userId} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{p.username}</div>
                            <div className="text-xs text-slate-500">userId: {p.userId}</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeParticipant(detail.id, p.userId)}
                            className="h-9 rounded-xl border border-red-200 px-3 text-sm text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                      {participants.length === 0 && (
                        <li className="px-3 py-3 text-sm text-slate-600">No participants.</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="mt-2 text-xs text-slate-500">
                  Not: Participant remove endpoint farklıysa `endpoints.participantRemove` override et.
                </div>
              </div>

              {/* playlist read-only */}
              <div className="mt-4 rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">Playlist (read-only)</div>
                  <button
                    type="button"
                    onClick={() => router.push(`${playlistEditPath}?id=${detail.playlistId}`)}
                    className="h-9 rounded-xl bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Open playlist editor
                  </button>
                </div>

                {plistErr && (
                  <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {plistErr}
                  </div>
                )}

                {plistLoading ? (
                  <div className="mt-2 text-sm text-slate-600">Loading playlist...</div>
                ) : (
                  <>
                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                      <div className="font-medium">{playlist?.name ?? "-"}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        Playlist #{detail.playlistId} • ownerId: {playlist?.ownerId ?? "-"} • songs:{" "}
                        {playlistSongs.length}
                      </div>
                    </div>

                    <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-slate-200">
                      <ul className="divide-y divide-slate-100">
                        {playlistSongs.map((m) => (
                          <li key={m.id} className="px-3 py-2">
                            <div className="text-sm font-medium truncate">{m.name}</div>
                            <div className="text-xs text-slate-500 truncate">
                              #{m.id} • {m.artist?.name ?? "-"} • {m.genre?.name ?? "-"}
                            </div>
                          </li>
                        ))}
                        {playlistSongs.length === 0 && (
                          <li className="px-3 py-3 text-sm text-slate-600">Playlist has no songs.</li>
                        )}
                      </ul>
                    </div>
                  </>
                )}
              </div>

              {/* delete tournament */}
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3">
                <div className="text-sm font-semibold text-red-800">Danger zone</div>
                <div className="mt-1 text-xs text-red-700">
                  This will permanently delete the tournament (backend must support it).
                </div>

                {deleteErr && (
                  <div className="mt-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-red-700">
                    {deleteErr}
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const ok = window.confirm(`Delete tournament #${detail.id}? This cannot be undone.`);
                      if (ok) deleteTournament();
                    }}
                    disabled={deleting}
                    className="h-10 rounded-xl bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting ? "Deleting..." : "Delete tournament"}
                  </button>
                </div>

                <div className="mt-2 text-xs text-red-700/80">
                  Not: Tournament delete endpoint farklıysa `endpoints.del` override et.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
