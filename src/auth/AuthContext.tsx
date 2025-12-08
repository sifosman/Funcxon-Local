import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabaseClient';

WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = 'google' | 'github' | 'facebook' | 'apple';

export type AuthContextValue = {
  session: Session | null | undefined;
  user: Session['user'] | null | undefined;
  signIn: (params: { email: string; password: string }) => Promise<{ error?: Error }>;
  signUp: (params: {
    email: string;
    password: string;
    data?: Record<string, any>;
    emailRedirectTo?: string;
  }) => Promise<{ error?: Error }>;
  signOut: () => Promise<{ error?: Error }>;
  signInWithProvider: (provider: OAuthProvider) => Promise<{ error?: Error }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session ?? null);
      })
      .catch(() => {
        setSession(null);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthContextValue['signIn'] = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? undefined };
  };

  const signUp: AuthContextValue['signUp'] = async ({ email, password, data, emailRedirectTo }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data,
        emailRedirectTo,
      },
    });
    return { error: error ?? undefined };
  };

  const signOut: AuthContextValue['signOut'] = async () => {
    const { error } = await supabase.auth.signOut();
    return { error: error ?? undefined };
  };

  const signInWithProvider: AuthContextValue['signInWithProvider'] = async (provider) => {
    // On web, let Supabase handle the redirect directly.
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      return { error: error ?? undefined };
    }

    // On native (Expo), use AuthSession so we can return to the app.
    const redirectUrl = AuthSession.makeRedirectUri();

    console.log('AuthContext signInWithProvider (native) redirectUrl:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    console.log('AuthContext signInWithProvider (native) supabase response:', {
      hasDataUrl: !!data?.url,
      error,
    });

    if (error) {
      return { error: error ?? undefined };
    }

    if (!data?.url) {
      return { error: new Error('No OAuth URL returned from Supabase') };
    }

    try {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      console.log('AuthContext signInWithProvider (native) WebBrowser result type:', result.type);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { error: new Error('Google sign-in was cancelled') };
      }

      if (result.type === 'success' && result.url) {
        try {
          const urlObj = new URL(result.url);
          const fragment = urlObj.hash.startsWith('#') ? urlObj.hash.slice(1) : urlObj.hash;
          const params = new URLSearchParams(fragment);

          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (!accessToken || !refreshToken) {
            return { error: new Error('Missing tokens in redirect URL') };
          }

          const { error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setError) {
            return { error: setError ?? undefined };
          }
        } catch (parseErr: any) {
          console.log('AuthContext signInWithProvider (native) token parse error:', parseErr);
          return { error: parseErr instanceof Error ? parseErr : new Error(String(parseErr)) };
        }
      }
    } catch (err: any) {
      console.log('AuthContext signInWithProvider (native) WebBrowser threw:', err);
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }

    // On success, Supabase will update the session via onAuthStateChange
    // if the OAuth flow completed successfully.
    return { error: undefined };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user,
        signIn,
        signUp,
        signOut,
        signInWithProvider,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
