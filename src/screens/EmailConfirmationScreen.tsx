import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import ThemedAlert from '../components/ThemedAlert';
import * as Linking from 'expo-linking';
import { useIsDesktop } from '../hooks/useIsDesktop';

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailConfirmation'>;

export default function EmailConfirmationScreen({ route, navigation }: Props) {
  const isDesktop = useIsDesktop();
  const { resendConfirmationEmail } = useAuth();
  const email = route.params?.email;
  const role = route.params?.role ?? 'attendee';
  const existingAccount = route.params?.existingAccount ?? false;
  const roleLabel =
    role === 'vendor' ? 'Vendor' : role === 'venue' ? 'Venue' : 'Attendee';
  const [isResending, setIsResending] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);

  const handleResendEmail = async () => {
    if (!email) {
      setAlertState({ visible: true, title: 'Error', message: 'No email address found. Please sign up again.' });
      return;
    }

    setIsResending(true);
    try {
      const callbackRole = role === 'attendee' ? 'attendee' : 'vendor';
      const emailRedirectTo = Linking.createURL(`auth/callback/${callbackRole}`);
      const { error } = await resendConfirmationEmail(email, emailRedirectTo);
      if (error) {
        setAlertState({ visible: true, title: 'Error', message: error.message });
      } else {
        setAlertState({ visible: true, title: 'Success', message: 'Confirmation email resent! Please check your inbox.' });
      }
    } catch (error) {
      setAlertState({ visible: true, title: 'Error', message: 'Failed to resend email. Please try again.' });
    } finally {
      setIsResending(false);
    }
  };

  const renderExistingAccount = (desktop: boolean) => (
    <View style={{ width: '100%', maxWidth: desktop ? 480 : 360, alignSelf: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: desktop ? 140 : 120,
          height: desktop ? 140 : 120,
          borderRadius: radii.full,
          backgroundColor: '#fef3c7',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <MaterialIcons name="warning" size={desktop ? 64 : 56} color="#f59e0b" />
      </View>

      <Text
        style={{
          ...(desktop ? typography.headlineMd : typography.titleLarge),
          color: colors.textPrimary,
          marginBottom: spacing.sm,
          textAlign: 'center',
          fontWeight: '700',
        }}
      >
        This email already has an account
      </Text>

      <Text
        style={{
          ...(desktop ? typography.bodyMd : typography.body),
          color: colors.textMuted,
          marginBottom: spacing.lg,
          textAlign: 'center',
          lineHeight: 24,
        }}
      >
        You can't create a new account with this email address. Please log in to your existing account instead.
      </Text>

      {email && (
        <View
          style={{
            backgroundColor: desktop ? colors.surfaceContainerLowest : colors.surface,
            borderRadius: radii.md,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.lg,
            borderWidth: 1,
            borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <MaterialIcons name="email" size={20} color={colors.textPrimary} />
          <Text
            style={{
              ...typography.body,
              color: colors.textPrimary,
              fontWeight: '600',
            }}
          >
            {email}
          </Text>
        </View>
      )}

      <View
        style={{
          backgroundColor: '#FEF3C7',
          borderRadius: radii.md,
          padding: spacing.md,
          marginBottom: spacing.xl,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
        }}
      >
        <MaterialIcons name="info" size={20} color="#F59E0B" style={{ marginTop: 2 }} />
        <Text
          style={{
            ...(desktop ? typography.bodyMd : typography.caption),
            color: '#92400E',
            flex: 1,
            lineHeight: 20,
          }}
        >
          If you've forgotten your password, you can reset it from the sign-in screen.
        </Text>
      </View>

      <PrimaryButton title="Log in" onPress={() => navigation.navigate('SignIn')} />

      <TouchableOpacity
        onPress={() => navigation.navigate('SignUp')}
        style={{
          marginTop: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        }}
      >
        <MaterialIcons name="arrow-back" size={16} color={colors.textPrimary} />
        <Text
          style={{
            ...typography.caption,
            color: colors.textPrimary,
            fontWeight: '600',
          }}
        >
          Try another email
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderConfirmation = (desktop: boolean) => (
    <View style={{ width: '100%', maxWidth: desktop ? 480 : 360, alignSelf: 'center', alignItems: 'center' }}>
      {/* Icon Container */}
      <View
        style={{
          width: desktop ? 140 : 120,
          height: desktop ? 140 : 120,
          borderRadius: radii.full,
          backgroundColor: '#f2f7ff',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <MaterialIcons name="mark-email-read" size={desktop ? 64 : 56} color={colors.textPrimary} />
      </View>

      {/* Title */}
      <Text
        style={{
          ...(desktop ? typography.headlineMd : typography.titleLarge),
          color: colors.textPrimary,
          marginBottom: spacing.sm,
          textAlign: 'center',
          fontWeight: '700',
        }}
      >
        Check your email
      </Text>

      {/* Subtitle */}
      <Text
        style={{
          ...(desktop ? typography.bodyMd : typography.body),
          color: colors.textMuted,
          marginBottom: spacing.lg,
          textAlign: 'center',
          lineHeight: 24,
        }}
      >
        We've sent a confirmation link to your email address. Please check your inbox and click the link to activate your account.
      </Text>

      {/* Email Address Display */}
      {email && (
        <View
          style={{
            backgroundColor: desktop ? colors.surfaceContainerLowest : colors.surface,
            borderRadius: radii.md,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.lg,
            borderWidth: 1,
            borderColor: desktop ? colors.outlineVariant : colors.borderSubtle,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <MaterialIcons name="email" size={20} color={colors.textPrimary} />
          <Text
            style={{
              ...typography.body,
              color: colors.textPrimary,
              fontWeight: '600',
            }}
          >
            {email}
          </Text>
        </View>
      )}

      {/* Instructions */}
      <View
        style={{
          backgroundColor: '#FEF3C7',
          borderRadius: radii.md,
          padding: spacing.md,
          marginBottom: spacing.xl,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
        }}
      >
        <MaterialIcons name="info" size={20} color="#F59E0B" style={{ marginTop: 2 }} />
        <Text
          style={{
            ...(desktop ? typography.bodyMd : typography.caption),
            color: '#92400E',
            flex: 1,
            lineHeight: 20,
          }}
        >
          Once confirmed, sign in with your credentials to access your {roleLabel.toLowerCase()} dashboard.
        </Text>
      </View>

      {/* Go to Login Button */}
      <PrimaryButton title="Go to Sign In" onPress={() => navigation.navigate('SignIn')} />

      {/* Resend Email Option */}
      <TouchableOpacity
        onPress={handleResendEmail}
        disabled={isResending}
        style={{
          marginTop: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        }}
      >
        <MaterialIcons
          name="refresh"
          size={16}
          color={isResending ? colors.textMuted : colors.textPrimary}
        />
        <Text
          style={{
            ...typography.caption,
            color: isResending ? colors.textMuted : colors.textPrimary,
            fontWeight: '600',
          }}
        >
          {isResending ? 'Resending...' : 'Resend confirmation email'}
        </Text>
      </TouchableOpacity>

      {/* Troubleshooting Link */}
      <Text
        style={{
          ...typography.caption,
          color: colors.textMuted,
          marginTop: spacing.xl,
          textAlign: 'center',
        }}
      >
        Can't find the email? Check your spam folder or contact support.
      </Text>
    </View>
  );

  const renderScreen = (desktop: boolean) => (
    <View style={{ flex: 1, backgroundColor: desktop ? colors.surfaceBg : colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingVertical: desktop ? spacing.xxl : spacing.xl,
          paddingHorizontal: desktop ? 48 : spacing.lg,
          paddingTop: desktop ? spacing.xxl : spacing.sm,
        }}
      >
        {!desktop && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, alignSelf: 'flex-start' }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.xs }}>Back</Text>
          </TouchableOpacity>
        )}
        <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
          {existingAccount ? renderExistingAccount(desktop) : renderConfirmation(desktop)}
        </View>
      </ScrollView>

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

  return isDesktop ? renderScreen(true) : renderScreen(false);
}
