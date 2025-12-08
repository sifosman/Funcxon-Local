import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton, OutlineButton } from '../components/ui';
import { MaterialIcons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation }: Props) {
  const { signIn, signInWithProvider } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleSignIn = async () => {
    setFormError(null);
    setFormSuccess(null);

    if (!email || !password) {
      Alert.alert('Missing details', 'Please enter both email and password.');
      setFormError('Please enter both email and password.');
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

    setLoading(true);
    const { error } = await signIn({ email: trimmedEmail, password });
    setLoading(false);

    if (error) {
      Alert.alert('Sign in failed', error.message);
      setFormError(error.message);
      return;
    }

    setFormSuccess('Signed in successfully. Redirecting...');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Enter email', 'Please enter your email address first.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: undefined,
    });

    if (error) {
      Alert.alert('Reset failed', error.message);
      return;
    }

    Alert.alert(
      'Check your email',
      'If an account exists for this email, a password reset link has been sent.',
    );
  };
  const handleGoogleSignIn = async () => {
    const { error } = await signInWithProvider('google');
    if (error) {
      Alert.alert('Google sign in failed', error.message);
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
        <View style={{ width: '100%', maxWidth: 360, alignSelf: 'center' }}>
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <Text
              style={{
                ...typography.titleLarge,
                color: colors.textPrimary,
                marginBottom: spacing.sm,
              }}
            >
              Log in
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted }}>
              Connect, Collaborate, Celebrate
            </Text>
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
              secureTextEntry
              autoCapitalize="none"
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, paddingVertical: spacing.sm, color: colors.textPrimary }}
            />
          </View>

          <TouchableOpacity
            style={{ alignSelf: 'flex-end', marginBottom: spacing.md }}
            onPress={handleForgotPassword}
          >
            <Text style={{ ...typography.caption, color: colors.primaryTeal }}>Forgot password?</Text>
          </TouchableOpacity>

          <PrimaryButton
            title={loading ? 'Signing in...' : 'Log in'}
            onPress={handleSignIn}
            disabled={loading}
          />

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
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surface,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                }}
              >
                <Text style={{ ...typography.caption, color: colors.textPrimary }}>G</Text>
              </View>
              <Text
                style={{
                  ...typography.body,
                  color: colors.textPrimary,
                }}
              >
                Log in with Google
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              Dont have an account?{' '}
              <Text
                style={{ ...typography.caption, color: colors.primaryTeal }}
                onPress={() => navigation.navigate('SignUp')}
              >
                Create account
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
