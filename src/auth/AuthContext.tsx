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
  userRole: 'attendee' | 'vendor' | null | undefined;
  isLoading: boolean;
  signIn: (params: { email: string; password: string }) => Promise<{ error?: Error }>;
  signUp: (params: {
    email: string;
    password: string;
    data?: Record<string, any>;
    emailRedirectTo?: string;
  }) => Promise<{ error?: Error }>;
  signOut: () => Promise<{ error?: Error }>;
  signInWithProvider: (provider: OAuthProvider) => Promise<{ error?: Error }>;
  resendConfirmationEmail: (email: string) => Promise<{ error?: Error }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [userRole, setUserRole] = useState<'attendee' | 'vendor' | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user role from database
  const fetchUserRole = async (userId: string) => {
    try {
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (!userError && userRow?.role) {
        const normalizedRole = String(userRow.role).toLowerCase();
        const isVendorRole = normalizedRole === 'vendor' || normalizedRole === 'subscriber';
        setUserRole(isVendorRole ? 'vendor' : 'attendee');
        return;
      }

      const { data: vendorRow, error: vendorError } = await supabase
        .from('vendors')
        .select('id, subscription_status, subscription_tier')
        .eq('user_id', userId)
        .maybeSingle();

      if (!vendorError && vendorRow) {
        const status = String(vendorRow.subscription_status ?? '').toLowerCase();
        const tier = String(vendorRow.subscription_tier ?? '').toLowerCase();
        const isVendor = status === 'active' || status === 'trial' || tier !== '';
        setUserRole(isVendor ? 'vendor' : 'attendee');
        return;
      }

      console.log('No user role found, defaulting to attendee');
      setUserRole('attendee');
    } catch (err) {
      console.error('Error fetching user role:', err);
      setUserRole('attendee');
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session ?? null);
        if (data.session?.user) {
          fetchUserRole(data.session.user.id);
        } else {
          setUserRole(null);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setSession(null);
        setUserRole(null);
        setIsLoading(false);
      });

    // Listen for auth state changes
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      if (newSession?.user) {
        fetchUserRole(newSession.user.id);
      } else {
        setUserRole(null);
      }
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

  const resendConfirmationEmail: AuthContextValue['resendConfirmationEmail'] = async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    return { error: error ?? undefined };
  };

  const signInWithProvider: AuthContextValue['signInWithProvider'] = async (provider) => {
    // On web, let Supabase handle the redirect directly.
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      return { error: error ?? undefined };
    }

    // On native (Expo), use AuthSession so we can return to the app.
    // Use the app scheme for production builds to ensure proper redirect
    const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'vibeventz', path: 'auth/callback' });

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
        return { error: new Error(`${provider} sign-in was cancelled`) };
      }

      if (result.type === 'success' && result.url) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(result.url);
        if (exchangeError) {
          return { error: exchangeError ?? undefined };
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
        userRole,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithProvider,
        resendConfirmationEmail,
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
