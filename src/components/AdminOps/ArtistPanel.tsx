"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import { Artist } from "@/dto/common.dto";
import { useLanguage } from "@/contexts/LanguageContext";

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
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
      <path
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"
      />
    </svg>
  );
}

export default function ArtistPanel({ apiBase }: Props) {
  const { token, apiFetch } = useApi(apiBase);
  const { t } = useLanguage();

  const [items, setItems] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // add
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  // search + pagination
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // delete/edit
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchArtists = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setErr(null);

    try {
      const res = await apiFetch("/api/artists");
      const text = await res.text();

      if (!res.ok) {
        const parsed = safeJsonParse(text);
        throw new Error(parsed?.message || `GET /api/artists failed (${res.status})`);
      }

      const data = safeJsonParse(text) as Artist[] | null;
      if (!Array.isArray(data)) throw new Error("Invalid /api/artists response (not an array)");

      data.sort((a, b) => b.id - a.id);
      setItems(data);
    } catch (e: unknown) {
      setErr(isError(e) ? e.message : "Failed to load artists");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, token]);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  const filtered = useMemo(() => {
    const query = normalize(q);
    if (!query) return items;
    return items.filter((a) => `${a.id} ${a.name}`.toLowerCase().includes(query));
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

  const canAdd = useMemo(() => newName.trim().length > 0 && !adding, [newName, adding]);

  async function addArtist() {
    const name = newName.trim();
    if (!name) return;

    setAdding(true);
    setErr(null);

    try {
      const res = await apiFetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const text = await res.text();
      if (!res.ok) {
        const parsed = safeJsonParse(text);
        throw new Error(parsed?.message || `POST /api/artists failed (${res.status})`);
      }

      const created = safeJsonParse(text) as Artist | null;
      if (created?.id) {
        setItems((cur) => [created, ...cur].sort((a, b) => b.id - a.id));
      } else {
        await fetchArtists();
      }

      setNewName("");
      setPage(1);
    } catch (e: unknown) {
      setErr(isError(e) ? e.message : "Add failed");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(a: Artist) {
    setErr(null);
    setEditingId(a.id);
    setEditName(a.name ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setSavingId(null);
  }

  async function saveEdit(id: number) {
    const name = editName.trim();
    if (!name) {
      setErr("Artist name cannot be empty.");
      return;
    }

    setSavingId(id);
    setErr(null);

    const prev = items;
    setItems((cur) => cur.map((x) => (x.id === id ? { ...x, name } : x)));

    try {
      const res = await apiFetch(`/api/artists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const text = await res.text();
      if (!res.ok) {
        const parsed = safeJsonParse(text);
        throw new Error(parsed?.message || `PATCH /api/artists/${id} failed (${res.status})`);
      }

      const updated = safeJsonParse(text) as Artist | null;
      if (updated?.id) {
        setItems((cur) => cur.map((x) => (x.id === id ? updated : x)).sort((a, b) => b.id - a.id));
      } else {
        await fetchArtists();
      }

      cancelEdit();
    } catch (e: unknown) {
      setItems(prev);
      setErr(isError(e) ? e.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteArtist(id: number) {
    const prev = items;
    setDeletingId(id);
    setErr(null);

    setItems((cur) => cur.filter((x) => x.id !== id));

    try {
      const res = await apiFetch(`/api/artists/${id}`, { method: "DELETE" });

      const text = await res.text().catch(() => "");
      if (!res.ok) {
        const parsed = safeJsonParse(text);
        throw new Error(parsed?.message || `DELETE /api/artists/${id} failed (${res.status})`);
      }
    } catch (e: unknown) {
      setItems(prev);
      setErr(isError(e) ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">{t('admin.artists')}</h2>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder={t('admin.searchByIdName')}
            className="w-full sm:w-72 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
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
                {n} {t('admin.perPage')}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchArtists}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {t('admin.refresh')}
          </button>
        </div>
      </div>

      {/* Add new */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm font-semibold text-slate-800">{t('admin.addNewArtist')}</div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Tarkan"
            className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <button
            type="button"
            onClick={addArtist}
            disabled={!canAdd}
            className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {adding ? t('admin.adding') : t('admin.add')}
          </button>
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* List */}
      <div className="mt-5 rounded-2xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
          <div className="col-span-2 sm:col-span-1">ID</div>
          <div className="col-span-7 sm:col-span-8">{t('admin.name')}</div>
          <div className="col-span-3 sm:col-span-3 text-right">{t('admin.actions')}</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-600">{t('admin.loading')}</div>
        ) : pageItems.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-600">{t('admin.noArtists')}</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pageItems.map((a) => {
              const isEditing = editingId === a.id;
              const isDeleting = deletingId === a.id;
              const isSaving = savingId === a.id;

              return (
                <li key={a.id} className="grid grid-cols-12 items-start px-4 py-3 gap-y-2 min-w-0">
                  <div className="col-span-2 sm:col-span-1 font-mono text-sm text-slate-700 pt-2">
                    {a.id}
                  </div>

                  <div className="col-span-10 sm:col-span-8 min-w-0">
                    {isEditing ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-10 w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        placeholder="Artist name"
                      />
                    ) : (
                      <div className="pt-2 text-sm font-medium text-slate-900">{a.name}</div>
                    )}
                  </div>

                  <div className="col-span-12 sm:col-span-3 flex sm:justify-end gap-2 sm:self-start sm:z-20">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(a.id)}
                          disabled={isSaving || isDeleting}
                          className="h-10 rounded-xl bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                          {isSaving ? t('admin.saving') : t('admin.save')}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isSaving || isDeleting}
                          className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          {t('admin.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(a)}
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-700 hover:bg-slate-50"
                          title={t('admin.edit')}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteArtist(a.id)}
                          disabled={isDeleting}
                          className="h-10 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                          {isDeleting ? t('admin.deleting') : t('admin.delete')}
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
          {t('admin.showing')}{" "}
          <span className="font-medium text-slate-900">
            {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}
          </span>{" "}
          -{" "}
          <span className="font-medium text-slate-900">
            {Math.min(page * pageSize, filtered.length)}
          </span>{" "}
          {t('admin.of')} <span className="font-medium text-slate-900">{filtered.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {t('admin.first')}
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {t('admin.prev')}
          </button>

          <div className="text-sm text-slate-700">
            {t('admin.page')} <span className="font-medium">{page}</span> /{" "}
            <span className="font-medium">{totalPages}</span>
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {t('admin.next')}
          </button>
          <button
            type="button"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {t('admin.last')}
          </button>
        </div>
      </div>
    </div>
  );
}
