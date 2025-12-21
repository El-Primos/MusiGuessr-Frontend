"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import { Header } from "@/components/Header";



const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

type Mode = "login" | "signup";

type AuthRes = {
  message: string;
  id: number;
  username: string;
  email: string;
  role: string;
  token: string;
  token_type: string;
};

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export default function Auth() {

  const router = useRouter();
  const sp = useSearchParams();

  const initialMode = (sp.get("mode") as Mode) || "login";
  const [mode, setMode] = useState<Mode>(initialMode);

  useEffect(() => {
    const m = (sp.get("mode") as Mode) || "login";
    if (m === "login" || m === "signup") setMode(m);
  }, [sp]);

  // LOGIN fields
  const [loginUserName, setLoginUserName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // SIGNUP fields
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (mode === "login" ? "Welcome back" : "Create your account"), [mode]);
  const subtitle = useMemo(
    () => (mode === "login" ? "Login to continue" : "Sign up to start playing"),
    [mode]
  );

  function switchMode(m: Mode) {
    if (loading) return;
    setError(null);
    router.replace(`/auth?mode=${m}`);
  }

  function storeUserAndGoHome(res: AuthRes) {
    console.log("res: " , res);
    localStorage.setItem(
      "user",
      JSON.stringify({ id: res.id, username: res.username, email: res.email })
    );
    router.push("/");
  }

  function login() {

    if (loading) return;

    setError(null);

    if (!loginUserName.trim() || !loginPassword) {
      setError("Please fill in username and password.");
      return;
    }

    setLoading(true);

    fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: loginUserName.trim(),
        password: loginPassword,
      }),
    })
      .then(async (r) => {
        console.log("R.json = ", r);
        if (!r.ok) {
          const txt = await r.text().catch(() => "");
          throw new Error(txt || `Login failed (HTTP ${r.status})`);
        }
        return (await r.json()) as AuthRes;
      })
      .then((data) => {
        storeUserAndGoHome(data);
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Sign up failed.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function signup() {

    if (loading) return;

    setError(null);

    const n = name.trim();
    const u = userName.trim();
    const em = email.trim();

    if (!n || !u || !em || !signupPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (!isEmail(em)) {
      setError("Please enter a valid email.");
      return;
    }
    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: n,
        username: u,
        email: em,
        password: signupPassword,
      }),
    })
    .then(async (r) => {
      if (!r.ok) {
        let msg = `Sign up failed (HTTP ${r.status})`;

        // if json message
        try {
          const errJson = await r.json();
          if (errJson?.message) msg = errJson.message;
          else if (errJson?.error) msg = errJson.error;
        } catch {
          // else direct backend text log
          try {
            const txt = await r.text();
            if (txt) msg = txt;
          } catch {}
        }

        throw new Error(msg);
      }

      return (await r.json()) as AuthRes;
    })
    .then((data) => {
      storeUserAndGoHome(data);
    })
    .catch((err: unknown) => {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Sign up failed.");
      }
    })
    .finally(() => {
      setLoading(false);
    });

  }

  const primaryBtnClass = [
    "w-full py-3 bg-blue-600 hover:bg-blue-700",
    loading ? "opacity-60 cursor-not-allowed pointer-events-none" : "",
  ].join(" ");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      <Header
        logoSrc="/logo.png"
        exitVisible={false}
        onExit={() => console.log("EXIT")}
        className="top-0 left-0"
      />
    
      <div className="flex-1 flex items-center justify-center px-4 text-white">
        
        <div className="w-full max-w-md m-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-xl">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">{title}</h1>
              <div className="flex gap-2 rounded-xl bg-white/5 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={[
                    "px-3 py-1.5 rounded-lg text-sm transition",
                    mode === "login" ? "bg-white/15 text-white" : "text-white/70 hover:text-white",
                    loading ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={[
                    "px-3 py-1.5 rounded-lg text-sm transition",
                    mode === "signup" ? "bg-white/15 text-white" : "text-white/70 hover:text-white",
                    loading ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  Sign Up
                </button>
              </div>
            </div>
            <p className="mt-2 text-white/70">{subtitle}</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100 ">
              {error}
            </div>
          )}

          {mode === "login" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/80 mb-1">Username</label>
                <input
                  value={loginUserName}
                  onChange={(e) => setLoginUserName(e.target.value)}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25"
                  placeholder="username"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-1">Password</label>
                <input
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <Button className={primaryBtnClass} onClick={login}>
                {loading ? "Logging in..." : "Login"}
              </Button>

              <p className="text-center text-sm text-white/70">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={[
                    "text-blue-300 hover:text-blue-200 underline underline-offset-4",
                    loading ? "opacity-60 cursor-not-allowed pointer-events-none" : "",
                  ].join(" ")}
                >
                  Sign up
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/80 mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25"
                  placeholder="name"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-1">Username</label>
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25"
                  placeholder="username"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-1">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-1">Password</label>
                <input
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25"
                  placeholder="min 6 chars"
                  autoComplete="new-password"
                />
              </div>

              <Button className={primaryBtnClass} onClick={() => signup()}>
                {loading ? "Creating account..." : "Sign Up"}
              </Button>

              <p className="text-center text-sm text-white/70">
                Do you have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={[
                    "text-blue-300 hover:text-blue-200 underline underline-offset-4",
                    loading ? "opacity-60 cursor-not-allowed pointer-events-none" : "",
                  ].join(" ")}
                >
                  Login
                </button>
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => (loading ? null : router.push("/"))}
              className={[
                "text-sm text-white/60 hover:text-white underline underline-offset-4",
                loading ? "opacity-60 cursor-not-allowed pointer-events-none" : "",
              ].join(" ")}
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
