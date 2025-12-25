"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import Button from "@/components/Button";
import { useApi } from "@/lib/useApi";
import { AuthRes } from "@/dto/common.dto";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiFetch } = useApi(API_BASE);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginUserName, setLoginUserName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const modeParam = searchParams?.get("mode");
    if (modeParam === "login" || modeParam === "signup") {
      setMode(modeParam);
    }
  }, [searchParams]);

  const switchMode = (newMode: "login" | "signup") => {
    setMode(newMode);
    setError(null);
    router.replace(`/auth?mode=${newMode}`);
  };

  const login = async () => {
    if (!loginUserName.trim() || !loginPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUserName.trim(),
          password: loginPassword.trim(),
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = `Login failed (${res.status})`;
        try {
          const errJson = JSON.parse(text);
          msg = errJson.message || msg;
        } catch {}
        setError(msg);
        return;
      }

      const data: AuthRes = JSON.parse(text);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          username: data.username,
          email: data.email,
          role: data.role,
        })
      );

      router.push("/");
    } catch (err: any) {
      setError(err.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const signup = async () => {
    if (!name.trim() || !userName.trim() || !email.trim() || !signupPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: userName.trim(),
          email: email.trim(),
          password: signupPassword.trim(),
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = `Signup failed (${res.status})`;
        try {
          const errJson = JSON.parse(text);
          msg = errJson.message || msg;
        } catch {}
        setError(msg);
        return;
      }

      const data: AuthRes = JSON.parse(text);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          username: data.username,
          email: data.email,
          role: data.role,
        })
      );

      router.push("/");
    } catch (err: any) {
      setError(err.message || "An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Welcome Back" : "Create Account";
  const subtitle = mode === "login" ? "Enter your credentials to continue" : "Sign up to start guessing";
  const primaryBtnClass = "w-full rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white transition-all hover:bg-blue-500 hover:scale-[1.02] disabled:opacity-50 active:scale-95";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black">
      <Header
        logoSrc="/logo.png"
        exitVisible={false}
        onExit={() => {}}
        className="top-0 left-0"
      />
    
      <div className="flex-1 flex items-center justify-center px-4 text-slate-900 dark:text-white">
        <div className="w-full max-w-md m-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
              <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={[
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    mode === "login" ? "bg-blue-600 text-white shadow-lg" : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white",
                  ].join(" ")}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={[
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    mode === "signup" ? "bg-blue-600 text-white shadow-lg" : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white",
                  ].join(" ")}
                >
                  Sign Up
                </button>
              </div>
            </div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">{subtitle}</p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-4 text-sm text-red-700 dark:text-red-200 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                {error}
              </div>
            </div>
          )}

          {mode === "login" ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                <input
                  value={loginUserName}
                  onChange={(e) => setLoginUserName(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <input
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <Button className={primaryBtnClass} onClick={login}>
                {loading ? "Processing..." : "Login"}
              </Button>

              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold underline underline-offset-4"
                >
                  Sign up
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white"
                  placeholder="johndoe"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <input
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white"
                  placeholder="Min. 6 characters"
                />
              </div>

              <Button className={primaryBtnClass} onClick={() => signup()}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold underline underline-offset-4"
                >
                  Login
                </button>
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 flex justify-center">
            <button
              type="button"
              onClick={() => (loading ? null : router.push("/"))}
              className="text-sm text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Auth() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}