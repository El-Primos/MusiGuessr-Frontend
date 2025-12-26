"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = { apiBase: string; onCreated?: (t: Tournament) => void };

type Playlist = {
  id: number;
  name: string;
  ownerId: number;
  createdAt?: string;
  message?: string;
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
};

type CreateTournamentReq = {
  name: string;
  description?: string;
  playlistId: number;
  startDate: string; // ISO date-time
  endDate: string;   // ISO date-time
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

function toIsoFromDatetimeLocal(value: string): string {
  // value example: "2025-12-23T19:00"
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value; // fallback
  return d.toISOString();
}

function getUserIdFromStorage(): number | null {
  if (!localStorage.getItem("user")) return null;
  const parsed = safeJsonParse(localStorage.getItem("user")!) as
    | { id?: number; userId?: number }
    | null;

  const id = parsed?.id ?? parsed?.userId;
  return typeof id === "number" && id > 0 ? id : null;
}

export default function TournamentCreate({ apiBase, onCreated }: Props) {
  const { token, apiFetch } = useApi(apiBase);
  const { t } = useLanguage();

  // playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [plistLoading, setPlistLoading] = useState(false);
  const [plistErr, setPlistErr] = useState<string | null>(null);

  const [plistQuery, setPlistQuery] = useState("");
  const [plistPage, setPlistPage] = useState(1);
  const [plistPageSize, setPlistPageSize] = useState(8);

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);

  // form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [startLocal, setStartLocal] = useState(""); // datetime-local string
  const [endLocal, setEndLocal] = useState("");

  // submit
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [created, setCreated] = useState<Tournament | null>(null);

  // time err
  const MIN_START_MS = 2 * 60 * 1000;
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (!startLocal || !endLocal) {
      setTimeError(null);
      return;
    }

    const startMs = new Date(startLocal).getTime();
    const endMs = new Date(endLocal).getTime();
    const nowMs = Date.now();

    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      setTimeError("Invalid date value.");
      return;
    }
    if (startMs < nowMs + MIN_START_MS) {
      setTimeError("Start time must be at least 2 minutes from now.");
      return;
    }
    if (endMs <= startMs) {
      setTimeError("End must be after Start.");
      return;
    }

    setTimeError(null);
  }, [startLocal, endLocal, MIN_START_MS]);


  function pad2(n: number) {
    return String(n).padStart(2, "0");
  }

  function toDatetimeLocalValue(d: Date) {
    // datetime-local: "YYYY-MM-DDTHH:mm"
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  function nowPlusMinutes(min: number) {
    const d = new Date();
    d.setMinutes(d.getMinutes() + min);
    d.setSeconds(0, 0);
    return d;
  
  }
  const minStartMs = useMemo(() => {
    const d = nowPlusMinutes(2);
    return d.getTime();
  }, []);

  const minStartLocal = useMemo(() => toDatetimeLocalValue(nowPlusMinutes(2)), [toDatetimeLocalValue]);


  const fetchPlaylists = useCallback(async () => {
    setPlistLoading(true);
    setPlistErr(null);

    try {
      const ownerId = getUserIdFromStorage();
      if (!ownerId) throw new Error("User not found. Please login again.");

      const qs = new URLSearchParams();
      qs.set("ownerId", String(ownerId));

      // İstersen backend name filtresi de kullanalım (opsiyonel)
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

      if (data.length > 0 && selectedPlaylistId == null) setSelectedPlaylistId(data[0].id);
      if (data.length > 0 && selectedPlaylistId != null && !data.some((p) => p.id === selectedPlaylistId)) {
        setSelectedPlaylistId(data[0].id);
      }
      if (data.length === 0) setSelectedPlaylistId(null);
    } catch (e: unknown) {
      setPlistErr(isError(e) ? e.message : "Failed to load playlists");
    } finally {
      setPlistLoading(false);
    }
  }, [apiFetch, plistQuery, selectedPlaylistId]);

  useEffect(() => {
    if (!token) return;
    fetchPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, apiBase]);

  const filteredPlaylists = useMemo(() => {
    // backend name filtresi kullanıyorsak bu ekstra filtre şart değil;;;
    const q = normalize(plistQuery);
    if (!q) return playlists;

    return playlists.filter((p) => normalize(`${p.id} ${p.name ?? ""}`).includes(q));
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

  const canCreate = useMemo(() => {
    if (!selectedPlaylistId) return false;
    if (!name.trim()) return false;
    if (!startLocal || !endLocal) return false;

    const startMs = new Date(startLocal).getTime();
    const endMs = new Date(endLocal).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return false;

    if (startMs < minStartMs) return false;     // ✅ 2 dk kuralı
    if (endMs <= startMs) return false;

    return !!token && !creating;
  }, [selectedPlaylistId, name, startLocal, endLocal, token, creating, minStartMs]);

  const createTournament = useCallback(async () => {
    setErr(null);
    setCreated(null);

    if (!selectedPlaylistId) {
      setErr("Please select a playlist.");
      return;
    }

    const startMs = new Date(startLocal).getTime();
    if (startMs < minStartMs) {
      setErr("Start time must be at least 2 minutes from now.");
      return;
    }

    const startIso = toIsoFromDatetimeLocal(startLocal);
    const endIso = toIsoFromDatetimeLocal(endLocal);

    const payload: CreateTournamentReq = {
      name: name.trim(),
      description: description.trim() ? description.trim() : undefined,
      playlistId: selectedPlaylistId,
      startDate: startIso,
      endDate: endIso,
    };

    setCreating(true);
    try {
      const res = await apiFetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        const parsed = safeJsonParse(text);
        throw new Error(parsed?.message || `POST /api/tournaments failed (${res.status})`);
      }

      const json = safeJsonParse(text) as Tournament | null;
      if (!json?.id) throw new Error("Invalid tournament response");

      setCreated(json);
      onCreated?.(json);

      // küçük reset (istersen kapatma)
      // setName(""); setDescription("");
    } catch (e: unknown) {
      setErr(isError(e) ? e.message : "Failed to create tournament");
    } finally {
      setCreating(false);
    }
  }, [apiFetch, selectedPlaylistId, name, description, startLocal, endLocal, onCreated, minStartMs]);

  return (
    <div className="w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Create Tournament</h2>
          <p className="mt-1 text-sm text-slate-500">
            Select one of your playlists, set start/end time, and create.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchPlaylists}
          className="h-10 rounded-xl border border-slate-200 px-4 text-sm hover:bg-slate-50"
        >
          Reload playlists
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT: Playlist picker */}
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">Pick a playlist</div>
            <div className="text-xs text-slate-500">
              {filteredPlaylists.length} playlists
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={plistQuery}
              onChange={(e) => {
                setPlistQuery(e.target.value);
                setPlistPage(1);
              }}
              placeholder="Search playlists..."
              className="h-10 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
            <select
              value={plistPageSize}
              onChange={(e) => {
                setPlistPageSize(Number(e.target.value));
                setPlistPage(1);
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

          {plistErr && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {plistErr}
            </div>
          )}

          {plistLoading ? (
            <div className="mt-3 text-sm text-slate-600">Loading playlists...</div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <ul className="divide-y divide-slate-100">
                {plistPageItems.map((p) => {
                  const active = p.id === selectedPlaylistId;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedPlaylistId(p.id)}
                        className={[
                          "w-full px-3 py-2 text-left transition-colors",
                          active ? "bg-slate-900 text-white" : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{p.name}</div>
                            <div className={active ? "text-xs text-white/70" : "text-xs text-slate-500"}>
                              #{p.id}
                            </div>
                          </div>
                          {active && (
                            <span className="rounded-full bg-white/15 px-2 py-1 text-xs">
                              Selected
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
                {plistPageItems.length === 0 && (
                  <li className="px-3 py-3 text-sm text-slate-600">No playlists found.</li>
                )}
              </ul>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPlistPage((p) => Math.max(1, p - 1))}
              disabled={plistPage === 1}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <div className="text-sm text-slate-600">
              {plistPage} / {plistTotalPages}
            </div>
            <button
              type="button"
              onClick={() => setPlistPage((p) => Math.min(plistTotalPages, p + 1))}
              disabled={plistPage === plistTotalPages}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* RIGHT: Tournament form */}
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="text-sm font-semibold">Tournament details</div>

          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 90s Turkish Pop Cup"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional..."
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Start</label>
                <input
                  type="datetime-local"
                  value={startLocal}
                  min={minStartLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">End</label>
                <input
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <div className="font-medium">Selected playlist</div>
              <div className="mt-1 text-slate-600">
                {selectedPlaylistId
                  ? `#${selectedPlaylistId} • ${playlists.find((p) => p.id === selectedPlaylistId)?.name ?? "-"}`
                  : "None"}
              </div>
     
              {timeError && (
                <div className="mt-1 text-xs text-red-600 font-medium">
                  {timeError}
                </div>
              )}

            </div>

            {err && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {err}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={createTournament}
                disabled={!canCreate}
                className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Tournament"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {created && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-semibold text-emerald-900">Tournament created</div>
          <div className="mt-2 text-sm text-emerald-900/90 space-y-1">
            <div>
              <span className="font-medium">ID:</span> {created.id}
            </div>
            <div>
              <span className="font-medium">Name:</span> {created.name}
            </div>
            <div>
              <span className="font-medium">Playlist:</span> {created.playlistId}
            </div>
            {created.startDate && (
              <div>
                <span className="font-medium">Start:</span> {created.startDate}
              </div>
            )}
            {created.endDate && (
              <div>
                <span className="font-medium">End:</span> {created.endDate}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
