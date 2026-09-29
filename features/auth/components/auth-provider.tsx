"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { signOutCustomerAction } from "../actions/customer-auth.actions";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = React.useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = React.useState<boolean>(!initialUser);
  const supabase = React.useMemo(() => createClient(), []);

  const refresh = React.useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    let isMounted = true;

    if (!initialUser) {
      supabase.auth.getUser().then(({ data: { user: fetchedUser } }) => {
        if (isMounted) {
          setUser(fetchedUser);
          setIsLoading(false);
        }
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, initialUser]);

  const signOut = React.useCallback(async () => {
    setIsLoading(true);
    try {
      await signOutCustomerAction();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      signOut,
      refresh,
    }),
    [user, isLoading, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access current client-side authentication state.
 */
export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
