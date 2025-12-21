"use client";

import { useCallback, useRef, useState } from "react";

export type UploadUrlReq = {
  name: string;
  fileName: string;
  content_type: string; // <-- this may change after backend camelCase refactoring
};

export type UploadUrlRes = {
  message: string;
  key: string;
  upload_url: string; // <-- this may change after backend camelCase refactoring
};

export type S3UploadInput = {
  name: string;
  file: File;
};

export type S3UploadResult = {
  key: string;
  uploadUrl: string;
};

export type UseS3UploadOptions = {
  uploadUrlPath?: string;

  /**
   * IMPORTANT:
   * This should be `apiFetch` returned from `useApi(apiBase)`
  */
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;

  method?: "PUT";
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

export function useS3Upload(opts: UseS3UploadOptions) {
  const { apiFetch, uploadUrlPath = "/api/musics/upload-url", method = "PUT" } = opts;

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"idle" | "requesting_url" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);

  // If two uploads are triggered simultaneously, to cancel/ignore the former:
  const callIdRef = useRef(0);

  const requestUploadUrl = useCallback(
    async (payload: UploadUrlReq): Promise<UploadUrlRes> => {
      const res = await apiFetch(uploadUrlPath, {
        method: "POST",
        headers: {
          // apiFetch already merges authHeaders, so no need to pass Authorization here
          "Content-Type": "application/json",
          accept: "*/*",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const text = await res.text();
      if (!res.ok) {
        const parsed = safeJsonParse(text);
        throw new Error(
          parsed?.message || `upload-url failed (${res.status}): ${text || res.statusText}`
        );
      }

      const parsed = safeJsonParse(text) as UploadUrlRes | null;
      if (!parsed?.key || !parsed?.upload_url) {
        throw new Error("upload-url response missing key/uploadUrl");
      }
      return parsed;
    },
    [apiFetch, uploadUrlPath]
  );

  const uploadToPresignedUrl = useCallback(
    async (uploadUrl: string, file: File) => {

      const res = await fetch(uploadUrl, {
        method,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Upload to storage failed (${res.status}): ${text || res.statusText}`);
      }
    },
    [method]
  );

  const upload = useCallback(
    async ({ name, file }: S3UploadInput): Promise<S3UploadResult> => {
      const myCallId = ++callIdRef.current;

      setError(null);
      setLoading(true);
      setStage("requesting_url");

      try {
        const urlRes = await requestUploadUrl({
          name,
          fileName: file.name,
          content_type: file.type || "application/octet-stream",
        });

        if (myCallId !== callIdRef.current) throw new Error("Upload cancelled");

        setStage("uploading");
        await uploadToPresignedUrl(urlRes.upload_url, file);

        if (myCallId !== callIdRef.current) throw new Error("Upload cancelled");

        setStage("idle");
        return { key: urlRes.key, uploadUrl: urlRes.upload_url };
      } catch (e: unknown) {
        setStage("idle");

        if (isError(e)) {
          if (e.message !== "Upload cancelled") setError(e.message);
        } else {
          setError("Unexpected error");
        }

        throw e;
      } finally {
        if (myCallId === callIdRef.current) setLoading(false);
      }
    },
    [requestUploadUrl, uploadToPresignedUrl]
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
    setStage("idle");
  }, []);

  return { upload, loading, stage, error, reset };
}
