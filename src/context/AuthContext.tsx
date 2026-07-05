"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClientIfConfigured } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { setAnalyticsUserId } from "@/lib/analytics/track";
import type { DataMode } from "@/lib/data";

interface AuthContextValue {
  user: User | null;
  email: string | null;
  authLoading: boolean;
  supabaseReady: boolean;
  dataMode: DataMode;
  setDataMode: (mode: DataMode) => void;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataMode, setDataMode] = useState<DataMode>("local");
  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseReady) {
      setAuthLoading(false);
      return;
    }

    const supabase = createClientIfConfigured();
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAnalyticsUserId(data.user?.id ?? null);
      if (data.user) setDataMode("cloud");
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAnalyticsUserId(session?.user?.id ?? null);
      if (session?.user) {
        setDataMode((prev) => (prev === "local" ? prev : "cloud"));
      } else {
        setDataMode("local");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabaseReady]);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = createClientIfConfigured();
    if (!supabase) return { error: "Supabase is not configured" };

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClientIfConfigured();
    if (!supabase) return { error: "Supabase is not configured" };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    setDataMode("cloud");
    return {};
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClientIfConfigured();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setAnalyticsUserId(null);
    setDataMode("local");
  }, []);

  const value = useMemo(
    () => ({
      user,
      email: user?.email ?? null,
      authLoading,
      supabaseReady,
      dataMode,
      setDataMode,
      signUp,
      signIn,
      signOut,
    }),
    [user, authLoading, supabaseReady, dataMode, signUp, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
