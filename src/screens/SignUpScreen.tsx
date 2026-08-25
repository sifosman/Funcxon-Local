import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ThemedAlert from '../components/ThemedAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, radii, typography } from '../theme';
import * as Linking from 'expo-linking';
import { PrimaryButton, OutlineButton } from '../components/ui';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { useIsDesktop } from '../hooks/useIsDesktop';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation, route }: Props) {
  const isDesktop = useIsDesktop();
  const { signUp, signInWithProvider, checkEmailExists } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'attendee' | 'vendor' | 'venue'>(route.params?.role ?? 'attendee');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);

  const handleSignUp = async () => {
    console.log('SignUp: handleSignUp pressed');
    setFormError(null);

    if (!name || !email || !password || !confirmPassword) {
      setAlertState({ visible: true, title: 'Missing details', message: 'Please fill in name, email, password, and confirm password.' });
      setFormError('Please fill in name, email, password, and confirm password.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
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

    if (password !== confirmPassword) {
      setAlertState({ visible: true, title: 'Passwords do not match', message: 'Please make sure the passwords match.' });
      setFormError('Passwords do not match.');
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setAlertState({ visible: true, title: 'Consent Required', message: 'Please accept the Terms and Conditions and Privacy Policy to continue.' });
      setFormError('Please accept the Terms and Conditions and Privacy Policy.');
      return;
    }

    const callbackRole = role === 'attendee' ? 'attendee' : 'vendor';
    const emailRedirectTo = Linking.createURL(`auth/callback/${callbackRole}`);

    setLoading(true);
    const { exists: emailExists, error: checkError } = await checkEmailExists(trimmedEmail);
    if (checkError || emailExists) {
      setLoading(false);
      if (checkError) {
        const friendlyMessage = 'We could not verify if this email is already registered. Please check your connection and try again.';
        setAlertState({ visible: true, title: 'Unable to check email', message: friendlyMessage });
        setFormError(friendlyMessage);
      } else {
        navigation.navigate('EmailConfirmation', { email: trimmedEmail, role, existingAccount: true });
      }
      return;
    }

    const { error, session } = await signUp({
      email: trimmedEmail,
      password,
      data: { name: trimmedName, full_name: trimmedName, role },
      emailRedirectTo,
    });
    setLoading(false);

    console.log('SignUp: signUp result', { error, hasSession: !!session });

    if (error) {
      setAlertState({ visible: true, title: 'Sign up failed', message: error.message });
      setFormError(error.message);
      return;
    }

    setFormError(null);

    // Send welcome email with app features write-up
    try {
      await supabase.functions.invoke('send-attendee-welcome-email', {
        body: { email: trimmedEmail, fullName: trimmedName, signUpMethod: 'email' },
      });
    } catch (e) {
      console.warn('SignUp: Failed to send welcome email:', e);
    }

    if (session) {
      // Email confirmation is disabled; Supabase created the session immediately.
      navigation.getParent()?.navigate('Main');
      return;
    }
    navigation.navigate('EmailConfirmation', { email: trimmedEmail, role });
  };

  const handleGoogleSignUp = async () => {
    const { error } = await signInWithProvider('google');
    if (error) {
      setAlertState({ visible: true, title: 'Google sign up failed', message: error.message });
    } else {
      navigation.getParent()?.navigate('Main');
    }
  };

  const handleFacebookSignUp = async () => {
    const { error } = await signInWithProvider('facebook');
    if (error) {
      setAlertState({ visible: true, title: 'Facebook sign up failed', message: error.message });
    } else {
      navigation.getParent()?.navigate('Main');
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
      <View style={{ alignItems: 'center', marginBottom: desktop ? spacing.xl : spacing.sm }}>
        <Text
          style={{
            ...(desktop ? typography.headlineMd : typography.titleLarge),
            color: colors.textPrimary,
            textAlign: 'center',
          }}
        >
          Create Your Account
        </Text>
        <Text style={{ ...(desktop ? typography.bodyMd : typography.caption), color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }}>
          Join thousands of event hosts planning their perfect occasions.
        </Text>
      </View>

      {/* Name */}
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
          name="person-outline"
          size={20}
          color={colors.primary}
          style={{ marginRight: spacing.sm }}
        />
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name"
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, paddingVertical: spacing.sm, color: colors.textPrimary }}
        />
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
          marginBottom: spacing.md,
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

      {/* Confirm Password */}
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
          name="lock-outline"
          size={20}
          color={colors.primary}
          style={{ marginRight: spacing.sm }}
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          placeholder="Confirm Password"
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, paddingVertical: spacing.sm, color: colors.textPrimary }}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword((prev) => !prev)}
          style={{ paddingVertical: spacing.sm, paddingLeft: spacing.sm }}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={showConfirmPassword ? 'visibility-off' : 'visibility'}
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Role selection */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{ ...(desktop ? typography.labelMd : typography.caption), color: colors.textMuted, marginBottom: spacing.sm }}>
          I am a...
        </Text>
        <View style={{ gap: spacing.sm } as any}>
          {[
            { key: 'attendee' as const, label: 'Attendee' },
            { key: 'vendor' as const, label: 'Vendor & Service Provider' },
            { key: 'venue' as const, label: 'Venue' },
          ].map((option) => {
            const selected = role === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => setRole(option.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : (desktop ? colors.outlineVariant : colors.borderSubtle),
                  backgroundColor: selected ? colors.primary : colors.surface,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selected ? '#FFFFFF' : (desktop ? colors.outlineVariant : colors.borderSubtle),
                    backgroundColor: selected ? '#FFFFFF' : colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: spacing.sm,
                  }}
                >
                  {selected && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: colors.primary,
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    ...(desktop ? typography.bodyMd : typography.body),
                    color: selected ? '#FFFFFF' : colors.textPrimary,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Terms & Privacy Consent */}
      <View style={{ marginBottom: spacing.lg }}>
        <TouchableOpacity
          testID="terms-checkbox"
          onPress={() => setTermsAccepted(!termsAccepted)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md }}
          activeOpacity={0.8}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: termsAccepted ? colors.primary : (desktop ? colors.outlineVariant : colors.borderSubtle),
              backgroundColor: termsAccepted ? colors.primary : colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.sm,
              marginTop: 1,
            }}
          >
            {termsAccepted && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
          </View>
          <Text style={{ ...(desktop ? typography.bodyMd : typography.caption), color: colors.textSecondary, flex: 1, lineHeight: 18 }}>
            I agree to the{' '}
            <Text
              style={{ color: colors.textPrimary, fontWeight: '600', textDecorationLine: 'underline' }}
              onPress={() => navigation.navigate('LegalDocument', { documentId: 'terms-and-conditions' })}
            >
              Terms and Conditions
            </Text>
            {' '}*
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="privacy-checkbox"
          onPress={() => setPrivacyAccepted(!privacyAccepted)}
          style={{ flexDirection: 'row', alignItems: 'flex-start' }}
          activeOpacity={0.8}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: privacyAccepted ? colors.primary : (desktop ? colors.outlineVariant : colors.borderSubtle),
              backgroundColor: privacyAccepted ? colors.primary : colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.sm,
              marginTop: 1,
            }}
          >
            {privacyAccepted && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
          </View>
          <Text style={{ ...(desktop ? typography.bodyMd : typography.caption), color: colors.textSecondary, flex: 1, lineHeight: 18 }}>
            I accept the{' '}
            <Text
              style={{ color: colors.textPrimary, fontWeight: '600', textDecorationLine: 'underline' }}
              onPress={() => navigation.navigate('LegalDocument', { documentId: 'privacy-policy' })}
            >
              Privacy Policy
            </Text>
            {' '}(POPIA) *
          </Text>
        </TouchableOpacity>
      </View>

      <PrimaryButton title={loading ? 'Creating account...' : 'Sign up'} onPress={handleSignUp} disabled={loading} />

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

      <View style={{ marginTop: spacing.lg }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleGoogleSignUp}
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
          <Text style={{ ...typography.body, color: colors.textPrimary }}>Sign up with Google</Text>
        </TouchableOpacity>


        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleFacebookSignUp}
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
          <Text style={{ ...typography.body, color: colors.textPrimary }}>Sign up with Facebook</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
        <Text style={{ ...typography.caption, color: colors.textMuted }}>
          Already have an account?{' '}
          <Text
            style={{ ...typography.caption, color: colors.textPrimary }}
            onPress={() => navigation.navigate('SignIn')}
          >
            Log in
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
          buttons={[{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
    </View>
  );
}
