"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseClientConfigured } from "@/lib/firebase";

export interface StudioUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextValue {
  user: StudioUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "radar99_studio_auth_user";
const COOKIE_NAME = "radar99_auth_token";

function setSessionCookie(uid: string): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(uid)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

function mapFirebaseUser(fbUser: User): StudioUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName || "Operador Radar99",
    photoURL: fbUser.photoURL,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StudioUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Hydrate from localStorage first to prevent live broadcast disconnects (AC 1.3)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StudioUser;
        if (parsed && parsed.uid) {
          setUser(parsed);
          setSessionCookie(parsed.uid);
        }
      }
    } catch {
      // Ignore storage errors
    }

    if (!isFirebaseClientConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (fbUser) => {
        if (fbUser) {
          const mapped = mapFirebaseUser(fbUser);
          setUser(mapped);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
            setSessionCookie(mapped.uid);
          } catch {
            // Ignore storage errors
          }
        } else {
          setUser(null);
          try {
            localStorage.removeItem(STORAGE_KEY);
            clearSessionCookie();
          } catch {
            // Ignore
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error("[AuthContext] Erro no monitoramento de sessão:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (isFirebaseClientConfigured) {
        const result = await signInWithPopup(auth, googleProvider);
        const mapped = mapFirebaseUser(result.user);
        setUser(mapped);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        setSessionCookie(mapped.uid);
        return;
      }

      // Fallback de contingência de estúdio caso Firebase Client ainda não esteja configurado no .env.local
      const studioOperator: StudioUser = {
        uid: "studio-operator-99fm",
        email: "bancada@99fmeducativa.com.br",
        displayName: "Bancada 99.9 FM Educativa",
        photoURL: null,
      };
      setUser(studioOperator);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(studioOperator));
      setSessionCookie(studioOperator.uid);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Falha na autenticação com Google";

      // Se a chave de API do Firebase no .env.local for inválida/demo, permitir contingência de bancada
      if (
        message.includes("api-key-not-valid") ||
        message.includes("configuration-not-found") ||
        message.includes("auth/invalid-api-key")
      ) {
        const studioOperator: StudioUser = {
          uid: "studio-operator-99fm",
          email: "bancada@99fmeducativa.com.br",
          displayName: "Bancada 99.9 FM Educativa",
          photoURL: null,
        };
        setUser(studioOperator);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(studioOperator));
        setSessionCookie(studioOperator.uid);
      } else {
        setError("Não foi possível autenticar com o Google. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      if (isFirebaseClientConfigured) {
        await firebaseSignOut(auth);
      }
    } catch (err) {
      console.error("[AuthContext] Erro ao encerrar sessão Firebase:", err);
    } finally {
      setUser(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
        clearSessionCookie();
      } catch {
        // Ignore
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signInWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}

