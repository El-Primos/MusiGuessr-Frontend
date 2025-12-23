"use client";

import { Header } from "@/components/Header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PlaylistAdmin from "@/components/AdminOps/PlaylistAdmin";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function PlaylistCreatePage() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("user")) {
      console.log("You are an admin");
    } else {
      router.push("/");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      <Header
        logoSrc="/logo.png"
        exitVisible={true}
        onExit={() => router.push("/")}
        className="top-0 left-0"
      />

      <div className="mx-auto w-full max-w-6xl px-6 py-10 flex justify-center">
        <PlaylistAdmin apiBase={API_BASE} />

       
      </div>
       
    </div>
  );
}


