'use client';

import Button from "@/components/Button";
import { Header } from "@/components/Header";
import { SettingsButton } from "@/components/SettingsButton";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { StoredUser } from "@/dto/common.dto"

export default function Home() {
  const router = useRouter();
  const [hasUser, setHasUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredUser;
        setHasUser(true);
        const role = parsed.role;
        setIsAdmin(role === "ADMIN");
      } catch {
        setHasUser(false);
      }
    }
  }, []);

  const go = (path: string) => router.push(path);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('friends');
    setHasUser(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-sky-50 dark:from-slate-900 dark:via-slate-950 dark:to-black text-slate-900 dark:text-white flex flex-col">
      <Header
        logoSrc="/logo.png"
        exitVisible={false}
        onExit={() => console.log("EXIT")}
        className="top-0 left-0"
        rightContent={
          hasUser ? (
            <div className="flex items-center gap-2 mr-2 md:mr-4">
              {isAdmin && (
                <button
                  onClick={() => router.push("/admin")}
                  className="px-2 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-1 md:gap-2 transition-colors"
                  title="Admin Panel"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}
              <button
                onClick={() => router.push("/profile")}
                className="px-2 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 md:gap-2 transition-colors"
                title="View Profile"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-2 md:px-3 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-1 transition-colors"
                title="Logout"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          ) : null
        }
      />

      <div className="flex flex-col items-center justify-center flex-1 px-4 gap-4">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur px-6 py-10 shadow-lg">
          <h1 className="text-4xl font-bold mb-3 text-center text-slate-900 dark:text-white">Welcome to MusiGuessr!</h1>
          <p className="text-lg mb-8 text-center text-slate-700 dark:text-white/80">
            Test your knowledge of music tracks and artists. Can you guess them all?
          </p>

          <div className="flex flex-col gap-3 items-center justify-center">
            <Button
              className="px-4 py-2 text-base text-slate-200 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              onClick={() => go("/game")}
            >
              Play
            </Button>

            <Button
              className="px-4 py-2 text-base text-slate-200 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              onClick={() => go("/tournaments")}
            >
              Tournaments
            </Button>

            <Button
              className="px-4 py-2 text-base text-slate-200 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              onClick={() => go("/leaderboard")}
            >
              Leaderboard
            </Button>

            {/* login-signup - if there is no user in localStorage */}
            {!hasUser && (
              <div className="mt-3 flex items-center justify-center gap-3">
                <Button
                  className="px-4 py-2 text-sm bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-300 dark:border-white/10 min-w-[90px] text-slate-900 dark:text-white"
                  onClick={() => go("/auth?mode=login")}
                >
                  Login
                </Button>
                <span className="text-slate-400 dark:text-white/40">|</span>
                <Button
                  className="px-4 py-2 text-sm bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-300 dark:border-white/10 min-w-[90px] text-slate-900 dark:text-white"
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

      <div className="mt-auto p-4 text-center text-sm text-slate-500 dark:text-gray-400">
        &copy; 2025 MusiGuessr. All rights reserved.
      </div>
    </div>
  );
}
