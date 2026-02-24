import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform, Alert } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase, SUPABASE_URL } from '../lib/supabaseClient';

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
    // Configure Google Sign-In
    if (Platform.OS !== 'web') {
      GoogleSignin.configure({
        // The Web Client ID from Google Cloud Console (NOT the Android Client ID)
        // You will need to replace this with your actual Web Client ID for Supabase auth to work
        webClientId: '686531626266-cndnmba0atn98c1adgvqtr7ij3vgh266.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
      });
    }

    // Handle OAuth callback on web - check for auth code in URL or access_token in hash
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const hash = window.location.hash;
      
      // Check for PKCE flow (code in query params)
      const code = url.searchParams.get('code');
      
      if (code) {
        console.log('AuthContext: Found auth code in URL, exchanging for session...');
        supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (error) {
            console.error('AuthContext: Failed to exchange code for session:', error);
          } else {
            console.log('AuthContext: Successfully exchanged code for session');
            url.searchParams.delete('code');
            window.history.replaceState({}, '', url.toString());
          }
        });
      }
      
      // Check for implicit flow (access_token in URL hash fragment)
      if (hash && hash.includes('access_token=')) {
        console.log('AuthContext: Found access_token in URL hash, setting session...');
        // Parse the hash fragment
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const expires_at = params.get('expires_at');
        
        if (access_token) {
          supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || '',
          }).then(({ error }) => {
            if (error) {
              console.error('AuthContext: Failed to set session from hash:', error);
            } else {
              console.log('AuthContext: Successfully set session from URL hash');
              // Clear the hash to prevent re-processing
              window.history.replaceState({}, '', window.location.pathname + window.location.search);
            }
          });
        }
      }
    }

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
    const scopes = provider === 'facebook' ? 'email public_profile' : undefined;

    Alert.alert('Debug', `Starting ${provider} sign in...`);

    // --- NATIVE GOOGLE SIGN-IN ---
    if (provider === 'google' && Platform.OS !== 'web') {
      try {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        
        if (userInfo.data?.idToken) {
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: userInfo.data.idToken,
          });
          
          if (error) {
            Alert.alert('Error', error.message);
            return { error };
          }
          Alert.alert('Success', 'Signed in with Google successfully!');
          return { error: undefined };
        } else {
          return { error: new Error('No ID token present!') };
        }
      } catch (error: any) {
        console.error('Google Sign-In Error:', error);
        if (error.code === 'SIGN_IN_CANCELLED') {
          return { error: new Error('Google sign-in was cancelled') };
        }
        Alert.alert('Google Sign-In Error', error.message);
        return { error };
      }
    }

    // --- WEB OAUTH FLOW (Facebook, Apple, or Web Platform) ---
    if (Platform.OS === 'web') {
      // Get the current URL for the redirect
      const redirectTo = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : undefined;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          scopes,
          redirectTo,
          skipBrowserRedirect: false,
        },
      });
      return { error: error ?? undefined };
    }

    // On native (Expo), use AuthSession so we can return to the app.
    // IMPORTANT: For Google OAuth to work, we must use the Expo proxy URL
    // (https://auth.expo.io/@owner/slug/auth/callback) instead of a custom scheme.
    // Google Web OAuth clients don't accept custom URI schemes like vibeventz://
    const redirectUrl = 'https://auth.expo.io/@sifosman/vibeventz-app/auth/callback';

    Alert.alert('Debug', `Redirect URL: ${redirectUrl}`);
    console.log('AuthContext signInWithProvider (native) redirectUrl:', redirectUrl);
    
    // Debug: Check AsyncStorage before OAuth
    const keysBefore = await AsyncStorage.getAllKeys();
    console.log('AuthContext: AsyncStorage keys before OAuth:', keysBefore.filter((k: string) => k.includes('supabase')));
    Alert.alert('Debug', `Storage keys before: ${keysBefore.filter(k => k.includes('supabase')).length}`);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        scopes,
      },
    });

    console.log('AuthContext signInWithProvider (native) supabase response:', {
      hasDataUrl: !!data?.url,
      error,
    });
    Alert.alert('Debug', `Got OAuth URL: ${!!data?.url}`);

    if (error) {
      Alert.alert('Error', `OAuth error: ${error.message}`);
      return { error: error ?? undefined };
    }

    if (!data?.url) {
      Alert.alert('Error', 'No OAuth URL returned from Supabase');
      return { error: new Error('No OAuth URL returned from Supabase') };
    }

    try {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      console.log('AuthContext signInWithProvider (native) WebBrowser result type:', result.type);
      Alert.alert('Debug', `WebBrowser result: ${result.type}`);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { error: new Error(`${provider} sign-in was cancelled`) };
      }

      if (result.type === 'success' && result.url) {
        console.log('AuthContext: Full redirect URL:', result.url);
        Alert.alert('Debug', `Success! URL: ${result.url.substring(0, 100)}...`);
        
        // Debug: Check AsyncStorage after OAuth
        const keysAfter = await AsyncStorage.getAllKeys();
        console.log('AuthContext: AsyncStorage keys after OAuth:', keysAfter.filter((k: string) => k.includes('supabase')));
        Alert.alert('Debug', `Storage keys after: ${keysAfter.filter(k => k.includes('supabase')).length}`);
        
        // Parse the URL to extract the auth code
        // Handle both standard URLs and deep links (vibeventz://)
        let code: string | null = null;
        let errorParam: string | null = null;
        let errorDescription: string | null = null;
        
        try {
          const url = new URL(result.url);
          // First try query params (standard PKCE flow)
          code = url.searchParams.get('code');
          errorParam = url.searchParams.get('error');
          errorDescription = url.searchParams.get('error_description');
          
          // If no code in query params, check hash fragment (some OAuth flows)
          if (!code && url.hash) {
            const hashParams = new URLSearchParams(url.hash.substring(1));
            code = hashParams.get('code');
            if (!errorParam) errorParam = hashParams.get('error');
            if (!errorDescription) errorDescription = hashParams.get('error_description');
          }
          
          console.log('AuthContext: URL parsed successfully');
          console.log('AuthContext: code present:', !!code);
          console.log('AuthContext: error param:', errorParam);
          console.log('AuthContext: error_description:', errorDescription);
          Alert.alert('Debug', `Parsed URL - Code: ${!!code}, Error: ${errorParam}`);
        } catch (e) {
          console.log('AuthContext: URL parsing failed, using regex fallback');
          // Fallback for deep link URLs that might not parse correctly
          const urlStr = result.url;
          
          // Try to extract from query params
          const codeMatch = urlStr.match(/[?&]code=([^&]+)/);
          const errorMatch = urlStr.match(/[?&]error=([^&]+)/);
          const errorDescMatch = urlStr.match(/[?&]error_description=([^&]+)/);
          
          // Also check hash fragment
          const hashIndex = urlStr.indexOf('#');
          if (hashIndex !== -1) {
            const hash = urlStr.substring(hashIndex + 1);
            const hashCodeMatch = hash.match(/(^|&)code=([^&]+)/);
            const hashErrorMatch = hash.match(/(^|&)error=([^&]+)/);
            if (!codeMatch && hashCodeMatch) {
              code = decodeURIComponent(hashCodeMatch[2]);
            }
            if (!errorMatch && hashErrorMatch) {
              errorParam = decodeURIComponent(hashErrorMatch[2]);
            }
          }
          
          if (!code && codeMatch) {
            code = decodeURIComponent(codeMatch[1]);
          }
          if (!errorParam && errorMatch) {
            errorParam = decodeURIComponent(errorMatch[1]);
          }
          if (!errorDescription && errorDescMatch) {
            errorDescription = decodeURIComponent(errorDescMatch[1]);
          }
          
          console.log('AuthContext: Extracted via regex - code:', !!code, 'error:', errorParam);
          Alert.alert('Debug', `Regex fallback - Code: ${!!code}, Error: ${errorParam}`);
        }
        
        if (errorParam) {
          console.error('AuthContext: OAuth error:', errorParam, errorDescription);
          Alert.alert('OAuth Error', `${errorParam}${errorDescription ? ` - ${errorDescription}` : ''}`);
          return { error: new Error(`OAuth error: ${errorParam}${errorDescription ? ` - ${errorDescription}` : ''}`) };
        }
        
        if (!code) {
          console.error('AuthContext: No auth code found in redirect URL');
          console.error('AuthContext: Redirect URL was:', result.url);
          Alert.alert('Debug', `No code in URL: ${result.url.substring(0, 50)}...`);
          
          // Check if session was already established by the auth state listener
          // This can happen if Supabase processed the OAuth via deep link before we got here
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.log('AuthContext: Session already exists, OAuth succeeded');
            Alert.alert('Success', 'Signed in successfully!');
            return { error: undefined };
          }
          
          Alert.alert('Error', 'No auth code found in redirect URL');
          return { error: new Error('No auth code found in redirect URL') };
        }
        
        console.log('AuthContext: Calling exchangeCodeForSession...');
        Alert.alert('Debug', 'Exchanging code for session...');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('AuthContext: exchangeCodeForSession error:', exchangeError);
          Alert.alert('Exchange Error', exchangeError.message);
          return { error: exchangeError ?? undefined };
        }
        console.log('AuthContext: exchangeCodeForSession succeeded');
        Alert.alert('Success', 'OAuth completed successfully!');
      }
    } catch (err: any) {
      console.log('AuthContext signInWithProvider (native) WebBrowser threw:', err);
      Alert.alert('Exception', err.message);
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
