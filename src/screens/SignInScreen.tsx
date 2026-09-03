import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ThemedAlert from '../components/ThemedAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { clearPendingSubscriptionCheckout, getPendingSubscriptionCheckout } from '../lib/pendingSubscriptionCheckout';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton, OutlineButton } from '../components/ui';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useIsDesktop } from '../hooks/useIsDesktop';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation }: Props) {
  const isDesktop = useIsDesktop();
  const { signIn, signInWithProvider } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }>} | null>(null);
  const [resending, setResending] = useState(false);

  const redirectAfterSignIn = async () => {
    const pendingCheckout = await getPendingSubscriptionCheckout();
    if (pendingCheckout) {
      await clearPendingSubscriptionCheckout();
      (navigation.getParent() as any)?.navigate('Main', {
        screen: 'Account',
        params: {
          screen: 'ApplicationStep1',
        },
      });
      return;
    }

    navigation.getParent()?.navigate('Main');
  };

  const handleResendConfirmation = async (emailToResend: string) => {
    setResending(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: emailToResend,
      });
      if (resendError) {
        setAlertState({ visible: true, title: 'Resend failed', message: resendError.message, buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
      } else {
        setAlertState({ visible: true, title: 'Verification email sent', message: 'A new verification email has been sent to your inbox. Please check your email (including spam folder) and click the link to verify your email address.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
      }
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Resend failed', message: err?.message || 'Could not resend the verification email. Please try again later.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
    } finally {
      setResending(false);
    }
  };

  const handleSignIn = async () => {
    setFormError(null);
    setFormSuccess(null);

    if (!email || !password) {
      setAlertState({ visible: true, title: 'Missing details', message: 'Please enter both email and password.' });
      setFormError('Please enter both email and password.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /[^@]+@[^.]+\..+/;
    if (!emailRegex.test(trimmedEmail)) {
      setAlertState({ visible: true, title: 'Invalid email', message: 'Please enter a valid email address.' });
      setFormError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setAlertState({ visible: true, title: 'Weak password', message: 'Password should be at least 6 characters long.' });
      setFormError('Password should be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const { error } = await signIn({ email: trimmedEmail, password });
    setLoading(false);

    if (error) {
      // Detect "email not confirmed" errors and show a friendlier message
      // with a resend option (covers both Supabase error variants).
      const isEmailNotConfirmed =
        error.message.toLowerCase().includes('email not confirmed') ||
        (error as any).code === 'email_not_confirmed' ||
        ((error as any).status === 400 && error.message.toLowerCase().includes('confirm'));

      if (isEmailNotConfirmed) {
        setAlertState({
          visible: true,
          title: 'Verify your email',
          message: 'A verification email has been sent to you. Please check your inbox (and spam folder) and click the link to verify your email address.',
          buttons: [
            { text: 'Resend email', style: 'default', onPress: () => { setAlertState(null); handleResendConfirmation(trimmedEmail); } },
            { text: 'OK', style: 'cancel', onPress: () => setAlertState(null) },
          ],
        });
        setFormError('Email not confirmed. Check your inbox for the verification link.');
      } else {
        setAlertState({ visible: true, title: 'Sign in failed', message: error.message, buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
        setFormError(error.message);
      }
      return;
    }

    setFormSuccess('Signed in successfully. Redirecting...');
    setTimeout(() => {
      redirectAfterSignIn();
    }, 500);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAlertState({ visible: true, title: 'Enter email', message: 'Please enter your email address first.' });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: undefined,
    });

    if (error) {
      setAlertState({ visible: true, title: 'Reset failed', message: error.message });
      return;
    }

    setAlertState({ visible: true, title: 'Check your email', message: 'If an account exists for this email, a password reset link has been sent.' });
  };
  const handleGoogleSignIn = async () => {
    const { error } = await signInWithProvider('google');
    if (error) {
      setAlertState({ visible: true, title: 'Google sign in failed', message: error.message });
    } else {
      redirectAfterSignIn();
    }
  };

  const handleFacebookSignIn = async () => {
    const { error } = await signInWithProvider('facebook');
    if (error) {
      setAlertState({ visible: true, title: 'Facebook sign in failed', message: error.message });
    } else {
      redirectAfterSignIn();
    }
  };


  const renderCard = (desktop: boolean) => (
    <View
      style={{
        width: '100%',
        maxWidth: desktop ? 480 : 360,
        alignSelf: 'center',
        backgroundColor: desktop ? colors.surfaceContainerLowest : colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
        paddingHorizontal: desktop ? spacing.xxl : spacing.lg,
        paddingTop: desktop ? spacing.xl : spacing.sm,
        paddingBottom: desktop ? spacing.xxl : spacing.lg,
        shadowColor: desktop ? undefined : '#000',
        shadowOpacity: desktop ? undefined : 0.08,
        shadowRadius: desktop ? undefined : 10,
        shadowOffset: desktop ? undefined : { width: 0, height: 4 },
      }}
    >
      <View style={{ alignItems: 'center', marginBottom: desktop ? spacing.xl : spacing.lg }}>
        <Text
          style={{
            ...(desktop ? typography.headlineMd : typography.titleLarge),
            color: colors.textPrimary,
            marginBottom: spacing.sm,
            textAlign: 'center',
          }}
        >
          Welcome Back
        </Text>
        <Text style={{ ...(desktop ? typography.bodyMd : typography.body), color: colors.textMuted, textAlign: 'center' }}>
          Log in to access your event planning tools.
        </Text>
      </View>

      {/* Email */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <MaterialIcons
          name="mail-outline"
          size={20}
          color={colors.primary}
          style={{ marginRight: spacing.sm }}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, paddingVertical: spacing.sm, color: colors.textPrimary }}
        />
      </View>

      {/* Password */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
          marginBottom: spacing.sm,
        }}
      >
        <MaterialIcons
          name="lock-outline"
          size={20}
          color={colors.primary}
          style={{ marginRight: spacing.sm }}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, paddingVertical: spacing.sm, color: colors.textPrimary }}
        />
        <TouchableOpacity
          onPress={() => setShowPassword((prev) => !prev)}
          style={{ paddingVertical: spacing.sm, paddingLeft: spacing.sm }}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={showPassword ? 'visibility-off' : 'visibility'}
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={{ alignSelf: 'flex-end', marginBottom: spacing.md }}
        onPress={handleForgotPassword}
      >
        <Text style={{ ...typography.caption, color: colors.textPrimary }}>Forgot password?</Text>
      </TouchableOpacity>

      <PrimaryButton title={loading ? 'Signing in...' : 'Log in'} onPress={handleSignIn} disabled={loading} />

      {formError ? (
        <Text
          style={{
            ...typography.caption,
            color: colors.textPrimary,
            marginTop: spacing.sm,
            textAlign: 'center',
          }}
        >
          {formError}
        </Text>
      ) : null}

      {formSuccess ? (
        <Text
          style={{
            ...typography.caption,
            color: colors.textSecondary,
            marginTop: spacing.sm,
            textAlign: 'center',
          }}
        >
          {formSuccess}
        </Text>
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleGoogleSignIn}
          style={{
            width: '100%',
            paddingVertical: spacing.md,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            backgroundColor: colors.surface,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 12,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.sm,
              borderWidth: 2,
              borderTopColor: '#4285F4',
              borderRightColor: '#EA4335',
              borderBottomColor: '#34A853',
              borderLeftColor: '#FBBC05',
            }}
          >
            <Text style={{ ...typography.captionBold, color: '#4285F4' }}>G</Text>
          </View>
          <Text style={{ ...typography.body, color: colors.textPrimary }}>Log in with Google</Text>
        </TouchableOpacity>


        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleFacebookSignIn}
          style={{
            width: '100%',
            paddingVertical: spacing.md,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            backgroundColor: colors.surface,
            marginTop: spacing.sm,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 12,
              backgroundColor: '#1877F2',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.sm,
            }}
          >
            <Text style={{ ...typography.captionBold, color: '#FFFFFF' }}>f</Text>
          </View>
          <Text style={{ ...typography.body, color: colors.textPrimary }}>Log in with Facebook</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
        <Text style={{ ...typography.caption, color: colors.textMuted }}>
          Don’t have an account?{' '}
          <Text
            style={{ ...typography.caption, color: colors.textPrimary }}
            onPress={() => navigation.navigate('SignUp')}
          >
            Create account
          </Text>
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      {isDesktop ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingVertical: spacing.xxl,
            paddingHorizontal: 48,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
            {renderCard(true)}
          </View>
        </ScrollView>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.sm,
              paddingBottom: spacing.xl,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
              <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.xs }}>
                Back
              </Text>
            </TouchableOpacity>
            {renderCard(false)}
          </ScrollView>
        </>
      )}

      {alertState && (
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons ?? [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
    </View>
  );
}
