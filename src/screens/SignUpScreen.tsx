import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton, OutlineButton } from '../components/ui';
import { MaterialIcons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const { signUp, signInWithProvider } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'attendee' | 'vendor'>('attendee');
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
              Create an Account
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted }}>
              Connect, Collaborate, Celebrate
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
              secureTextEntry
              autoCapitalize="none"
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, paddingVertical: spacing.sm, color: colors.textPrimary }}
            />
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
              secureTextEntry
              autoCapitalize="none"
              placeholder="Confirm Password"
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, paddingVertical: spacing.sm, color: colors.textPrimary }}
            />
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

          <PrimaryButton
            title={loading ? 'Creating account...' : 'Create Account'}
            onPress={handleSignUp}
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

          <View style={{ marginTop: spacing.lg }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleGoogleSignUp}
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
                Register with Google
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              Already have an account?{' '}
              <Text
                style={{ ...typography.caption, color: colors.primaryTeal }}
                onPress={() => navigation.navigate('SignIn')}
              >
                Sign In
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
