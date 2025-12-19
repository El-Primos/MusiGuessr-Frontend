'use client';

import Button from "@/components/Button";
import { Header } from "@/components/Header";
import { SettingsButton } from "@/components/SettingsButton";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StoredUser = {
  userId: number;
  userName: string;
  email: string;
};

export default function Home() {
  const router = useRouter();
  const [hasUser, setHasUser] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return setHasUser(false);
      const parsed = JSON.parse(raw) as Partial<StoredUser>;
      setHasUser(Boolean(parsed && parsed.userId && parsed.userName));
    } catch {
      setHasUser(false);
    }
  }, []);

  const go = (path: string) => router.push(path);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white flex flex-col">
      <Header
        logoSrc="/logo.png"
        exitVisible={false}
        onExit={() => console.log("EXIT")}
        className="top-0 left-0"
      />

      <div className="flex flex-col items-center justify-center flex-1 px-4 gap-4">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-6 py-10 shadow-lg">
          <h1 className="text-4xl font-bold mb-3 text-center">Welcome to MusiGuessr!</h1>
          <p className="text-lg mb-8 text-center text-white/80">
            Test your knowledge of music tracks and artists. Can you guess them all?
          </p>

          <div className="flex flex-col gap-3 items-center justify-center">
            <Button
              className="px-4 py-2 text-base bg-blue-600 hover:bg-blue-700"
              onClick={() => go("/game")}
            >
              Play
            </Button>

            <Button
              className="px-4 py-2 text-base bg-blue-600 hover:bg-blue-700"
              onClick={() => go("/game")}
            >
              Tournaments
            </Button>

            <Button
              className="px-4 py-2 text-base bg-blue-600 hover:bg-blue-700"
              onClick={() => go("/leaderboard")}
            >
              Leaderboard
            </Button>

            {/* login-signup - if there is no user in localStorage */}
            {!hasUser && (
              <div className="mt-3 flex items-center justify-center gap-3">
                <Button
                  className="px-4 py-2 text-sm bg-white/10 hover:bg-white/15 border border-white/10 min-w-[90px]"
                  onClick={() => go("/auth?mode=login")}
                >
                  Login
                </Button>
                <span className="text-white/40">|</span>
                <Button
                  className="px-4 py-2 text-sm bg-white/10 hover:bg-white/15 border border-white/10 min-w-[90px]"
                  onClick={() => go("/auth?mode=signup")}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SettingsButton />

      <div className="mt-auto p-4 text-center text-sm text-gray-400">
        &copy; 2025 MusiGuessr. All rights reserved.
      </div>
    </div>
  );
}
