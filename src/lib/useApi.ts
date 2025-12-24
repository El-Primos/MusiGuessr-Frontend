"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

function getTokenFromLocalStorage(): string {
  try {
    const raw = localStorage.getItem("user");
    
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    
    return parsed?.accessToken || "";
  } catch {
    return "";
  }
}

export function useApi(apiBase: string) {
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(getTokenFromLocalStorage());
  }, []);

  const authHeaders = useMemo(() => {
    return {
      accept: "*/*",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    } as Record<string, string>;
  }, [token]);

  const apiFetch = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const headers: Record<string, string> = {
        ...authHeaders,
        ...(init.headers as Record<string, string> | undefined),
      };

      const res = await fetch(`${apiBase}${path}`, {
        ...init,
        headers,
        cache: init.cache ?? "no-store",
      });

      return res;
    },
    [apiBase, authHeaders]
  );

  return { token, authHeaders, apiFetch };
}
