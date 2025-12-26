"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function getTokensFromLocalStorage(): AuthTokens {
  if (typeof window === 'undefined') return { accessToken: "", refreshToken: "" };
  
  try {
    const raw = localStorage.getItem("user");
    
    if (!raw) return { accessToken: "", refreshToken: "" };
    const parsed = JSON.parse(raw);
    
    return {
      accessToken: parsed?.accessToken || "",
      refreshToken: parsed?.refreshToken || "",
    };
  } catch {
    return { accessToken: "", refreshToken: "" };
  }
}

function updateTokensInLocalStorage(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    
    const parsed = JSON.parse(raw);
    parsed.accessToken = accessToken;
    parsed.refreshToken = refreshToken;
    
    localStorage.setItem("user", JSON.stringify(parsed));
  } catch (error) {
    console.error("Failed to update tokens in localStorage:", error);
  }
}

export function useApi(apiBase: string) {
  // Initialize tokens immediately from localStorage
  const [tokens, setTokens] = useState<AuthTokens>(() => getTokensFromLocalStorage());
  const isRefreshingRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    // Update tokens if they change
    const currentTokens = getTokensFromLocalStorage();
    if (currentTokens.accessToken !== tokens.accessToken || 
        currentTokens.refreshToken !== tokens.refreshToken) {
      setTokens(currentTokens);
    }
  }, [tokens]);

  const authHeaders = useMemo(() => {
    return {
      accept: "*/*",
      ...(tokens.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
    } as Record<string, string>;
  }, [tokens.accessToken]);

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    // If already refreshing, wait for that promise
    if (isRefreshingRef.current && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    // Start refreshing
    isRefreshingRef.current = true;
    
    const refreshPromise = (async () => {
      try {
        const { refreshToken } = getTokensFromLocalStorage();
        
        if (!refreshToken) {
          console.error("No refresh token available");
          return false;
        }

        const response = await fetch(`${apiBase}/api/auth/refresh-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          console.error("Failed to refresh token:", response.status);
          // Clear tokens on refresh failure
          if (typeof window !== 'undefined') {
            localStorage.removeItem("user");
          }
          setTokens({ accessToken: "", refreshToken: "" });
          return false;
        }

        const data = await response.json();
        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        if (!newAccessToken || !newRefreshToken) {
          console.error("Invalid token response");
          return false;
        }

        // Update tokens in localStorage and state
        updateTokensInLocalStorage(newAccessToken, newRefreshToken);
        setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });

        return true;
      } catch (error) {
        console.error("Error refreshing token:", error);
        return false;
      } finally {
        isRefreshingRef.current = false;
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [apiBase]);

  const apiFetch = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const headers: Record<string, string> = {
        ...authHeaders,
        ...(init.headers as Record<string, string> | undefined),
      };

      let res = await fetch(`${apiBase}${path}`, {
        ...init,
        headers,
        cache: init.cache ?? "no-store",
      });

      // If we get a 401 and have a refresh token, try to refresh and retry once
      if (res.status === 401 && tokens.refreshToken && !init.signal?.aborted) {
        const refreshed = await refreshAccessToken();
        
        if (refreshed) {
          // Retry the request with the new token
          const newTokens = getTokensFromLocalStorage();
          const newHeaders: Record<string, string> = {
            ...headers,
            ...(newTokens.accessToken ? { Authorization: `Bearer ${newTokens.accessToken}` } : {}),
          };

          res = await fetch(`${apiBase}${path}`, {
            ...init,
            headers: newHeaders,
            cache: init.cache ?? "no-store",
          });
        }
      }

      return res;
    },
    [apiBase, authHeaders, tokens.refreshToken, refreshAccessToken]
  );

  return { 
    token: tokens.accessToken, 
    refreshToken: tokens.refreshToken,
    authHeaders, 
    apiFetch,
    refreshAccessToken,
  };
}
