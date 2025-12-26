"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import { Header } from "@/components/Header";
import { AuthRes } from "@/dto/common.dto";
import { useLanguage } from "@/contexts/LanguageContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

type Mode = "login" | "signup";

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export default function Auth() {
  const router = useRouter();
  const sp = useSearchParams();
  const { t } = useLanguage();

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

  const title = useMemo(() => (mode === "login" ? t('auth.welcomeBack') : t('auth.createAccount')), [mode, t]);
  const subtitle = useMemo(
    () => (mode === "login" ? t('auth.loginToContinue') : t('auth.signupToStart')),
    [mode, t]
  );

  function switchMode(m: Mode) {
    if (loading) return;
    setError(null);
    router.replace(`/auth?mode=${m}`);
  }

  /**
   * Kullanıcıyı kaydetmeden önce BANNED olup olmadığını kontrol eder.
   */
  function storeUserAndGoHome(res: AuthRes) {
    localStorage.setItem(
      "user",
      JSON.stringify({ 
        id: res.id, 
        username: res.username, 
        email: res.email, 
        role: res.role, 
        accessToken: res.accessToken, 
        refreshToken: res.refreshToken, 
        tokenType: res.tokenType 
      })
    );
    router.push("/");
  }

  function login() {
    if (loading) return;
    setError(null);

    if (!loginUserName.trim() || !loginPassword) {
      setError(t('auth.fillUsernamePassword'));
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
        if (err instanceof Error && err.message.includes("disabled")) {
          setError("Hesabınız banlanmıştır. Lütfen admin@musiguessr.com ile iletişime geçin.");
        } else {
          setError(err instanceof Error ? err.message : "Login failed.");
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
      setError(t('auth.fillAllFields'));
      return;
    }
    if (!isEmail(em)) {
      setError(t('auth.validEmail'));
      return;
    }
    if (signupPassword.length < 6) {
      setError(t('auth.passwordLength'));
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
        try {
          const errJson = await r.json();
          msg = errJson.message || errJson.error || msg;
        } catch {
          const txt = await r.text();
          if (txt) msg = txt;
        }
        throw new Error(msg);
      }
      return (await r.json()) as AuthRes;
    })
    .then((data) => {
      storeUserAndGoHome(data);
    })
    .catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    })
    .finally(() => {
      setLoading(false);
    });
  }

  const primaryBtnClass = [
    "w-full py-3 bg-blue-600 hover:bg-blue-700 transition-colors rounded-xl font-semibold",
    loading ? "opacity-60 cursor-not-allowed pointer-events-none" : "",
  ].join(" ");

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
              <h1 className="text-3xl font-bold">{title}</h1>
              <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={[
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    mode === "login" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white",
                  ].join(" ")}
                >
                  {t('nav.login')}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={[
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    mode === "signup" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white",
                  ].join(" ")}
                >
                  {t('nav.signup')}
                </button>
              </div>
            </div>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                {error}
              </div>
            </div>
          )}

          {mode === "login" ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">{t('auth.username')}</label>
                <input
                  value={loginUserName}
                  onChange={(e) => setLoginUserName(e.target.value)}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder={t('auth.enterUsername')}
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">{t('auth.password')}</label>
                <input
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder={t('auth.enterPassword')}
                  autoComplete="current-password"
                />
              </div>

              <Button className={primaryBtnClass} onClick={login}>
                {loading ? t('auth.processing') : t('auth.loginButton')}
              </Button>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                {t('auth.noAccount')}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-blue-500 dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300 font-semibold underline underline-offset-4"
                >
                  {t('nav.signup')}
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">{t('auth.fullName')}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder={t('auth.enterFullName')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">{t('auth.username')}</label>
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="johndoe123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">{t('auth.email')}</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder={t('auth.enterEmail')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">{t('auth.password')}</label>
                <input
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder={t('auth.minPassword')}
                />
              </div>

              <Button className={primaryBtnClass} onClick={() => signup()}>
                {loading ? t('auth.creatingAccount') : t('auth.createAccountButton')}
              </Button>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                {t('auth.hasAccount')}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-blue-500 dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300 font-semibold underline underline-offset-4"
                >
                  {t('nav.login')}
                </button>
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 flex justify-center">
            <button
              type="button"
              onClick={() => (loading ? null : router.push("/"))}
              className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t('nav.backToHome')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}