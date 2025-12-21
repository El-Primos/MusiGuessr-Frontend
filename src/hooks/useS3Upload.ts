import { useCallback, useRef, useState } from "react";

export type UploadUrlReq = {
  name: string;
  fileName: string;
  contentType: string;
};

export type UploadUrlRes = {
  message: string;
  key: string;
  uploadUrl: string;
};

export type UseS3UploadOptions = {
  apiBase?: string;
  uploadUrlPath?: string;

  // If auth needed for "upload-url" endpoint (NOT for presigned PUT)
  getAuthHeaders?: () => Record<string, string>;

  method?: "PUT";
};

export type S3UploadInput = {
  name: string;
  file: File;
};

export type S3UploadResult = {
  key: string;
  uploadUrl: string;
};

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function joinUrl(base: string, path: string) {
  if (!base) return path;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function isError(e: unknown): e is Error {
  return e instanceof Error;
}

export function useS3Upload(opts: UseS3UploadOptions = {}) {
  const {
    apiBase = "",
    uploadUrlPath = "/api/musics/upload-url",
    getAuthHeaders,
    method = "PUT",
  } = opts;

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"idle" | "requesting_url" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);

  // If two uploads are triggered simultaneously, to cancel/ignore the former:
  const callIdRef = useRef(0);

  const getAuthHeadersRef = useRef<UseS3UploadOptions["getAuthHeaders"]>(getAuthHeaders);
  getAuthHeadersRef.current = getAuthHeaders;

  const requestUploadUrl = useCallback(async (payload: UploadUrlReq): Promise<UploadUrlRes> => {
    const auth = getAuthHeadersRef.current ? getAuthHeadersRef.current() : {};

    const res = await fetch(joinUrl(apiBase, uploadUrlPath), {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
        ...auth,
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
    if (!parsed?.key || !parsed?.uploadUrl) {
      throw new Error("upload-url response missing key/uploadUrl");
    }
    return parsed;
  }, [apiBase, uploadUrlPath]);

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
          contentType: file.type || "application/octet-stream",
        });

        if (myCallId !== callIdRef.current) throw new Error("Upload cancelled");

        setStage("uploading");
        await uploadToPresignedUrl(urlRes.uploadUrl, file);

        if (myCallId !== callIdRef.current) throw new Error("Upload cancelled");

        setStage("idle");
        return { key: urlRes.key, uploadUrl: urlRes.uploadUrl };
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
