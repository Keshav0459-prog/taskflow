"use client";

/**
 * Hook providing global authentication state and session management.
 */

import { useEffect, useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/api";
import type { UserProfile } from "@/types/task";

interface AuthState {
  session: Session | null;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

// Module-level shared singleton state
const INITIAL_AUTH_STATE: AuthState = {
  session: null,
  user: null,
  loading: true,
  error: null,
};
let globalAuthState: AuthState = INITIAL_AUTH_STATE;

const listeners = new Set<() => void>();
let isInitialized = false;
let ongoingInitPromise: Promise<void> | null = null;

function setGlobalAuthState(next: Partial<AuthState>) {
  globalAuthState = { ...globalAuthState, ...next };
  listeners.forEach((listener) => listener());
}

function subscribeToAuth(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getAuthSnapshot() {
  return globalAuthState;
}

function getServerAuthSnapshot() {
  return INITIAL_AUTH_STATE;
}

async function initAuth(): Promise<void> {
  if (ongoingInitPromise) return ongoingInitPromise;

  ongoingInitPromise = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const profile = await getCurrentUser();
          setGlobalAuthState({ session, user: profile, loading: false, error: null });
        } catch {
          setGlobalAuthState({ session, user: null, loading: false, error: "Failed to load profile." });
        }
      } else {
        setGlobalAuthState({ session: null, user: null, loading: false, error: null });
      }
    } catch (err) {
      setGlobalAuthState({
        session: null,
        user: null,
        loading: false,
        error: err instanceof Error ? err.message : "Auth initialization error",
      });
    } finally {
      ongoingInitPromise = null;
    }
  })();

  return ongoingInitPromise;
}

// Subscribe once to Supabase auth events
if (typeof window !== "undefined" && !isInitialized) {
  isInitialized = true;
  initAuth();

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session) {
      try {
        const profile = await getCurrentUser();
        setGlobalAuthState({ session, user: profile, loading: false, error: null });
      } catch {
        setGlobalAuthState({ session, user: null, loading: false, error: "Failed to load profile." });
      }
    } else if (event === "SIGNED_OUT") {
      setGlobalAuthState({ session: null, user: null, loading: false, error: null });
    } else if (session) {
      setGlobalAuthState({ session });
    }
  });
}

export function useAuth() {
  const state = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    getServerAuthSnapshot
  );

  useEffect(() => {
    // If not initialized yet, trigger it
    if (globalAuthState.loading && !ongoingInitPromise) {
      initAuth();
    }

    // Auth state changes are delivered through useSyncExternalStore above.
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setGlobalAuthState({ session: null, user: null, loading: false, error: null });
  };

  return {
    session: state.session,
    user: state.user,
    loading: state.loading,
    error: state.error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!state.session,
  };
}
