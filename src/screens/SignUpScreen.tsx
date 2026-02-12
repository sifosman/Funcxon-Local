import { useState } from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton, OutlineButton } from '../components/ui';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const { signUp, signInWithProvider } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'attendee' | 'vendor'>('attendee');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSignUp = async () => {
    console.log('SignUp: handleSignUp pressed');
    setFormError(null);

    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Missing details', 'Please fill in name, email, password, and confirm password.');
      setFormError('Please fill in name, email, password, and confirm password.');
      return;
    }

    const trimmedEmail = email.trim();
    const emailRegex = /[^@]+@[^.]+\..+/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      setFormError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password should be at least 6 characters long.');
      setFormError('Password should be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure the passwords match.');
      setFormError('Passwords do not match.');
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      Alert.alert('Consent Required', 'Please accept the Terms and Conditions and Privacy Policy to continue.');
      setFormError('Please accept the Terms and Conditions and Privacy Policy.');
      return;
    }

    const redirectBase = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL;
    const emailRedirectTo = redirectBase
      ? `${redirectBase}/auth/callback/${role === 'vendor' ? 'vendor' : 'attendee'}`
      : undefined;

    setLoading(true);
    const { error } = await signUp({
      email: trimmedEmail,
      password,
      data: { name, role },
      emailRedirectTo,
    });
    setLoading(false);

    console.log('SignUp: signUp result', { error });

    if (error) {
      Alert.alert('Sign up failed', error.message);
      setFormError(error.message);
      return;
    }

    setFormError(null);
    navigation.navigate('EmailConfirmation', { email: trimmedEmail, role });
  };

  const handleGoogleSignUp = async () => {
    const { error } = await signInWithProvider('google');
    if (error) {
      Alert.alert('Google sign up failed', error.message);
    }
  };

  const handleFacebookSignUp = async () => {
    const { error } = await signInWithProvider('facebook');
    if (error) {
      Alert.alert('Facebook sign up failed', error.message);
    }
  };

  const handleAppleSignUp = async () => {
    const { error } = await signInWithProvider('apple');
    if (error) {
      Alert.alert('Apple sign up failed', error.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.xl,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            width: '100%',
            maxWidth: 360,
            alignSelf: 'center',
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            padding: spacing.xl,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <Text
              style={{
                ...typography.titleLarge,
                color: colors.textPrimary,
                marginBottom: spacing.sm,
                textAlign: 'center',
              }}
            >
              Create Your Account
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
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
              borderColor: colors.borderSubtle,
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
              borderColor: colors.borderSubtle,
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
              borderColor: colors.borderSubtle,
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
              borderColor: colors.borderSubtle,
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
          <View style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm }}>
              I am a...
            </Text>
            <View style={{ flexDirection: 'row', columnGap: spacing.sm }}>
              {[
                { key: 'attendee' as const, label: 'Attendee' },
                { key: 'vendor' as const, label: 'Vendor' },
              ].map((option) => {
                const selected = role === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setRole(option.key)}
                    style={{
                      flex: 1,
                      paddingVertical: spacing.md,
                      borderRadius: radii.lg,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : colors.borderSubtle,
                      backgroundColor: selected ? colors.primary : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        ...typography.body,
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
                  borderColor: termsAccepted ? colors.primary : colors.borderSubtle,
                  backgroundColor: termsAccepted ? colors.primary : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                  marginTop: 1,
                }}
              >
                {termsAccepted && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
              </View>
              <Text style={{ ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 }}>
                I agree to the{' '}
                <Text
                  style={{ color: colors.primaryTeal, fontWeight: '600', textDecorationLine: 'underline' }}
                  onPress={() => navigation.navigate('LegalDocument', { documentId: 'terms-and-conditions' })}
                >
                  Terms and Conditions
                </Text>
                {' '}*
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
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
                  borderColor: privacyAccepted ? colors.primary : colors.borderSubtle,
                  backgroundColor: privacyAccepted ? colors.primary : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                  marginTop: 1,
                }}
              >
                {privacyAccepted && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
              </View>
              <Text style={{ ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 }}>
                I accept the{' '}
                <Text
                  style={{ color: colors.primaryTeal, fontWeight: '600', textDecorationLine: 'underline' }}
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
                color: colors.primaryTeal,
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
                borderColor: colors.borderSubtle,
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
                <Text style={{ ...typography.caption, color: '#4285F4', fontWeight: '800' }}>G</Text>
              </View>
              <Text style={{ ...typography.body, color: colors.textPrimary }}>Sign up with Google</Text>
            </TouchableOpacity>

            {(Platform.OS === 'ios' || Platform.OS === 'web') && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleAppleSignUp}
                style={{
                  width: '100%',
                  paddingVertical: spacing.md,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
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
                    backgroundColor: '#000000',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: spacing.sm,
                  }}
                >
                  <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
                </View>
                <Text style={{ ...typography.body, color: colors.textPrimary }}>Sign up with Apple</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleFacebookSignUp}
              style={{
                width: '100%',
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
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
                <Text style={{ ...typography.caption, color: '#FFFFFF', fontWeight: 'bold' }}>f</Text>
              </View>
              <Text style={{ ...typography.body, color: colors.textPrimary }}>Sign up with Facebook</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              Already have an account?{' '}
              <Text
                style={{ ...typography.caption, color: colors.primaryTeal }}
                onPress={() => navigation.navigate('SignIn')}
              >
                Log in
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
