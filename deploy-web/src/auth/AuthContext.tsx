import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import ThemedAlert from '../components/ThemedAlert';
import type { Session } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
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
  }) => Promise<{ error?: Error; session?: Session }>;
  signOut: () => Promise<{ error?: Error }>;
  signInWithProvider: (provider: OAuthProvider) => Promise<{ error?: Error }>;
  resendConfirmationEmail: (email: string, emailRedirectTo?: string) => Promise<{ error?: Error }>;
  checkEmailExists: (email: string) => Promise<{ exists?: boolean; error?: Error }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [userRole, setUserRole] = useState<'attendee' | 'vendor' | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);
  const welcomeEmailSentFor = useRef<Set<string>>(new Set());

  // Fetch user role from database
  const fetchUserRole = async (userId: string) => {
    try {
      console.log('[fetchUserRole] Starting for userId:', userId);
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

      console.log('[fetchUserRole] users row:', userRow, 'error:', userError);

      if (!userError && userRow?.role) {
        const normalizedRole = String(userRow.role).toLowerCase();
        const isVendorRole = normalizedRole === 'vendor' || normalizedRole === 'subscriber' || normalizedRole === 'venue';
        console.log('[fetchUserRole] users.role =', normalizedRole, 'isVendorRole =', isVendorRole);
        if (isVendorRole) {
          setUserRole('vendor');
          return;
        }
      }

      const internalUserId = userRow?.id ?? userId;
      console.log('[fetchUserRole] internalUserId:', internalUserId);

      const { data: vendorRow, error: vendorError } = await supabase
        .from('vendors')
        .select('id, subscription_status, subscription_tier')
        .eq('user_id', internalUserId)
        .maybeSingle();

      console.log('[fetchUserRole] vendorRow:', vendorRow, 'error:', vendorError);

      if (!vendorError && vendorRow) {
        const status = String(vendorRow.subscription_status ?? '').toLowerCase();
        const tier = String(vendorRow.subscription_tier ?? '').toLowerCase();
        const isVendor = status === 'active' || status === 'trial' || tier !== '';
        console.log('[fetchUserRole] vendor status=', status, 'tier=', tier, 'isVendor=', isVendor);
        if (isVendor) {
          setUserRole('vendor');
          return;
        }
      }

      const { data: fallbackVendorRow, error: fallbackVendorError } = await supabase
        .from('vendors')
        .select('id, subscription_status, subscription_tier')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('[fetchUserRole] fallbackVendorRow:', fallbackVendorRow, 'error:', fallbackVendorError);

      if (!fallbackVendorError && fallbackVendorRow) {
        const status = String(fallbackVendorRow.subscription_status ?? '').toLowerCase();
        const tier = String(fallbackVendorRow.subscription_tier ?? '').toLowerCase();
        const isVendor = status === 'active' || status === 'trial' || tier !== '';
        console.log('[fetchUserRole] fallback vendor status=', status, 'tier=', tier, 'isVendor=', isVendor);
        if (isVendor) {
          setUserRole('vendor');
          return;
        }
      }

      const { data: venueRow, error: venueError } = await supabase
        .from('venue_listings')
        .select('id, subscription_status, subscription_plan')
        .eq('user_id', internalUserId)
        .maybeSingle();

      console.log('[fetchUserRole] venueRow:', venueRow, 'error:', venueError);

      if (!venueError && venueRow) {
        const status = String(venueRow.subscription_status ?? '').toLowerCase();
        const plan = String(venueRow.subscription_plan ?? '').toLowerCase();
        const isVendor = status === 'active' || status === 'trial' || plan !== '';
        console.log('[fetchUserRole] venue status=', status, 'plan=', plan, 'isVendor=', isVendor);
        if (isVendor) {
          setUserRole('vendor');
          return;
        }
      }

      const { data: fallbackVenueRow, error: fallbackVenueError } = await supabase
        .from('venue_listings')
        .select('id, subscription_status, subscription_plan')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('[fetchUserRole] fallbackVenueRow:', fallbackVenueRow, 'error:', fallbackVenueError);

      if (!fallbackVenueError && fallbackVenueRow) {
        const status = String(fallbackVenueRow.subscription_status ?? '').toLowerCase();
        const plan = String(fallbackVenueRow.subscription_plan ?? '').toLowerCase();
        const isVendor = status === 'active' || status === 'trial' || plan !== '';
        console.log('[fetchUserRole] fallback venue status=', status, 'plan=', plan, 'isVendor=', isVendor);
        if (isVendor) {
          setUserRole('vendor');
          return;
        }
      }

      console.log('[fetchUserRole] No active plan found, defaulting to attendee');
      setUserRole('attendee');
    } catch (err) {
      console.error('[fetchUserRole] Error fetching user role:', err);
      setUserRole('attendee');
    }
  };

  const fetchUserRoleWithTimeout = async (userId: string) => {
    try {
      await fetchUserRole(userId);
    } catch {
      console.warn('[fetchUserRoleWithTimeout] Timed out or errored, defaulting to attendee');
      setUserRole('attendee');
    }
  };

  // Send welcome email for OAuth (Google/Facebook) sign-ups.
  // Detects new users by checking if their auth account was created within the last 5 minutes.
  const maybeSendOAuthWelcomeEmail = async (user: Session['user']) => {
    if (!user?.id || !user?.email) return;

    // Prevent duplicate sends within the same app session
    if (welcomeEmailSentFor.current.has(user.id)) return;

    // Check if this is a newly created user (created within last 5 minutes)
    const createdAt = user.created_at;
    if (createdAt) {
      const createdTime = new Date(createdAt).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      if (now - createdTime > fiveMinutes) {
        // Not a new user, skip welcome email
        welcomeEmailSentFor.current.add(user.id);
        return;
      }
    }

    // Mark as sent early to prevent concurrent duplicate calls
    welcomeEmailSentFor.current.add(user.id);

    // Determine sign-up method from app metadata
    const provider = user.app_metadata?.provider as string | undefined;
    const signUpMethod = provider === 'google' ? 'Google'
      : provider === 'facebook' ? 'Facebook'
      : provider === 'apple' ? 'Apple'
      : provider ? provider.charAt(0).toUpperCase() + provider.slice(1)
      : undefined;

    // Get full name from user metadata
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'there';

    try {
      const { error } = await supabase.functions.invoke('send-attendee-welcome-email', {
        body: { email: user.email, fullName, signUpMethod },
      });
      if (error) {
        console.warn('[maybeSendOAuthWelcomeEmail] Failed to send welcome email:', error);
      } else {
        console.log('[maybeSendOAuthWelcomeEmail] Welcome email sent for', user.email);
      }
    } catch (e) {
      console.warn('[maybeSendOAuthWelcomeEmail] Exception sending welcome email:', e);
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

    // Handle deep links on native (email confirmation, magic links, OAuth redirects)
    const handleDeepLink = async (url: string | null) => {
      if (!url || Platform.OS === 'web') return;

      console.log('[AuthContext] Deep link received:', url);

      try {
        const parsedUrl = new URL(url);
        const hash = parsedUrl.hash;
        const searchParams = parsedUrl.searchParams;

        let access_token: string | null = null;
        let refresh_token: string | null = null;
        let code: string | null = null;

        // Check hash fragment (implicit flow)
        if (hash && hash.includes('access_token=')) {
          const hashParams = new URLSearchParams(hash.substring(1));
          access_token = hashParams.get('access_token');
          refresh_token = hashParams.get('refresh_token');
        }

        // Check query params (implicit flow)
        if (!access_token) {
          access_token = searchParams.get('access_token');
          refresh_token = searchParams.get('refresh_token');
        }

        // Check query params (PKCE flow - used by email confirmation links)
        if (!access_token) {
          code = searchParams.get('code');
        }

        if (access_token) {
          console.log('[AuthContext] Setting session from deep link (implicit flow)');
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || '',
          });

          if (error) {
            console.error('[AuthContext] Failed to set session from deep link:', error);
          } else {
            console.log('[AuthContext] Session set from deep link');
          }
        } else if (code) {
          console.log('[AuthContext] Exchanging code for session (PKCE flow)');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('[AuthContext] Failed to exchange code for session:', error);
          } else {
            console.log('[AuthContext] Session set from PKCE code exchange');
          }
        }
      } catch (e) {
        console.error('[AuthContext] Error parsing deep link:', e);
      }
    };

    Linking.getInitialURL().then(handleDeepLink);
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Get initial session
    let loadingTimeout: ReturnType<typeof setTimeout> | null = null;

    const clearLoadingTimeout = () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
    };

    loadingTimeout = setTimeout(() => {
      console.warn('[AuthContext] Force-clearing isLoading after safety timeout');
      setIsLoading(false);
    }, 12000);

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session ?? null);
        if (data.session?.user) {
          await fetchUserRoleWithTimeout(data.session.user.id);
        } else {
          setUserRole(null);
        }
        clearLoadingTimeout();
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[AuthContext] getSession error:', err);
        clearLoadingTimeout();
        setSession(null);
        setUserRole(null);
        setIsLoading(false);
      });

    // Listen for auth state changes
    const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession ?? null);
      if (newSession?.user) {
        try {
          await fetchUserRoleWithTimeout(newSession.user.id);
          // Send welcome email for new OAuth sign-ups (Google/Facebook/Apple)
          maybeSendOAuthWelcomeEmail(newSession.user);
        } catch (e) {
          console.error('[AuthContext] onAuthStateChange fetchUserRole error:', e);
        }
      } else {
        setUserRole(null);
      }
    });

    return () => {
      data.subscription.unsubscribe();
      linkingSubscription?.remove();
    };
  }, []);

  const signIn: AuthContextValue['signIn'] = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? undefined };
  };

  const signUp: AuthContextValue['signUp'] = async ({ email, password, data, emailRedirectTo }) => {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data,
        emailRedirectTo,
      },
    });
    return { error: error ?? undefined, session: signUpData?.session ?? undefined };
  };

  const signOut: AuthContextValue['signOut'] = async () => {
    const { error } = await supabase.auth.signOut();
    return { error: error ?? undefined };
  };

  const resendConfirmationEmail: AuthContextValue['resendConfirmationEmail'] = async (email, emailRedirectTo) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    });
    return { error: error ?? undefined };
  };

  const checkEmailExists: AuthContextValue['checkEmailExists'] = async (email) => {
    try {
      const { data, error } = await supabase.rpc('check_email_exists', {
        p_email: email,
      });

      if (error) {
        console.error('checkEmailExists RPC error:', error);
        return { error: new Error(error.message || 'Unable to verify email. Please try again.') };
      }

      return { exists: !!data };
    } catch (err) {
      console.error('checkEmailExists unexpected error:', err);
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signInWithProvider: AuthContextValue['signInWithProvider'] = async (provider) => {
    const scopes = provider === 'facebook' ? 'email public_profile' : undefined;


    // --- NATIVE GOOGLE SIGN-IN ---
    if (provider === 'google' && Platform.OS !== 'web') {
      try {
        console.log('Google Sign-In: Checking Play Services...');
        await GoogleSignin.hasPlayServices();
        console.log('Google Sign-In: Play Services OK, starting sign in...');
        
        const userInfo = await GoogleSignin.signIn();
        console.log('Google Sign-In: Got userInfo:', JSON.stringify(userInfo, null, 2));
        
        // Try different locations for the idToken
        const idToken = (userInfo.data as any)?.idToken || (userInfo as any).idToken || (userInfo as any).id_token;
        
        if (idToken) {
          console.log('Google Sign-In: Got ID token, signing in with Supabase...');
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });
          
          if (error) {
            console.error('Google Sign-In: Supabase error:', error);
            setAlertState({ visible: true, title: 'Error', message: error.message });
            return { error };
          }
          console.log('Google Sign-In: Supabase success');
                return { error: undefined };
        } else {
          console.error('Google Sign-In: No ID token found. userInfo:', JSON.stringify(userInfo, null, 2));
          return { error: new Error('No ID token present in Google Sign-In response') };
        }
      } catch (error: any) {
        console.error('Google Sign-In Error:', error);
        console.error('Google Sign-In Error code:', error.code);
        console.error('Google Sign-In Error message:', error.message);
        if (error.code === 'SIGN_IN_CANCELLED') {
          return { error: new Error('Google sign-in was cancelled') };
        }
        if (error.code === 'DEVELOPER_ERROR') {
          setAlertState({ visible: true, title: 'Google Sign-In Error', message: 'Developer Error: Check your SHA-1 fingerprint and package name in Google Cloud Console. Make sure they match your Android build.' });
          return { error: new Error('Developer Error - Check Google Cloud Console configuration') };
        }
        setAlertState({ visible: true, title: 'Google Sign-In Error', message: error.message });
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
    // Google Web OAuth clients don't accept custom URI schemes like funxon://
    const redirectUrl = 'https://auth.expo.io/@sifosman/funxon/auth/callback';

    console.log('AuthContext signInWithProvider (native) redirectUrl:', redirectUrl);
    
    // Debug: Check AsyncStorage before OAuth
    const keysBefore = await AsyncStorage.getAllKeys();
    console.log('AuthContext: AsyncStorage keys before OAuth:', keysBefore.filter((k: string) => k.includes('supabase')));

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

    if (error) {
      setAlertState({ visible: true, title: 'Error', message: `OAuth error: ${error.message}` });
      return { error: error ?? undefined };
    }

    if (!data?.url) {
      setAlertState({ visible: true, title: 'Error', message: 'No OAuth URL returned from Supabase' });
      return { error: new Error('No OAuth URL returned from Supabase') };
    }

    try {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      console.log('AuthContext signInWithProvider (native) WebBrowser result type:', result.type);
  
      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { error: new Error(`${provider} sign-in was cancelled`) };
      }

      if (result.type === 'success' && result.url) {
        console.log('AuthContext: Full redirect URL:', result.url);
        
        // Debug: Check AsyncStorage after OAuth
        const keysAfter = await AsyncStorage.getAllKeys();
        console.log('AuthContext: AsyncStorage keys after OAuth:', keysAfter.filter((k: string) => k.includes('supabase')));
        
        // Parse the URL to extract the auth code
        // Handle both standard URLs and deep links (funxon://)
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
        }
        
        if (errorParam) {
          console.error('AuthContext: OAuth error:', errorParam, errorDescription);
          setAlertState({ visible: true, title: 'OAuth Error', message: `${errorParam}${errorDescription ? ` - ${errorDescription}` : ''}` });
          return { error: new Error(`OAuth error: ${errorParam}${errorDescription ? ` - ${errorDescription}` : ''}`) };
        }
        
        if (!code) {
          console.error('AuthContext: No auth code found in redirect URL');
          console.error('AuthContext: Redirect URL was:', result.url);
          
          // Check if session was already established by the auth state listener
          // This can happen if Supabase processed the OAuth via deep link before we got here
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.log('AuthContext: Session already exists, OAuth succeeded');
            return { error: undefined };
          }
          
          setAlertState({ visible: true, title: 'Error', message: 'No auth code found in redirect URL' });
          return { error: new Error('No auth code found in redirect URL') };
        }
        
        console.log('AuthContext: Calling exchangeCodeForSession...');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('AuthContext: exchangeCodeForSession error:', exchangeError);
          setAlertState({ visible: true, title: 'Exchange Error', message: exchangeError.message });
          return { error: exchangeError ?? undefined };
        }
        console.log('AuthContext: exchangeCodeForSession succeeded');
      }
    } catch (err: any) {
      console.log('AuthContext signInWithProvider (native) WebBrowser threw:', err);
      setAlertState({ visible: true, title: 'Exception', message: err.message });
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
        checkEmailExists,
      }}
    >
      {children}
      {alertState && (
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={[{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
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
