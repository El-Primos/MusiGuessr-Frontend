"use client";

import { Header } from "@/components/Header";
import TournamentCreate from "@/components/AdminOps/TournamentCreate";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function TournamentCreatePage() {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("user")) router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      <Header
        logoSrc="/logo.png"
        exitVisible
        onExit={() => router.push("/")}
        className="top-0 left-0"
      />

      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <TournamentCreate apiBase={API_BASE} />
      </div>
    </div>
  );
}
