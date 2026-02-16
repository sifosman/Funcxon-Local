import { useState } from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton, OutlineButton } from '../components/ui';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation }: Props) {
  const { signIn, signInWithProvider } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleFacebookSignIn = async () => {
    const { error } = await signInWithProvider('facebook');
    if (error) {
      Alert.alert('Facebook sign in failed', error.message);
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
              Welcome Back
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
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
            <Text style={{ ...typography.caption, color: colors.primaryTeal }}>Forgot password?</Text>
          </TouchableOpacity>

          <PrimaryButton title={loading ? 'Signing in...' : 'Log in'} onPress={handleSignIn} disabled={loading} />

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
              <Text style={{ ...typography.body, color: colors.textPrimary }}>Log in with Facebook</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              Don’t have an account?{' '}
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
