import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

type OAuthProvider = 'google';

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

  const fetchUserRole = async (userId: string) => {
    try {
      const { data: userRow, error: userError } = await Promise.race([
        supabase
          .from('users')
          .select('id, role')
          .eq('auth_user_id', userId)
          .maybeSingle(),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('fetchUserRole timeout')), 8000)
        ),
      ]);

      if (userError) {
        console.warn('[fetchUserRole] Error:', userError);
        setUserRole(null);
        return;
      }

      if (userRow?.role) {
        setUserRole(userRow.role as 'attendee' | 'vendor');
        return;
      }

      const { data: vendorRow } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (vendorRow) {
        setUserRole('vendor');
      } else {
        setUserRole('attendee');
      }
    } catch (err) {
      console.warn('[fetchUserRole] Exception:', err);
      setUserRole(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        fetchUserRole(session.user.id);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error || undefined };
  };

  const signUp = async ({
    email,
    password,
    data,
    emailRedirectTo,
  }: {
    email: string;
    password: string;
    data?: Record<string, any>;
    emailRedirectTo?: string;
  }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data,
        emailRedirectTo: emailRedirectTo || `${window.location.origin}/email-confirmation`,
      },
    });
    return { error: error || undefined };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setUserRole(null);
    return { error: error || undefined };
  };

  const signInWithProvider = async (provider: OAuthProvider) => {
    const redirectTo = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    return { error: error || undefined };
  };

  const resendConfirmationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/email-confirmation`,
      },
    });
    return { error: error || undefined };
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
