"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ShareGamePost, { ShareGamePostData } from "@/components/Game/ShareGamePost";
import { useApi } from "@/lib/useApi";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

export default function SharePostPage() {
  const params = useParams();
  const id = params?.id as string;
  const idNum = Number(id);

  // useApi'den token'ı da çekiyoruz
  const { apiFetch, token } = useApi(API_BASE);
  
  const [data, setData] = useState<ShareGamePostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    const checkToken = localStorage.getItem("user");
    if (!checkToken) {
      setError("Lütfen önce giriş yapın (Token bulunamadı).");
      setLoading(false);
      return;
    }

    async function fetchData() {
      if (!idNum) return;

      try {
        const res = await apiFetch(`/api/posts/${idNum}`);
        
        if (res.status === 401) {
          throw new Error("Oturum süreniz dolmuş veya yetkiniz yok (401).");
        }

        if (!res.ok) throw new Error(`Hata: ${res.status}`);
        
        const json = await res.json();
        setData(json);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Bilinmeyen bir hata oluştu.");
        }
      } finally {
        setLoading(false);
      }
    }

    // Token useApi içinde set edildiğinde veya sayfa yüklendiğinde çalış
    if (token) {
      fetchData();
    }
  }, [idNum, apiFetch, token]); // token bağımlılığını ekledik

  if (loading) return <div className="p-20 text-white">Yükleniyor...</div>;
  if (error) return <div className="p-20 text-red-500">❌ Hata: {error}</div>;

  return (
    <div className="min-h-screen bg-black py-10 flex justify-center">
      {data && <ShareGamePost data={data} />}
    </div>
  );
}