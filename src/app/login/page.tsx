"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Radio, ShieldCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { user, loading, error, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-[#0d0f11] text-white flex flex-col justify-between p-6 select-none">
      {/* Top Studio Bar */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto pt-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            ESTÚDIO 99.9 FM
          </span>
          <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
            SISTEMA INTEGRADO DE PAUTA RADIOFÔNICA
          </span>
        </div>
      </header>

      {/* Center Login Card */}
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-[#15181c] border border-[#252a31] rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4">
              <Radio className="w-8 h-8 text-orange-500" />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Radar<span className="text-orange-500">99</span>
              </h1>
            </div>
            <p className="text-sm text-zinc-400 max-w-xs">
              Curadoria e síntese radiofônica em tempo real para locução ao vivo
              na bancada.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-950/50 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 15.64 5 12c0-3.64 3.36-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
            <span>{loading ? "Autenticando..." : "Entrar com Google"}</span>
          </button>

          <div className="mt-6 pt-6 border-t border-[#252a31] flex items-center justify-center gap-2 text-xs text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Acesso restrito à equipe de jornalismo e locutores</span>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="text-center text-xs text-zinc-600 pb-2">
        Radar99 &bull; Jornalismo 99.9 FM Educativa &bull; Powered by Google
        Gemini &amp; Cloud Firestore
      </footer>
    </div>
  );
}

